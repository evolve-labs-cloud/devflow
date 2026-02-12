# Changelog

Todas as mudancas notaveis neste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-11

### Security Hardening

- **File API path scoping**: `safePath()` valida todas as operacoes de arquivo contra `DEVFLOW_PROJECT_PATH`, prevenindo path traversal
- **Session ID sanitization**: IDs de terminal sanitizados para prevenir command injection
- **Temp file permissions**: Arquivos temporarios do autopilot criados com 0o600
- **Shell detection**: Fallback chain segura (`SHELL` → `/bin/zsh` → `/bin/bash` → `/bin/sh`)

### Fixed

- **npm global install**: `devflow web` agora funciona corretamente quando instalado via `npm install -g`
  - SWC/Next.js nao compilava TypeScript dentro de `node_modules`
  - Solucao: `resolveWebDir()` copia fonte web para `~/.devflow/_web/` com cache por versao
- **node-pty spawn-helper**: `fixSpawnHelperPermissions()` corrige permissoes do binario prebuilt apos npm install
  - `npm install` removia bit de execucao do `spawn-helper` em macOS/Linux
  - Solucao: `fs.chmodSync(helper, 0o755)` automatico ao iniciar Web IDE
- **Dados pessoais removidos**: Nome pessoal substituido por `[Tech Lead]` em templates
- **URLs corrigidas**: GitHub URLs atualizadas para `evolve-labs-cloud/devflow`

### Changed

- Versao publica estavel no npm como `@evolve.labs/devflow`
- Documentacao completamente atualizada (ARCHITECTURE, INSTALLATION, QUICKSTART, CHANGELOG)

---

## [0.9.0] - 2026-02-10

### Added - Autopilot Terminal-Based + CLI

- **Autopilot no terminal**: Agents rodam no terminal panel do Web IDE com output streaming em tempo real
  - `terminal-execute` API route: executa agent via PTY em vez de `execSync`
  - Marker-based completion detection (`___DEVFLOW_PHASE_DONE_<exitCode>___`)
  - `ptyManager` extended com autopilot collector
  - SSE event `autopilot-phase-done` para notificacao ao frontend
  - Tab "Autopilot" criada automaticamente no terminal

- **CLI `devflow autopilot`**: Comando headless para rodar autopilot sem Web IDE
  - `devflow autopilot <spec-file>` com `spawn` streaming
  - `--phases <list>`: selecionar fases (default: todas)
  - `--project <path>`: diretorio do projeto
  - `--no-update`: nao auto-atualizar tasks no spec
  - Auto-task tracking: tasks na spec marcadas automaticamente como concluidas

- **Autopilot shared constants**: `autopilotConstants.ts` extraido de `execute/route.ts`
  - `AGENT_PROMPTS`, `AGENT_SKILLS`, `AGENT_TIMEOUTS`
  - `autoUpdateSpecTasks()` reutilizavel

### Changed - Web IDE Refactoring

- **Removido File Explorer**: Navegacao por projeto removida
- **Multi-project support**: `ProjectSelector` para alternar entre projetos
- **Agent completion tracking**: Badges visuais por agente
- **Layout simplificado**: Sem sidebar, foco em specs + terminal
- **AutopilotPanel**: Simplificado — output principal no terminal, panel mostra status/duracao/tasks
- **Abort button**: Envia Ctrl+C ao terminal e marca fases como failed/skipped

---

## [0.8.0] - 2026-02-08

### Added - npm Package + CLI Commands

- **npm package**: Publicado como `@evolve.labs/devflow` no npm
  - `npm install -g @evolve.labs/devflow`
  - `bin/devflow.js` com commander CLI

- **`devflow init [path]`**: Inicializar DevFlow num projeto
  - `--agents-only`: apenas agentes (minimo)
  - `--full`: tudo incluindo .gitignore
  - `--web`: inclui Web IDE
  - Copia agentes, metadata, estrutura de docs, project.yaml

- **`devflow update [path]`**: Atualizar instalacao existente
  - Preserva customizacoes do usuario
  - Atualiza apenas agentes e metadata

- **`devflow web`**: Iniciar Web IDE
  - `--port <number>`: porta customizada
  - `--project <path>`: projeto especifico
  - `--dev`: modo desenvolvimento
  - Instala dependencias automaticamente se necessario

- **Constantes centralizadas**: `lib/constants.js` com VERSION, diretories, copy mappings

### Changed

- **Removido `install.sh`**: Substituido por `devflow init`
- **Removido `update.sh`**: Substituido por `devflow update`
- **`.gitignore` reescrito**: Exclui runtime data, package-lock files, legacy scripts
- **Estrutura de pastas**: `docs/snapshots/` padronizado (antes era `.devflow/snapshots/`)

---

## [0.7.0] - 2026-02-11

### Added - System Designer Agent (6th Agent)

- **@system-designer**: Novo agente especializado em System Design em escala
  - Inspirado por DDIA (Kleppmann), Alex Xu, Sam Newman, Google SRE Book
  - 4 Pilares: Escalabilidade & Distribuicao, Data Systems, Infra & Cloud, Reliability & Observability
  - 7 Comandos: `/system-design`, `/rfc`, `/capacity-planning`, `/trade-off-analysis`, `/data-model`, `/infra-design`, `/reliability-review`
  - Templates completos: SDD (System Design Document) e RFC (Request for Comments)
  - Hard stops: NUNCA escreve codigo de producao, apenas exemplos/diagramas
  - EXIT CHECKLIST bloqueante com 8 verificacoes
  - Boundary clara com @architect: architect="QUAL pattern/tech" vs system-designer="COMO funciona em producao"

