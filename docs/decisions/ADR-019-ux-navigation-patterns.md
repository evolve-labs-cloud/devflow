# ADR-019: Padroes de Navegacao e Acessibilidade

**Status**: Accepted
**Date**: 2025-12-26
**Deciders**: @architect
**Story**: US-019

---

## Context

US-019 requer melhorias de UX incluindo:
- Navegacao por tabs (history, pinned, recent)
- Breadcrumbs
- Acessibilidade (focus trap, keyboard nav, ARIA)

Precisamos definir padroes consistentes.

---

## Decision

### 1. Tab History: Duas Listas Separadas

**Escolha**: `tabHistory[]` (session) + `recentFiles[]` (persistido)

```typescript
// Session only - para Alt+Left/Right
tabHistory: string[];
historyIndex: number;

// Persistido - para Ctrl+Tab
recentFiles: string[]; // max 20
```

### 2. Focus Management: Hook Customizado

**Escolha**: `useFocusTrap` hook interno

```typescript
// ~40 linhas, zero dependencias
function useFocusTrap(ref, isActive) {
  // Tab cycling + focus restoration
}
```

**Rejeitado**: focus-trap-react (dependencia extra desnecessaria)

### 3. Keyboard Navigation: Composite Pattern

**Escolha**: Hook `useListNavigation` reutilizavel

```typescript
function useListNavigation({
  items,
  onSelect,
  orientation: 'vertical' | 'horizontal'
}) {
  // Arrow keys, Enter, Escape, Home, End
}
```

### 4. ARIA Strategy: Semantic First

**Escolha**: HTML semantico > ARIA attributes

| Preferir | Ao inves de |
|----------|-------------|
| `<button>` | `<div role="button">` |
| `<nav>` | `<div role="navigation">` |
| `<ul>/<li>` | `<div role="list">` |

ARIA apenas onde HTML nao cobre.

### 5. Persistencia: Zustand Persist

**Escolha**: Usar `persist` middleware existente no uiStore

```typescript
persist(
  (set, get) => ({
    pinnedFiles: [],
    recentFiles: [],
  }),
  { name: 'devflow-ui-store' }
)
```

---

## Alternatives Considered

### Focus Trap: Biblioteca Externa
- **focus-trap-react**: +15KB, overkill
- **@radix-ui/react-focus-scope**: Ja temos patterns similares
- **Custom hook**: Simples, zero deps, controle total -> ESCOLHIDO

### State: Separate Store vs Extend fileStore
- **Novo navigationStore**: Fragmenta estado relacionado
- **Estender fileStore**: Mantem coesao de "arquivos" -> ESCOLHIDO

---

## Consequences

### Positive
- Zero novas dependencias
- Padroes consistentes em todos modais
- Codigo auditavel para acessibilidade
- Reutilizacao de hooks em novos componentes

### Negative
- Mais codigo interno para manter
- Precisa testar manualmente acessibilidade

### Risks
- Monaco Editor pode conflitar com shortcuts
  - Mitigacao: Testar combinacoes, ajustar keybindings
- WCAG contraste pode exigir mudanca visual
  - Mitigacao: Usar ferramenta axe-core antes

---

## Implementation Status

### Arquivos Criados - DONE

| Arquivo | Linhas | Status |
|---------|--------|--------|
| hooks/useFocusTrap.ts | 142 | Done |
| hooks/useListNavigation.ts | 238 | Done |
| components/editor/Breadcrumbs.tsx | 135 | Done |
| components/editor/TabContextMenu.tsx | - | Done |
| components/modals/RecentFiles.tsx | - | Done |

### Arquivos Modificados - DONE

| Arquivo | Mudanca | Status |
|---------|---------|--------|
| lib/stores/fileStore.ts | +pinnedFiles, +tabHistory, +recentFiles, +closedTabs | Done |
| hooks/useKeyboardShortcuts.ts | +Alt+Left/Right, +Ctrl+Tab, +Ctrl+Shift+T | Done |
| components/editor/EditorTabs.tsx | Context menu integration | Done |

---

## Proximos Passos (Atualizado 2025-12-26)

### Pendente - @builder
1. Adicionar botoes back/forward no EditorTabs (UI para tab history)
2. Criar hook useTreeNavigation (extensao de useListNavigation para arvores)
3. Integrar useTreeNavigation no FileTree.tsx
4. Aplicar useListNavigation no SpecsPanel (RequirementsView, DesignView, TasksView)
5. Adicionar ARIA labels faltantes em botoes de acao

### Pendente - @guardian
1. Rodar axe-core audit de acessibilidade
2. Testar navegacao keyboard end-to-end
3. Validar contraste WCAG AA

### Pendente - @chronicler
1. Documentar atalhos de teclado no CHANGELOG
2. Criar guia de acessibilidade

---

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WAI-ARIA TreeView Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
- [VSCode Keyboard Shortcuts](https://code.visualstudio.com/docs/getstarted/keybindings)
