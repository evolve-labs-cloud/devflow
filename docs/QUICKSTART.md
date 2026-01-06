# Guia Rápido: DevFlow no Claude Code

## Setup Instantâneo

Você já está pronto! Os 5 agentes estão disponíveis:

```
/agents:strategist  - Planejamento & Produto
/agents:architect   - Design & Arquitetura
/agents:builder     - Implementação
/agents:guardian    - Qualidade & Segurança
/agents:chronicler  - Documentação & Memória
```

---

## Como Usar

### 1. Chame um Agente

No Claude Code, use o comando do agente:

```
/agents:strategist Preciso criar um sistema de autenticação
```

O Strategist vai:
- Fazer perguntas para entender o requisito
- Criar especificação
- Quebrar em user stories se necessário

### 2. Workflows Comuns

#### Bug Fix Rápido

```
/agents:builder Fix: botão de login não funciona no mobile
```

**Fluxo automático:**
1. Builder investiga e corrige
2. Chronicler documenta no CHANGELOG

---

#### Nova Feature Simples

```
/agents:strategist Adicionar filtro por categoria na lista de produtos
```

**Fluxo automático:**
1. Strategist cria spec rápida
2. Architect valida (se necessário)
3. Builder implementa
4. Guardian testa
5. Chronicler documenta

---

#### Feature Complexa

```
/agents:strategist Criar sistema de pagamentos com múltiplos providers
```

**Fluxo completo:**

**Sprint 1: Planning**
```
/agents:strategist Criar PRD para sistema de pagamentos
# Output: docs/planning/prd-payments.md

/agents:architect Design do sistema de pagamentos
# Output: docs/architecture/payments.md + ADRs
```

**Sprint 2-4: Implementation**
```
/agents:builder Implementar docs/planning/stories/payments/story-001.md
# Implementa cada story iterativamente

# Chronicler documenta automaticamente após cada story
```

---

## Comandos Úteis

### Strategist (Planejamento)
```
/agents:strategist Analisar [problema]
/agents:strategist Criar PRD para [feature]
/agents:strategist Criar stories para [feature]
```

### Architect (Design)
```
/agents:architect Design de [sistema]
/agents:architect Criar ADR para [decisão]
/agents:architect Revisar arquitetura de [doc]
```

### Builder (Implementação)
```
/agents:builder Implementar [story.md]
/agents:builder Review de [file.ts]
/agents:builder Refatorar [file.ts]
/agents:builder Debug [problema]
```

### Guardian (Qualidade)
```
/agents:guardian Plano de testes para [story.md]
/agents:guardian Security check em [src/]
/agents:guardian Performance review de [endpoint]
```

### Chronicler (Documentação)
```
/agents:chronicler Documentar mudanças recentes
/agents:chronicler Criar snapshot do projeto
/agents:chronicler Verificar sync de docs
```

---

## Exemplos Práticos

### Exemplo 1: Começando um Novo Projeto

```
Você: /agents:strategist Quero criar uma API REST para gerenciar tarefas

Strategist: Vou fazer algumas perguntas para entender melhor:

1. Quem vai usar? (público geral, equipes, empresas?)
2. Principais features? (CRUD básico, colaboração, notificações?)
3. Requisitos especiais? (offline, real-time, integração?)

[Você responde...]

Strategist: Perfeito! Vou criar:
1. Quick spec (MVP)
2. PRD completo (roadmap)
3. Stories priorizadas

Próximo: Use /agents:architect para design técnico
```

---

### Exemplo 2: Implementando Feature

```
Você: /agents:builder Implementar autenticação JWT básica

Builder: Vou verificar se há spec/design...

[Busca em docs/planning/ e docs/architecture/]

Encontrei:
- docs/planning/stories/auth/story-001-jwt-core.md
- docs/architecture/auth-system.md
- docs/decisions/001-jwt-implementation.md

Implementando baseado no design...

[Cria código + testes]

✅ Implementação completa:
- src/auth/jwt.service.ts
- src/auth/auth.middleware.ts
- src/auth/auth.routes.ts
- Tests (95% coverage)

Chronicler vai documentar automaticamente.

Próximo: /agents:guardian para security review
```

---

## Workflow Recomendado

### Para Features Novas

```
Idea → /agents:strategist → /agents:architect → /agents:builder → /agents:guardian → Done
```

### Para Bug Fixes

```
Problema → /agents:builder Debug → Fix → Done
```

### Para Refactors

```
/agents:architect Revisa → /agents:builder Refatora → /agents:guardian Testa → Done
```

---

## Estrutura de Arquivos

Após usar o sistema, você terá:

```
seu-projeto/
├── .claude/
│   └── commands/
│       └── agents/           # Os 5 agentes
│
├── .devflow/
│   ├── memory/               # Memória do projeto
│   └── sessions/             # Sessões
│
├── docs/
│   ├── planning/             # PRDs e stories
│   │   └── stories/
│   ├── architecture/         # Design docs
│   ├── decisions/            # ADRs
│   ├── snapshots/            # Histórico do projeto
│   └── CHANGELOG.md
│
└── seu-codigo/
```

---

## Dicas de Uso

### Faça

1. **Comece pelo Strategist** em features novas
2. **Use Architect para decisões técnicas**
3. **Deixe Chronicler rodar automático**
4. **Consulte snapshots entre sessões**

### Evite

1. **Pular planejamento em features complexas**
2. **Ignorar avisos do Guardian**
3. **Editar CHANGELOG.md manualmente**

---

## Troubleshooting

### Agente não responde como esperado?

1. Verifique se está usando a sintaxe correta: `/agents:nome`
2. Leia a documentação do agente em `.claude/commands/agents/`

### Perdeu contexto entre sessões?

```bash
# Leia o snapshot mais recente
cat docs/snapshots/$(ls -t docs/snapshots/ | head -1)

# Ou peça ao Chronicler
/agents:chronicler Criar snapshot do estado atual
```

---

**Pronto para começar!**

Use `/agents:strategist` para iniciar uma nova feature.
