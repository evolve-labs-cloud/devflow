# Changelog

Todas as mudancas notaveis neste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.4] - 2026-03-24

### Added

- **Agent Teams habilitado por padrão** — `devflow init` e `devflow update` agora escrevem automaticamente `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` em `.claude/settings.json`, ativando o Modo Team para todos os 7 agentes sem configuração manual
- **Merge seguro de settings** — se `.claude/settings.json` já existir com outras configurações do usuário (permissões, model, etc.), a chave `env` é mesclada sem sobrescrever; se não existir, é criado

### Fixed

- **Team mode silenciosamente inativo** — usuários que instalavam via npm tinham o Modo Team documentado nos agentes mas a flag `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` nunca era escrita; o peer-to-peer não funcionava
- **CLI mostrava "DevFlow Pro"** — `lib/utils.js` continha 3 ocorrências hardcoded de "DevFlow Pro"; corrigido para "DevFlow"
- **`challenger.meta.yaml` ausente** — challenger era o único agente sem `.meta.yaml`; criado com estrutura completa
- **`lib/web.js` incluído no tarball** — arquivo morto após remoção da Web IDE ainda era publicado via cobertura de `lib/`; removido

---

## [1.2.0] - 2026-03-22

### Removed

- **Web IDE removida** — `devflow web` command removido; Web IDE (Next.js, xterm.js, node-pty) não faz mais parte do pacote npm
- `--web` flag removida do `devflow init`
- `lib/web.js` descontinuado; arquivos `web/` não são mais publicados no npm
- Dependências implícitas de Next.js, Monaco Editor, Zustand eliminadas do bundle

### Added

- **Persistent Memory** — cada execução do autopilot registrada em `.devflow/memory.json`: sessões, decisões técnicas, artifacts por agente
- **Adaptive Autopilot** (`--adaptive`) — LLM classifica complexidade (TRIVIAL/SIMPLE/MODERATE/COMPLEX) e decide quais fases rodar; mostra plano e pede confirmação
- **Context Isolation** — por padrão cada agente recebe apenas o output do agente anterior (N-1), reduzindo ~87% dos tokens; `--full-context` restaura comportamento anterior
- **Challenger** (`--challenger`) — review adversarial com OpenAI após o guardian; auto-save em `docs/security/`; gaps críticos registrados no memory
- **`devflow challenge`** — challenger standalone sem precisar do autopilot completo
- `lib/challengers/openai.js`, `lib/autopilot/planner.js`, `lib/context/isolation.js`, `lib/memory/` adicionados
- `quick/codex-review.md` — novo quick command para code review com OpenAI

### Changed

- `lib/autopilot.js` — atualizado com suporte a memory, adaptive planning, context isolation e challenger
- `lib/constants.js` — `VERSION` agora lido dinamicamente de `package.json` (sem hardcode)
- README reescrito — foco em CLI + agentes, sem seção Web IDE; documentadas todas as features

---

## [1.1.1] - 2026-03-22

### Added

- **Dual Scaling Modes por Agente** — cada um dos 6 agentes agora suporta dois modos de scaling:
  - **Modo Padrão** (sem argumento): Parallel Subagents via Agent tool — isolado, automático, 1x tokens
  - **Modo Team** (argumento `team`): Claude Agent Teams — peers com comunicação direta, 3-5x tokens
  - Trigger: `/agents:<nome> team <tarefa>` ativa o Modo Team
  - Backward compatible: sem `team`, comportamento anterior inalterado
  - Pré-requisito Modo Team: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` em `.claude/settings.json` + Claude Code v2.1.32+

- **Teammates por agente:**
  - `@strategist team`: @user-story-writer, @competitive-analyst, @acceptance-criteria-expert, @roadmap-planner
  - `@architect team`: @schema-specialist, @api-contract-designer, @adr-researcher, @diagram-builder
  - `@system-designer team`: @capacity-calculator, @failure-mode-analyst, @infrastructure-planner, @slo-architect, @data-flow-designer
  - `@builder team`: @backend-dev, @frontend-dev, @test-writer, @migration-writer, @api-integrator
  - `@guardian team`: @owasp-scanner, @dependency-auditor, @performance-tester, @test-generator, @coverage-analyst
  - `@chronicler team`: @changelog-writer, @docs-synchronizer, @snapshot-creator, @adr-linker, @status-auditor

- **`/agents:team`** — novo comando de orquestração cross-domain: coordena todos os 6 agentes em paralelo via Claude Agent Teams com templates para feature development, code review, debug e system design colaborativo

- **ADR-023** — "Agent Scaling Mechanism: Parallel Subagents vs Claude Agent Teams" — decisão arquitetural documentando os dois mecanismos e quando usar cada um

### Changed

- Todos os 6 arquivos de agentes atualizados com seção `## 🔀 SCALING AUTÔNOMO — PARALLEL SUBAGENTS` + `## 🤝 MODO TEAM — CLAUDE AGENT TEAMS`

---

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
