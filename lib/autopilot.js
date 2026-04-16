const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const readline = require('node:readline');
const {
  VALID_AGENTS,
  DEFAULT_PHASES,
  AGENT_TIMEOUTS,
  TASK_TRACKING_AGENTS,
  loadAgentDefinitionSync,
  buildPrompt,
  buildChallengerPrompt,
  parseChallengerOutput,
  saveChallengerOutput,
  validateAgentOutput,
  autoUpdateSpecTasks,
} = require('./autopilotConstants');
const MemoryManager = require('./memory/MemoryManager');
const { generatePlan } = require('./autopilot/planner');
const { getPreviousOutputs, logContextStats, buildIsolatedContext } = require('./context/isolation');
const { callOpenAI } = require('./challengers/openai');

// ANSI color helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const AGENT_COLORS = {
  strategist: c.blue,
  architect: c.magenta,
  'system-designer': c.cyan,
  builder: c.yellow,
  guardian: c.green,
  challenger: c.red,
  chronicler: c.gray,
};

/**
 * Execute a single agent phase.
 * Challenger uses OpenAI o3; all other agents use claude --print.
 * Returns the captured output.
 *
 * @param {string} agent
 * @param {string} fullPrompt
 * @param {string} projectPath
 * @param {number} timeoutSec
 * @param {{ challengerModel?: string, color?: string }} extraOptions
 */
