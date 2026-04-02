/**
 * Shared autopilot constants for CLI usage.
 * Mirrors web/lib/autopilotConstants.ts for Node.js CLI.
 */

const VALID_AGENTS = [
  'strategist', 'architect', 'system-designer', 'builder', 'guardian', 'challenger', 'chronicler',
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
  strategist: `Você é o Strategist — Product Manager & Planning Specialist.

Spec/Tarefa: {spec_content}

PASSO 1 — ANÁLISE DE REQUISITOS:
  - Identificar requisitos explícitos e implícitos
  - Definir acceptance criteria claros e mensuráveis
  - Mapear dependências entre tasks
  - Identificar riscos e pontos de atenção
  - Estimar complexidade (TRIVIAL / SIMPLE / MODERATE / COMPLEX)

PASSO 2 — CRIAR ARQUIVO DE PLANEJAMENTO (OBRIGATÓRIO):
  USE a ferramenta Write para CRIAR O ARQUIVO FÍSICO:
  Caminho: docs/planning/stories/{NOME-DA-FEATURE}-story.md

  Conteúdo obrigatório:
  # Story: {nome da feature}

  ## Objetivo
  [O que queremos alcançar e por quê]

  ## Acceptance Criteria
  - [ ] [critério 1 — mensurável e testável]
  - [ ] [critério 2]
  - [ ] [critério N]

  ## Escopo
  **IN:** [o que está incluído]
  **OUT:** [o que NÃO está incluído nesta iteração]

  ## Dependências
  [arquivos, serviços ou features que esta task depende]

  ## Riscos
  - 🔴 [risco crítico] / 🟡 [risco médio] / 🟢 [risco baixo]

  ## Estimativa
  **Complexidade**: TRIVIAL | SIMPLE | MODERATE | COMPLEX
  **Agentes necessários**: [lista]

NÃO APENAS DESCREVA — CRIE O ARQUIVO. O Architect lê este arquivo para definir a solução.`,

  architect: `Você é o Architect — Software Architect & Technical Design Specialist.

Spec/Tarefa: {spec_content}

Planejamento do Strategist: {previous_output}

PASSO 1 — ANÁLISE DA SOLUÇÃO:
  - Definir arquitetura da solução (componentes, camadas, fluxos)
  - Escolher padrões e tecnologias adequados ao projeto
  - Mapear interfaces entre componentes
  - Identificar trade-offs e justificar decisões

PASSO 2 — CRIAR ADR (OBRIGATÓRIO):
  USE a ferramenta Write para CRIAR O ARQUIVO FÍSICO.
  Liste os ADRs existentes em docs/decisions/ primeiro para escolher o próximo número.
  Caminho: docs/decisions/ADR-{NNN}-{titulo-kebab-case}.md

  Conteúdo obrigatório (template padrão):
  # ADR-{NNN}: {Título}

  **Status**: Proposed | Accepted | Deprecated
  **Date**: {DATA-DE-HOJE}

  ## Context
  [Contexto do problema e por que uma decisão é necessária]

  ## Decision
  [A decisão tomada, com justificativa]

  ## Alternatives Considered
  - **[Alternativa A]**: [prós e contras]
  - **[Alternativa B]**: [prós e contras]

  ## Consequences
  **Positive**: [benefícios esperados]
  **Negative**: [trade-offs aceitos]

  ## Implementation Notes
  [Orientações para o Builder implementar esta decisão]

NÃO APENAS DESCREVA — CRIE O ARQUIVO ADR. O Builder lê este ADR para implementar.`,

  'system-designer': `Você é o System Designer — Especialista em System Design & Infraestrutura em Escala.

Spec/Tarefa: {spec_content}

Contexto anterior: {previous_output}

PASSO 1 — ANÁLISE DE SISTEMA:
  - Back-of-the-envelope: estimar volume de dados, requests/s, storage
  - High-level design: componentes principais e como se comunicam
  - Data model: entidades, relacionamentos, escolha de storage
  - Scalability: como o sistema escala horizontalmente
  - Reliability: SLOs, redundância, failover, disaster recovery

PASSO 2 — CRIAR DOCUMENTO DE SYSTEM DESIGN (OBRIGATÓRIO):
  USE a ferramenta Write para CRIAR O ARQUIVO FÍSICO:
  Caminho: docs/system-design/sdd/{NOME-DA-FEATURE}.md

  Conteúdo obrigatório:
  # System Design: {nome da feature}

  ## Back-of-the-Envelope Estimation
  - Users: X DAU / MAU
  - Requests/s: X read, X write
  - Storage: X GB/TB (growth rate)
  - Bandwidth: X Mbps

  ## High-Level Architecture
  [Diagrama em texto/ASCII ou descrição dos componentes]

  ## Data Model
  [Entidades principais, schema, tipo de storage (SQL/NoSQL/cache)]

  ## API Design
  [Endpoints principais com método, parâmetros e response]

  ## Scalability & Reliability
  - **Horizontal scaling**: [estratégia]
  - **Caching**: [onde e como]
  - **SLO**: availability X%, latency p99 Xms
  - **Failure modes**: [como lidar com falhas]

  ## Trade-offs
  [Decisões de design com justificativa]

NÃO APENAS DESCREVA — CRIE O ARQUIVO. O Builder e o Guardian leem este documento.`,

  builder: `Você é o Builder — Software Engineer & Implementation Specialist.

Spec/Tarefa: {spec_content}

Design e contexto anterior: {previous_output}

PASSO 1 — IMPLEMENTAÇÃO:
  USE as ferramentas Write e Edit para CRIAR/MODIFICAR ARQUIVOS FÍSICOS:
  - Implemente toda a lógica descrita na spec e no design
  - Siga os padrões do projeto (leia arquivos existentes para entender convenções)
  - Error handling completo: sem catch vazio, mensagens úteis, logging adequado
  - Tipagem correta (TypeScript quando aplicável)
  - Testes unitários para a lógica principal (se o projeto já tem test suite)
  - NÃO deixe TODO, placeholder ou código incompleto

PASSO 2 — AO TERMINAR, LISTE O QUE FOI FEITO:
  Formato obrigatório no final da sua resposta:

  ## Implementation Summary
  **Status**: ✅ COMPLETE | ⚠️ PARTIAL (justifique)

  ### Files Created
  - \`path/to/file.ts\` — [o que faz]

  ### Files Modified
  - \`path/to/existing.ts\` — [o que mudou]

  ### What was implemented
  [Descrição objetiva do que foi feito]

  ### What was NOT implemented (if any)
  [Itens fora de escopo ou que precisam de follow-up]

CRÍTICO: Use as ferramentas Write/Edit. Não apenas descreva — CRIE OS ARQUIVOS.`,

  guardian: `Você é o Guardian — QA Engineer & Code Reviewer completo.

Spec: {spec_content}

Implementação do Builder: {previous_output}

PASSO 1 — REGRESSION TESTS (obrigatório, execute ANTES de qualquer review):
  Detecte e rode a suite de testes existente (npm test / pytest / make test).
  SE algum teste que antes passava agora falha → REGRESSÃO DETECTADA:
    - Marque como 🔴 BREAKING
    - Liste: qual teste, qual arquivo causou, o que quebrou
    - Bloqueie o avanço, chame @builder para corrigir ANTES de continuar

PASSO 2 — CODE REVIEW:
  - Legibilidade, nomes, coesão de funções
  - DRY, SOLID, padrões do projeto
  - Error handling: sem catch vazio, mensagens úteis
  - Dead code, imports desnecessários
  - Tipagem correta (TypeScript quando aplicável)
  - Edge cases não tratados

PASSO 3 — SECURITY:
  - OWASP Top 10: injection, XSS, CSRF, broken auth
  - Secrets hardcoded, input validation, rate limiting
  - Dados sensíveis em logs ou respostas de erro

PASSO 4 — PERFORMANCE:
  - Queries N+1, falta de índices, falta de cache
  - Operações bloqueantes, response size excessivo

PASSO 5 — CRIAR ARQUIVO DE VERDICT (OBRIGATÓRIO):
  USE a ferramenta Write/Edit para CRIAR O ARQUIVO FÍSICO:
  Caminho: docs/security/guardian-verdict-{DATA-DE-HOJE}.md

  Conteúdo obrigatório do arquivo:
  # Guardian Verdict — {DATA E HORA}

  ## Overall Verdict
  **Status**: APPROVED ✅ | BLOCKED ❌ | NEEDS_FIXES ⚠️
  **Feature**: [nome da feature/spec]

  ## Regression Tests
  **Result**: ✅ ALL PASSING | ❌ REGRESSIONS FOUND
  - Tests run: X | Passed: X | Failed: X
  - Regressions: [lista ou "none"]

  ## Code Review
  **Score**: X/10
  - [principais pontos positivos e negativos]

  ## Security
  **Score**: X/10
  **Blockers**: [lista ou "none"]
  - 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

  ## Performance
  **Score**: X/10
  [resumo ou "not evaluated"]

  ## Breaking Changes
  **Has breaking changes**: YES ⚠️ | NO ✅

  ## Action Items
  - [ ] [item obrigatório antes do merge]

  ## Summary for Challenger
  [Parágrafo objetivo: o que foi aprovado, o que foi bloqueado, principais riscos]

NÃO APENAS DESCREVA — CRIE O ARQUIVO. O Challenger lê este arquivo automaticamente.`,

  challenger: `Você é um revisor adversarial independente (Red Team).
Desafie criticamente o review do Guardian abaixo.

Spec original:
{spec_content}

Review do Guardian:
{previous_output}

Sua missão:
1. Questionar suposições do Guardian
2. Identificar blind spots e vetores não cobertos
3. Propor abordagens alternativas onde o Guardian aprovou algo questionável
4. Avaliar confiança no review (0-100%) por categoria
5. Marcar gaps críticos com ⚠️ CRITICAL GAP

Formato obrigatório de resposta:
## Challenger Assessment
**Confidence in Guardian's Review**: XX%
**Overall verdict**: [Agree / Partially Agree / Disagree]

## Scores (0–100)
| Category | Score | Justification |
|---|---|---|
| Security | XX/100 | [1-line justification] |
| Completeness | XX/100 | [1-line justification] |
| Correctness | XX/100 | [1-line justification] |
| Test Coverage | XX/100 | [1-line justification] |
| **Overall** | **XX/100** | [weighted average] |

### ✅ Confirmed
### ⚠️ Challenged Points
### 🔴 Critical Gaps
### 💡 Alternative Approaches
### Summary for Chronicler`,

  chronicler: `Você é o Chronicler — Technical Writer & Documentation Specialist.

Spec/Tarefa: {spec_content}

Implementação e reviews: {previous_output}

PASSO 1 — ATUALIZAR CHANGELOG (OBRIGATÓRIO):
  USE a ferramenta Edit para MODIFICAR docs/CHANGELOG.md.
  Adicione uma entrada na seção [Unreleased] (ou crie se não existir):

  ### Added / Changed / Fixed / Security (use o tipo correto)
  - [Descrição da mudança] — implementado pelo @builder, revisado pelo @guardian

PASSO 2 — CRIAR SNAPSHOT (OBRIGATÓRIO):
  USE a ferramenta Write para CRIAR O ARQUIVO FÍSICO:
  Caminho: docs/snapshots/{DATA-DE-HOJE}-{nome-da-feature}.md

  Conteúdo obrigatório:
  # Snapshot: {nome da feature} — {DATA E HORA}

  ## O que foi implementado
  [Descrição clara do que foi entregue]

  ## Arquivos criados/modificados
  | Arquivo | Ação | Descrição |
  |---------|------|-----------|
  | \`path/to/file\` | Created/Modified | [o que faz] |

  ## Decisões técnicas tomadas
  [ADRs gerados, trade-offs aceitos]

  ## Quality Gate
  **Guardian Verdict**: APPROVED ✅ | BLOCKED ❌ | NEEDS_FIXES ⚠️
  **Challenger**: [resultado se aplicável]
  **Tests**: [cobertura e status]

  ## Próximos passos sugeridos
  - [ ] [follow-up item 1]
  - [ ] [follow-up item 2]

PASSO 3 — ATUALIZAR TASKS NA SPEC:
  USE a ferramenta Edit para marcar tasks concluídas na spec:
  Mude \`- [ ]\` para \`- [x]\` nas tasks implementadas.

NÃO APENAS DESCREVA — CRIE/EDITE OS ARQUIVOS. Sem documentação, o trabalho não existe.`,
};

