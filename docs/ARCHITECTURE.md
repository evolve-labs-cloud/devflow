# DevFlow - Arquitetura

Documentacao tecnica da arquitetura do sistema DevFlow v1.0.0.

---

## Visao Geral

DevFlow e um sistema de multi-agentes especializados para desenvolvimento de software, integrado ao Claude Code CLI. Distribuido via npm como `@evolve.labs/devflow`.

```
┌──────────────────────────────────────────────────────────────────┐
│                        Claude Code CLI                            │
├──────────────────────────────────────────────────────────────────┤
│  /agents:strategist  →  /agents:architect  →                      │
│  /agents:system-designer  →  /agents:builder  →                   │
│  /agents:guardian  →  /agents:chronicler                          │
├──────────────────────────────────────────────────────────────────┤
│  .claude/commands/agents/    (definicoes dos agentes)             │
│  .devflow/                   (estado do projeto)                  │
│  docs/                       (documentacao)                       │
│  web/                        (Web IDE - opcional)                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Instalacao

```bash
# Via npm (recomendado)
npm install -g @evolve.labs/devflow

# Inicializar no projeto
devflow init /caminho/para/seu-projeto

# Opcoes
devflow init                    # Agentes + estrutura de docs (padrao)
devflow init --agents-only      # Apenas agentes (minimo)
devflow init --full             # Tudo incluindo .gitignore
devflow init --web              # Inclui Web IDE (opcional)
```

---

## Os 6 Agentes

### 1. Strategist (Planejamento)
- **Funcao**: Analise de requisitos, PRDs, user stories
- **Input**: Ideias, problemas, features
- **Output**: `docs/planning/`, `docs/planning/stories/`
- **Hard Stop**: NUNCA escreve codigo

### 2. Architect (Design)
- **Funcao**: Design tecnico, ADRs, diagramas
- **Input**: PRDs, requisitos tecnicos
- **Output**: `docs/architecture/`, `docs/decisions/`
- **Hard Stop**: NUNCA implementa

### 3. System Designer (System Design & Escala)
- **Funcao**: System design em escala, SDDs, RFCs, capacity planning
- **Input**: Requisitos de escala, SLAs, problemas de infraestrutura
- **Output**: `docs/system-design/sdd/`, `docs/system-design/rfc/`, `docs/system-design/capacity/`, `docs/system-design/trade-offs/`
- **Hard Stop**: NUNCA escreve codigo de producao, apenas exemplos/diagramas
- **Inspiracao**: DDIA (Kleppmann), Alex Xu, Sam Newman, Google SRE Book

### 4. Builder (Implementacao)
- **Funcao**: Codigo, refactoring, code review
- **Input**: Stories, specs, bugs
- **Output**: Codigo fonte, testes
- **Hard Stop**: NUNCA cria requisitos

### 5. Guardian (Qualidade)
- **Funcao**: Testes, seguranca, performance
- **Input**: Codigo, endpoints, arquivos
- **Output**: `docs/security/`, `docs/performance/`
- **Hard Stop**: NUNCA adiciona features

### 6. Chronicler (Documentacao)
- **Funcao**: CHANGELOG, snapshots, sync de docs
- **Input**: Mudancas no projeto
- **Output**: `docs/CHANGELOG.md`, `docs/snapshots/`
- **Hard Stop**: NUNCA escreve codigo

---

## Estrutura de Arquivos

```
projeto/
├── .claude/
│   └── commands/
│       ├── agents/                 # Definicoes dos 6 agentes
│       │   ├── strategist.md
│       │   ├── architect.md
│       │   ├── system-designer.md
│       │   ├── builder.md
│       │   ├── guardian.md
│       │   └── chronicler.md
│       └── quick/                  # Quick start commands
│           ├── new-feature.md
│           ├── security-check.md
│           ├── create-adr.md
│           └── system-design.md
│
├── .devflow/
│   ├── agents/                     # Metadados dos agentes
│   ├── memory/                     # Memoria do projeto
│   ├── sessions/                   # Sessoes de trabalho
│   └── project.yaml                # Estado do projeto
│
├── docs/
│   ├── planning/                   # PRDs (Strategist)
│   │   └── stories/                # User stories
│   ├── architecture/               # Design (Architect)
│   │   └── diagrams/
│   ├── decisions/                  # ADRs (Architect)
│   ├── system-design/              # System Designer
│   │   ├── sdd/                    # System Design Documents
│   │   ├── rfc/                    # Requests for Comments
│   │   ├── capacity/               # Capacity Plans
│   │   └── trade-offs/             # Trade-off Analysis
│   ├── security/                   # Audits (Guardian)
│   ├── performance/                # Reports (Guardian)
│   ├── snapshots/                  # Historico (Chronicler)
│   └── CHANGELOG.md                # Mantido pelo Chronicler
│
└── web/                            # Web IDE (opcional, com --web)
    ├── app/                        # Next.js pages + API routes
    ├── components/                 # React components
    ├── hooks/                      # Custom hooks
    └── lib/                        # Stores, utils, types
```

---

## Fluxo de Trabalho

### Pipeline Completo

```
Strategist → Architect → System Designer → Builder → Guardian → Chronicler
```

### Feature Nova

```
1. /agents:strategist "Criar feature X"
   └→ Cria PRD em docs/planning/
   └→ Cria stories em docs/planning/stories/

2. /agents:architect "Design da feature X"
   └→ Cria design em docs/architecture/
   └→ Cria ADR em docs/decisions/

3. /agents:system-designer "System design para feature X"
   └→ Cria SDD em docs/system-design/sdd/
   └→ Capacity plan se necessario

