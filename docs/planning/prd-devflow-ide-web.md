# PRD: DevFlow IDE Web

**Versão**: 1.0
**Data**: 2025-12-19
**Status**: Draft
**Owner**: @strategist

---

## 1. Visão Geral

### 1.1 Problema

O DevFlow atualmente opera exclusivamente via Claude Code CLI, o que apresenta limitações:

1. **Falta de visibilidade**: Difícil visualizar o estado geral do projeto (specs, stories, ADRs, knowledge graph)
2. **Navegação fragmentada**: Alternar entre arquivos MD/YAML no terminal é ineficiente
3. **Curva de aprendizado**: Novos usuários precisam memorizar comandos e sintaxe de @ mentions
4. **Comunicação lenta**: Tentativas anteriores de interface falharam por latência na comunicação com Claude
5. **Contexto perdido**: Sem visualização do knowledge graph, relações entre entidades ficam invisíveis

### 1.2 Solução Proposta

**DevFlow IDE Web** - Uma IDE local estilo Kiro (AWS) que:

- Roda localmente via Next.js
- Comunica com Claude Code CLI como subprocess
- Oferece interface visual para todas as operações do DevFlow
- Resolve latência via streaming e comunicação otimizada
- Mantém a filosofia spec-driven do sistema

### 1.3 Objetivos

| Objetivo | Métrica | Target |
|----------|---------|--------|
| Reduzir tempo de navegação | Tempo para encontrar spec | < 5 segundos |
| Aumentar adoção | Novos usuários produtivos | < 30 min onboarding |
| Resolver latência | Tempo de resposta do agente | < 2s para início do streaming |
| Melhorar visibilidade | Informações visíveis sem comando | 100% do estado do projeto |

### 1.4 Não-Objetivos (Out of Scope para MVP)

- Colaboração multi-usuário em tempo real
- Deploy em cloud/SaaS
- Integração com Git (além de visualização)
- Mobile support
- Temas customizáveis (além de light/dark)
- Plugins/extensões de terceiros

---

## 2. User Personas

### 2.1 Persona Primária: Dev Solo (Lucas)

- **Perfil**: Desenvolvedor full-stack, 28 anos
- **Contexto**: Usa DevFlow para projetos pessoais e freelance
- **Pain Points**:
  - Perde tempo alternando entre terminal e editor
  - Esquece quais specs já foram criadas
  - Não consegue visualizar dependências entre stories
- **Objetivo**: Fluxo contínuo de spec → code sem context switching
- **Quote**: "Quero ver tudo num lugar só e conversar com os agentes sem sair da IDE"

### 2.2 Persona Secundária: Tech Lead (Marina)

- **Perfil**: Tech Lead, 35 anos, equipe de 5 devs
- **Contexto**: Usa DevFlow para padronizar processo da equipe
- **Pain Points**:
  - Difícil acompanhar progresso de múltiplas stories
  - Onboarding de novos devs é lento
  - ADRs ficam "perdidos" em pastas
- **Objetivo**: Dashboard de progresso e onboarding simplificado
- **Quote**: "Preciso ver o big picture sem abrir 10 arquivos"

---

## 3. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    DevFlow IDE Web                          │
│                      (Next.js)                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Editor  │  │   Chat   │  │  Graph   │  │ Dashboard │   │
│  │  Panel   │  │  Panel   │  │  View    │  │   View    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘   │
│       │             │             │              │          │
│  ┌────┴─────────────┴─────────────┴──────────────┴─────┐   │
│  │              State Management (Zustand)              │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────┴──────────────────────────────┐   │
│  │           API Routes (Next.js App Router)            │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          │ Subprocess + Streaming
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Claude Code CLI                           │
│              (claude --print --stream)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    .devflow/ + docs/                        │
│              (Specs, Stories, ADRs, Memory)                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Decisão Arquitetural: CLI como Backend

**Por que Claude CLI e não API direta?**

1. **Contexto preservado**: CLI já carrega .claude_project e configurações
2. **Agentes funcionam**: Sistema de @ mentions funciona nativamente
3. **Comandos existentes**: /new-feature, /security-check já implementados
4. **Menos complexidade**: Não precisa replicar lógica de contexto
5. **Streaming nativo**: `claude --stream` resolve problema de latência

**Trade-offs**:
- Dependência do Claude Code instalado
- Menos controle fino sobre tokens/custos
- Debug mais complexo

---

## 4. Funcionalidades MVP

### 4.1 Core Features (Must Have)

#### F1: File Explorer ✅
- Árvore de arquivos focada em .devflow/ e docs/
- Ícones diferenciados por tipo (spec, story, ADR, agent)
- Quick filters (mostrar só specs, só stories, etc)
- Create/rename/delete arquivos

#### F2: Editor de Specs/Markdown ✅
- Syntax highlighting para MD e YAML
- Preview lado a lado
- Templates para novos arquivos (spec, story, ADR)
- Auto-save

