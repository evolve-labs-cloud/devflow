import { promises as fs } from 'fs';
import path from 'node:path';

/**
 * Shared autopilot constants and utilities.
 * Used by both /api/autopilot/execute and /api/autopilot/terminal-execute routes.
 */

export const VALID_AGENTS = [
  'strategist', 'architect', 'system-designer', 'builder', 'guardian', 'chronicler',
] as const;

export type AgentName = typeof VALID_AGENTS[number];

export function isValidAgent(agent: string): agent is AgentName {
  return VALID_AGENTS.includes(agent as AgentName);
}

export const AGENT_SKILLS: Record<AgentName, string> = {
  strategist: '/agents:strategist',
  architect: '/agents:architect',
  'system-designer': '/agents:system-designer',
  builder: '/agents:builder',
  guardian: '/agents:guardian',
  chronicler: '/agents:chronicler',
};

export const AGENT_PROMPTS: Record<AgentName, string> = {
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

export const AGENT_TIMEOUTS: Record<AgentName, number> = {
  strategist: 300,
  architect: 600,
  'system-designer': 600,
  builder: 1200,
  guardian: 600,
  chronicler: 300,
};

// Agents that produce actionable output for task tracking
export const TASK_TRACKING_AGENTS: AgentName[] = ['builder', 'guardian', 'chronicler'];

/**
 * Load the full agent definition from .claude/commands/agents/{agent}.md
 * Returns the file content or null if not found.
 */
export async function loadAgentDefinition(projectPath: string, agent: AgentName): Promise<string | null> {
  const filePath = path.join(projectPath, '.claude', 'commands', 'agents', `${agent}.md`);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Build the full prompt for a given agent phase.
 * If agentDefinition is provided (from loadAgentDefinition), uses it as context.
 * Otherwise falls back to the slash command text (won't work with --print mode).
 */
export function buildPrompt(
  agent: AgentName,
  specContent: string,
  previousOutputs: string[],
  agentDefinition?: string | null,
): string {
  const prompt = AGENT_PROMPTS[agent]
    .replace('{spec_content}', specContent)
    .replace('{previous_output}', previousOutputs.join('\n---\n') || 'N/A');

  // Use full agent definition if available, otherwise fallback to skill command
  const agentContext = agentDefinition || AGENT_SKILLS[agent];

  return `${agentContext}\n\n---\n\n${prompt}`;
}

/**
 * Extract unchecked task titles from a markdown spec file.
 * Matches lines like: - [ ] Task title
 */
export function extractUncheckedTasks(content: string): string[] {
  const tasks: string[] = [];
  const regex = /^\s*[-*]\s*\[ \]\s*(?:\[[^\]]+\]\s*)?(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    tasks.push(match[1].trim());
  }
  return tasks;
}

/**
 * Check if the agent output mentions a task as completed.
 * Uses case-insensitive substring matching with completion context.
 */
export function isTaskMentionedAsCompleted(taskTitle: string, output: string): boolean {
  const lower = output.toLowerCase();
  const taskLower = taskTitle.toLowerCase();

  if (!lower.includes(taskLower)) return false;

  // For short task titles (< 10 chars), require a completion keyword nearby
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
 * After a phase completes, auto-detect completed tasks and update the spec file.
 */
export async function autoUpdateSpecTasks(
  specFilePath: string,
  agentOutput: string
): Promise<string[]> {
  const completedTasks: string[] = [];

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
    console.error('Error auto-updating spec tasks:', error);
  }

  return completedTasks;
}

/** Completion marker used to detect when an autopilot phase finishes in the terminal. */
export const PHASE_DONE_MARKER = '___DEVFLOW_PHASE_DONE_';
export const PHASE_DONE_REGEX = /___DEVFLOW_PHASE_DONE_(\d+)___/;
