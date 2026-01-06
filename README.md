# DevFlow v0.4.0 - Sistema Multi-Agentes + Web IDE

Sistema de multi-agentes especializados para desenvolvimento de software, agora com **Web IDE** integrada para visualização e controle do fluxo de trabalho.

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](docs/CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🆕 Novidades v0.4.0 - Web IDE

### Web IDE (Nova!)
Interface visual completa para gerenciar seu projeto DevFlow:

- **Dashboard** - Métricas do projeto, health check, status dos agentes
- **Specs Panel** - Visualize requirements, design decisions e tasks
- **File Explorer** - Navegue pelo código com preview de markdown/mermaid
- **Editor Monaco** - Editor profissional com syntax highlighting
- **Terminal Integrado** - Execute comandos diretamente na IDE
- **Chat com Claude** - Converse com os agentes via interface gráfica
- **Autopilot** - Execute o pipeline completo automaticamente
- **Settings** - Configure tema, fonte, terminal

### Melhorias CLI
- Hard Stops aprimorados por agente
- Delegação obrigatória entre agentes
- Geração automática de stories

---

## 🚀 Instalação

### Opção 1: CLI (Recomendado)
```bash
# Clone o repositório
git clone https://github.com/evolve-labs-cloud/devflow.git
cd devflow

# Instale no seu projeto
./install.sh /caminho/para/seu-projeto

# Use no Claude Code
cd /caminho/para/seu-projeto
# @strategist Olá! Quero criar [sua feature]
```

### Opção 2: Web IDE
```bash
# Entre na pasta release/web
cd devflow/release/web

# Instale dependências
npm install

# Inicie o servidor
npm run dev

# Acesse http://localhost:3000
```

---

## 🤖 Os 5 Agentes

| Agente | Função | Uso |
|--------|--------|-----|
| **@strategist** | Planejamento & Produto | Requisitos, PRDs, user stories |
| **@architect** | Design & Arquitetura | Decisões técnicas, ADRs, APIs |
| **@builder** | Implementação | Código, reviews, refactoring |
| **@guardian** | Qualidade & Segurança | Testes, security, performance |
| **@chronicler** | Documentação & Memória | CHANGELOG, snapshots, stories |

### 🚨 Hard Stops

Cada agente tem limites rígidos:

```
@strategist → APENAS planejamento (NUNCA código)
@architect  → APENAS design técnico (NUNCA implementação)
@builder    → APENAS código (NUNCA requisitos)
@guardian   → APENAS QA/segurança (NUNCA features)
@chronicler → APENAS documentação (NUNCA código)
```

### Fluxo de Trabalho

```
@strategist → @architect → @builder → @guardian → @chronicler
```

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

### Autopilot
Execute o pipeline DevFlow completo automaticamente:
1. Planning (Strategist)
2. Design (Architect)
3. Implementation (Builder)
4. Validation (Guardian)
5. Documentation (Chronicler)

### Editor
- Monaco Editor (VS Code engine)
- Syntax highlighting para 50+ linguagens
- Preview de Markdown com Mermaid diagrams
- Múltiplas tabs com indicador de dirty state

### Terminal
- Terminal integrado via xterm.js
- Histórico de comandos
- Múltiplas sessões

### Chat
- Converse com Claude diretamente
- Suporte a imagens (paste/drag-drop)
- Histórico de mensagens

---

## 📁 Estrutura do Projeto

```
devflow/
├── .devflow/           # Configuração dos agentes
│   ├── agents/         # Skills dos 5 agentes
│   ├── snapshots/      # Histórico do projeto
│   └── project.yaml    # Estado do projeto
│
├── docs/               # Documentação
│   ├── decisions/      # ADRs
│   ├── planning/       # Stories e specs
│   └── security/       # Security audits
│
├── release/            # Release folder
│   └── web/            # Web IDE
│
└── web/                # Source da Web IDE (dev)
```

---

## 📊 Versões

| Versão | Features |
|--------|----------|
| v0.1.0 | Multi-agent system, Documentation automation |
| v0.2.0 | Structured metadata, Knowledge graph |
| v0.3.0 | Hard stops, Mandatory delegation |
| **v0.4.0** | **Web IDE completa** |

---

## 📚 Documentação

- **[Quick Start](docs/QUICKSTART.md)** - Comece em 5 minutos
- **[Instalação](docs/INSTALLATION.md)** - Guia detalhado
- **[Web IDE](release/web/README.md)** - Guia da interface web
- **[Arquitetura](docs/ARCHITECTURE.md)** - Como funciona
- **[Changelog](docs/CHANGELOG.md)** - Histórico de mudanças

---

## 🛠️ Tech Stack (Web IDE)

- **Next.js 16** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editing
- **xterm.js** - Terminal
- **Zustand** - State management
- **Lucide Icons** - Iconografia

---

## 📜 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**DevFlow v0.4.0** - Desenvolvido por [Evolve Labs](https://evolvelabs.cloud)