const AGENT_TIMEOUTS = {
  strategist: 300,
  architect: 600,
  'system-designer': 600,
  builder: 1200,
  guardian: 600,
  challenger: 300,
  chronicler: 300,
};

const DEFAULT_PHASES = [
  { id: 'strategist', name: 'Planning' },
  { id: 'architect', name: 'Design' },
  { id: 'system-designer', name: 'System Design' },
  { id: 'builder', name: 'Implementation' },
  { id: 'guardian', name: 'Validation' },
  { id: 'challenger', name: 'Adversarial Review (o3)' },
  { id: 'chronicler', name: 'Documentation' },
];

const TASK_TRACKING_AGENTS = ['builder', 'guardian', 'chronicler'];

/**
 * Prompt contracts define the expected structure for each agent's output.
 * Used to validate that the model actually produced useful output,
 * regardless of prompt composition or model behavior changes.
 *
 * Each contract specifies:
 * - requiredSections: headings or markers that MUST appear in output
 * - minLength: minimum output length (chars) to be considered valid
 * - forbiddenPatterns: patterns that indicate the agent violated its hard stops
 */
const AGENT_CONTRACTS = {
  strategist: {
    requiredSections: ['Acceptance Criteria', 'Estimativa'],
    minLength: 300,
    forbiddenPatterns: [/```(?:js|ts|py|go|rb|java|php|rs)\n/i], // must not write code
  },
  architect: {
    requiredSections: ['ADR-', 'Consequences'],
    minLength: 300,
    forbiddenPatterns: [],
  },
  'system-designer': {
    requiredSections: ['Back-of-the-Envelope', 'Scalability'],
    minLength: 300,
    forbiddenPatterns: [],
  },
  builder: {
    requiredSections: ['Implementation Summary'],
    minLength: 100,
    forbiddenPatterns: [],
  },
  guardian: {
    requiredSections: ['Guardian Verdict', 'Overall Verdict', 'Code Review'],
    minLength: 300,
    forbiddenPatterns: [],
  },
  challenger: {
    requiredSections: ['Challenger Assessment'],
    minLength: 200,
    forbiddenPatterns: [],
  },
  chronicler: {
    requiredSections: ['Snapshot:', 'Arquivos criados'],
    minLength: 200,
    forbiddenPatterns: [],
  },
};

/**
 * Validate agent output against its contract.
 * Returns { valid: boolean, warnings: string[] }
 */
function validateAgentOutput(agent, output) {
  const contract = AGENT_CONTRACTS[agent];
  if (!contract) return { valid: true, warnings: [] };

  const warnings = [];

  if (output.length < contract.minLength) {
    warnings.push(`Output too short (${output.length} chars, expected >= ${contract.minLength})`);
  }

  for (const section of contract.requiredSections) {
    if (!output.includes(section)) {
      warnings.push(`Missing required section: "${section}"`);
    }
  }

  for (const pattern of contract.forbiddenPatterns) {
    if (pattern.test(output)) {
      warnings.push(`Hard stop violation: output matches forbidden pattern ${pattern}`);
    }
  }

  return { valid: warnings.length === 0, warnings };
};

/**
 * Read markdown docs from specific project directories.
 * Returns concatenated content capped at maxChars per file.
 */
function readProjectDocs(projectPath, dirs, maxCharsPerFile = 4000) {
  const path = require('node:path');
  const fs = require('node:fs');
  const sections = [];

  for (const dir of dirs) {
    const dirPath = path.join(projectPath, dir);
    try {
      const files = fs.readdirSync(dirPath)
        .filter(f => f.endsWith('.md') && !f.startsWith('.'))
        .sort()
        .slice(-3); // last 3 files per dir (most recent)

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
          const trimmed = content.length > maxCharsPerFile
            ? content.slice(0, maxCharsPerFile) + '\n... [truncated]'
            : content;
          sections.push(`### ${dir}/${file}\n${trimmed}`);
        } catch { /* skip unreadable files */ }
      }
    } catch { /* skip missing dirs */ }
  }

  return sections.join('\n\n---\n\n');
}

