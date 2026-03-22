/**
 * Adaptive Autopilot Planner
 *
 * Uses Claude CLI to classify task complexity and decide which phases to run.
 * Called when --adaptive flag is set.
 *
 * @module lib/autopilot/planner
 */

const { execSync } = require('node:child_process');

/**
 * @typedef {'TRIVIAL'|'SIMPLE'|'MODERATE'|'COMPLEX'} Complexity
 *
 * @typedef {Object} Plan
 * @property {Complexity} complexity
 * @property {string[]} phases - Ordered list of agent IDs to run
 * @property {string} rationale - Why these phases were selected
 * @property {number} estimatedMinutes - Estimated duration
 */

const PLANNER_PROMPT = `You are an autopilot planner for DevFlow, a multi-agent development system.

Given a task spec, decide which agents to run and in what order.

Available agents (in pipeline order):
- strategist: Planning, requirements, user stories
- architect: Technical design, ADRs, API design
- system-designer: System design at scale, SDDs, capacity planning, SLOs
- builder: Implementation, code writing, file changes
- guardian: Code review, security, testing
- challenger: Adversarial review using a DIFFERENT model than builder (multi-model cross-check)
- chronicler: Documentation, CHANGELOG, snapshots

Complexity levels:
- TRIVIAL: Single-file change, typo fix, small config update → builder + chronicler
- SIMPLE: Small feature, bug fix, refactor → architect + builder + chronicler (or subset)
- MODERATE: Feature with design decisions → strategist + architect + builder + guardian + chronicler
- COMPLEX: Major feature, scale concerns → all 7 agents including challenger

Rules:
1. builder is almost always required (unless purely analytical)
2. chronicler is always last (if included)
3. system-designer only for tasks with scale/infra/SLO concerns
4. guardian for any production code changes
5. challenger MUST come after guardian (if included). Include challenger for MODERATE+ tasks or when --challenger flag is set
6. Less phases = faster = better, when quality is maintained

TASK SPEC:
{spec_content}

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "complexity": "TRIVIAL|SIMPLE|MODERATE|COMPLEX",
  "phases": ["agent1", "agent2"],
  "rationale": "one sentence explaining the choice",
  "estimatedMinutes": 15
}`;

/**
 * Call Claude CLI to generate a plan for the given spec.
 * @param {string} specContent - The spec file content
 * @param {string} projectPath - Project root path (for claude CLI cwd)
 * @param {number} [timeoutSec=30] - Timeout for the planning call
 * @returns {Plan}
 */
function generatePlan(specContent, projectPath, timeoutSec = 30) {
  const prompt = PLANNER_PROMPT.replace('{spec_content}', specContent.slice(0, 4000));

  let raw;
  try {
    raw = execSync('claude --print', {
      cwd: projectPath,
      input: prompt,
      encoding: 'utf-8',
      timeout: timeoutSec * 1000,
      maxBuffer: 512 * 1024,
    });
  } catch (error) {
    throw new Error(`Planner failed: ${error.message}`);
  }

  // Strip markdown fences if Claude wrapped in ```json
  const cleaned = raw.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();

  let plan;
  try {
    plan = JSON.parse(cleaned);
  } catch {
    throw new Error(`Planner returned invalid JSON:\n${raw.slice(0, 500)}`);
  }

  // Validate structure
  const validAgents = ['strategist', 'architect', 'system-designer', 'builder', 'guardian', 'challenger', 'chronicler'];
  const validComplexities = ['TRIVIAL', 'SIMPLE', 'MODERATE', 'COMPLEX'];

  if (!validComplexities.includes(plan.complexity)) {
    throw new Error(`Invalid complexity: ${plan.complexity}`);
  }

  if (!Array.isArray(plan.phases) || plan.phases.length === 0) {
    throw new Error('Planner returned empty phases list');
  }

  const invalidAgents = plan.phases.filter(p => !validAgents.includes(p));
  if (invalidAgents.length > 0) {
    throw new Error(`Unknown agents in plan: ${invalidAgents.join(', ')}`);
  }

  // Ensure pipeline order is respected
  const pipelineOrder = validAgents;
  plan.phases = plan.phases.sort((a, b) => pipelineOrder.indexOf(a) - pipelineOrder.indexOf(b));

  plan.estimatedMinutes = typeof plan.estimatedMinutes === 'number' ? plan.estimatedMinutes : 15;
  plan.rationale = typeof plan.rationale === 'string' ? plan.rationale : 'No rationale provided';

  return plan;
}

module.exports = { generatePlan };
