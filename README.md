<<<<<<< HEAD
# DevFlow v0.9.2 - Sistema Multi-Agentes + Web IDE
=======
# DevFlow - Sistema Multi-Agentes + Web IDE
>>>>>>> 73f942219a4c21e903f955064c3017ba76f73749

Sistema de multi-agentes especializados para desenvolvimento de software, com **6 agentes**, **Web IDE** integrada e **Autopilot** para execução automatizada.

[![Version](https://img.shields.io/badge/version-0.9.2-blue.svg)](docs/CHANGELOG.md)
[![npm](https://img.shields.io/npm/v/@evolve.labs/devflow.svg)](https://www.npmjs.com/package/@evolve.labs/devflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Screenshots

![DevFlow Hero](docs/images/hero.png)

![Dashboard](docs/images/dashboard.png)

![Editor](docs/images/editor.png)

![Terminal](docs/images/terminal.png)

![Specs Panel](docs/images/specs.png)

---

## Novidades v0.9.x

### Autopilot
- **Terminal-based**: Agents rodam no terminal com output streaming em tempo real
- **CLI headless**: `devflow autopilot <spec-file>` para rodar sem Web IDE
- **Auto-task tracking**: Tasks na spec sao marcadas automaticamente como concluidas
- **Abort**: Cancele a qualquer momento

### Web IDE
- Removido File Explorer (navegacao por projeto)
- Multi-project support com ProjectSelector
- Agent completion tracking com badges visuais
- Layout simplificado sem sidebar

### System Designer Agent (6th agent)
- System Design Documents (SDDs) com back-of-the-envelope calculations
- RFCs, capacity planning, trade-off analysis
- SLA/SLO/SLI definitions e reliability patterns

---

## Instalacao

### Via npm (Recomendado)

```bash
# Instalar globalmente
npm install -g @evolve.labs/devflow

# Inicializar no seu projeto
devflow init /caminho/para/seu-projeto

# Ou usar npx (sem instalar)
npx @evolve.labs/devflow init
```

### Opcoes de instalacao

```bash
devflow init                    # Agentes + estrutura de docs (padrao)
devflow init --agents-only      # Apenas agentes (minimo)
devflow init --full             # Tudo incluindo .gitignore
devflow init --web              # Inclui Web IDE (opcional)
devflow init --full --web       # Tudo + Web IDE
```

### Comandos

```bash
devflow init [path]             # Inicializar DevFlow num projeto
devflow update [path]           # Atualizar instalacao existente
devflow web                     # Iniciar Web IDE (http://localhost:3000)
devflow autopilot <spec-file>   # Rodar autopilot nos agentes
```

### Autopilot

```bash
# Rodar todas as fases
devflow autopilot docs/specs/minha-spec.md

# Escolher fases especificas
devflow autopilot docs/specs/minha-spec.md --phases "strategist,architect,builder"

# Apontar para outro projeto
devflow autopilot docs/specs/minha-spec.md --project /path/to/project

# Sem auto-update de tasks
devflow autopilot docs/specs/minha-spec.md --no-update
```

### Web IDE

```bash
# Iniciar (abre browser automaticamente)
devflow web

# Porta customizada
devflow web --port 8080

# Apontar para projeto especifico
devflow web --project /path/to/project

# Modo desenvolvimento
devflow web --dev
```

### Requisitos

- **Claude Code CLI** (`npm i -g @anthropic-ai/claude-code`)
- **Node.js 18+**
- **Git** (recomendado)

### Dependencias por Sistema

#### macOS
```bash
xcode-select --install
brew install node
npm install -g @anthropic-ai/claude-code
```

#### Debian/Ubuntu
```bash
sudo apt-get update
sudo apt-get install -y build-essential python3 git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g @anthropic-ai/claude-code
```

#### Fedora
```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3 git nodejs npm
npm install -g @anthropic-ai/claude-code
```

#### Windows (WSL)
```powershell
wsl --install
```
Depois siga as instrucoes de Debian/Ubuntu no terminal WSL.

---

## Os 6 Agentes

| # | Agente | Funcao | Uso |
|---|--------|--------|-----|
| 1 | **/agents:strategist** | Planejamento & Produto | Requisitos, PRDs, user stories |
| 2 | **/agents:architect** | Design & Arquitetura | Decisoes tecnicas, ADRs, APIs |
| 3 | **/agents:system-designer** | System Design & Escala | SDDs, RFCs, capacity planning, SLOs |
| 4 | **/agents:builder** | Implementacao | Codigo, reviews, refactoring |
| 5 | **/agents:guardian** | Qualidade & Seguranca | Testes, security, performance |
| 6 | **/agents:chronicler** | Documentacao & Memoria | CHANGELOG, snapshots, stories |

### Fluxo de Trabalho

```
strategist → architect → system-designer → builder → guardian → chronicler
```

Cada agente tem **hard stops** — limites rigidos que impedem de fazer trabalho de outros agentes.

### Autopilot

O autopilot executa os agentes em sequencia automaticamente. Cada fase recebe o output da anterior como contexto:

```
1. Strategist analisa a spec e refina requisitos
2. Architect define a arquitetura baseado na analise
3. System Designer projeta o sistema em escala
4. Builder implementa conforme design
5. Guardian revisa seguranca e qualidade
6. Chronicler documenta tudo
```

---

## Web IDE Features

### Dashboard
- Metricas do projeto (specs, decisoes, tasks)
- Health check (Claude CLI, .devflow, git)
- Status em tempo real

### Specs Panel
- **Requirements** - User stories com acceptance criteria
- **Design** - Architecture Decision Records (ADRs)
- **Tasks** - Tarefas de implementacao

### Terminal + Autopilot
- Terminal integrado via xterm.js + node-pty
- Autopilot roda direto no terminal com streaming
- Tab dedicada "Autopilot" criada automaticamente
- Botao Abort para cancelar execucao

### Editor
- Monaco Editor (VS Code engine)
- Syntax highlighting para 50+ linguagens
- Preview de Markdown com Mermaid diagrams
- Multiplas tabs com indicador de dirty state

### Multi-Project
- ProjectSelector para alternar entre projetos
- Cada projeto com seus proprios specs e agents

---

## Estrutura do Projeto

```
seu-projeto/
├── .claude/            # Comandos e agentes
│   └── commands/
│       ├── agents/     # Definicoes dos 6 agentes
│       └── quick/      # Quick start commands
│
├── .devflow/           # Configuracao do projeto
│   ├── agents/         # Metadata dos agentes
│   └── project.yaml    # Estado do projeto
│
├── docs/               # Documentacao
│   ├── decisions/      # ADRs
│   ├── planning/       # Stories e specs
│   ├── snapshots/      # Historico do projeto
│   └── system-design/  # SDDs, RFCs, capacity plans
│       ├── sdd/
│       ├── rfc/
│       ├── capacity/
│       └── trade-offs/
│
└── web/                # Web IDE (opcional, com --web)
    ├── app/            # Next.js pages + API routes
    ├── components/     # React components
    └── lib/            # Stores, utils, types
```

---

## Versoes

| Versao | Features |
|--------|----------|
| v0.1.0 | Multi-agent system, Documentation automation |
| v0.2.0 | Structured metadata, Knowledge graph |
| v0.3.0 | Hard stops, Mandatory delegation |
| v0.4.0 | Web IDE completa |
| v0.5.0 | Terminal como interface principal, WSL support |
| v0.6.0 | Permission mode configuration |
| v0.7.0 | System Designer agent (6th), npm package |
| v0.8.0 | Autopilot terminal-based, CLI commands, Multi-project, Web IDE refactoring |
| **v0.9.2** | **Security hardening, npm global install fix, node-pty reliability** |

---

## Documentacao

- **[Quick Start](docs/QUICKSTART.md)** - Comece em 5 minutos
- **[Instalacao](docs/INSTALLATION.md)** - Guia detalhado
- **[Arquitetura](docs/ARCHITECTURE.md)** - Como funciona
- **[Changelog](docs/CHANGELOG.md)** - Historico de mudancas

---

## Tech Stack (Web IDE)

- **Next.js 16** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editing
- **xterm.js** - Terminal emulator
- **node-pty** - PTY para terminal real
- **Zustand** - State management
- **Lucide Icons** - Iconografia

---

## Licenca

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**DevFlow v0.9.2** - Desenvolvido por [Evolve Labs](https://evolvelabs.cloud)