/**
 * Extract file paths mentioned in a text (Guardian's review, spec, etc.)
 * Looks for common patterns like `src/foo.js`, ./bar/baz.ts, etc.
 */
function extractMentionedFiles(text, projectPath) {
  const fs = require('node:fs');
  const path = require('node:path');

  const SKIP_EXTENSIONS = new Set(['.jpg', '.png', '.gif', '.svg', '.ico', '.woff', '.ttf', '.eot', '.lock']);
  const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__']);

  // Match file paths: src/foo.js, ./bar.ts, `path/to/file.py`, etc.
  const regex = /(?:`|'|"|\b)((?:\.\/|\.\.\/)?(?:[\w-]+\/)*[\w.-]+\.(?:js|ts|jsx|tsx|py|go|rb|java|php|rs|cs|cpp|c|h|yaml|yml|json|env|sh|sql))\b/g;

  const found = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    found.add(match[1]);
  }

  const results = [];
  for (const relPath of found) {
    const ext = path.extname(relPath);
    if (SKIP_EXTENSIONS.has(ext)) continue;
    if (SKIP_DIRS.has(relPath.split('/')[0])) continue;

    const absPath = path.resolve(projectPath, relPath);
    try {
      const stat = fs.statSync(absPath);
      if (stat.isFile()) results.push({ relPath, absPath });
    } catch { /* file doesn't exist */ }
  }

  return results;
}

/**
 * Read source code files mentioned in the Guardian's review or spec.
 * Falls back to recently modified files in common source dirs.
 * Returns formatted string with file contents.
 */
function readRelevantCode(projectPath, guardianOutput, specContent, maxTotalChars = 30000) {
  const fs = require('node:fs');
  const path = require('node:path');

  const SOURCE_DIRS = ['src', 'app', 'lib', 'backend', 'api', 'server', 'components', 'pages'];
  const CODE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rb', '.php', '.rs', '.java', '.sql']);
  const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__', 'vendor']);

  // 1. First priority: files explicitly mentioned in Guardian's review or spec
  const mentioned = extractMentionedFiles((guardianOutput || '') + '\n' + specContent, projectPath);

  // 2. Fallback: recently modified source files
  function collectRecent(dir, results = []) {
    const dirPath = path.join(projectPath, dir);
    try {
      for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          collectRecent(path.relative(projectPath, fullPath), results);
        } else if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
          try {
            const stat = fs.statSync(fullPath);
            results.push({ relPath: path.relative(projectPath, fullPath), absPath: fullPath, mtime: stat.mtimeMs });
          } catch { /* skip */ }
        }
      }
    } catch { /* dir doesn't exist */ }
    return results;
  }

  let candidates = [...mentioned];
  if (candidates.length === 0) {
    const recent = [];
    for (const dir of SOURCE_DIRS) collectRecent(dir, recent);
    recent.sort((a, b) => b.mtime - a.mtime);
    candidates = recent.slice(0, 10);
  }

  const sections = [];
  let totalChars = 0;
  const MAX_PER_FILE = 5000;

  for (const { relPath, absPath } of candidates) {
    if (totalChars >= maxTotalChars) break;
    try {
      let content = fs.readFileSync(absPath, 'utf-8');
      if (content.length > MAX_PER_FILE) content = content.slice(0, MAX_PER_FILE) + '\n... [truncated]';
      sections.push(`### ${relPath}\n\`\`\`\n${content}\n\`\`\``);
      totalChars += content.length;
    } catch { /* skip unreadable */ }
  }

  return sections.join('\n\n');
}