- **Novos arquivos criados**:
  - `.claude/commands/agents/system-designer.md` (~1100 linhas, spec completa)
  - `.devflow/agents/system-designer.meta.yaml` (metadata estruturada)
  - `.claude/commands/quick/system-design.md` (wizard de quick start)
  - `docs/system-design/{sdd,rfc,capacity,trade-offs}/` (diretorios de output)

- **`/system-design` slash command**: Quick start wizard para system design

### Changed - Agent Integration & Audit

- **Workflow atualizado para 6 agentes**: Strategist(1) -> Architect(2) -> System Designer(3) -> Builder(4) -> Guardian(5) -> Chronicler(6)

- **Todos os 5 agentes existentes integrados com @system-designer**:
  - `strategist.md`: Delegacao para @system-designer quando NFRs envolvem escala/infra
  - `architect.md`: Delegacao obrigatoria apos design que envolve escala/infra/reliability
  - `builder.md`: Verificacao de SDD antes de implementar features com escala
  - `guardian.md`: Reporta problemas de escala/performance ao @system-designer
  - `chronicler.md`: Documenta SDDs e RFCs automaticamente

- **Token optimization (~30% reducao nos 3 maiores agentes)**:
  - `guardian.md`: ~1535 -> ~600 linhas
  - `chronicler.md`: ~789 -> ~550 linhas
  - `strategist.md`: ~535 -> ~430 linhas

- **EXIT CHECKLIST adicionado ao strategist.md** (era o unico agente sem)

### Fixed - Agent Consistency Issues

- **Meta.yaml desync**: .claude/ e .devflow/ tinham positions conflitantes - sincronizados
- **Missing @system-designer refs**: 4 de 5 agentes existentes nao referenciavam - corrigido
- **Guardian should_not_do incompleto**: Faltava "Projetar infraestrutura em escala"
- **Builder should_not_do incompleto**: Faltava "Fazer decisoes de infraestrutura ou escala"

---

## [0.6.0] - 2025-12-29

### Added - Permission Mode Configuration

- **ChatSettings Component**: Configuracao de permissoes no chat
  - 3 modos: Auto-Accept Edits, Bypass All, Ask Permission
  - Persistencia em localStorage

- **Permission Mode API**: Suporte a permission mode dinamico
  - `settingsStore.ts`, `chatStore.ts`, `/api/chat/route.ts`

### Fixed

- **Web UI Permission Blocking**: Claude CLI usa `--permission-mode acceptEdits` por padrao na web

---

## [0.4.0] - 2025-12-26

### Added - Web IDE Complete

- **Web IDE Interface**: Interface visual completa para projetos DevFlow
  - Dashboard Panel com metricas e health check
  - Specs Panel (requirements, design, tasks)
  - File Explorer com context menu
  - Monaco Editor com syntax highlighting
  - Terminal integrado via xterm.js
  - Chat com Claude
  - Settings Panel (Cmd+,)

- **Autopilot System**: Pipeline DevFlow automatico (5 fases sequenciais)
- **Keyboard Shortcuts**: Cmd+P, Cmd+Shift+F, Cmd+Shift+P, Cmd+S, Cmd+W, etc.
- **Markdown Preview**: GFM, Mermaid diagrams, syntax highlighting

### Changed

- Mermaid diagrams lazy loaded
- Components memoizados
- Terminal writes com buffering

### Removed

- Knowledge Graph visualization
- Kanban Board

---

## [0.3.0] - 2025-12-05

### Added - Hard Stops & Mandatory Delegation

- **Hard Stops em todos os agentes**: Secao critica no topo de cada .md
- **Regras de NUNCA FACA / SEMPRE FACA** com logica IF/THEN
- **Geracao automatica de stories**: Chronicler gera se strategist nao criar
- **Detection patterns**: Padroes de codigo para detectar violacoes de escopo
- **Mandatory delegation triggers**: Em todos os .meta.yaml

### Changed

- Orquestracao completa com regras obrigatorias
- Todos os agentes com hard stops e EXIT CHECKLIST

---

## [0.2.0] - 2025-11-15

### Added - Metadata Estruturada

- `.devflow/project.yaml`: Metadata do projeto
- `.devflow/agents/*.meta.yaml`: Metadata por agente
- Knowledge Graph: `.devflow/knowledge-graph.json`
- ADR com YAML Frontmatter
- ADR-001: "5 Agentes ao inves de 19+"

---

## [0.1.0] - 2025-11-15

### Added - Release Inicial

- Sistema DevFlow multi-agentes (5 agentes iniciais)
- Strategist, Architect, Builder, Guardian, Chronicler
- Estrutura de documentacao automatica
- Sistema de snapshots
- Workflow adaptativo (4 niveis de complexidade)

---

<!-- O Chronicler mantera este arquivo atualizado automaticamente -->
<!-- Nao edite manualmente - use @chronicler /document -->