function executePhase(agent, fullPrompt, projectPath, timeoutSec, extraOptions = {}) {
  if (agent === 'challenger') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Promise.reject(
        new Error('OPENAI_API_KEY env var is required for --challenger. Set it before running.')
      );
    }
    // Model priority: --challenger-model flag > OPENAI_CHALLENGER_MODEL env > o3-mini (default)
    const model = extraOptions.challengerModel || process.env.OPENAI_CHALLENGER_MODEL || undefined;
    return callOpenAI(fullPrompt, apiKey, timeoutSec, model);
  }

  return new Promise((resolve, reject) => {
    let output = '';
    let settled = false;
    const settle = (fn, val) => { if (!settled) { settled = true; fn(val); } };
    const timeoutMs = timeoutSec * 1000;

    const child = spawn('claude', ['--print'], {
      cwd: projectPath,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Write the prompt to stdin
    child.stdin.write(fullPrompt);
    child.stdin.end();

    // Stream stdout in real-time with agent color
    const agentColor = extraOptions.color || '';
    if (agentColor) process.stdout.write(agentColor);

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      if (agentColor) {
        // Re-apply color after any ANSI reset so the hue persists through the full stream
        process.stdout.write(text.replace(/(\x1b\[0m)/g, `$1${agentColor}`));
      } else {
        process.stdout.write(text);
      }
    });

    // Stream stderr (dim, no agent color)
    child.stderr.on('data', (data) => {
      process.stderr.write(c.dim + data.toString() + c.reset + (agentColor || ''));
    });

    // Timeout
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      settle(reject, new Error(`Timeout: ${agent} exceeded ${timeoutSec}s`));
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (agentColor) process.stdout.write(c.reset);
      if (code === 0) {
        settle(resolve, output.trim());
      } else if (!settled) {
        settle(reject, new Error(`Agent ${agent} exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') {
        settle(reject, new Error('Claude CLI not found. Install with: npm i -g @anthropic-ai/claude-code'));
      } else {
        settle(reject, err);
      }
    });
  });
}

/**
 * Prompt user for yes/no confirmation on the adaptive plan.
 * @returns {Promise<boolean>}
 */
function confirmPlan() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`Proceed? (y/n): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

/**
 * Format duration in seconds to human-readable string.
 */
function formatDuration(ms) {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m ${remainSecs}s`;
}

/**
 * devflow autopilot <spec-file> - Run autopilot agents on a spec file
 */
async function autopilotCommand(specFile, options) {
  // 1. Validate spec file
  const resolvedSpec = path.resolve(specFile);
  if (!fs.existsSync(resolvedSpec)) {
    console.error(`${c.red}Error: Spec file not found: ${resolvedSpec}${c.reset}`);
    process.exit(1);
  }

  // 2. Read spec content
  const specContent = fs.readFileSync(resolvedSpec, 'utf-8');
  if (!specContent.trim()) {
    console.error(`${c.red}Error: Spec file is empty${c.reset}`);
    process.exit(1);
  }

  // 3. Determine project path
  const projectPath = path.resolve(options.project || process.cwd());
  if (!fs.existsSync(projectPath)) {
    console.error(`${c.red}Error: Project path not found: ${projectPath}${c.reset}`);
    process.exit(1);
  }

  // 4. Parse phases
  const phasesStr = options.phases || VALID_AGENTS.join(',');
  const selectedPhases = phasesStr.split(',').map(p => p.trim()).filter(Boolean);

  // Validate phase names
  for (const phase of selectedPhases) {
    if (!VALID_AGENTS.includes(phase)) {
      console.error(`${c.red}Error: Unknown agent: ${phase}${c.reset}`);
      console.error(`Valid agents: ${VALID_AGENTS.join(', ')}`);
      process.exit(1);
    }
  }

  // --challenger: inject 'challenger' after 'guardian' if not already present
  if (options.challenger) {
    if (!selectedPhases.includes('guardian')) {
      console.warn(`${c.yellow}Warning: --challenger requires guardian in the pipeline. Skipping challenger.${c.reset}\n`);
    } else if (!selectedPhases.includes('challenger')) {
      const guardianIdx = selectedPhases.indexOf('guardian');
      selectedPhases.splice(guardianIdx + 1, 0, 'challenger');
    }
  }

  // 5. Adaptive planning (--adaptive flag)
  let adaptivePlan = null; // Will hold plan.complexity for injection into each agent's prompt
  if (options.adaptive) {
    const COMPLEXITY_COLORS = {
      TRIVIAL: c.green,
      SIMPLE: c.cyan,
      MODERATE: c.yellow,
      COMPLEX: c.red,
    };

    console.log(`\n${c.bold}${c.magenta}  DevFlow Adaptive Planner${c.reset}`);
    console.log(`${c.gray}${'─'.repeat(50)}${c.reset}`);
    console.log(`${c.gray}  Analyzing task complexity...${c.reset}\n`);

    let plan;
    try {
      plan = generatePlan(specContent, projectPath);
    } catch (error) {
      console.error(`${c.red}Planner error: ${error.message}${c.reset}`);
      console.error(`${c.yellow}Falling back to full pipeline${c.reset}\n`);
      plan = null;
    }

    if (plan) {
      const cc = COMPLEXITY_COLORS[plan.complexity] || c.white;
      console.log(`  ${c.gray}Complexity:${c.reset} ${cc}${c.bold}${plan.complexity}${c.reset}`);
      console.log(`  ${c.gray}Rationale:${c.reset}  ${plan.rationale}`);
      console.log(`  ${c.gray}Phases:${c.reset}     ${plan.phases.map(p => `@${p}`).join(' → ')}`);
      console.log(`  ${c.gray}Estimate:${c.reset}   ~${plan.estimatedMinutes} minutes`);

      const skipped = selectedPhases.filter(p => !plan.phases.includes(p));
      if (skipped.length > 0) {
        console.log(`  ${c.gray}Skipping:${c.reset}   ${c.dim}${skipped.join(', ')}${c.reset}`);
      }

      console.log(`\n${c.gray}${'─'.repeat(50)}${c.reset}`);

      const confirmed = await confirmPlan();
      if (!confirmed) {
        console.log(`\n${c.yellow}Aborted by user.${c.reset}\n`);
        process.exit(0);
      }

      // Capture plan for per-agent complexity injection
      adaptivePlan = {
        level: plan.complexity,
        rationale: plan.rationale,
        subagentCount: plan.complexity === 'COMPLEX' ? 4 : plan.complexity === 'MODERATE' ? 3 : plan.complexity === 'SIMPLE' ? 2 : 1,
        focus: plan.complexity === 'TRIVIAL' ? 'core task only, skip deep analysis' : plan.complexity === 'COMPLEX' ? 'thorough analysis, cover all edge cases' : 'balanced depth',
      };

      // Apply the plan — replace selectedPhases with plan result
      const challengerRequested = options.challenger && !plan.phases.includes('challenger');
      selectedPhases.length = 0;
      plan.phases.forEach(p => selectedPhases.push(p));

      // Re-inject challenger if user requested it but planner omitted it
      if (challengerRequested) {
        const guardianIdx = selectedPhases.indexOf('guardian');
        if (guardianIdx !== -1) {
          selectedPhases.splice(guardianIdx + 1, 0, 'challenger');
          console.log(`  ${c.cyan}ℹ Challenger re-injected after guardian (--challenger flag)${c.reset}`);
        } else {
          // No guardian in the plan — add both guardian + challenger before chronicler
          const chroniclerIdx = selectedPhases.indexOf('chronicler');
          if (chroniclerIdx !== -1) {
            selectedPhases.splice(chroniclerIdx, 0, 'guardian', 'challenger');
          } else {
            selectedPhases.push('guardian', 'challenger');
          }
          console.log(`  ${c.cyan}ℹ Guardian + Challenger added (--challenger flag requires review)${c.reset}`);
        }
      }
      console.log('');
    }
  }

  // 6. Initialize Memory Manager
  const memory = new MemoryManager(projectPath);
  const taskDescription = `Autopilot: ${path.basename(resolvedSpec)} (${selectedPhases.length} phases${options.adaptive ? ', adaptive' : ''})`;
  const sessionId = memory.startSession(taskDescription);

  // Ensure artifact directory exists for this session
  const artifactsDir = path.join(projectPath, '.devflow', 'artifacts', sessionId);
  fs.mkdirSync(artifactsDir, { recursive: true });

  if (options.adaptive) {
    memory.recordDecision(sessionId, {
      agent: 'planner',
      type: 'tech_choice',
      subject: `Adaptive plan: ${selectedPhases.join(' → ')}`,
      rationale: 'LLM-selected phases based on task complexity analysis',
    });
  }

  if (options.verbose) {
    console.log(`${c.dim}[Memory] Session started: ${sessionId}${c.reset}`);
  }

  // 7. Print header
  const specName = path.basename(resolvedSpec);
  console.log(`\n${c.bold}${c.magenta}  DevFlow Autopilot${c.reset}`);
  console.log(`${c.gray}${'─'.repeat(50)}${c.reset}`);
  console.log(`${c.gray}  Spec:${c.reset}    ${specName}`);
  console.log(`${c.gray}  Project:${c.reset} ${path.basename(projectPath)}`);
  console.log(`${c.gray}  Phases:${c.reset}  ${selectedPhases.length} agents`);
  console.log(`${c.gray}${'─'.repeat(50)}${c.reset}\n`);

  // 7. Execute phases
  const results = [];
  let previousOutputs = [];
  const totalStart = Date.now();
  let hasFailure = false;

  for (let i = 0; i < selectedPhases.length; i++) {
    const agentId = selectedPhases[i];
    const phaseInfo = DEFAULT_PHASES.find(p => p.id === agentId);
    const phaseName = phaseInfo ? phaseInfo.name : agentId;
    const color = AGENT_COLORS[agentId] || c.white;

    console.log(`${c.bold}${color}═══ Phase ${i + 1}/${selectedPhases.length}: ${phaseName} (@${agentId}) ═══${c.reset}\n`);

    // Load the full agent definition from the project
    const agentDef = loadAgentDefinitionSync(projectPath, agentId);
    if (!agentDef && options.verbose) {
      console.log(`${c.dim}  (agent definition not found at ${projectPath}/.claude/commands/agents/${agentId}.md)${c.reset}`);
    }

    // Get memory context for this agent
    const memoryContext = memory.getContextForAgent(agentId, 5);

    // Context isolation: each agent sees only N-1 output (unless --full-context)
    const isolatedOutputs = getPreviousOutputs(previousOutputs, !options.fullContext);

    // Log context stats in verbose mode
    const ctx = buildIsolatedContext(agentId, specContent, previousOutputs, selectedPhases, i);
    logContextStats(agentId, ctx, options.verbose);

    // Challenger uses its own prompt builder: reads project docs + memory + Guardian's review
    // instead of raw code — same pattern as Claude agents reading files for context
    let fullPrompt;
    if (agentId === 'challenger') {
      const guardianOutput = previousOutputs[previousOutputs.length - 1] || '';
      fullPrompt = buildChallengerPrompt(agentDef, specContent, guardianOutput, memoryContext, projectPath);
    } else {
      fullPrompt = buildPrompt(agentId, specContent, isolatedOutputs, agentDef, memoryContext, adaptivePlan);
    }
    const timeout = AGENT_TIMEOUTS[agentId] || 600;
    const phaseStart = Date.now();

    try {
      // Add agent to session
      memory.addAgentToSession(sessionId, agentId);

      const output = await executePhase(agentId, fullPrompt, projectPath, timeout, { challengerModel: options.challengerModel, color });
      const duration = Date.now() - phaseStart;

      // Validate output against agent contract
      const validation = validateAgentOutput(agentId, output);
      if (!validation.valid) {
        for (const warning of validation.warnings) {
          console.warn(`${c.yellow}  ⚠ Contract: ${warning}${c.reset}`);
        }
      }

      // Persist phase output as artifact for traceability and cross-session reference
      if (output && output.trim()) {
        const artifactFile = path.join(artifactsDir, `${agentId}.md`);
        try {
          fs.writeFileSync(artifactFile, `# Artifact: ${phaseName}\nSession: ${sessionId}\nPhase: ${i + 1}/${selectedPhases.length}\n\n---\n\n${output}`, 'utf-8');
          if (options.verbose) {
            const relArtifact = path.relative(projectPath, artifactFile);
            console.log(`${c.dim}  [Artifact] ${relArtifact} (${Math.round(output.length / 1024)}KB)${c.reset}`);
          }
        } catch (writeErr) {
          if (options.verbose) {
            console.warn(`${c.yellow}  [Artifact] Could not write: ${writeErr.message}${c.reset}`);
          }
        }
      }

      previousOutputs.push(output);

      // Challenger-specific: auto-save output + record critical gaps in memory
      if (agentId === 'challenger' && output) {
        const savedPath = saveChallengerOutput(projectPath, output);
        if (savedPath) {
          const relPath = path.relative(projectPath, savedPath);
          console.log(`${c.gray}  Saved: ${relPath}${c.reset}`);

          const { confidence, verdict, scores, criticalGaps, challengedPoints } = parseChallengerOutput(output);

          const scoresStr = scores && scores.overall != null
            ? ` | scores: security=${scores.security ?? '?'} completeness=${scores.completeness ?? '?'} correctness=${scores.correctness ?? '?'} tests=${scores.testCoverage ?? '?'} overall=${scores.overall ?? '?'}`
            : '';

          memory.recordArtifact(sessionId, {
            agent: 'challenger',
            type: 'doc',
            path: relPath,
            summary: `Challenger review — confidence: ${confidence ?? '?'}%, verdict: ${verdict ?? 'N/A'}, ${criticalGaps.length} critical gaps, ${challengedPoints} challenged points${scoresStr}`
          });

          // Record each critical gap as a decision so future sessions see them
          for (const gap of criticalGaps.slice(0, 5)) {
            memory.recordDecision(sessionId, {
              agent: 'challenger',
              type: 'tech_choice',
              subject: `Critical Gap: ${gap.slice(0, 80)}`,
              rationale: `Found by Challenger (confidence: ${confidence ?? '?'}%, verdict: ${verdict ?? 'N/A'}, overall score: ${scores?.overall ?? '?'}/100)`
            });
          }

          // Print scores summary in verbose mode
          if (options.verbose && scores) {
            const s = scores;
            console.log(`${c.dim}  Challenger Scores — security:${s.security ?? '?'} completeness:${s.completeness ?? '?'} correctness:${s.correctness ?? '?'} tests:${s.testCoverage ?? '?'} overall:${s.overall ?? '?'}/100${c.reset}`);
          }
        }
      }

      // Record output as artifact in memory (non-challenger agents)
      if (output && output.length > 0 && agentId !== 'challenger') {
        memory.recordArtifact(sessionId, {
          agent: agentId,
          type: 'doc',
          path: `.devflow/artifacts/${sessionId}/${agentId}.md`,
          summary: `Phase ${i + 1}/${selectedPhases.length}: ${phaseName} output (${Math.floor(output.length / 1024)}KB)`
        });
      }

      // Auto-update tasks
      let tasksCompleted = [];
      if (options.update !== false && TASK_TRACKING_AGENTS.includes(agentId) && output.length > 0) {
        tasksCompleted = await autoUpdateSpecTasks(resolvedSpec, output);

        // Record task completion as decision
        if (tasksCompleted.length > 0) {
          memory.recordDecision(sessionId, {
            agent: agentId,
            type: 'tech_choice',
            subject: `Completed ${tasksCompleted.length} tasks`,
            rationale: `Auto-detected task completion: ${tasksCompleted.join(', ')}`
          });
        }
      }

      results.push({ agent: agentId, name: phaseName, status: 'completed', duration, tasksCompleted });

      console.log(`\n${c.green}✓ ${phaseName} completed in ${formatDuration(duration)}${c.reset}`);
      if (tasksCompleted.length > 0) {
        console.log(`${c.green}  Tasks auto-completed:${c.reset}`);
        for (const task of tasksCompleted) {
          console.log(`${c.green}    ✓ ${task}${c.reset}`);
        }
      }
      console.log('');

    } catch (error) {
      const duration = Date.now() - phaseStart;
      const errorMessage = error.message || 'Unknown error';

      results.push({ agent: agentId, name: phaseName, status: 'failed', duration, error: errorMessage });

      console.error(`\n${c.red}✗ ${phaseName} failed after ${formatDuration(duration)}${c.reset}`);
      console.error(`${c.red}  Error: ${errorMessage}${c.reset}\n`);

      hasFailure = true;
      break; // Stop on failure
    }
  }

  // 8. End session in memory
  memory.endSession(sessionId, hasFailure ? 'failed' : 'completed');

  if (options.verbose) {
    console.log(`${c.dim}[Memory] Session ended: ${hasFailure ? 'failed' : 'completed'}${c.reset}`);
    const stats = memory.getStats();
    console.log(`${c.dim}[Memory] Total sessions: ${stats.totalSessions}, decisions: ${stats.totalDecisions}, artifacts: ${stats.totalArtifacts}${c.reset}\n`);
  }

  // 9. Print summary
  const totalDuration = Date.now() - totalStart;
  const completedCount = results.filter(r => r.status === 'completed').length;
  const totalTasks = results.reduce((acc, r) => acc + (r.tasksCompleted?.length || 0), 0);

  console.log(`${c.gray}${'═'.repeat(50)}${c.reset}`);
  console.log(`${c.bold}  Summary${c.reset}`);
  console.log(`${c.gray}${'─'.repeat(50)}${c.reset}`);
  console.log(`  ${c.gray}Status:${c.reset}    ${hasFailure ? `${c.red}Failed${c.reset}` : `${c.green}Completed${c.reset}`}`);
  console.log(`  ${c.gray}Phases:${c.reset}    ${completedCount}/${selectedPhases.length} completed`);
  console.log(`  ${c.gray}Duration:${c.reset}  ${formatDuration(totalDuration)}`);
  if (totalTasks > 0) {
    console.log(`  ${c.gray}Tasks:${c.reset}     ${totalTasks} auto-completed`);
  }
  console.log(`${c.gray}${'═'.repeat(50)}${c.reset}\n`);

  if (hasFailure) {
    process.exit(1);
  }
}

module.exports = { autopilotCommand };
