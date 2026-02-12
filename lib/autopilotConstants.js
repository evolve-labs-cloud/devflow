/**
 * Shared autopilot constants for CLI usage.
 * Mirrors web/lib/autopilotConstants.ts for Node.js CLI.
 */

const VALID_AGENTS = [
  'strategist', 'architect', 'system-designer', 'builder', 'guardian', 'chronicler',
];

const AGENT_SKILLS = {
  strategist: '/agents:strategist',
  architect: '/agents:architect',
  'system-designer': '/agents:system-designer',
  builder: '/agents:builder',
  guardian: '/agents:guardian',
  chronicler: '/agents:chronicler',
};

const AGENT_PROMPTS = {
  strategist: `Analise a spec e refine os requisitos:
{spec_content}

1. Identificar requisitos implícitos
2. Listar acceptance criteria
3. Dependências e riscos
4. Estimar complexidade`,

  architect: `Defina a arquitetura com base na spec:
{spec_content}

Contexto anterior: {previous_output}

1. Arquitetura da solução
2. Padrões e tecnologias
3. Componentes necessários
4. Decisões importantes`,

  'system-designer': `Projete o system design com base na spec:
{spec_content}

Contexto anterior: {previous_output}

1. Back-of-the-envelope estimation
2. High-level design
3. Data model e storage
4. Scalability e reliability`,

  builder: `Implemente a solução conforme spec e design:
{spec_content}

Contexto anterior: {previous_output}

1. Criar/modificar arquivos necessários
2. Implementar lógica principal
3. Tratamento de erros`,

  guardian: `Revise o código implementado:
{spec_content}

Implementação: {previous_output}

1. Segurança
2. Performance
3. Edge cases
4. Melhorias necessárias`,

  chronicler: `Documente as mudanças realizadas:
{spec_content}

Implementação: {previous_output}

1. Resumir o que foi implementado
2. Arquivos criados/modificados
3. Atualizar tasks na spec`,
};

const AGENT_TIMEOUTS = {
  strategist: 300,
  architect: 600,
  'system-designer': 600,
  builder: 1200,
  guardian: 600,
  chronicler: 300,
};

const DEFAULT_PHASES = [
  { id: 'strategist', name: 'Planning' },
  { id: 'architect', name: 'Design' },
  { id: 'system-designer', name: 'System Design' },
  { id: 'builder', name: 'Implementation' },
  { id: 'guardian', name: 'Validation' },
  { id: 'chronicler', name: 'Documentation' },
];

const TASK_TRACKING_AGENTS = ['builder', 'guardian', 'chronicler'];

/**
 * Load the full agent definition from .claude/commands/agents/{agent}.md
 * Returns the file content or null if not found.
 */
function loadAgentDefinitionSync(projectPath, agent) {
  const path = require('node:path');
  const fs = require('node:fs');
  const filePath = path.join(projectPath, '.claude', 'commands', 'agents', `${agent}.md`);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Build the full prompt for a given agent phase.
 * If agentDefinition is provided, uses it as context instead of the slash command.
 */
function buildPrompt(agent, specContent, previousOutputs, agentDefinition) {
  const prompt = AGENT_PROMPTS[agent]
    .replace('{spec_content}', specContent)
    .replace('{previous_output}', (previousOutputs || []).join('\n---\n') || 'N/A');

  // Use full agent definition if available, otherwise fallback to skill command
  const agentContext = agentDefinition || AGENT_SKILLS[agent];

  return `${agentContext}\n\n---\n\n${prompt}`;
}

/**
 * Extract unchecked task titles from markdown content.
 */
function extractUncheckedTasks(content) {
  const tasks = [];
  const regex = /^\s*[-*]\s*\[ \]\s*(?:\[[^\]]+\]\s*)?(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    tasks.push(match[1].trim());
  }
  return tasks;
}

/**
 * Check if the agent output mentions a task as completed.
 */
function isTaskMentionedAsCompleted(taskTitle, output) {
  const lower = output.toLowerCase();
  const taskLower = taskTitle.toLowerCase();

  if (!lower.includes(taskLower)) return false;

  if (taskLower.length < 10) {
    const completionKeywords = [
      'completed', 'done', 'implemented', 'finished', 'created',
      'added', 'fixed', 'resolved', 'built', 'configured',
      '✅', '✓', '[x]', 'complete',
    ];
    const idx = lower.indexOf(taskLower);
    const context = lower.slice(Math.max(0, idx - 200), idx + taskLower.length + 200);
    return completionKeywords.some(kw => context.includes(kw));
  }

  return true;
}

/**
 * Auto-detect completed tasks and update the spec file.
 */
async function autoUpdateSpecTasks(specFilePath, agentOutput) {
  const fs = require('node:fs').promises;
  const completedTasks = [];

  try {
    const content = await fs.readFile(specFilePath, 'utf-8');
    const uncheckedTasks = extractUncheckedTasks(content);

    if (uncheckedTasks.length === 0) return [];

    let updatedContent = content;
    for (const taskTitle of uncheckedTasks) {
      if (isTaskMentionedAsCompleted(taskTitle, agentOutput)) {
        const escapedTitle = taskTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const taskRegex = new RegExp(
          `^(\\s*[-*]\\s*)\\[ \\](\\s*(?:\\[[^\\]]+\\]\\s*)?)${escapedTitle}`,
          'gm'
        );
        updatedContent = updatedContent.replace(taskRegex, (match, prefix, middle) => {
          completedTasks.push(taskTitle);
          return `${prefix}[x]${middle}${taskTitle}`;
        });
      }
    }

    if (completedTasks.length > 0) {
      await fs.writeFile(specFilePath, updatedContent, 'utf-8');
    }
  } catch (error) {
    console.error('Error auto-updating spec tasks:', error.message);
  }

  return completedTasks;
}

module.exports = {
  VALID_AGENTS,
  AGENT_SKILLS,
  AGENT_PROMPTS,
  AGENT_TIMEOUTS,
  DEFAULT_PHASES,
  TASK_TRACKING_AGENTS,
  loadAgentDefinitionSync,
  buildPrompt,
  extractUncheckedTasks,
  isTaskMentionedAsCompleted,
  autoUpdateSpecTasks,
};
