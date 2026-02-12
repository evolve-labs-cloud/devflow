const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const {
  VALID_AGENTS,
  DEFAULT_PHASES,
  AGENT_TIMEOUTS,
  TASK_TRACKING_AGENTS,
  loadAgentDefinitionSync,
  buildPrompt,
  autoUpdateSpecTasks,
} = require('./autopilotConstants');

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
  chronicler: c.red,
};

/**
 * Execute a single agent phase via claude --print with streaming output.
 * Returns the captured output.
 */
function executePhase(agent, fullPrompt, projectPath, timeoutSec) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeoutMs = timeoutSec * 1000;

    const child = spawn('claude', ['--print'], {
      cwd: projectPath,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Write the prompt to stdin
    child.stdin.write(fullPrompt);
    child.stdin.end();

    // Stream stdout in real-time
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    // Stream stderr
    child.stderr.on('data', (data) => {
      process.stderr.write(c.dim + data.toString() + c.reset);
    });

    // Timeout
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Timeout: ${agent} exceeded ${timeoutSec}s`));
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Agent ${agent} exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') {
        reject(new Error('Claude CLI not found. Install with: npm i -g @anthropic-ai/claude-code'));
      } else {
        reject(err);
      }
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

  // 5. Print header
  const specName = path.basename(resolvedSpec);
  console.log(`\n${c.bold}${c.magenta}  DevFlow Autopilot${c.reset}`);
  console.log(`${c.gray}${'─'.repeat(50)}${c.reset}`);
  console.log(`${c.gray}  Spec:${c.reset}    ${specName}`);
  console.log(`${c.gray}  Project:${c.reset} ${path.basename(projectPath)}`);
  console.log(`${c.gray}  Phases:${c.reset}  ${selectedPhases.length} agents`);
  console.log(`${c.gray}${'─'.repeat(50)}${c.reset}\n`);

  // 6. Execute phases
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

    const fullPrompt = buildPrompt(agentId, specContent, previousOutputs, agentDef);
    const timeout = AGENT_TIMEOUTS[agentId] || 600;
    const phaseStart = Date.now();

    try {
      const output = await executePhase(agentId, fullPrompt, projectPath, timeout);
      const duration = Date.now() - phaseStart;

      previousOutputs.push(output);

      // Auto-update tasks
      let tasksCompleted = [];
      if (options.update !== false && TASK_TRACKING_AGENTS.includes(agentId) && output.length > 0) {
        tasksCompleted = await autoUpdateSpecTasks(resolvedSpec, output);
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

  // 7. Print summary
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
