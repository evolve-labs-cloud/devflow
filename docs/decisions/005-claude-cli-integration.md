---
id: "ADR-005"
title: "Integração com Claude Code CLI via Subprocess"
status: "accepted"
date: "2025-12-19"
deciders:
  - "@architect"
  - "@strategist"
tags:
  - "backend"
  - "claude"
  - "integration"
  - "streaming"
category: "architecture"
technical_story: "PRD DevFlow IDE Web - Chat com Agentes"

relates_to: ["ADR-004"]
supersedes: []
superseded_by: null

impact:
  scope: "project"
  magnitude: "critical"

review_date: "2025-12-19"
next_review: "2026-03-19"
---

# ADR-005: Integração com Claude Code CLI via Subprocess

## Context

O DevFlow IDE precisa comunicar com Claude para funcionalidade de chat com agentes. Existem duas abordagens principais:

1. **API Direta**: Chamar API do Anthropic diretamente
2. **Via CLI**: Usar Claude Code CLI como subprocess

**Problema anterior**: Tentativas de interface web falharam por latência na comunicação.

**Constraints**:
- Deve preservar contexto do projeto (.claude_project)
- Sistema de agentes (@strategist, etc) deve funcionar
- Comandos existentes (/new-feature) devem funcionar
- Latência deve ser < 2s para primeiro token

## Decision

**Escolhemos usar Claude Code CLI como subprocess com streaming via Server-Sent Events (SSE).**

```
Frontend (fetch) → API Route (spawn) → Claude CLI (stdout) → SSE → Frontend
```

### Comando CLI

```bash
claude --print --output-format stream-json -p /path/to/project "mensagem"
```

### Flags Utilizadas

| Flag | Propósito |
|------|-----------|
| `--print` | Modo não-interativo, retorna resultado |
| `--output-format stream-json` | Output em JSONL para parsing |
| `-p /path` | Define projeto para carregar contexto |

## Rationale

### Por que CLI e não API direta?

| Critério | Via CLI | API Direta |
|----------|---------|------------|
| Contexto do projeto | Automático (.claude_project) | Manual (replicar lógica) |
| Sistema de agentes | Funciona nativamente | Precisa reimplementar |
| Comandos / | Funcionam | Precisa reimplementar |
| Complexidade | Baixa (spawn process) | Alta (gerenciar contexto) |
| Custo de tokens | Gerenciado pelo CLI | Controle manual |
| Streaming | `--output-format stream-json` | API nativa |

**Decisão**: CLI. O ganho de não reimplementar toda a lógica de contexto supera a complexidade de gerenciar subprocess.

### Por que SSE e não WebSocket?

| Critério | SSE | WebSocket |
|----------|-----|-----------|
| Direção | Unidirecional (server→client) | Bidirecional |
| Complexidade | Simples (HTTP) | Maior (protocolo separado) |
| Reconexão | Automática | Manual |
| Compatibilidade | Nativa em Next.js | Precisa servidor separado |
| Use case | Chat (request→response) | Real-time bidirecional |

**Decisão**: SSE. Chat é request-response, não precisa bidirecional. SSE é mais simples e funciona bem com Next.js API Routes.

## Alternatives Considered

### Alternativa 1: API Anthropic Direta

**Descrição**: Chamar `/v1/messages` diretamente

**Pros:**
- Controle total sobre tokens/custos
- Streaming nativo
- Sem dependência do CLI instalado

**Cons:**
- Precisa reimplementar sistema de contexto
- Precisa reimplementar agentes
- Precisa reimplementar comandos /
- Duplicação de lógica

**Por que foi rejeitada**: Effort muito alto. CLI já tem tudo implementado.

### Alternativa 2: WebSocket para Chat

**Descrição**: Conexão WebSocket persistente

**Pros:**
- Bidirecional
- Conexão persistente
- Menos overhead por mensagem

**Cons:**
- Complexidade maior
- Next.js não suporta WebSocket em API Routes (precisa custom server)
- Chat não precisa de bidirecional

**Por que foi rejeitada**: Over-engineering. SSE resolve o problema com menos complexidade.

### Alternativa 3: Long Polling

**Descrição**: Polling para verificar novas mensagens

**Pros:**
- Universalmente suportado
- Simples de implementar

**Cons:**
- Ineficiente
- Latência variável
- Não é streaming real

**Por que foi rejeitada**: Não resolve o problema de latência.

## Consequences

### Positive

- Contexto do projeto preservado automaticamente
- Sistema de agentes funciona sem modificação
- Comandos / funcionam nativamente
- Streaming resolve problema de latência
- Implementação simples

### Negative

- Dependência do Claude Code CLI instalado
- Menos controle sobre tokens/custos
- Debug mais complexo (subprocess)
- Erro handling precisa cobrir muitos casos

### Risks

**Risk 1**: Claude CLI não instalado/autenticado
- Likelihood: High (primeiro uso)
- Impact: High (app não funciona)
- Mitigation:
  - Health check no startup
  - Mensagem clara de instalação
  - Link para documentação

**Risk 2**: Streaming quebra no meio
- Likelihood: Medium
- Impact: Medium
- Mitigation:
  - Timeout com mensagem clara
  - Retry automático
  - Preservar output parcial

**Risk 3**: Output do CLI muda entre versões
- Likelihood: Low
- Impact: High
- Mitigation:
  - Documentar versão mínima suportada
  - Parser resiliente (fallback para raw text)
  - Monitorar changelog do Claude Code