/**
 * Build the full prompt for the Challenger agent (OpenAI o3).
 * Hybrid approach: project docs (history/context) + relevant source code (ground truth)
 * + Guardian's review + memory. Same pattern as Claude agents reading project files.
 */
function buildChallengerPrompt(agentDefinition, specContent, guardianOutput, memoryContext, projectPath) {
  const DOC_DIRS = ['docs/security', 'docs/decisions', 'docs/architecture', 'docs/performance'];

  const projectDocs = readProjectDocs(projectPath, DOC_DIRS);
  const relevantCode = readRelevantCode(projectPath, guardianOutput, specContent);

  const sections = [];

  if (agentDefinition) {
    sections.push(agentDefinition);
  }

  if (memoryContext) {
    sections.push(`## Project Memory (decisions & artifacts from this session)\n\n${memoryContext}`);
  }

  if (projectDocs) {
    sections.push(`## Project Documentation (generated by previous agents)\n\n${projectDocs}`);
  }

  if (relevantCode) {
    sections.push(`## Relevant Source Code\n\n${relevantCode}`);
  }

  sections.push(`## Spec (original task)\n\n${specContent}`);
  sections.push(`## Guardian's Review (Claude's security & quality assessment)\n\n${guardianOutput || 'N/A'}`);

  return sections.join('\n\n---\n\n');
}

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
 * If memoryContext is provided, injects it before the prompt for context continuity.
 * If complexity is provided (from adaptive planning), injects it as calibration context.
 *
 * @param {string} agent
 * @param {string} specContent
 * @param {string[]} previousOutputs
 * @param {string|null} agentDefinition
 * @param {string|null} memoryContext
 * @param {{ level: string, rationale: string, subagentCount?: number, focus?: string }|null} complexity
 */