#### F3: Chat com Agentes ✅
- Interface de chat estilo ChatGPT
- Seletor de agente (@strategist, @builder, etc)
- Streaming de respostas (resolve latência)
- Histórico de conversas por sessão
- Suporte a comandos (/, @)

#### F4: Knowledge Graph Viewer ✅
- Visualização interativa do knowledge-graph.json
- Filtros por tipo de nó (agent, feature, decision)
- Click para navegar ao arquivo relacionado
- Zoom/pan/search

#### F5: Dashboard de Progresso ✅
- Cards com contadores (specs, stories, ADRs)
- Lista de stories por status (pending, in_progress, done)
- Timeline de atividades recentes
- Health check do projeto

#### F6: Terminal Integrado ✅
- Terminal embutido na IDE
- Comandos pré-configurados (devflow-status, etc)
- Output colorido

#### F7: Preview de Markdown ✅
- Renderização em tempo real
- Suporte a Mermaid diagrams
- Links clicáveis entre documentos

### 4.2 Nice to Have (Should - Post MVP)

- Diff viewer para mudanças
- Busca global (cmd+shift+f)
- Snippets/templates customizáveis
- Shortcuts customizáveis
- Notificações de atividade dos agentes
- Export de reports (PDF)

### 4.3 Future (Could - v2+)

- Colaboração real-time
- Integração Git visual
- CI/CD integration
- Métricas de velocity
- AI code review integrado

---

## 5. User Stories MVP

### Epic 1: Setup & Navegação

| ID | Story | Prioridade | Complexidade |
|----|-------|------------|--------------|
| US-001 | Como dev, quero abrir um projeto DevFlow existente para trabalhar nele | P0 | 3 |
| US-002 | Como dev, quero navegar pela estrutura de arquivos para encontrar specs | P0 | 5 |
| US-003 | Como dev, quero filtrar arquivos por tipo para focar no que preciso | P1 | 3 |

### Epic 2: Editor

| ID | Story | Prioridade | Complexidade |
|----|-------|------------|--------------|
| US-004 | Como dev, quero editar arquivos MD com syntax highlighting | P0 | 5 |
| US-005 | Como dev, quero preview do Markdown lado a lado | P0 | 3 |
| US-006 | Como dev, quero criar novos arquivos a partir de templates | P1 | 5 |
| US-007 | Como dev, quero auto-save para não perder trabalho | P1 | 2 |

### Epic 3: Chat com Agentes

| ID | Story | Prioridade | Complexidade |
|----|-------|------------|--------------|
| US-008 | Como dev, quero conversar com @strategist para criar specs | P0 | 8 |
| US-009 | Como dev, quero ver respostas em streaming para feedback imediato | P0 | 5 |
| US-010 | Como dev, quero selecionar qual agente usar na conversa | P0 | 3 |
| US-011 | Como dev, quero usar comandos / no chat | P1 | 3 |
| US-012 | Como dev, quero ver histórico de conversas da sessão | P1 | 3 |

### Epic 4: Visualizações

| ID | Story | Prioridade | Complexidade |
|----|-------|------------|--------------|
| US-013 | Como dev, quero ver o knowledge graph visualmente | P1 | 8 |
| US-014 | Como dev, quero clicar num nó do graph e ir ao arquivo | P1 | 3 |
| US-015 | Como dev, quero ver dashboard com status do projeto | P1 | 5 |
| US-016 | Como dev, quero ver lista de stories por status | P1 | 3 |

### Epic 5: Terminal & Execução

| ID | Story | Prioridade | Complexidade |
|----|-------|------------|--------------|
| US-017 | Como dev, quero terminal integrado na IDE | P1 | 5 |
| US-018 | Como dev, quero executar comandos DevFlow com um click | P2 | 3 |

---

## 6. Requisitos Não-Funcionais

### 6.1 Performance

| Requisito | Target | Medição |
|-----------|--------|---------|
| Tempo de startup | < 3s | First Contentful Paint |
| Resposta do chat (início streaming) | < 2s | Tempo até primeiro token |
| Renderização do graph (100 nós) | < 500ms | Time to Interactive |
| File tree load | < 1s | Tempo de renderização |

### 6.2 Usabilidade

- Keyboard shortcuts para todas ações principais
- Responsive (min 1024px width)
- Dark/Light mode
- Acessibilidade básica (ARIA labels, contraste)

### 6.3 Segurança

- Execução apenas local (localhost)
- Sem telemetria externa
- Sanitização de inputs para CLI
- Validação de paths (prevenir path traversal)

### 6.4 Compatibilidade

- Node.js 18+
- macOS, Linux, Windows (WSL)
- Claude Code CLI instalado e autenticado
- Browsers: Chrome, Firefox, Safari (últimas 2 versões)

---

## 7. Stack Técnico Recomendado