## Implementation

### API Route: /api/chat/route.ts

```typescript
import { spawn } from 'child_process';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, projectPath, agent } = await req.json();

  // Validação de segurança
  if (!isValidPath(projectPath)) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), {
      status: 400
    });
  }

  // Preparar mensagem com agente
  const fullMessage = agent ? `${agent} ${message}` : message;

  // Criar stream de resposta
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const claude = spawn('claude', [
          '--print',
          '--output-format', 'stream-json',
          '-p', projectPath,
        ], {
          cwd: projectPath,
          env: { ...process.env },
        });

        // Enviar mensagem para stdin
        claude.stdin.write(fullMessage);
        claude.stdin.end();

        // Buffer para linhas incompletas
        let buffer = '';

        claude.stdout.on('data', (data: Buffer) => {
          buffer += data.toString();
          const lines = buffer.split('\n');

          // Manter última linha incompleta no buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const event = JSON.parse(line);

              // Extrair texto do evento
              if (event.type === 'assistant' && event.message?.content) {
                for (const block of event.message.content) {
                  if (block.type === 'text') {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: 'token',
                        content: block.text
                      })}\n\n`)
                    );
                  }
                }
              } else if (event.type === 'result') {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'done',
                    result: event.result
                  })}\n\n`)
                );
              }
            } catch (e) {
              // Fallback: enviar como texto raw
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'token',
                  content: line
                })}\n\n`)
              );
            }
          }
        });

        claude.stderr.on('data', (data: Buffer) => {
          const error = data.toString();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              content: error
            })}\n\n`)
          );
        });

        claude.on('close', (code) => {
          if (code !== 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                content: `Process exited with code ${code}`
              })}\n\n`)
            );
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        });

        claude.on('error', (err) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              content: err.message
            })}\n\n`)
          );
          controller.close();
        });

      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            content: String(error)
          })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Validação de path para segurança
function isValidPath(path: string): boolean {
  // Prevenir path traversal
  if (path.includes('..')) return false;

  // Deve ser path absoluto
  if (!path.startsWith('/')) return false;

  // Não permitir paths sensíveis
  const blockedPaths = ['/etc', '/usr', '/var', '/root'];
  if (blockedPaths.some(p => path.startsWith(p))) return false;

  return true;
}
```

### Frontend Hook: useChat.ts

```typescript
import { useState, useRef, useCallback } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  timestamp: Date;
}

export function useChat(projectPath: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentAgent, setCurrentAgent] = useState('@strategist');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Preparar mensagem do assistente (streaming)
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      agent: currentAgent,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsStreaming(true);

    // Criar abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          projectPath,
          agent: currentAgent,
        }),
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') {
            setIsStreaming(false);
            return;
          }

          try {
            const event = JSON.parse(data);

            if (event.type === 'token') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  last.content += event.content;
                }
                return updated;
              });
            } else if (event.type === 'error') {
              console.error('Chat error:', event.content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            last.content += '\n\n[Resposta interrompida]';
          }
          return updated;
        });
      } else {
        console.error('Chat error:', error);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [projectPath, currentAgent]);

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    messages,
    sendMessage,
    cancelStream,
    isStreaming,
    currentAgent,
    setCurrentAgent,
  };
}
```

### Health Check: /api/health/route.ts

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface HealthStatus {
  claudeCli: {
    installed: boolean;
    authenticated: boolean;
    version?: string;
    error?: string;
  };
  project: {
    valid: boolean;
    hasDevflow: boolean;
    hasClaudeProject: boolean;
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectPath = searchParams.get('projectPath');

  const status: HealthStatus = {
    claudeCli: {
      installed: false,
      authenticated: false,
    },
    project: {
      valid: false,
      hasDevflow: false,
      hasClaudeProject: false,
    },
  };

  // Check Claude CLI
  try {
    const { stdout } = await execAsync('claude --version');
    status.claudeCli.installed = true;
    status.claudeCli.version = stdout.trim();

    // Check auth (simplified)
    const { stdout: whoami } = await execAsync('claude whoami');
    status.claudeCli.authenticated = !whoami.includes('not authenticated');
  } catch (error) {
    status.claudeCli.error = (error as Error).message;
  }

  // Check project if path provided
  if (projectPath) {
    try {
      const fs = await import('fs/promises');

      await fs.access(projectPath);
      status.project.valid = true;

      try {
        await fs.access(`${projectPath}/.devflow`);
        status.project.hasDevflow = true;
      } catch {}

      try {
        await fs.access(`${projectPath}/.claude_project`);
        status.project.hasClaudeProject = true;
      } catch {}
    } catch {}
  }

  return Response.json(status);
}
```

## Follow-up Actions

- [ ] Implementar API Route /api/chat
- [ ] Implementar hook useChat
- [ ] Implementar health check
- [ ] Adicionar timeout (120s)
- [ ] Adicionar retry logic
- [ ] Testar com diferentes outputs do CLI
- [ ] Documentar erros comuns e soluções

## References

- [Claude Code CLI Documentation](https://docs.anthropic.com/claude-code)
- [Next.js Streaming](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)
- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Node.js child_process](https://nodejs.org/api/child_process.html)

---

**Notes**:
- Versão mínima do Claude CLI: verificar na implementação
- Monitorar changelog do Claude Code para mudanças no output format
- Considerar API direta como fallback futuro
