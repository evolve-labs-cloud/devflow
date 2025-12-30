# DevFlow IDE Web

Interface web para o DevFlow - Spec-driven development powered by AI agents.

**v0.5.0** - Terminal como interface principal

## Features

### Core

- **Terminal Integrado** - Interface principal para Claude CLI
  - Performance nativa (sem overhead de parsing)
  - Todas as features do Claude: session resume, tools, MCP servers
  - Quick Actions: botões para agentes e comandos frequentes
  - Altura ajustável via drag
- **Monaco Editor** - Editor de código profissional
  - Syntax highlighting para 50+ linguagens
  - IntelliSense, Find & Replace, Multi-cursor
  - Configurações persistentes
- **File Explorer** - Navegação completa
  - Keyboard navigation (WAI-ARIA TreeView)
  - Context menu para operações
  - Busca de arquivos

### Painéis

- **Specs Panel** - Visualize requirements, design e tasks
  - Progress bars por spec
  - Navegação por teclado
- **Dashboard** - Métricas e health check do projeto
- **Git Panel** - Status, commit, push/pull, branches
- **Settings** - Configurações do editor, terminal e AI

### Produtividade

- **Quick Open** (Cmd+P) - Busca rápida de arquivos
- **Global Search** (Cmd+Shift+F) - Busca em todo o projeto
- **Command Palette** (Cmd+Shift+P) - Todos os comandos
- **Recent Files** (Ctrl+Tab) - Arquivos recentes
- **Tab History** (Alt+Left/Right) - Navegação back/forward

## Requisitos

- Node.js 18+
- Claude Code CLI instalado e autenticado (`claude login`)
- Um projeto DevFlow existente

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## Uso

1. Na página inicial, insira o caminho do seu projeto DevFlow
2. O projeto será carregado com o file explorer à esquerda
3. Clique em arquivos para editar no Monaco Editor
4. Use o **Terminal** (Ctrl+`) para interagir com Claude CLI
5. Use os **Quick Actions** do terminal para chamar agentes

### Agentes DevFlow

Execute via terminal ou Quick Actions:

| Agente | Comando | Função |
|--------|---------|--------|
| Strategist | `claude /agents:strategist` | Planejamento e Produto |
| Architect | `claude /agents:architect` | Design e Arquitetura |
| Builder | `claude /agents:builder` | Implementação |
| Guardian | `claude /agents:guardian` | Qualidade e Testes |
| Chronicler | `claude /agents:chronicler` | Documentação |

## Stack

- **Framework**: Next.js 15 (App Router)
- **Editor**: Monaco Editor
- **Terminal**: xterm.js + node-pty (PTY real)
- **State**: Zustand with persist
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: Sonner

## Estrutura

```
web/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── terminal/     # Terminal PTY (SSE)
│   │   ├── files/        # File operations
│   │   ├── git/          # Git operations
│   │   ├── specs/        # Specs loading
│   │   └── health/       # System health
│   ├── ide/              # IDE workspace
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── terminal/         # Terminal + Quick Actions
│   ├── editor/           # Monaco, Tabs, Breadcrumbs
│   ├── explorer/         # File tree
│   ├── specs/            # Specs panel
│   ├── git/              # Git panel
│   ├── dashboard/        # Dashboard
│   ├── settings/         # Settings modal
│   ├── modals/           # QuickOpen, Search, etc.
│   └── layout/           # Sidebar, StatusBar
├── hooks/                 # Custom hooks
│   ├── useFocusTrap.ts
│   ├── useKeyboardShortcuts.ts
│   └── useTreeNavigation.ts
├── lib/
│   ├── stores/           # Zustand stores
│   ├── constants/        # AGENTS, etc.
│   ├── types/            # TypeScript types
│   └── utils.ts          # Utilities
└── README.md
```

## Scripts

```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run start    # Iniciar produção
npm run lint     # Lint
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+S | Salvar arquivo |
| Cmd+P | Quick Open |
| Cmd+Shift+F | Global Search |
| Cmd+Shift+P | Command Palette |
| Cmd+, | Settings |
| Cmd+B | Toggle sidebar |
| Ctrl+` | Toggle terminal |
| Ctrl+Tab | Recent Files |
| Alt+Left/Right | Navegar histórico |
| Cmd+W | Fechar tab |

## Changelog

Veja [CHANGELOG.md](./CHANGELOG.md) para histórico completo de mudanças.

---

**Powered by Evolve Labs** | DevFlow v0.5.0
