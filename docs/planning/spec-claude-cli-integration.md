# Quick Spec: Integração Claude CLI

**Feature**: Core de comunicação com Claude Code CLI
**Prioridade**: P0 (Fundação)
**Status**: Implemented

---

## Problema

Tentativas anteriores de interface web falharam devido à **latência na comunicação** com Claude. O usuário enviava mensagem e esperava muito tempo para ver resposta.

## Solução

Usar **Claude Code CLI como subprocess** com **streaming via Server-Sent Events (SSE)**, garantindo:

1. **Time to First Token < 2s** - Feedback imediato
2. **Streaming contínuo** - Resposta aparece token por token
3. **Cancelamento** - Usuário pode interromper
4. **Context preservado** - CLI mantém .claude_project carregado

## Arquitetura

```
┌─────────────────────┐
│   React Frontend    │
│   (Chat Component)  │
└──────────┬──────────┘
           │ fetch() + EventSource
           ▼
┌─────────────────────┐
│  Next.js API Route  │
│  /api/chat          │
└──────────┬──────────┘
           │ spawn() + pipe stdout
           ▼
┌─────────────────────┐
│   Claude Code CLI   │
│   claude --print    │
│   --output-format   │
│   stream-json       │
└─────────────────────┘
```

## Acceptance Criteria

- [x] Mensagem enviada executa `claude` como subprocess
- [x] Output do CLI é parseado e transmitido via SSE
- [x] Frontend recebe tokens em streaming
- [x] Primeiro token em < 2s após envio
- [x] Cancelamento (abort) funciona
- [x] Erros são capturados e exibidos
- [ ] Timeout de 120s com mensagem clara

## Edge Cases

| Caso | Tratamento |
|------|------------|
| Claude CLI não instalado | Health check no startup + mensagem de instalação |
| CLI não autenticado | Detectar erro + link para `claude login` |
| Timeout (>120s) | Cancelar processo + "Resposta demorou muito" |
| Erro de parsing JSON | Log error + continuar com raw text |
| Projeto sem .claude_project | Warning + funcionar sem contexto |

## Out of Scope (MVP)

- Cache de respostas
- Rate limiting
- Múltiplas conversas paralelas
- Histórico persistente em banco

## Technical Reference

### Comando CLI

```bash
# Modo recomendado para integração
claude --print \
       --output-format stream-json \
       -p /path/to/project \
       "mensagem do usuário"
```

### Formato stream-json

```jsonl
{"type":"assistant","message":{"content":[{"type":"text","text":"token1"}]}}
{"type":"assistant","message":{"content":[{"type":"text","text":"token2"}]}}
{"type":"result","result":"success"}
```

### SSE Format (para frontend)

```
data: {"token":"Olá"}

data: {"token":", como"}

data: {"token":" posso ajudar?"}

data: [DONE]
```

---

*Spec criada por @strategist*
*Próximo: @architect validar e detalhar design*
