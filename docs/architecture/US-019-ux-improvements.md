# Arquitetura: US-019 Melhorias de UX

**Status**: Completed
**Date**: 2025-12-26
**Architect**: @architect
**Stories**: US-019A (Navegacao), US-019B (Acessibilidade)
**Progress**: 100% completo

---

## 0. Status Atual

### Implementado (100%)
| Feature | Status | Componente |
|---------|--------|------------|
| Toast notifications | Done | Toaster.tsx + sonner |
| Skeleton loaders | Done | Skeleton.tsx |
| Loading spinners | Done | LoadingSpinner.tsx |
| Saving indicator | Done | EditorTabs.tsx |
| Hover/Active states | Done | Tailwind classes |
| Breadcrumbs | Done | Breadcrumbs.tsx |
| Tab history (store) | Done | fileStore.ts |
| Recent files modal | Done | RecentFiles.tsx |
| Pinned tabs | Done | fileStore.ts + EditorTabs.tsx |
| Focus trap hook | Done | useFocusTrap.ts |
| List navigation hook | Done | useListNavigation.ts |
| Skip links | Done | SkipLinks.tsx |
| Back/Forward buttons | Done | EditorTabs.tsx |
| FileExplorer keyboard nav | Done | useTreeNavigation.ts + FileTree.tsx |
| SpecsPanel keyboard nav | Done | SpecsPanel.tsx |
| ARIA labels completos | Done | Todos os componentes |
| Tree navigation hook | Done | useTreeNavigation.ts |

### Pendente
| Feature | Status | Responsavel |
|---------|--------|-------------|
| WCAG AA contraste audit | Pendente | @guardian |

**Nota**: Audit de contraste WCAG AA sera feito por @guardian como parte de QA

---

## 1. Visao Geral

### Escopo
- **US-019A**: Navegacao avancada (breadcrumbs, tab history, pinned tabs)
- **US-019B**: Acessibilidade (focus trap, keyboard nav, ARIA)

### Stack Atual (Mantida)
- React 18 + Next.js
- Zustand (state management)
- Tailwind CSS
- sonner (toasts)
- lucide-react (icones)

---

## 2. US-019A: Navegacao Avancada

### 2.1 Arquitetura de Estado

```
fileStore.ts (MODIFICAR)
├── openFiles: OpenFile[]
├── activeFile: string | null
├── pinnedFiles: Set<string>          ← NOVO
├── tabHistory: string[]              ← NOVO
├── historyIndex: number              ← NOVO
└── recentFiles: string[]             ← NOVO (max 20)
```

#### Interface OpenFile (Estender)
```typescript
// lib/types.ts - MODIFICAR
interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  language: string;
  isPinned?: boolean;     // NOVO
  openedAt?: number;      // NOVO - timestamp para ordenacao
}
```

### 2.2 Novos Componentes

```
components/
├── editor/
│   ├── EditorTabs.tsx       ← MODIFICAR (context menu, pinned)
│   ├── Breadcrumbs.tsx      ← NOVO
│   └── TabContextMenu.tsx   ← NOVO
└── modals/
    └── RecentFiles.tsx      ← NOVO (Ctrl+Tab)
```

#### Breadcrumbs.tsx
```typescript
// Exemplo de estrutura
interface BreadcrumbsProps {
  path: string;  // "/src/components/editor/EditorTabs.tsx"
}

// Renderiza: src > components > editor > EditorTabs.tsx
// Click em segmento: navega para pasta no FileExplorer
```

#### TabContextMenu.tsx
```typescript
interface TabContextMenuProps {
  path: string;
  position: { x: number; y: number };
  onClose: () => void;
}

// Opcoes:
// - Close
// - Close Others
// - Close All
// - Close to the Right
// - Pin/Unpin Tab
// - Copy Path
// - Reveal in Explorer
```

### 2.3 Novas Acoes no Store

```typescript
// fileStore.ts - NOVAS ACOES
interface FileState {
  // ... existentes ...

  // Tab History
  navigateBack: () => void;
  navigateForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;

  // Pinned
  togglePinned: (path: string) => void;
  isPinned: (path: string) => boolean;

  // Recent Files
  addToRecent: (path: string) => void;
  getRecentFiles: () => string[];

  // Tab Management
  closeOtherTabs: (exceptPath: string) => void;
  closeTabsToRight: (path: string) => void;
  closeAllTabs: () => void;
  reorderTab: (fromIndex: number, toIndex: number) => void;
}
```