```yaml
Frontend:
  framework: Next.js 14+ (App Router)
  styling: Tailwind CSS + shadcn/ui
  state: Zustand
  editor: Monaco Editor (VS Code engine)
  graph: React Flow ou D3.js
  terminal: xterm.js
  markdown: react-markdown + remark-gfm

Backend (API Routes):
  runtime: Node.js
  cli_integration: child_process (spawn)
  file_system: fs/promises
  streaming: Server-Sent Events (SSE)

DevEx:
  language: TypeScript
  linting: ESLint + Prettier
  testing: Vitest + Playwright
```

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Latência do CLI persiste | Média | Alto | Implementar streaming desde o início; cache de respostas parciais |
| Monaco Editor pesado | Baixa | Médio | Lazy loading; considerar CodeMirror como alternativa |
| Complexidade do graph com muitos nós | Média | Médio | Virtualização; limitar nós visíveis; clustering |
| Claude CLI não instalado | Alta | Alto | Onboarding guiado; health check no startup |
| Path traversal via input malicioso | Baixa | Alto | Sanitização rigorosa; whitelist de diretórios |

---

## 9. Métricas de Sucesso

### 9.1 MVP Success Criteria

- [x] Usuário consegue abrir projeto em < 3s
- [x] Chat com agente responde em < 2s (início streaming)
- [x] Todas 7 features core funcionando (7/7 completas)
- [ ] Zero crashes em uso normal (1h sessão)
- [ ] Feedback positivo de 3+ usuários beta

### 9.2 KPIs Pós-Launch

- Tempo médio de sessão > 30min
- Retention D7 > 50%
- NPS > 40
- < 5 bugs críticos reportados no primeiro mês

---

## 10. Roadmap Sugerido

### Fase 1: Foundation (MVP Core) ✅ COMPLETA
- ✅ Setup Next.js + estrutura base
- ✅ File explorer funcional
- ✅ Editor básico com preview
- ✅ Chat com streaming funcionando

### Fase 2: MVP Completo ✅ COMPLETA
- ✅ Knowledge graph viewer
- ✅ Dashboard de progresso
- ✅ Terminal integrado
- ✅ Git Integration
- ✅ Specs Workflow System
- ✅ Task Execution System

### Fase 3: Enhancement (EM ANDAMENTO)
- [x] Busca global (Cmd+Shift+F)
- [x] Quick Open (Cmd+P)
- [x] Command Palette (Cmd+Shift+P)
- [x] Keyboard Shortcuts globais
- [x] Context menu no File Explorer
- [x] Mermaid diagrams no preview
- [x] Knowledge Graph visualization
- [x] Kanban Board view (toggle com Graph)
- [x] Dagre hierarchical layout para Graph
- [x] Unified data source (Kanban + SpecsPanel)
- [x] Dashboard com métricas e health check
- [ ] Melhorias de UX baseadas em feedback
- [ ] Performance optimization
- [ ] Testes automatizados
- [ ] Scroll sincronizado (editor/preview)

---

## 11. Próximos Passos

### Concluídos ✅
1. ~~**@architect**: Revisar viabilidade técnica e criar design de arquitetura~~
2. ~~**@architect**: Definir estrutura de pastas e componentes~~
3. ~~**@builder**: Implementar stories P0 do Epic 1 e 2~~
4. ~~**@builder**: Implementar stories P0 do Epic 3 (Chat)~~
5. ~~**@builder**: Implementar Git Integration~~
6. ~~**@builder**: Implementar Terminal Integration~~
7. ~~**@builder**: Implementar Specs Workflow System~~
8. ~~**@builder**: Implementar Quick Open (Cmd+P)~~
9. ~~**@builder**: Implementar Global Search (Cmd+Shift+F)~~
10. ~~**@builder**: Implementar Command Palette (Cmd+Shift+P)~~
11. ~~**@chronicler**: Criar snapshot do projeto~~
12. ~~**@builder**: Implementar Mermaid diagrams no preview~~
13. ~~**@builder**: Implementar Context Menu no File Explorer~~
14. ~~**@builder**: Implementar Knowledge Graph visualization~~
15. ~~**@builder**: Implementar Kanban Board view~~
16. ~~**@builder**: Implementar Dagre hierarchical layout~~
17. ~~**@builder**: Unificar data source (Kanban + SpecsPanel)~~
18. ~~**@builder**: Implementar Dashboard com métricas~~

### Pendentes
1. **@guardian**: Definir estratégia de testes
2. **@guardian**: Implementar testes unitários e e2e
3. **@builder**: Implementar scroll sincronizado (editor/preview)
4. **@builder**: Performance optimization

---

## Anexo A: Referências

- [Kiro AWS](https://kiro.dev) - Inspiração principal
- [Claude Code CLI](https://docs.anthropic.com/claude-code)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [React Flow](https://reactflow.dev/)
- [shadcn/ui](https://ui.shadcn.com/)

---

*Documento criado por @strategist*
*Próxima revisão: Após feedback do @architect*
