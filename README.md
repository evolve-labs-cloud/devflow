# DevFlow v0.7.0 - Sistema Multi-Agentes + Web IDE

Sistema de multi-agentes especializados para desenvolvimento de software, com **6 agentes** e **Web IDE** integrada.

[![Version](https://img.shields.io/badge/version-0.7.0-blue.svg)](docs/CHANGELOG.md)
[![npm](https://img.shields.io/npm/v/devflow-agents.svg)](https://www.npmjs.com/package/devflow-agents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Screenshots

![DevFlow Hero](docs/images/hero.png)

![Dashboard](docs/images/dashboard.png)

![Editor](docs/images/editor.png)

![Terminal](docs/images/terminal.png)

![Specs Panel](docs/images/specs.png)

---

## 🆕 Novidades v0.7.0

### System Designer Agent (6th agent)
- System Design Documents (SDDs) com back-of-the-envelope calculations
- RFCs, capacity planning, trade-off analysis
- SLA/SLO/SLI definitions e reliability patterns

### npm Package
- `npx devflow-agents init` para instalacao rapida
- `devflow update` para atualizacoes
- Flag `--web` para incluir Web IDE

### Web IDE (Opcional)
Interface visual completa para gerenciar seu projeto DevFlow:

- **Terminal Integrado** - Interface principal via xterm.js + node-pty
- **Dashboard** - Metricas do projeto, health check, status dos agentes
- **Specs Panel** - Visualize requirements, design decisions e tasks
- **File Explorer** - Navegue pelo codigo com preview de markdown/mermaid
- **Editor Monaco** - Editor profissional com syntax highlighting
- **Settings** - Configure tema, fonte, terminal

---

## 🚀 Instalacao

### Via npm (Recomendado)

```bash
# Instala DevFlow no seu projeto (sem instalar nada globalmente)
npx devflow-agents init

# Ou instale globalmente para usar em multiplos projetos
npm install -g devflow-agents
devflow init /caminho/para/seu-projeto

# Opcoes de instalacao
devflow init                    # Agentes + estrutura de docs (padrao)
devflow init --agents-only      # Apenas agentes (minimo)
devflow init --full             # Tudo incluindo .gitignore
devflow init --web              # Inclui Web IDE (opcional)
devflow init --full --web       # Tudo + Web IDE

# Atualizar instalacao existente
devflow update
```

### Via bash script (Alternativa)

```bash
git clone https://github.com/evolve-labs-cloud/devflow.git
cd devflow
./install.sh /caminho/para/seu-projeto
```

### Requisitos

- **Claude Code CLI** (`npm i -g @anthropic-ai/claude-code`)
- **Node.js 18+** (para o CLI npm)
- **Git** (recomendado)

### Dependências por Sistema

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

#### RHEL/CentOS/Rocky
```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3 git
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
npm install -g @anthropic-ai/claude-code
```

#### macOS
```bash
xcode-select --install
brew install node
npm install -g @anthropic-ai/claude-code
```

#### Windows (WSL)
```powershell
# PowerShell como Admin
wsl --install
```
Depois siga as instruções de Debian/Ubuntu no terminal WSL.

### Web IDE (Opcional)
```bash
cd devflow/web
npm install
npm run dev
# Acesse http://localhost:3000
```

---

## 🤖 Os 6 Agentes

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

---

## 🖥️ Web IDE Features

### Dashboard
- Métricas do projeto (specs, decisões, tasks)
- Health check (Claude CLI, .devflow, git)
- Status em tempo real

### Specs Panel
- **Requirements** - User stories com acceptance criteria
- **Design** - Architecture Decision Records (ADRs)
- **Tasks** - Tarefas de implementação

### Editor
- Monaco Editor (VS Code engine)
- Syntax highlighting para 50+ linguagens
- Preview de Markdown com Mermaid diagrams
- Múltiplas tabs com indicador de dirty state

### Terminal
- Terminal integrado via xterm.js + node-pty
- WebGL rendering para displays de alta resolução
- Histórico de comandos
- Resize responsivo

---

## 📁 Estrutura do Projeto

```
devflow/
├── .claude/            # Comandos e agentes
│   └── commands/       # Skills dos 6 agentes
│       └── agents/     # Definições dos agentes
│
├── .devflow/           # Configuração do projeto
│   ├── snapshots/      # Histórico do projeto
│   └── project.yaml    # Estado do projeto
│
├── docs/               # Documentação
│   ├── decisions/      # ADRs
│   ├── planning/       # Stories e specs
│   └── images/         # Screenshots
│
└── web/                # Web IDE
    ├── app/            # Next.js pages
    ├── components/     # React components
    └── lib/            # Utilities
```

---

## 📊 Versões

| Versão | Features |
|--------|----------|
| v0.1.0 | Multi-agent system, Documentation automation |
| v0.2.0 | Structured metadata, Knowledge graph |
| v0.3.0 | Hard stops, Mandatory delegation |
| v0.4.0 | Web IDE completa |
| v0.5.0 | Terminal como interface principal, WSL support |
| v0.6.0 | Permission mode configuration |
| **v0.7.0** | **System Designer agent (6th), npm package, token optimization** |

---

## 📚 Documentação

- **[Quick Start](docs/QUICKSTART.md)** - Comece em 5 minutos
- **[Instalação](docs/INSTALLATION.md)** - Guia detalhado
- **[Arquitetura](docs/ARCHITECTURE.md)** - Como funciona
- **[Changelog](docs/CHANGELOG.md)** - Histórico de mudanças

---

## 🛠️ Tech Stack (Web IDE)

- **Next.js 15** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editing
- **xterm.js** - Terminal emulator
- **node-pty** - PTY para terminal real
- **Zustand** - State management
- **Lucide Icons** - Iconografia

---

## 📜 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**DevFlow v0.7.0** - Desenvolvido por [Evolve Labs](https://evolvelabs.cloud)