### 2.4 Persistencia (localStorage)

```typescript
// uiStore.ts - ADICIONAR ao persist
{
  pinnedFiles: string[];      // Paths dos arquivos fixados
  recentFiles: string[];      // Ultimos 20 arquivos
}
```

### 2.5 Keyboard Shortcuts (Adicionar)

```typescript
// useKeyboardShortcuts.ts - ADICIONAR
| Shortcut        | Acao                  |
|-----------------|----------------------|
| Ctrl+Tab        | Abrir Recent Files   |
| Ctrl+Shift+Tab  | Tab anterior         |
| Alt+Left        | Navegar back         |
| Alt+Right       | Navegar forward      |
| Ctrl+W          | Fechar tab atual     |
| Ctrl+Shift+T    | Reabrir ultima tab   |
```

---

## 3. US-019B: Acessibilidade

### 3.1 Focus Management

```typescript
// hooks/useFocusTrap.ts - NOVO
function useFocusTrap(ref: RefObject<HTMLElement>, isActive: boolean) {
  // Captura foco dentro do elemento
  // Cicla Tab/Shift+Tab dentro do container
  // Restaura foco ao elemento anterior ao fechar
}
```

#### Aplicar em:
- CommandPalette
- QuickOpen
- GlobalSearch
- SettingsPanel
- AutopilotConfigModal
- FileContextMenu

### 3.2 Keyboard Navigation

```typescript
// hooks/useListNavigation.ts - NOVO
function useListNavigation(options: {
  items: any[];
  onSelect: (item: any) => void;
  onEscape?: () => void;
}) {
  // Arrow Up/Down: mover selecao
  // Enter: selecionar item
  // Escape: fechar/cancelar
  // Home/End: primeiro/ultimo item
}
```

#### Aplicar em:
- FileExplorer (tree navigation)
- SpecsPanel (lista de specs)
- Resultados de busca

### 3.3 ARIA Labels

```typescript
// Padrao para todos componentes interativos:
<button
  aria-label="Close file"
  aria-describedby="file-path"
  aria-pressed={isPinned}    // para toggles
/>

<div
  role="tree"                 // FileExplorer
  aria-label="File explorer"
/>

<div
  role="listbox"              // Dropdowns
  aria-activedescendant={selectedId}
/>
```

### 3.4 Live Regions para Toasts

```typescript
// Toaster.tsx - MODIFICAR
<SonnerToaster
  // ... existentes ...
  toastOptions={{
    role: 'alert',           // ARIA live region
    'aria-live': 'polite',
  }}
/>
```

### 3.5 Skip Links

```typescript
// Shell.tsx - ADICIONAR
<a
  href="#main-editor"
  className="sr-only focus:not-sr-only"
>
  Skip to editor
</a>
```

---

## 4. Componentes Novos/Modificados

### Resumo

| Componente | Tipo | Descricao |
|-----------|------|-----------|
| Breadcrumbs.tsx | NOVO | Navegacao por path |
| TabContextMenu.tsx | NOVO | Menu de contexto para tabs |
| RecentFiles.tsx | NOVO | Modal Ctrl+Tab |
| useFocusTrap.ts | NOVO | Hook focus management |
| useListNavigation.ts | NOVO | Hook keyboard nav listas |
| EditorTabs.tsx | MODIFICAR | Adicionar pinned, context menu |
| fileStore.ts | MODIFICAR | Adicionar history, pinned, recent |
| uiStore.ts | MODIFICAR | Persist pinned/recent |
| useKeyboardShortcuts.ts | MODIFICAR | Novos atalhos |
| Toaster.tsx | MODIFICAR | ARIA live regions |
| Shell.tsx | MODIFICAR | Skip links |

---

## 5. Diagrama de Estado

```
                    ┌─────────────────┐
                    │   fileStore     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   openFiles[]   │ │  tabHistory[]   │ │  recentFiles[]  │
│   (com pinned)  │ │  historyIndex   │ │   (max 20)      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                      EditorTabs                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │ Pin  │ │ Tab1 │ │ Tab2 │ │ Tab3 │ [+]               │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
│                                                         │
│  Breadcrumbs: src > components > editor > file.tsx      │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Fluxo: Tab History

```
Acao: Usuario abre arquivo
  │
  ├─► 1. addToRecent(path)
  │      - Adiciona ao recentFiles[]
  │      - Remove duplicatas
  │      - Limita a 20 itens
  │
  ├─► 2. pushToHistory(path)
  │      - Adiciona ao tabHistory[]
  │      - Atualiza historyIndex
  │      - Trunca history se navegou back
  │
  └─► 3. setActiveFile(path)

