# US-021: Testes Automatizados

**Status**: deferred
**Prioridade**: P0
**Complexidade**: 8
**Sprint**: Fase 3 - Enhancement
**Responsável**: @guardian

---

## User Story

**Como** desenvolvedor do DevFlow IDE,
**Quero** uma suíte de testes automatizados,
**Para** garantir qualidade e prevenir regressões.

---

## Estratégia de Testes

### 1. Unit Tests (Vitest)
**Cobertura alvo**: 80%

#### Stores (Zustand)
- [ ] `fileStore.ts` - operações de arquivo
- [ ] `chatStore.ts` - gerenciamento de mensagens
- [ ] `graphStore.ts` - manipulação do graph
- [ ] `specsStore.ts` - parsing de specs
- [ ] `terminalStore.ts` - estado do terminal
- [ ] `gitStore.ts` - operações git

#### Utils
- [ ] `specsParser.ts` - parsing de markdown
- [ ] Path utilities
- [ ] Validation helpers

### 2. Component Tests (React Testing Library)
**Cobertura alvo**: 70%

#### Críticos
- [ ] `ChatPanel` - envio de mensagens, streaming
- [ ] `FileExplorer` - navegação, context menu
- [ ] `EditorPanel` - abertura de arquivos, save
- [ ] `GraphPanel` - renderização de nós
- [ ] `KanbanBoard` - drag & drop, status
- [ ] `SpecsPanel` - listagem, criação

#### Modais
- [ ] `QuickOpen` - busca, seleção
- [ ] `GlobalSearch` - resultados, navegação
- [ ] `CommandPalette` - execução de comandos

### 3. Integration Tests
**Cobertura alvo**: 60%

#### API Routes
- [ ] `/api/chat` - streaming, erros
- [ ] `/api/files` - CRUD completo
- [ ] `/api/git` - operações git
- [ ] `/api/specs` - parsing, listagem
- [ ] `/api/search` - busca global
- [ ] `/api/health` - status check

### 4. E2E Tests (Playwright)
**Cobertura alvo**: Fluxos críticos

#### Fluxos Críticos
- [ ] Abrir projeto e navegar arquivos
- [ ] Editar arquivo e salvar
- [ ] Conversar com agente (mock)
- [ ] Criar nova spec via workflow
- [ ] Busca global e navegação
- [ ] Git commit flow

---

## Setup Técnico

### Dependências

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "playwright": "^1.48.0",
    "@playwright/test": "^1.48.0",
    "msw": "^2.0.0"
  }
}
```

### Estrutura de Pastas

```
web/
├── __tests__/
│   ├── unit/
│   │   ├── stores/
│   │   └── utils/
│   ├── components/
│   │   ├── chat/
│   │   ├── editor/
│   │   ├── explorer/
│   │   └── graph/
│   └── integration/
│       └── api/
├── e2e/
│   ├── fixtures/
│   ├── pages/
│   └── specs/
├── vitest.config.ts
└── playwright.config.ts
```

### Configuração Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', '.next', 'e2e']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
```

### Configuração Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## Critérios de Aceitação

- [ ] Setup de Vitest funcionando
- [ ] Setup de Playwright funcionando
- [ ] CI pipeline configurado (GitHub Actions)
- [ ] Cobertura mínima de 70% em código crítico
- [ ] Todos os testes E2E passando
- [ ] Tempo de execução < 5min (unit + integration)
- [ ] Tempo de execução < 10min (e2e)

---

## Mocks Necessários

### Claude CLI
```typescript
// Mock para chat API
const mockClaudeResponse = {
  stream: async function* () {
    yield { type: 'text', content: 'Hello from mock!' }
    yield { type: 'done' }
  }
}
```

### File System
```typescript
// Mock para operações de arquivo
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn()
}))
```

### MSW para API Routes
```typescript
// Mock de API routes
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/files', () => {
    return HttpResponse.json({ files: [] })
  }),
  http.post('/api/chat', () => {
    return new Response(/* streaming mock */)
  })
]
```

---

## Scripts NPM

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "vitest run && playwright test"
  }
}
```

---

## Priorização

### Sprint 1: Foundation
1. Setup Vitest + React Testing Library
2. Testes para stores críticas (fileStore, chatStore)
3. Testes para specsParser

### Sprint 2: Components
1. Testes para ChatPanel
2. Testes para FileExplorer
3. Testes para modais

### Sprint 3: Integration + E2E
1. Setup Playwright
2. Testes de API routes
3. E2E para fluxos críticos

---

## Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| Unit test coverage | > 80% |
| Component test coverage | > 70% |
| E2E fluxos cobertos | 100% críticos |
| Tempo CI total | < 15min |
| Flaky tests | 0 |

---

*Criado por @strategist*
*Data: 2025-12-22*
*Próximo: @guardian para validação e implementação*
