const path = require('node:path');
const fs = require('node:fs');
const { buildChallengerPrompt, loadAgentDefinitionSync, parseChallengerOutput, saveChallengerOutput } = require('./autopilotConstants');
const MemoryManager = require('./memory/MemoryManager');
const { callOpenAI } = require('./challengers/openai');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * devflow-pro challenge [review-file] - Run Challenger (o3) on any Guardian output or project
 */
async function challengeCommand(reviewFile, options) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(`${c.red}Error: OPENAI_API_KEY env var is required.${c.reset}`);
    console.error(`${c.gray}  export OPENAI_API_KEY=sk-...${c.reset}`);
    process.exit(1);
  }

  const projectPath = path.resolve(options.project || process.cwd());
  const model = options.model || process.env.OPENAI_CHALLENGER_MODEL || 'gpt-5.4';

  // Read input file: --input takes priority, then positional argument
  const inputFile = options.input || reviewFile;
  let guardianOutput = '';
  if (inputFile) {
    const inputPath = path.resolve(inputFile);
    if (!fs.existsSync(inputPath)) {
      console.error(`${c.red}Error: File not found: ${inputPath}${c.reset}`);
      process.exit(1);
    }
    guardianOutput = fs.readFileSync(inputPath, 'utf-8');
  }

  // Read spec file (if provided or auto-detect)
  let specContent = '';
  if (options.spec) {
    const specPath = path.resolve(options.spec);
    if (fs.existsSync(specPath)) {
      specContent = fs.readFileSync(specPath, 'utf-8');
    }
  }

  // Load memory context
  const memory = new MemoryManager(projectPath);
  const memoryContext = memory.getContextForAgent('challenger', 10);

  // Load agent definition
  const agentDef = loadAgentDefinitionSync(projectPath, 'challenger');

  // Print header
  console.log(`\n${c.bold}${c.red}═══ Challenger (${model}) ═══${c.reset}\n`);
  console.log(`${c.gray}  Project:${c.reset} ${path.basename(projectPath)}`);
  if (inputFile) console.log(`${c.gray}  Input:${c.reset}   ${path.basename(inputFile)}`);
  if (options.output) console.log(`${c.gray}  Output:${c.reset}  ${path.basename(options.output)}`);
  const modelMode = /^o\d/.test(model) ? 'reasoning_effort: high' : 'temperature: default';
  console.log(`${c.gray}  Model:${c.reset}   ${model} (${modelMode})`);
  console.log(`${c.gray}${'─'.repeat(50)}${c.reset}\n`);

  // Build prompt using same logic as autopilot
  const fullPrompt = buildChallengerPrompt(agentDef, specContent, guardianOutput, memoryContext, projectPath);

  const timeout = parseInt(options.timeout || '300', 10);

  try {
    const start = Date.now();
    const result = await callOpenAI(fullPrompt, apiKey, timeout, model);
    const elapsed = Math.floor((Date.now() - start) / 1000);

    if (result) {
      // Explicit --output flag: save to that path
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true, mode: 0o750 });
        fs.writeFileSync(outputPath, result, { encoding: 'utf-8', mode: 0o640 });
        console.log(`${c.gray}  Saved: ${path.relative(projectPath, outputPath)}${c.reset}`);
      } else {
        // Auto-save to docs/security/challenger-{timestamp}.md
        const savedPath = saveChallengerOutput(projectPath, result);
        if (savedPath) {
          console.log(`${c.gray}  Auto-saved: ${path.relative(projectPath, savedPath)}${c.reset}`);
        }
      }

      // Record critical gaps in memory
      const { confidence, verdict, criticalGaps, challengedPoints } = parseChallengerOutput(result);
      if (criticalGaps.length > 0 || challengedPoints > 0) {
        const inputLabel = inputFile ? path.basename(inputFile) : 'standalone';
        const sessionId = memory.startSession(`challenge: ${inputLabel}`);
        memory.addAgentToSession(sessionId, 'challenger');

        const savedPath = options.output
          ? path.relative(projectPath, path.resolve(options.output))
          : `docs/security/challenger-${new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')}.md`;

        memory.recordArtifact(sessionId, {
          agent: 'challenger',
          type: 'doc',
          path: savedPath,
          summary: `Challenger review — confidence: ${confidence ?? '?'}%, verdict: ${verdict ?? 'N/A'}, ${criticalGaps.length} critical gaps, ${challengedPoints} challenged points`
        });

        for (const gap of criticalGaps.slice(0, 5)) {
          memory.recordDecision(sessionId, {
            agent: 'challenger',
            type: 'tech_choice',
            subject: `Critical Gap: ${gap.slice(0, 80)}`,
            rationale: `Found by Challenger standalone (confidence: ${confidence ?? '?'}%, verdict: ${verdict ?? 'N/A'})`
          });
        }

        memory.endSession(sessionId, 'completed');

        if (criticalGaps.length > 0) {
          console.log(`${c.gray}  Memory: ${criticalGaps.length} critical gap(s) recorded${c.reset}`);
        }
      }
    }

    console.log(`\n${c.green}✓ Challenger completed in ${elapsed}s${c.reset}\n`);
  } catch (err) {
    console.error(`\n${c.red}✗ Challenger failed: ${err.message}${c.reset}\n`);
    process.exit(1);
  }
}

module.exports = { challengeCommand };