Acao: Usuario pressiona Alt+Left
  │
  └─► navigateBack()
        - historyIndex--
        - setActiveFile(tabHistory[historyIndex])
        - Nao modifica tabHistory[]
```

---

## 7. Fluxo: Focus Trap

```
Modal abre
  │
  ├─► 1. Salvar elemento focado atual
  │      previousFocus = document.activeElement
  │
  ├─► 2. Focar primeiro elemento focavel do modal
  │      modal.querySelector('[tabindex]:not([tabindex="-1"])')
  │
  ├─► 3. Event listener Tab/Shift+Tab
  │      - Se Tab no ultimo elemento → foca primeiro
  │      - Se Shift+Tab no primeiro → foca ultimo
  │
  └─► Modal fecha
        - Restaurar foco: previousFocus.focus()
```

---

## 8. Prioridade de Implementacao

### Sprint 1: Navegacao Core (US-019A)
1. Modificar fileStore (pinned, history, recent)
2. Implementar Breadcrumbs
3. Implementar TabContextMenu
4. Adicionar shortcuts (Ctrl+Tab, Alt+Left/Right)
5. Persistencia localStorage

### Sprint 2: Acessibilidade (US-019B)
1. useFocusTrap hook
2. useListNavigation hook
3. Aplicar focus trap em modais
4. Keyboard nav em FileExplorer
5. ARIA labels audit
6. Skip links

---

## 9. Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Monaco conflita com shortcuts | Alto | Verificar Monaco keybindings, usar when clause |
| Performance com history grande | Baixo | Limitar history a 50 itens |
| WCAG contraste | Medio | Testar com axe-core antes de mudar tema |

---

## 10. Decisoes Arquiteturais

### ADR-019-1: History vs Recent Files
**Decisao**: Manter duas listas separadas
- `tabHistory[]`: navegacao back/forward (session only)
- `recentFiles[]`: persistido, usado no Ctrl+Tab

**Rationale**: VSCode usa este padrao. History e para navegacao instantanea, recent e para acesso rapido.

### ADR-019-2: Focus Trap Implementation
**Decisao**: Hook customizado ao inves de biblioteca
**Rationale**:
- Evita dependencia extra
- Controle total sobre comportamento
- Codigo simples (~40 linhas)

### ADR-019-3: ARIA vs Semantic HTML
**Decisao**: Priorizar HTML semantico, ARIA como fallback
**Rationale**:
- `<button>` sobre `<div role="button">`
- `<nav>` para navegacao
- ARIA apenas onde necessario

---

## 11. Implementacao Pendente

### 11.1 Back/Forward Buttons (AC-NAV-3)

**Arquivo**: `components/editor/EditorTabs.tsx`

**Logica existente no fileStore**:
```typescript
navigateBack: () => void;
navigateForward: () => void;
canGoBack: () => boolean;
canGoForward: () => boolean;
```

**Componente a adicionar** (inline antes das tabs):
```tsx
<div className="flex items-center gap-1 px-2 border-r border-white/10">
  <button
    onClick={navigateBack}
    disabled={!canGoBack()}
    className={cn(
      'p-1 rounded hover:bg-white/10 transition-colors',
      canGoBack() ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'
    )}
    aria-label="Go back"
  >
    <ChevronLeft className="w-4 h-4" />
  </button>
  <button
    onClick={navigateForward}
    disabled={!canGoForward()}
    className={cn(
      'p-1 rounded hover:bg-white/10 transition-colors',
      canGoForward() ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'
    )}
    aria-label="Go forward"
  >
    <ChevronRight className="w-4 h-4" />
  </button>
</div>
```

---

### 11.2 FileExplorer Tree Navigation (AC-A11Y-3)

**Novo Hook**: `hooks/useTreeNavigation.ts`

**Estrutura**:
```typescript
interface UseTreeNavigationOptions<T> {
  nodes: T[];
  getChildren: (node: T) => T[] | undefined;
  isExpanded: (node: T) => boolean;
  getId: (node: T) => string;
  onSelect: (node: T) => void;
  onToggle: (node: T) => void;
}

