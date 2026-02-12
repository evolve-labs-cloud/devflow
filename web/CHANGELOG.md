# Changelog

All notable changes to DevFlow IDE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-02-11

### Added

- **System Designer Agent** - 6th agent for system design & infrastructure at scale
  - System Design Documents (SDDs) with back-of-the-envelope calculations
  - RFCs, capacity planning, trade-off analysis
  - SLA/SLO/SLI definitions and reliability patterns
  - Quick action button in terminal panel
- **SystemDesignerIcon** - Custom SVG icon (gear/infrastructure)
- **npm Package** - `devflow-agents` available on npm
  - `npx devflow-agents init` for quick installation
  - `devflow update` for updates
  - Optional `--web` flag to include Web IDE

### Changed

- Updated all agent panels to include system-designer (Autopilot, Terminal, Config Modal)
- AgentId type now includes 'system-designer'
- DEFAULT_PHASES includes System Design phase between Design and Implementation
- Agent regex in specsParser includes system-designer
- Version bumped from 0.6.0 to 0.7.0

---

## [0.5.0] - 2025-12-29

### Major Change: Terminal as Primary Interface

O Chat customizado foi **removido** e substituído pelo **Terminal integrado** como interface principal para interação com Claude CLI.

**Motivação:**
- Performance nativa do Claude CLI (sem overhead de parsing)
- Todas as features funcionam: session resume, tools, MCP servers
- Output em tempo real sem processamento adicional
- Menos código para manter

### Added

- **Terminal Quick Actions** - Barra de ações rápidas no terminal
  - Comandos rápidos: Claude, New Feature, Security Check, Create ADR
  - Botões de agentes: Strategist, Architect, Builder, Guardian, Chronicler
  - Injeção de comandos direto no terminal PTY
- **Terminal Resize Handle** - Arraste para ajustar altura do terminal
  - Limites: 150px (mín) a 600px (máx)
  - Altura persiste no localStorage
  - Feedback visual durante arraste
- **Toast Notifications** - Feedback em ações do terminal
  - "Terminal ready" ao conectar (apenas uma vez)
  - "Terminal disconnected" ao perder conexão
  - Toast no reset de settings
- **AGENTS Constant** - Centralizado em `lib/constants/agents.ts`
  - Helper functions: `getAgentById()`, `getAgentByName()`
- **Agent Task Updates** - Instruções nos agentes para atualizar tasks
  - Builder agora marca checkboxes `[x]` ao completar tasks
  - Guardian atualiza status de review nas stories
  - Status muda para "completed" quando todas tasks concluídas

### Changed

- **Terminal Interface** - Agora é a forma principal de interagir com Claude
  - Performance nativa do Claude CLI
  - Session resume funciona automaticamente
  - Todas as tools e MCP servers disponíveis
- **Resize Debouncing** - Terminal resize com debounce de 150ms
  - Evita chamadas excessivas de fit() e API
  - Elimina "tremidas" durante resize
- **Toast Behavior** - Toast de conexão só aparece uma vez por sessão
  - Corrigido closure issue no handler de erro

### Removed

- **Chat Panel** - Completamente removido
  - `components/chat/ChatPanel.tsx`
  - `components/chat/ChatMessage.tsx`
  - `components/chat/AgentSelector.tsx`
  - `components/chat/ChatSettings.tsx`
  - `lib/stores/chatStore.ts`
  - `app/api/chat/route.ts`
- **Chat Commands** - Removidos do CommandPalette
  - Agent selection, clear chat, toggle chat
- **Chat Status** - Removido indicador de streaming do StatusBar

### Refactored

- `StatusBar.tsx` - Removido import e uso de chatStore
- `CommandPalette.tsx` - Removidos comandos de chat/agentes
- `SettingsPanel.tsx` - Import de AGENTS de constants
- `SpecsPanel.tsx` - Removida integração com chat
- `page.tsx` (IDE) - Removido painel de chat lateral

---

## [0.4.0] - 2025-12-26

### Added

- **US-019: Melhorias de UX - Navegação Avançada**
  - Breadcrumbs mostrando caminho do arquivo ativo
  - Botões Back/Forward para histórico de navegação (Alt+Left/Right)
  - Tab history com navegação entre arquivos abertos
  - Recent Files modal (Ctrl+Tab) com últimos 20 arquivos
  - Pinned tabs para fixar arquivos importantes
  - Tab context menu (Close, Close Others, Close to Right, Pin/Unpin)
- **US-019: Melhorias de UX - Acessibilidade**
  - Focus trap em todos os modais
  - Keyboard navigation no FileExplorer (Up/Down/Left/Right/Enter)
  - Keyboard navigation no SpecsPanel (Up/Down/Enter)
  - ARIA labels em todos os elementos interativos
  - Skip links para navegação rápida
  - Tree navigation hook seguindo WAI-ARIA TreeView pattern
- **Progress por Spec** - Barra de progresso visual nos cards
  - Mostra X/Y tasks completas com porcentagem
  - Status dinâmico: not_started → in_progress → completed
  - Cores adaptativas baseadas no progresso
- **Settings Panel** - Modal de configurações (Cmd+,)
  - Editor: font size, tab size, word wrap, minimap, line numbers
  - Terminal: font size
  - AI: default model, default agent, permission mode
  - General: auto-save toggle and delay
  - Keyboard shortcuts reference
- **Image Analysis in Chat** - Suporte a análise de imagens
  - Paste (Cmd+V), drag & drop, file picker
  - Imagens enviadas ao Claude para análise

### Changed

- Monaco Editor usa settings do settingsStore
- Terminal usa fontSize do settingsStore
- EditorTabs redesenhado com controles de navegação
- FileExplorer com navegação por teclado completa

### New Files

- `components/editor/Breadcrumbs.tsx`
- `components/editor/TabContextMenu.tsx`
- `components/modals/RecentFiles.tsx`
- `components/ui/SkipLinks.tsx`
- `hooks/useFocusTrap.ts`
- `hooks/useListNavigation.ts`
- `hooks/useTreeNavigation.ts`

---

## [0.2.0] - 2025-12-22

### Added

- Dashboard Panel with metrics and health check
- Mermaid diagrams in Markdown preview
- File Explorer context menu
- Quick Open (Cmd+P), Global Search (Cmd+Shift+F)
- Command Palette (Cmd+Shift+P)
- Modern dark theme with purple accents
- Toast notifications system (sonner)
- Skeleton loaders for loading states

### Changed

- Unified data source for Kanban and SpecsPanel
- Health API now checks parent directory for .devflow
- Faster health check

### Removed

- Knowledge Graph visualization
- Kanban Board view (replaced by SpecsPanel)

---

## [0.1.0] - 2025-12-19

### Added

- Initial release
- Monaco Editor with syntax highlighting
- File Explorer with tree view
- Terminal with xterm.js + PTY
- Git Panel with status, commit, push/pull
- Specs/Tasks panel with workflow phases
- Resizable panels

---

*Maintained by @chronicler*
