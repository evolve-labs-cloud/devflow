# US-004: Editor com Syntax Highlighting

**Epic**: Editor
**Prioridade**: P0 (Blocker)
**Complexidade**: 5 pontos
**Status**: Implemented

---

## User Story

**Como** desenvolvedor
**Quero** editar arquivos Markdown com syntax highlighting
**Para** ter melhor legibilidade e produtividade ao escrever specs

---

## Acceptance Criteria

### AC1: Abrir Arquivo no Editor
```gherkin
Given que cliquei em um arquivo .md no explorer
When o arquivo abre
Then vejo o conteúdo no painel do editor
And o nome do arquivo aparece em uma tab
```

### AC2: Syntax Highlighting Markdown
```gherkin
Given que tenho arquivo .md aberto
Then vejo highlighting para:
  | Elemento        | Estilo           |
  | # Headers       | Bold, cor destaque |
  | **bold**        | Bold             |
  | *italic*        | Itálico          |
  | `code`          | Background, mono |
  | ```code block   | Background, mono |
  | - lists         | Cor de lista     |
  | [links](url)    | Cor de link      |
  | > quotes        | Borda esquerda   |
```

### AC3: Syntax Highlighting YAML
```gherkin
Given que tenho arquivo .yaml aberto
Then vejo highlighting para:
  | Elemento        | Estilo           |
  | keys:           | Cor de chave     |
  | "strings"       | Cor de string    |
  | 123 (numbers)   | Cor de número    |
  | true/false      | Cor de boolean   |
  | # comments      | Cor de comentário |
```

### AC4: Múltiplas Tabs
```gherkin
Given que tenho um arquivo aberto
When clico em outro arquivo no explorer
Then novo arquivo abre em nova tab
And posso alternar entre tabs
And posso fechar tabs individualmente
```

### AC5: Indicador de Modificação
```gherkin
Given que tenho arquivo aberto
When modifico o conteúdo
Then a tab mostra indicador (•) de não salvo
When salvo o arquivo (Cmd+S)
Then o indicador desaparece
```

### AC6: Edição de Texto
```gherkin
Given que tenho arquivo aberto
When digito no editor
Then o texto é inserido na posição do cursor
And posso usar:
  | Ação            | Shortcut         |
  | Undo            | Cmd+Z            |
  | Redo            | Cmd+Shift+Z      |
  | Cut             | Cmd+X            |
  | Copy            | Cmd+C            |
  | Paste           | Cmd+V            |
  | Select All      | Cmd+A            |
  | Find            | Cmd+F            |
  | Replace         | Cmd+H            |
```

---

## Technical Notes

```typescript
// Componente principal
interface EditorProps {
  filePath: string;
  content: string;
  language: 'markdown' | 'yaml' | 'json';
  onChange: (content: string) => void;
  onSave: () => void;
}

// Estado de tabs
interface TabState {
  path: string;
  name: string;
  content: string;
  originalContent: string; // para detectar mudanças
  isDirty: boolean;
  language: string;
}

// API Routes
// GET /api/files/read?path=...
// POST /api/files/write { path, content }
```

**Monaco Editor Config**:
```typescript
const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  theme: 'vs-dark', // ou 'vs' para light
  language: 'markdown',
  wordWrap: 'on',
  minimap: { enabled: false },
  lineNumbers: 'on',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, monospace',
  automaticLayout: true,
  scrollBeyondLastLine: false,
};
```

**Bibliotecas**:
- `@monaco-editor/react` - Monaco para React
- Alternativa: `@uiw/react-codemirror` (mais leve)

---

## UI/UX Notes

```
┌─────────────────────────────────────────────────────────────┐
│ [US-001.md •] [US-002.md] [project.yaml]              [x]  │
├─────────────────────────────────────────────────────────────┤
│  1 │ # US-001: Abrir Projeto DevFlow                       │
│  2 │                                                        │
│  3 │ **Epic**: Setup & Navegação                           │
│  4 │ **Prioridade**: P0 (Blocker)                          │
│  5 │                                                        │
│  6 │ ## User Story                                          │
│  7 │                                                        │
│  8 │ **Como** desenvolvedor                                 │
│  9 │ **Quero** abrir um projeto DevFlow                    │
│ 10 │ **Para** começar a trabalhar                          │
│    │                                                        │
│    │ ▌  ← cursor                                           │
│    │                                                        │
└─────────────────────────────────────────────────────────────┘
│ Ln 10, Col 1 │ Markdown │ UTF-8 │ LF │                     │
└─────────────────────────────────────────────────────────────┘
```

**Status Bar** mostra:
- Linha e coluna atual
- Linguagem detectada
- Encoding
- Line ending (LF/CRLF)

---

## Definition of Done

- [x] Monaco Editor integrado e funcionando
- [x] Syntax highlighting para MD, YAML, JSON
- [x] Sistema de tabs funcional
- [x] Indicador de arquivo modificado
- [x] Salvar arquivo funciona (Cmd+S)
- [x] Shortcuts básicos funcionando
- [x] Testes de integração
- [x] Code review aprovado

---

## Dependencies

- US-001 (projeto aberto)
- US-002 (file explorer para selecionar arquivo)

---

*Story criada por @strategist*