export function useTreeNavigation<T>(options: UseTreeNavigationOptions<T>) {
  // 1. Flatten visible nodes (memoized)
  const flatNodes = useMemo(() => flattenTree(nodes, getChildren, isExpanded), [...]);

  // 2. Use base useListNavigation
  const listNav = useListNavigation({ items: flatNodes, onSelect });

  // 3. Extend with tree-specific keys
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      // If folder collapsed: expand
      // If folder expanded: go to first child
      // If file: no-op
    } else if (e.key === 'ArrowLeft') {
      // If folder expanded: collapse
      // If collapsed/file: go to parent
    } else {
      listNav.handleKeyDown(e);
    }
  };

  return { ...listNav, handleKeyDown };
}
```

**WAI-ARIA TreeView Keys**:
| Tecla | Acao |
|-------|------|
| ArrowDown | Proximo item visivel |
| ArrowUp | Item anterior visivel |
| ArrowRight | Expande ou vai para filho |
| ArrowLeft | Colapsa ou vai para pai |
| Home | Primeiro item |
| End | Ultimo item visivel |
| Enter/Space | Abre arquivo ou toggle folder |
| * | Expande todos siblings |

**Aplicar em FileTree.tsx**:
```tsx
<div
  role="tree"
  aria-label="File explorer"
  tabIndex={0}
  onKeyDown={handleKeyDown}
>
  {nodes.map((node, index) => (
    <TreeItem
      role="treeitem"
      aria-selected={isSelected(index)}
      aria-expanded={node.type === 'directory' ? isExpanded(node) : undefined}
      tabIndex={isSelected(index) ? 0 : -1}
    />
  ))}
</div>
```

---

### 11.3 SpecsPanel List Navigation (AC-A11Y-4)

**Reutilizar**: `useListNavigation` existente

**Aplicar em cada view** (RequirementsView, DesignView, TasksView):
```tsx
const { selectedIndex, handleKeyDown, isSelected } = useListNavigation({
  items: requirements, // ou decisions, tasks
  onSelect: (item) => handleOpenSpec(item),
  onEscape: () => document.activeElement?.blur(),
});

return (
  <div
    role="listbox"
    aria-label="Requirements"
    tabIndex={0}
    onKeyDown={handleKeyDown}
  >
    {items.map((item, index) => (
      <div
        role="option"
        aria-selected={isSelected(index)}
        tabIndex={isSelected(index) ? 0 : -1}
        className={cn(isSelected(index) && 'ring-2 ring-purple-500/50')}
      />
    ))}
  </div>
);
```

---

### 11.4 ARIA Labels Audit (AC-A11Y-5)

**Elementos a corrigir**:

| Componente | Elemento | ARIA Label |
|------------|----------|------------|
| SpecsPanel | Refresh button | "Refresh specs" |
| SpecsPanel | New button | "Create new spec" |
| FileExplorer | Folder chevron | (decorativo, aria-hidden) |
| ChatPanel | Send button | "Send message" |
| ChatPanel | Agent selector | "Select AI agent" |
| EditorTabs | Pin indicator | (decorativo, aria-hidden) |

**Padrao**:
```tsx
// Botao com apenas icone
<button aria-label="Refresh specs">
  <RefreshCw className="w-4 h-4" aria-hidden="true" />
</button>

// Icone decorativo
<ChevronRight className="w-4 h-4" aria-hidden="true" />
```

---

### 11.5 WCAG AA Contraste Audit (AC-A11Y-6)

**Ferramenta**: axe-core via Chrome DevTools

**Cores a validar**:
| Uso | Cor | Background | Ratio Min |
|-----|-----|------------|-----------|
| Texto normal | gray-400 | #0a0a0f | 4.5:1 |
| Texto desabilitado | gray-500 | #0a0a0f | 4.5:1 |
| Links | purple-400 | #0a0a0f | 4.5:1 |
| Placeholders | gray-500 | input bg | 4.5:1 |

**Comando para rodar axe-core**:
```bash
npx axe-core-cli http://localhost:3000/ide
```

---

## 12. Status Final

### Implementado por @builder (2025-12-26):
- [x] Adicionar botoes back/forward no EditorTabs
- [x] Criar hook useTreeNavigation
- [x] Integrar useTreeNavigation no FileTree
- [x] Aplicar useListNavigation no SpecsPanel
- [x] Adicionar ARIA labels faltantes

### Pendente para @guardian:
- [ ] Rodar axe-core audit
- [ ] Testar navegacao keyboard end-to-end
- [ ] Validar contraste WCAG AA

### Documentado por @chronicler (2025-12-26):
- [x] Atalhos de teclado no CHANGELOG
- [x] Story US-019 atualizada
- [x] Arquitetura atualizada

---

**US-019 COMPLETED**