4. /agents:builder "Implementar story Y"
   └→ Escreve codigo
   └→ Escreve testes

5. /agents:guardian "Review de seguranca"
   └→ Analisa codigo
   └→ Aprova ou rejeita

6. Chronicler (automatico)
   └→ Atualiza CHANGELOG
   └→ Cria snapshot
```

### Bug Fix

```
1. /agents:builder "Fix: descricao do bug"
   └→ Investiga, corrige, testa

2. Chronicler (automatico)
   └→ Documenta fix
```

---

## Delegacao entre Agentes

Cada agente DEVE delegar para o proximo no fluxo:

```
Strategist → Architect → System Designer → Builder → Guardian → (Chronicler automatico)
```

### Regras de Delegacao

1. **Strategist** chama Architect apos criar specs; chama System Designer se NFRs envolvem escala
2. **Architect** chama System Designer apos design que envolve escala/infra
3. **System Designer** chama Builder apos SDD/RFC
4. **Builder** chama Guardian apos implementar
5. **Guardian** aprova ou rejeita (Builder corrige se rejeitado)
6. **Chronicler** documenta automaticamente todas as mudancas

---

## Hard Stops

| Agente | Pode Fazer | Nao Pode Fazer |
|--------|------------|----------------|
| Strategist | PRDs, stories, analise | Codigo, design tecnico |
| Architect | Design, ADRs, diagramas | Codigo, implementacao |
| System Designer | SDDs, RFCs, capacity plans | Codigo de producao |
| Builder | Codigo, testes, refactor | Requisitos, specs |
| Guardian | Testes, security, perf | Features, codigo novo |
| Chronicler | Docs, changelog, snapshots | Codigo, decisoes |

---

## Autopilot

O autopilot executa os agentes em sequencia automaticamente. Cada fase recebe o output da anterior como contexto.

### Via CLI (headless)

```bash
devflow autopilot docs/specs/minha-spec.md
devflow autopilot docs/specs/minha-spec.md --phases "strategist,architect,builder"
devflow autopilot docs/specs/minha-spec.md --project /path/to/project
devflow autopilot docs/specs/minha-spec.md --no-update
```

### Via Web IDE

1. Selecionar spec no Specs Panel
2. Clicar "Start Autopilot"
3. Output streaming em tempo real no terminal integrado
4. Cada fase completa e avanca automaticamente
5. Tasks no spec sao marcadas como concluidas

---

## Web IDE (Opcional)

Interface web para gerenciar projetos DevFlow.

### Iniciar

```bash
devflow web                     # Abre http://localhost:3000
devflow web --port 8080         # Porta customizada
devflow web --project /path     # Projeto especifico
```

### Features

- **Dashboard**: Metricas do projeto, health check, status em tempo real
- **Specs Panel**: Requirements, Design (ADRs), Tasks com acceptance criteria
- **Editor**: Monaco Editor com syntax highlighting para 50+ linguagens, Markdown preview com Mermaid
- **Terminal**: xterm.js + node-pty, multiplas tabs, Autopilot integrado
- **Multi-Project**: ProjectSelector para alternar entre projetos

### Arquitetura Web

```
web/
├── app/                        # Next.js 16 App Router
│   ├── api/                    # API routes
│   │   ├── files/              # File CRUD (path-scoped)
│   │   ├── terminal/           # PTY SSE + commands
│   │   ├── autopilot/          # Autopilot execution
│   │   ├── git/                # Git operations
│   │   └── dashboard/          # Project metrics
│   └── page.tsx                # Main layout
├── components/
│   ├── editor/                 # Monaco Editor
│   ├── terminal/               # xterm.js + node-pty
│   ├── specs/                  # Painel de specs
│   ├── autopilot/              # Autopilot UI
│   └── dashboard/              # Metricas
└── lib/
    ├── stores/                 # Zustand state management
    └── ptyManager.ts           # Terminal process manager
```

### Tech Stack

- **Next.js 16** - Framework React com App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editing (VS Code engine)
- **xterm.js + node-pty** - Terminal emulation real
- **Zustand** - State management
- **Lucide Icons** - Iconografia
- **Mermaid** - Diagramas (lazy loaded)

---

## Seguranca

- **File API path scoping**: Todas as operacoes de arquivo sao validadas contra o project root
- **Session ID sanitization**: IDs de terminal sao sanitizados antes de uso
- **Temp file permissions**: Arquivos temporarios criados com permissoes restritas (0o600)
- **Shell detection**: Fallback chain segura para deteccao de shell

---

## Versionamento

| Versao | Mudancas |
|--------|----------|
| 0.1.0 | Sistema multi-agente inicial (5 agentes) |
| 0.2.0 | Metadata estruturado, knowledge graph |
| 0.3.0 | Hard stops, delegacao obrigatoria |
| 0.4.0 | Web IDE completa |
| 0.5.0 | Terminal como interface principal, WSL support |
| 0.6.0 | Permission mode configuration |
| 0.7.0 | System Designer agent (6th), npm package |
| 0.8.0 | Autopilot terminal-based, CLI commands, multi-project |
| 0.9.0 | Web IDE refactoring, agent completion tracking |
| **1.0.0** | **Security hardening, npm global install fix, node-pty reliability** |

---

## Referencias

- [Quick Start](QUICKSTART.md)
- [Instalacao](INSTALLATION.md)
- [Changelog](CHANGELOG.md)

---

**DevFlow v1.0.0** - Desenvolvido por [Evolve Labs](https://evolvelabs.cloud)
