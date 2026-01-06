---
id: "ADR-004"
title: "Tech Stack do DevFlow IDE Web"
status: "accepted"
date: "2025-12-19"
deciders:
  - "@architect"
  - "@strategist"
tags:
  - "frontend"
  - "stack"
  - "ide"
category: "architecture"
technical_story: "PRD DevFlow IDE Web"

relates_to: ["ADR-005"]
supersedes: []
superseded_by: null

impact:
  scope: "project"
  magnitude: "critical"

review_date: "2025-12-19"
next_review: "2026-03-19"
---

# ADR-004: Tech Stack do DevFlow IDE Web

## Context

Precisamos definir a stack tecnológica para construir uma IDE web local que:

1. Roda localmente (não é SaaS)
2. Comunica com Claude Code CLI
3. Oferece editor de código/markdown
4. Renderiza knowledge graph interativo
5. Suporta terminal embutido
6. Tem performance adequada (< 3s startup)

**Constraints**:
- Deve rodar em Node.js 18+
- Desenvolvedor único (inicialmente)
- MVP em tempo curto
- Experiência similar a VS Code/Kiro

## Decision

**Escolhemos a seguinte stack:**

```yaml
Framework:     Next.js 14+ (App Router)
Language:      TypeScript
Styling:       Tailwind CSS + shadcn/ui
State:         Zustand
Editor:        Monaco Editor
Graph:         React Flow
Terminal:      xterm.js
Markdown:      react-markdown + remark-gfm + mermaid
Testing:       Vitest + Playwright
```

## Rationale

### Por que Next.js 14?

1. **App Router**: Server Components para performance
2. **API Routes**: Backend integrado (não precisa de servidor separado)
3. **Streaming**: ReadableStream nativo para SSE
4. **Hot reload**: DX excelente
5. **Produção-ready**: Build otimizado para produção

### Por que Monaco Editor (não CodeMirror)?

| Critério | Monaco | CodeMirror 6 |
|----------|--------|--------------|
| Familiaridade | VS Code engine (usuários conhecem) | Menos familiar |
| Features | IntelliSense, multi-cursor, snippets | Precisa plugins |
| Bundle size | ~2MB | ~500KB |
| Markdown support | Excelente | Bom |
| YAML support | Nativo | Plugin necessário |

**Decisão**: Monaco. O tamanho maior é aceitável para uma IDE local. A familiaridade com VS Code é vantagem competitiva.

**Mitigação de tamanho**: Lazy loading do Monaco apenas quando abrir editor.

### Por que React Flow (não D3.js)?

| Critério | React Flow | D3.js |
|----------|------------|-------|
| React integration | Nativo | Manual |
| Learning curve | Baixa | Alta |
| Interatividade | Built-in (pan, zoom, drag) | Manual |
| Performance (1000 nós) | Virtualizado | Precisa implementar |
| Customização | Componentes React | SVG manual |

**Decisão**: React Flow. Produtividade muito maior, features prontas.

### Por que Zustand (não Redux/Context)?

| Critério | Zustand | Redux Toolkit | React Context |
|----------|---------|---------------|---------------|
| Boilerplate | Mínimo | Médio | Baixo |
| DevTools | Sim | Sim | Limitado |
| Performance | Excelente | Boa | Re-renders |
| Learning curve | 5 min | 30 min | 10 min |
| Bundle size | 1KB | 10KB+ | 0 |

**Decisão**: Zustand. Simplicidade máxima, performance excelente, zero boilerplate.

### Por que shadcn/ui (não MUI/Chakra)?

| Critério | shadcn/ui | MUI | Chakra |
|----------|-----------|-----|--------|
| Customização | Código próprio | Temas | Temas |
| Bundle size | Só o que usa | ~100KB+ | ~50KB+ |
| Tailwind | Nativo | Conflitos | Parcial |
| Design system | Radix primitives | Material | Próprio |
| Copy-paste | Sim | Não | Não |