function buildPrompt(agent, specContent, previousOutputs, agentDefinition, memoryContext, complexity) {
  const prompt = AGENT_PROMPTS[agent]
    .replace('{spec_content}', specContent)
    .replace('{previous_output}', (previousOutputs || []).join('\n---\n') || 'N/A');

  // Use full agent definition if available, otherwise fallback to skill command
  const agentContext = agentDefinition || AGENT_SKILLS[agent];

  // Build complexity calibration block if available (from adaptive planning)
  let complexityBlock = '';
  if (complexity && complexity.level) {
    const subagentHint = complexity.subagentCount
      ? `Spawn ${complexity.subagentCount} parallel subagents for independent sub-tasks.`
      : '';
    const focusHint = complexity.focus
      ? `Focus your effort on: ${complexity.focus}.`
      : '';
    complexityBlock = `## Task Complexity (from Adaptive Planner)\n**Level**: ${complexity.level}\n**Rationale**: ${complexity.rationale || 'N/A'}\n**Calibration**: ${subagentHint} ${focusHint}\nAdjust depth of analysis and number of subagents accordingly.\n\n---\n\n`;
  }

  // Inject memory context and complexity if available
  if (memoryContext) {
    return `${agentContext}\n\n---\n\n${memoryContext}\n\n---\n\n${complexityBlock}${prompt}`;
  }

  return `${agentContext}\n\n---\n\n${complexityBlock}${prompt}`;
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

/**
 * Parse structured data from Challenger output.
 * Extracts confidence score, verdict, per-category scores, critical gaps and challenged points.
 *
 * @param {string} output - Raw Challenger output
 * @returns {{
 *   confidence: number|null,
 *   verdict: string|null,
 *   scores: { security: number|null, completeness: number|null, correctness: number|null, testCoverage: number|null, overall: number|null },
 *   criticalGaps: string[],
 *   challengedPoints: number
 * }}
 */
function parseChallengerOutput(output) {
  // Confidence score: **Confidence in Guardian's Review**: 72%
  const confidenceMatch = output.match(/\*\*Confidence[^*]*\*\*[^0-9]*(\d+)%/i);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : null;

  // Verdict: **Overall verdict**: Partially Agree
  const verdictMatch = output.match(/\*\*Overall verdict\*\*[:\s]*(.+)/i);
  const verdict = verdictMatch ? verdictMatch[1].replace(/\*\*/g, '').trim() : null;

  // Per-category scores from the Scores table
  // Matches: | Security | 78/100 | ... | or | Security | 78 | ...
  const parseScore = (category) => {
    const re = new RegExp(`\\|\\s*${category}\\s*\\|\\s*(\\d+)(?:\\/100)?\\s*\\|`, 'i');
    const m = output.match(re);
    return m ? parseInt(m[1], 10) : null;
  };
  const scores = {
    security: parseScore('Security'),
    completeness: parseScore('Completeness'),
    correctness: parseScore('Correctness'),
    testCoverage: parseScore('Test Coverage'),
    overall: parseScore('\\*\\*Overall\\*\\*') ?? parseScore('Overall'),
  };

  // Critical Gaps section (🔴)
  const criticalMatch = output.match(/###\s*(?:🔴|Critical Gaps?)[^\n]*\n([\s\S]*?)(?=\n###|\n##|$)/i);
  const criticalGaps = criticalMatch
    ? criticalMatch[1]
        .split('\n')
        .map(l => l.replace(/^[-*]\s*/, '').trim())
        .filter(l => l.length > 10 && !l.startsWith('#'))
    : [];

  // Challenged Points count (numbered items)
  const challengedMatch = output.match(/###\s*(?:⚠️|Challenged Points?)[^\n]*\n([\s\S]*?)(?=\n###|\n##|$)/i);
  const challengedPoints = challengedMatch
    ? (challengedMatch[1].match(/^\d+\.\s/gm) || []).length
    : 0;

  return { confidence, verdict, scores, criticalGaps, challengedPoints };
}

/**
 * Auto-save Challenger output to docs/security/challenger-{timestamp}.md
 * Returns the path where it was saved (or null if output is empty).
 *
 * @param {string} projectPath
 * @param {string} output
 * @returns {string|null}
 */
function saveChallengerOutput(projectPath, output) {
  const path = require('node:path');
  const fs = require('node:fs');
  if (!output || !output.trim()) return null;

  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const dir = path.join(projectPath, 'docs', 'security');
  fs.mkdirSync(dir, { recursive: true, mode: 0o750 });

  const filePath = path.join(dir, `challenger-${timestamp}.md`);
  fs.writeFileSync(filePath, output, { encoding: 'utf-8', mode: 0o640 });
  return filePath;
}

module.exports = {
  VALID_AGENTS,
  AGENT_SKILLS,
  AGENT_PROMPTS,
  AGENT_TIMEOUTS,
  DEFAULT_PHASES,
  TASK_TRACKING_AGENTS,
  AGENT_CONTRACTS,
  loadAgentDefinitionSync,
  buildPrompt,
  buildChallengerPrompt,
  parseChallengerOutput,
  saveChallengerOutput,
  validateAgentOutput,
  extractUncheckedTasks,
  isTaskMentionedAsCompleted,
  autoUpdateSpecTasks,
};
