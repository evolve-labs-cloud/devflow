# US-008: Chat com Agentes

**Epic**: Chat com Agentes
**Prioridade**: P0 (Blocker)
**Complexidade**: 8 pontos
**Status**: Implemented

---

## User Story

**Como** desenvolvedor
**Quero** conversar com @strategist e outros agentes via chat
**Para** criar specs e interagir com o sistema DevFlow sem usar terminal

---

## Acceptance Criteria

### AC1: Interface de Chat
```gherkin
Given que tenho projeto aberto
When olho para o painel de chat (direita ou bottom)
Then vejo:
  - Área de mensagens (histórico)
  - Input de texto para nova mensagem
  - Botão de enviar
  - Seletor de agente
```

### AC2: Enviar Mensagem
```gherkin
Given que estou no chat
When digito uma mensagem e pressiono Enter (ou clico Send)
Then a mensagem aparece no histórico como "Você"
And um indicador de "pensando..." aparece
And a resposta do agente começa a aparecer
```

### AC3: Seletor de Agente
```gherkin
Given que estou no chat
When clico no seletor de agente
Then vejo lista dos agentes disponíveis:
  | Agente      | Descrição               |
  | @strategist | Planejamento & Produto  |
  | @architect  | Design & Arquitetura    |
  | @builder    | Implementação           |
  | @guardian   | Qualidade & Testes      |
  | @chronicler | Documentação            |
When seleciono um agente
Then mensagens são prefixadas com @agente automaticamente
```

### AC4: Menção Manual de Agente
```gherkin
Given que estou digitando no chat
When digito "@"
Then vejo autocomplete com agentes disponíveis
When seleciono ou digito @strategist
Then a menção é destacada visualmente
```

### AC5: Streaming de Resposta
```gherkin
Given que enviei mensagem ao agente
When o agente está respondendo
Then vejo a resposta aparecendo token por token
And vejo indicador de "digitando..."
And posso ler enquanto ainda está gerando
```

### AC6: Renderização de Markdown na Resposta
```gherkin
Given que o agente enviou resposta
Then a resposta renderiza Markdown:
  - Headers formatados
  - Code blocks com syntax highlighting
  - Listas formatadas
  - Links clicáveis
  - Tabelas renderizadas
```

### AC7: Copiar Resposta
```gherkin
Given que vejo uma resposta do agente
When clico no botão "Copy" da mensagem
Then o conteúdo (markdown raw) é copiado para clipboard
And vejo feedback "Copiado!"
```

### AC8: Histórico da Sessão
```gherkin
Given que tive uma conversa
When fecho e reabro o chat (mesma sessão)
Then vejo o histórico preservado
When fecho a IDE e reabro
Then o histórico da sessão anterior está disponível em "Sessions"
```

---

## Technical Notes

### Integração com Claude CLI

```typescript
// Executar Claude CLI como subprocess com streaming
import { spawn } from 'child_process';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

async function sendToClaudeCLI(
  message: string,
  projectPath: string,
  onToken: (token: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const claude = spawn('claude', [
      '--print',           // Não interativo
      '--output-format', 'stream-json',
      '--project', projectPath,
    ]);

    let fullResponse = '';

    claude.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            if (event.type === 'content_block_delta') {
              const token = event.delta?.text || '';
              fullResponse += token;
              onToken(token);
            }
          } catch (e) {
            // Handle non-JSON output
          }
        }
      }
    });

    claude.stdin.write(message);
    claude.stdin.end();

    claude.on('close', (code) => {
      if (code === 0) resolve(fullResponse);
      else reject(new Error(`Claude CLI exited with code ${code}`));
    });
  });
}
```

### API Route (Server-Sent Events)

```typescript
// app/api/chat/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, projectPath } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await sendToClaudeCLI(message, projectPath, (token) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
        );
      });
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
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

### Estado do Chat (Zustand)

```typescript
interface ChatState {
  messages: ChatMessage[];
  currentAgent: string;
  isLoading: boolean;
  sessions: ChatSession[];

  sendMessage: (content: string) => Promise<void>;
  setAgent: (agent: string) => void;
  clearChat: () => void;
  loadSession: (sessionId: string) => void;
}
```

---

## UI/UX Notes

```
┌─────────────────────────────────────────────────────────────┐
│ CHAT                                    [@strategist ▼]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Você                                    10:30 AM │   │
│  │ Preciso criar uma spec para autenticação JWT       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 @strategist                             10:30 AM │   │
│  │                                                     │   │
│  │ Antes de criar a spec, preciso entender melhor:    │   │
│  │                                                     │   │
│  │ 1. **Qual problema** a autenticação resolve?       │   │
│  │ 2. **Quem são os usuários?** Internos? Externos?   │   │
│  │ 3. **Requisitos de compliance?** LGPD? SOC2?       │   │
│  │                                                     │   │
│  │ ▌ (streaming...)                          [Copy]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ [Send] │
│ │ Digite sua mensagem... (Enter para enviar)      │        │
│ └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Seletor de Agente (Dropdown)

```
┌──────────────────────┐
│ @strategist     ✓    │ ← selecionado
├──────────────────────┤
│ 📊 @strategist       │ Planejamento
│ 🏗️ @architect        │ Arquitetura
│ 🔨 @builder          │ Código
│ 🛡️ @guardian         │ Testes
│ 📝 @chronicler       │ Docs
└──────────────────────┘
```

### Autocomplete de @mention

```
Digite: "Preciso que @s|"
                      ↓
            ┌─────────────────┐
            │ @strategist     │
            └─────────────────┘
```

**Shortcuts**:
- `Enter` - Enviar mensagem
- `Shift+Enter` - Nova linha
- `@` - Trigger autocomplete de agentes
- `/` - Trigger autocomplete de comandos
- `Cmd+K` - Focar no input
- `Esc` - Cancelar streaming

---

## Definition of Done

- [x] Interface de chat renderiza corretamente
- [x] Mensagens são enviadas ao Claude CLI
- [x] Streaming funciona (< 2s para primeiro token)
- [x] Seletor de agente funciona
- [x] Autocomplete de @mention funciona
- [x] Respostas renderizam Markdown
- [x] Botão de copiar funciona
- [x] Histórico persiste na sessão
- [x] Testes de integração com CLI mockado
- [x] Code review aprovado

---

## Dependencies

- US-001 (projeto precisa estar aberto)
- Claude Code CLI instalado e autenticado

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Claude CLI não responde | Timeout de 60s + retry + mensagem de erro clara |
| Streaming quebra | Fallback para resposta completa |
| Output muito grande | Virtualização + truncate com "Show more" |
| CLI não instalado | Health check no startup + instruções de instalação |

---

*Story criada por @strategist*