**Decisão**: shadcn/ui. Componentes são copiados para o projeto, total controle, zero dependência de runtime.

## Alternatives Considered

### Alternativa 1: Electron + React

**Descrição**: App desktop nativo com Electron

**Pros:**
- Acesso nativo ao filesystem
- Melhor integração com CLI
- Pode usar Node.js diretamente

**Cons:**
- Bundle ~150MB+
- Complexidade de build/update
- Overhead de Chromium

**Por que foi rejeitada**: Overkill para MVP. Next.js local resolve 90% dos casos. Electron pode ser considerado no futuro.

### Alternativa 2: Tauri + Svelte

**Descrição**: App nativo leve com Rust backend

**Pros:**
- Bundle ~10MB
- Performance nativa
- Svelte é mais simples

**Cons:**
- Ecossistema menor
- Rust learning curve
- Menos bibliotecas prontas

**Por que foi rejeitada**: Risco de produtividade. Precisamos entregar MVP rápido. Ecossistema React é mais maduro.

### Alternativa 3: Vue + Vite

**Descrição**: Vue 3 com Vite como bundler

**Pros:**
- Vue é simples
- Vite é rápido
- Menor curva que React

**Cons:**
- Menos bibliotecas para IDE (Monaco wrapper menos maduro)
- React Flow não tem equivalente Vue tão bom
- Menos desenvolvedores familiarizados

**Por que foi rejeitada**: Ecossistema de componentes de IDE é mais maduro em React.

## Consequences

### Positive

- Stack moderna e produtiva
- Componentes prontos (shadcn, React Flow)
- Monaco oferece experiência VS Code-like
- Build otimizado para produção
- TypeScript garante type safety
- Comunidade ativa para suporte

### Negative

- Monaco é pesado (~2MB) - mitigado com lazy loading
- Next.js tem overhead vs Vite puro - aceitável para o caso de uso
- Zustand é menos conhecido que Redux - documentação interna necessária

### Risks

**Risk 1**: Monaco muito pesado para startup
- Likelihood: Medium
- Impact: Medium
- Mitigation: Lazy loading, mostrar skeleton enquanto carrega

**Risk 2**: React Flow não escala para 1000+ nós
- Likelihood: Low (knowledge graph típico tem <100 nós)
- Impact: Low
- Mitigation: Virtualização built-in, clustering se necessário

## Implementation

### Setup Inicial

```bash
# Criar projeto
npx create-next-app@latest devflow-ide --typescript --tailwind --app

# Dependências core
npm install zustand @monaco-editor/react reactflow xterm xterm-addon-fit

# shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog dropdown-menu input tabs

# Markdown
npm install react-markdown remark-gfm rehype-highlight mermaid

# Dev dependencies
npm install -D vitest @playwright/test @types/node
```

### Estrutura Base

```
devflow-ide/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       ├── chat/route.ts      # SSE para Claude CLI
│       ├── files/route.ts     # File operations
│       └── project/route.ts   # Project management
├── components/
│   ├── ui/                    # shadcn components
│   ├── editor/                # Monaco wrapper
│   ├── chat/                  # Chat interface
│   ├── explorer/              # File tree
│   ├── graph/                 # React Flow
│   └── terminal/              # xterm wrapper
├── lib/
│   ├── stores/                # Zustand stores
│   ├── claude-cli.ts          # CLI integration
│   └── utils.ts
└── public/
```

## Follow-up Actions

- [ ] Setup projeto Next.js com dependências
- [ ] Configurar ESLint + Prettier
- [ ] Criar stores Zustand (files, chat, project)
- [ ] Implementar wrapper Monaco com lazy loading
- [ ] Configurar React Flow básico
- [ ] Setup xterm.js

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Monaco Editor React](https://github.com/suren-atoyan/monaco-react)
- [React Flow](https://reactflow.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [xterm.js](https://xtermjs.org/)

---

**Notes**:
- Stack validada para produção
- Lazy loading crítico para Monaco
- Review em 3 meses para avaliar decisões
