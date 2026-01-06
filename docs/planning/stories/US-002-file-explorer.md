# US-002: Navegar pela Estrutura de Arquivos

**Epic**: Setup & Navegação
**Prioridade**: P0 (Blocker)
**Complexidade**: 5 pontos
**Status**: Implemented

---

## User Story

**Como** desenvolvedor
**Quero** navegar pela estrutura de arquivos do projeto
**Para** encontrar e acessar specs, stories e ADRs rapidamente

---

## Acceptance Criteria

### AC1: Árvore de Arquivos
```gherkin
Given que tenho um projeto aberto
When olho para o painel esquerdo
Then vejo uma árvore de arquivos expandível
And a raiz mostra o nome do projeto
```

### AC2: Estrutura Focada
```gherkin
Given que vejo a árvore de arquivos
When expando as pastas
Then vejo em destaque:
  | Pasta           | Descrição              |
  | .devflow/       | Configuração dos agentes |
  | docs/           | Documentação           |
  | docs/planning/  | Specs e Stories        |
  | docs/decisions/ | ADRs                   |
```

### AC3: Ícones por Tipo
```gherkin
Given que vejo arquivos na árvore
Then cada tipo tem ícone específico:
  | Extensão/Pasta | Ícone           |
  | .md            | Documento       |
  | .yaml/.yml     | Engrenagem      |
  | .json          | Chaves {}       |
  | stories/       | Lista de tarefas |
  | decisions/     | Balança         |
  | agents/        | Robô            |
```

### AC4: Abrir Arquivo
```gherkin
Given que vejo um arquivo na árvore
When clico no arquivo
Then o arquivo abre no editor principal
And o arquivo fica marcado como "ativo" na árvore
```

### AC5: Expandir/Colapsar
```gherkin
Given que vejo uma pasta na árvore
When clico no ícone de seta
Then a pasta expande mostrando conteúdo
When clico novamente
Then a pasta colapsa
```

### AC6: Context Menu
```gherkin
Given que vejo um arquivo/pasta na árvore
When clico com botão direito
Then vejo menu com opções:
  | Arquivo        | Pasta               |
  | Rename         | New File            |
  | Delete         | New Folder          |
  | Copy Path      | Rename              |
  | Reveal in Finder | Delete            |
```

---

## Technical Notes

```typescript
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileNode[];
  icon: string;
  isExpanded?: boolean;
}

interface FileExplorerState {
  root: FileNode;
  selectedPath: string | null;
  expandedPaths: Set<string>;
}

// API Route
// GET /api/files/tree?path=/project/root
// Response: FileNode (árvore completa ou lazy-loaded)
```

**Performance**:
- Lazy loading para pastas grandes
- Virtualização se > 1000 arquivos visíveis
- Cache de estrutura com invalidação por file watcher

**Bibliotecas Sugeridas**:
- `react-arborist` - Árvore virtualizada
- `chokidar` - File watching no backend

---

## UI/UX Notes

```
┌──────────────────┬─────────────────────────────┐
│ EXPLORER         │                             │
├──────────────────┤                             │
│ ▼ my-project     │                             │
│   ▼ .devflow     │                             │
│     ▼ agents     │         Editor Area         │
│       🤖 strategist.md                         │
│       🤖 builder.md                            │
│     📄 project.yaml                            │
│   ▼ docs         │                             │
│     ▼ planning   │                             │
│       ▼ stories  │                             │
│         📋 US-001.md ← selected                │
│         📋 US-002.md                           │
│     ▼ decisions  │                             │
│       ⚖️ 001-arch.md                           │
│   📄 README.md   │                             │
└──────────────────┴─────────────────────────────┘
```

**Shortcuts**:
- `Cmd/Ctrl + B` - Toggle explorer visibility
- `Cmd/Ctrl + P` - Quick open (fuzzy finder)
- Arrow keys - Navegar árvore
- Enter - Abrir arquivo selecionado

---

## Definition of Done

- [x] Árvore renderiza estrutura do projeto
- [x] Ícones corretos por tipo de arquivo
- [x] Click abre arquivo no editor
- [x] Context menu funcional
- [x] Expand/collapse funciona
- [x] Performance OK com 500+ arquivos
- [x] Testes unitários
- [x] Code review aprovado

---

## Dependencies

- US-001 (projeto precisa estar aberto)

---

*Story criada por @strategist*
