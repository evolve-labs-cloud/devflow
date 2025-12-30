# PRD: Settings Panel

**Prioridade:** P0 (Alta) | **Complexidade:** 11 pontos | **Tokens:** 0

## 1. Problema

Usuarios nao conseguem personalizar o DevFlow. Configuracoes estao hardcoded ou se perdem ao recarregar.

## 2. User Stories

| ID | Story | Pontos |
|----|-------|--------|
| US-030 | Abrir Settings Panel (botao, Cmd+,) | 2 |
| US-031 | Configuracoes do Editor (font, tab, wrap, minimap) | 2 |
| US-032 | Configuracoes do Terminal (font size) | 1 |
| US-033 | Configuracoes do Chat/AI (modelo, agente padrao) | 2 |
| US-034 | Configuracoes Gerais (theme, auto-save) | 1 |
| US-035 | Persistencia em localStorage | 1 |
| US-036 | Keyboard Shortcuts View | 2 |
| **TOTAL** | | **11** |

## 3. Layout

```
+--------------------------------------------------+
|  Settings                                   [X]  |
+--------------------------------------------------+
|  [Search settings...]                            |
+--------------------------------------------------+
|                |                                 |
|  > General     |  Theme                          |
|  > Editor      |  [*] Dark                       |
|  > Terminal    |  [ ] Light (coming soon)        |
|  > Chat/AI     |                                 |
|  > Keyboard    |  Font Size: [14] px             |
|                |                                 |
|                |  Auto Save: [x] Enabled         |
|                |                                 |
+----------------+---------------------------------+
|  [Reset to Defaults]                             |
+--------------------------------------------------+
```

## 4. Arquivos a Criar

```
lib/stores/settingsStore.ts        # Zustand + persist
components/settings/
  SettingsPanel.tsx                # Modal principal
  SettingItem.tsx                  # Componente reutilizavel
```

## 5. Schema do Settings Store

```typescript
// lib/stores/settingsStore.ts

interface SettingsState {
  // Editor
  editorFontSize: number;      // 10-24, default: 14
  editorTabSize: 2 | 4 | 8;    // default: 2
  editorWordWrap: boolean;     // default: true
  editorMinimap: boolean;      // default: true

  // Terminal
  terminalFontSize: number;    // 10-20, default: 14

  // Chat
  chatDefaultModel: 'sonnet' | 'opus' | 'auto';  // default: 'sonnet'
  chatDefaultAgent: string | null;                // default: null

  // General
  autoSave: boolean;           // default: true
  autoSaveDelay: number;       // 500-5000, default: 1000

  // Actions
  setSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS = {
  editorFontSize: 14,
  editorTabSize: 2,
  editorWordWrap: true,
  editorMinimap: true,
  terminalFontSize: 14,
  chatDefaultModel: 'sonnet',
  chatDefaultAgent: null,
  autoSave: true,
  autoSaveDelay: 1000,
};
```

## 6. Integracao com Monaco

```typescript
// MonacoEditor.tsx - apenas adicionar:

import { useSettingsStore } from '@/lib/stores/settingsStore';

const MonacoEditor = () => {
  const {
    editorFontSize,
    editorTabSize,
    editorWordWrap,
    editorMinimap
  } = useSettingsStore();

  const options: editor.IEditorOptions = {
    fontSize: editorFontSize,
    tabSize: editorTabSize,
    wordWrap: editorWordWrap ? 'on' : 'off',
    minimap: { enabled: editorMinimap },
  };
};
```

## 7. Keyboard Shortcut

- **Cmd+,** (Mac) / **Ctrl+,** (Windows): Abrir Settings

## 8. Proximos Passos

1. [x] PRD aprovado
2. [x] Arquitetura validada (@architect)
3. [x] @builder implementar:
   - [x] settingsStore.ts
   - [x] SettingsPanel.tsx + SettingItem.tsx
   - [x] Integracao Monaco
   - [x] Integracao Terminal
   - [x] Integracao Chat
   - [x] Keyboard shortcut (Cmd+,)

---

*Criado por @strategist | Revisado por @architect*
