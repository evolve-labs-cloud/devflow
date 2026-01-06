# US-009: Streaming de Respostas

**Epic**: Chat com Agentes
**Prioridade**: P0 (Blocker)
**Complexidade**: 5 pontos
**Status**: Implemented

---

## User Story

**Como** desenvolvedor
**Quero** ver as respostas dos agentes em streaming (token por token)
**Para** ter feedback imediato e não esperar respostas longas

---

## Acceptance Criteria

### AC1: Início Rápido do Streaming
```gherkin
Given que enviei mensagem para um agente
When o Claude CLI começa a responder
Then vejo o primeiro token em menos de 2 segundos
And vejo indicador visual de "gerando..."
```

### AC2: Renderização Progressiva
```gherkin
Given que o streaming está em andamento
When novos tokens chegam
Then eles são adicionados à mensagem em tempo real
And a UI não trava ou fica lenta
And o scroll acompanha automaticamente (se no final)
```

### AC3: Indicador de Status
```gherkin
Given que o agente está respondendo
Then vejo indicador pulsante "●●●" ou similar
When a resposta termina
Then o indicador desaparece
And a mensagem fica "completa"
```

### AC4: Cancelar Streaming
```gherkin
Given que o streaming está em andamento
When clico no botão "Stop" ou pressiono Esc
Then o streaming é cancelado
And a mensagem parcial é preservada
And vejo indicação "[Resposta interrompida]"
```

### AC5: Reconexão em Falha
```gherkin
Given que o streaming foi interrompido por erro de conexão
When a conexão é restabelecida
Then vejo opção de "Tentar novamente"
When clico em tentar novamente
Then a mesma mensagem é reenviada
```

### AC6: Performance com Respostas Longas
```gherkin
Given que a resposta tem mais de 10.000 caracteres
When está sendo renderizada em streaming
Then a UI mantém 60fps
And não há congelamento perceptível
And a memória não cresce indefinidamente
```

---

## Technical Notes

### Server-Sent Events (SSE) Implementation

```typescript
// Frontend: Hook para SSE
function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = async (message: string) => {
    setIsStreaming(true);
    setStreamedContent('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, projectPath }),
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsStreaming(false);
              return;
            }

            try {
              const { token } = JSON.parse(data);
              setStreamedContent(prev => prev + token);
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled
        setStreamedContent(prev => prev + '\n\n[Resposta interrompida]');
      } else {
        throw error;
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const cancelStream = () => {
    abortControllerRef.current?.abort();
  };

  return { sendMessage, cancelStream, isStreaming, streamedContent };
}
```

### Backend: Spawn Claude CLI com Streaming

```typescript
// app/api/chat/route.ts
import { spawn } from 'child_process';

export async function POST(req: Request) {
  const { message, projectPath } = await req.json();

  const stream = new ReadableStream({
    start(controller) {
      const claude = spawn('claude', [
        '--print',
        '--output-format', 'stream-json',
        '-p', projectPath,
      ], {
        cwd: projectPath,
      });

      // Send message to stdin
      claude.stdin.write(message);
      claude.stdin.end();

      claude.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        const lines = text.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const event = JSON.parse(line);

            // Handle different event types from Claude CLI
            if (event.type === 'assistant' && event.message?.content) {
              for (const block of event.message.content) {
                if (block.type === 'text') {
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ token: block.text })}\n\n`
                    )
                  );
                }
              }
            }
          } catch {
            // Non-JSON output, might be raw text
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ token: line })}\n\n`
              )
            );
          }
        }
      });

      claude.stderr.on('data', (data: Buffer) => {
        console.error('Claude CLI stderr:', data.toString());
      });

      claude.on('close', (code) => {
        controller.enqueue(
          new TextEncoder().encode('data: [DONE]\n\n')
        );
        controller.close();
      });

      claude.on('error', (err) => {
        controller.error(err);
      });
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
```

### Performance Optimizations

```typescript
// 1. Batch DOM updates with requestAnimationFrame
const batchedUpdate = useMemo(() => {
  let pending = '';
  let rafId: number | null = null;

  return (token: string, setContent: (fn: (s: string) => string) => void) => {
    pending += token;

    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        setContent(prev => prev + pending);
        pending = '';
        rafId = null;
      });
    }
  };
}, []);

// 2. Virtualize long responses
// Use react-window ou similar para mensagens muito longas

// 3. Debounce markdown parsing
const debouncedMarkdown = useMemo(
  () => debounce((content: string) => parseMarkdown(content), 100),
  []
);
```

---

## UI/UX Notes

### Estados Visuais

```
┌─────────────────────────────────────────────────────────────┐
│ Estado: IDLE (aguardando input)                             │
├─────────────────────────────────────────────────────────────┤
│ 🤖 @strategist                                              │
│ Última resposta completa aqui...                            │
│                                                             │
│ ┌─────────────────────────────────────────────────┐ [Send] │
│ │ Digite sua mensagem...                          │        │
│ └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Estado: STREAMING                                           │
├─────────────────────────────────────────────────────────────┤
│ 🤖 @strategist                              ● Gerando...   │
│ Aqui está a análise do problema que você mencionou:        │
│                                                             │
│ 1. **Primeiro ponto**: O sistema atual não tem▌            │
│                                                             │
│ ┌─────────────────────────────────────────────────┐ [Stop] │
│ │ (aguardando resposta...)                        │        │
│ └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Estado: CANCELLED                                           │
├─────────────────────────────────────────────────────────────┤
│ 🤖 @strategist                                              │
│ Aqui está a análise do problema que você mencionou:        │
│                                                             │
│ 1. **Primeiro ponto**: O sistema atual não tem             │
│                                                             │
│ ⚠️ [Resposta interrompida pelo usuário]                    │
│                                                             │
│ ┌─────────────────────────────────────────────────┐ [Send] │
│ │ Digite sua mensagem...                          │        │
│ └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Indicador de Streaming

```css
/* Cursor piscante no final do texto */
.streaming-cursor::after {
  content: '▌';
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Indicador de "gerando" */
.generating-indicator {
  display: flex;
  gap: 4px;
}

.generating-dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  animation: pulse 1.5s infinite ease-in-out;
}

.generating-dot:nth-child(2) { animation-delay: 0.2s; }
.generating-dot:nth-child(3) { animation-delay: 0.4s; }
```

---

## Definition of Done

- [x] Primeiro token aparece em < 2s
- [x] Streaming renderiza suavemente (60fps)
- [x] Indicador visual durante streaming
- [x] Botão de cancelar funciona
- [x] Auto-scroll funciona corretamente
- [x] Respostas longas não travam UI
- [x] Erro de conexão mostra "Tentar novamente"
- [x] Testes de integração com mock de streaming
- [x] Code review aprovado

---

## Dependencies

- US-008 (interface de chat base)

---

## Métricas de Sucesso

| Métrica | Target | Como Medir |
|---------|--------|------------|
| Time to First Token | < 2s | Performance API |
| Frame rate durante streaming | > 55fps | DevTools Performance |
| Memory leak | 0 | Heap snapshot antes/depois |
| User-perceived latency | "Rápido" | User testing |

---

*Story criada por @strategist*
