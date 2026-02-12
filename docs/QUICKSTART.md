# Guia Rapido: DevFlow v1.0.0

## Instalacao

```bash
npm install -g @evolve.labs/devflow
devflow init /caminho/para/seu-projeto
```

---

## Os 6 Agentes

```
/agents:strategist       - Planejamento & Produto
/agents:architect        - Design & Arquitetura
/agents:system-designer  - System Design & Escala
/agents:builder          - Implementacao
/agents:guardian         - Qualidade & Seguranca
/agents:chronicler       - Documentacao & Memoria
```

### Pipeline

```
Strategist → Architect → System Designer → Builder → Guardian → Chronicler
```

Cada agente tem **hard stops** — limites rigidos que impedem de fazer trabalho de outros agentes.

---

## Como Usar

### 1. Chame um Agente

No Claude Code, use o comando do agente:

```
/agents:strategist Preciso criar um sistema de autenticacao
```

O Strategist vai:
- Fazer perguntas para entender o requisito
- Criar especificacao
- Quebrar em user stories se necessario

### 2. Workflows Comuns

#### Bug Fix Rapido

```
/agents:builder Fix: botao de login nao funciona no mobile
```

**Fluxo automatico:**
1. Builder investiga e corrige
2. Chronicler documenta no CHANGELOG

---

#### Nova Feature Simples

```
/agents:strategist Adicionar filtro por categoria na lista de produtos
```

**Fluxo automatico:**
1. Strategist cria spec rapida
2. Architect valida (se necessario)
3. Builder implementa
4. Guardian testa
5. Chronicler documenta

---

#### Feature Complexa (com System Design)

```
/agents:strategist Criar sistema de pagamentos com multiplos providers
```

**Fluxo completo:**

**Sprint 1: Planning**
```
/agents:strategist Criar PRD para sistema de pagamentos
# Output: docs/planning/prd-payments.md

/agents:architect Design do sistema de pagamentos
# Output: docs/architecture/payments.md + ADRs

/agents:system-designer System design para pagamentos em escala
# Output: docs/system-design/sdd/payments.md + capacity plan
```

**Sprint 2-4: Implementation**
```
/agents:builder Implementar docs/planning/stories/payments/story-001.md
# Implementa cada story iterativamente

# Chronicler documenta automaticamente apos cada story
```

---

## Autopilot

Execute todos os agentes automaticamente numa spec:

### Via CLI (headless)

```bash
devflow autopilot docs/specs/minha-spec.md

# Escolher fases
devflow autopilot docs/specs/minha-spec.md --phases "strategist,architect,builder"

# Outro projeto
devflow autopilot docs/specs/minha-spec.md --project /path/to/project
```

### Via Web IDE

```bash
devflow web
```

1. Abrir Specs Panel → selecionar spec
2. Clicar "Start Autopilot"
3. Output streaming no terminal integrado
4. Tasks marcadas automaticamente como concluidas

---

## Web IDE

Interface web completa para gerenciar projetos DevFlow.

```bash
devflow web                     # http://localhost:3000
devflow web --port 8080         # Porta customizada
devflow web --project /path     # Projeto especifico
```

**Features:**
- Dashboard com metricas e health check
- Specs Panel (requirements, design, tasks)
- Monaco Editor com Markdown preview + Mermaid
- Terminal integrado com multiplas tabs
- Autopilot com output streaming
- Multi-project support

---

## Comandos por Agente

### Strategist (Planejamento)
```
/agents:strategist Analisar [problema]
/agents:strategist Criar PRD para [feature]
/agents:strategist Criar stories para [feature]
```

### Architect (Design)
```
/agents:architect Design de [sistema]
/agents:architect Criar ADR para [decisao]
/agents:architect Revisar arquitetura de [doc]
```

### System Designer (Escala)
```
/agents:system-designer System design para [sistema]
/agents:system-designer RFC para [mudanca]
/agents:system-designer Capacity planning para [cenario]
/agents:system-designer Trade-off analysis: [opcao A] vs [opcao B]
```

### Builder (Implementacao)
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

### Chronicler (Documentacao)
```
/agents:chronicler Documentar mudancas recentes
/agents:chronicler Criar snapshot do projeto
/agents:chronicler Verificar sync de docs
```

---

## Quick Commands

Atalhos para workflows comuns:

```
/quick:new-feature         # Wizard para nova feature
/quick:security-check      # Security check rapido
/quick:create-adr          # Criar ADR rapidamente
/quick:system-design       # Wizard de system design
```

---

## Workflow Recomendado

### Para Features Novas
```
Idea → /agents:strategist → /agents:architect → /agents:system-designer → /agents:builder → /agents:guardian → Done
```

### Para Bug Fixes
```
Problema → /agents:builder Debug → Fix → Done
```

### Para Refactors
```
/agents:architect Revisa → /agents:builder Refatora → /agents:guardian Testa → Done
```

### Para System Design
```
/agents:strategist NFRs → /agents:architect Pattern → /agents:system-designer SDD → Done
```

---

## Estrutura de Arquivos

Apos usar o sistema:

```
seu-projeto/
├── .claude/
│   └── commands/
│       ├── agents/                 # Os 6 agentes
│       └── quick/                  # Quick commands
│
├── .devflow/
│   ├── agents/                     # Metadata
│   ├── memory/                     # Memoria do projeto
│   ├── sessions/                   # Sessoes
│   └── project.yaml                # Estado
│
├── docs/
│   ├── planning/                   # PRDs e stories
│   ├── architecture/               # Design docs
│   ├── decisions/                  # ADRs
│   ├── system-design/              # SDDs, RFCs
│   ├── security/                   # Audits
│   ├── performance/                # Reports
│   ├── snapshots/                  # Historico
│   └── CHANGELOG.md
│
└── web/                            # Web IDE (opcional)
```

---

## Dicas de Uso

### Faca

1. **Comece pelo Strategist** em features novas
2. **Use System Designer** para qualquer coisa com escala/infra
3. **Use Architect para decisoes tecnicas** (qual pattern, qual tech)
4. **Deixe Chronicler rodar automatico**
5. **Use autopilot** para specs completas

### Evite

1. **Pular planejamento em features complexas**
2. **Ignorar avisos do Guardian**
3. **Editar CHANGELOG.md manualmente**
4. **Implementar sem verificar design existente**

---

## Troubleshooting

### Agente nao responde como esperado?

1. Verifique a sintaxe: `/agents:nome`
2. Leia a documentacao em `.claude/commands/agents/`
3. Reinicie o Claude Code

### Perdeu contexto entre sessoes?

```
/agents:chronicler Criar snapshot do estado atual
```

### Terminal nao conecta na Web IDE?

```bash
# Reiniciar Web IDE
devflow web
```

---

**Pronto para comecar!**

Use `/agents:strategist` para iniciar uma nova feature ou `devflow autopilot` para automacao completa.

---

**DevFlow v1.0.0** - Desenvolvido por [Evolve Labs](https://evolvelabs.cloud)
