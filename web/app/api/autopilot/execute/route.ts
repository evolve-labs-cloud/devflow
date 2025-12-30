import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

/**
 * Autopilot Execute API - Executa uma única fase
 * Versão simplificada sem streaming
 */

interface ExecuteRequest {
  agent: string;
  specContent: string;
  previousOutputs: string[];
  projectPath: string;
}

// Agent skill prefixes
const AGENT_SKILLS: Record<string, string> = {
  strategist: '/agents:strategist',
  architect: '/agents:architect',
  builder: '/agents:builder',
  guardian: '/agents:guardian',
  chronicler: '/agents:chronicler',
};

// Prompts por agente
const AGENT_PROMPTS: Record<string, string> = {
  strategist: `Analise a spec e refine os requisitos:

{spec_content}

Tarefas:
1. Identificar requisitos implícitos
2. Listar acceptance criteria claros
3. Identificar dependências e riscos
4. Estimar complexidade

Seja conciso e objetivo.`,

  architect: `Com base na spec, defina a arquitetura:

{spec_content}

Contexto anterior:
{previous_output}

Tarefas:
1. Definir arquitetura da solução
2. Escolher padrões e tecnologias
3. Listar componentes necessários
4. Documentar decisões importantes

Seja conciso e objetivo.`,

  builder: `Implemente a solução conforme spec e design:

{spec_content}

Contexto anterior:
{previous_output}

Tarefas:
1. Criar/modificar arquivos necessários
2. Implementar lógica principal
3. Adicionar tratamento de erros

Implemente o código diretamente.`,

  guardian: `Revise o código implementado:

{spec_content}

Implementação:
{previous_output}

Tarefas:
1. Verificar segurança
2. Verificar performance
3. Verificar edge cases
4. Listar melhorias necessárias

Seja conciso e objetivo.`,

  chronicler: `Documente as mudanças realizadas:

{spec_content}

Implementação:
{previous_output}

Tarefas:
1. Resumir o que foi implementado
2. Listar arquivos criados/modificados
3. Atualizar tasks na spec se necessário

Seja conciso e objetivo.`,
};

// Timeout por agente (em segundos)
const AGENT_TIMEOUTS: Record<string, number> = {
  strategist: 300,    // 5 min
  architect: 600,     // 10 min
  builder: 1200,      // 20 min
  guardian: 600,      // 10 min
  chronicler: 300,    // 5 min
};

export async function POST(req: NextRequest) {
  let body: ExecuteRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { agent, specContent, previousOutputs, projectPath } = body;

  if (!agent || !specContent || !projectPath) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const agentSkill = AGENT_SKILLS[agent];
  const promptTemplate = AGENT_PROMPTS[agent];

  if (!agentSkill || !promptTemplate) {
    return NextResponse.json({ error: `Unknown agent: ${agent}` }, { status: 400 });
  }

  // Build prompt
  const prompt = promptTemplate
    .replace('{spec_content}', specContent)
    .replace('{previous_output}', previousOutputs.join('\n\n---\n\n') || 'N/A');

  const fullPrompt = `${agentSkill}\n\n${prompt}`;

  try {
    const timeout = AGENT_TIMEOUTS[agent] || 600;

    // Execute Claude CLI synchronously with timeout
    const output = execSync(
      `claude --print --dangerously-skip-permissions`,
      {
        cwd: projectPath,
        input: fullPrompt,
        encoding: 'utf-8',
        timeout: timeout * 1000,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        env: { ...process.env },
      }
    );

    return NextResponse.json({
      success: true,
      output: output.trim(),
      agent,
    });

  } catch (error) {
    console.error(`Autopilot ${agent} error:`, error);

    let errorMessage = 'Execution failed';

    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
        errorMessage = `Timeout: ${agent} took too long (>${AGENT_TIMEOUTS[agent]}s)`;
      } else if (error.message.includes('ENOENT')) {
        errorMessage = 'Claude CLI not found. Make sure it is installed.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
