# US-001: Abrir Projeto DevFlow

**Epic**: Setup & Navegação
**Prioridade**: P0 (Blocker)
**Complexidade**: 3 pontos
**Status**: Implemented

---

## User Story

**Como** desenvolvedor
**Quero** abrir um projeto DevFlow existente na IDE
**Para** começar a trabalhar sem configuração manual

---

## Acceptance Criteria

### AC1: Seleção de Pasta
```gherkin
Given que estou na tela inicial da IDE
When clico em "Open Project"
Then um file picker nativo abre
And posso selecionar uma pasta do sistema
```

### AC2: Validação de Projeto DevFlow
```gherkin
Given que selecionei uma pasta
When a pasta contém .devflow/ ou .claude_project
Then o projeto é carregado com sucesso
And vejo a estrutura de arquivos no explorer
```

### AC3: Feedback de Erro
```gherkin
Given que selecionei uma pasta
When a pasta NÃO contém .devflow/ ou .claude_project
Then vejo mensagem: "Pasta não é um projeto DevFlow válido"
And tenho opção de "Inicializar DevFlow" ou "Escolher outra pasta"
```

### AC4: Projeto Recente
```gherkin
Given que abri um projeto anteriormente
When volto à tela inicial
Then vejo lista de "Projetos Recentes"
And posso clicar para abrir diretamente
```

### AC5: Health Check
```gherkin
Given que o projeto foi carregado
When o carregamento termina
Then executo verificação do Claude CLI
And mostro status: "Claude CLI: Conectado" ou "Claude CLI: Não encontrado"
```

---

## Technical Notes

```typescript
// Estrutura esperada de validação
interface ProjectValidation {
  isValid: boolean;
  hasDevflow: boolean;      // .devflow/ existe
  hasClaudeProject: boolean; // .claude_project existe
  claudeCliAvailable: boolean;
  claudeCliAuthenticated: boolean;
  errors: string[];
}

// API Route sugerida
// POST /api/project/open
// Body: { path: string }
// Response: ProjectValidation & { projectMeta?: ProjectMeta }
```

**Dependências**:
- Electron/Tauri para file picker nativo OU
- Input de path manual para versão web pura

**Considerações de Segurança**:
- Validar path para prevenir traversal
- Whitelist de operações permitidas
- Não expor paths absolutos no frontend

---

## UI/UX Notes

```
┌─────────────────────────────────────────────┐
│           DevFlow IDE                       │
├─────────────────────────────────────────────┤
│                                             │
│         [Logo DevFlow]                      │
│                                             │
│    ┌─────────────────────────┐              │
│    │    Open Project         │              │
│    └─────────────────────────┘              │
│                                             │
│    Recent Projects:                         │
│    ├── ~/projects/my-app                    │
│    ├── ~/projects/api-service               │
│    └── ~/projects/dashboard                 │
│                                             │
│    [New Project]  [Documentation]           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Definition of Done

- [x] Código implementado e funcionando
- [x] Validação de projeto DevFlow funciona
- [x] Health check do Claude CLI funciona
- [x] Projetos recentes persistem entre sessões
- [x] Testes unitários para validação
- [x] Teste e2e do fluxo completo
- [x] Code review aprovado

---

## Dependencies

- Nenhuma (primeira story a ser implementada)

---

*Story criada por @strategist*
