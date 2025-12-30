import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

/**
 * Settings Store - Gerencia todas as configurações do DevFlow IDE
 * Persistido em localStorage para manter preferências entre sessões
 */

export type TabSize = 2 | 4 | 8;
export type ChatModel = 'sonnet' | 'opus' | 'auto';
export type PermissionMode = 'default' | 'acceptEdits' | 'bypassPermissions';

interface SettingsState {
  // Editor Settings
  editorFontSize: number;
  editorTabSize: TabSize;
  editorWordWrap: boolean;
  editorMinimap: boolean;
  editorLineNumbers: boolean;

  // Terminal Settings
  terminalFontSize: number;

  // Chat Settings
  chatDefaultModel: ChatModel;
  chatDefaultAgent: string | null;
  chatPermissionMode: PermissionMode;

  // General Settings
  autoSave: boolean;
  autoSaveDelay: number;

  // Settings Panel State
  isSettingsOpen: boolean;
  activeSettingsTab: 'general' | 'editor' | 'terminal' | 'chat' | 'keyboard';

  // Actions
  setSetting: <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => void;
  resetToDefaults: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setActiveSettingsTab: (tab: SettingsState['activeSettingsTab']) => void;
}

// Type helper for settings values only (excludes actions and UI state)
type SettingsValues = Omit<SettingsState,
  'setSetting' | 'resetToDefaults' | 'openSettings' | 'closeSettings' |
  'setActiveSettingsTab' | 'isSettingsOpen' | 'activeSettingsTab'
>;

const DEFAULT_SETTINGS: SettingsValues = {
  // Editor
  editorFontSize: 14,
  editorTabSize: 2,
  editorWordWrap: true,
  editorMinimap: false,
  editorLineNumbers: true,

  // Terminal
  terminalFontSize: 13,

  // Chat
  chatDefaultModel: 'sonnet',
  chatDefaultAgent: null,
  chatPermissionMode: 'acceptEdits',

  // General
  autoSave: true,
  autoSaveDelay: 1000,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      // UI State (não persistido)
      isSettingsOpen: false,
      activeSettingsTab: 'general',

      setSetting: (key, value) => {
        set({ [key]: value } as Partial<SettingsState>);
      },

      resetToDefaults: () => {
        set(DEFAULT_SETTINGS);
        toast.success('Settings reset', {
          description: 'All settings restored to defaults',
        });
      },

      openSettings: () => {
        set({ isSettingsOpen: true });
      },

      closeSettings: () => {
        set({ isSettingsOpen: false });
      },

      setActiveSettingsTab: (tab) => {
        set({ activeSettingsTab: tab });
      },
    }),
    {
      name: 'devflow-settings',
      // Não persistir estado da UI
      partialize: (state) => ({
        editorFontSize: state.editorFontSize,
        editorTabSize: state.editorTabSize,
        editorWordWrap: state.editorWordWrap,
        editorMinimap: state.editorMinimap,
        editorLineNumbers: state.editorLineNumbers,
        terminalFontSize: state.terminalFontSize,
        chatDefaultModel: state.chatDefaultModel,
        chatDefaultAgent: state.chatDefaultAgent,
        chatPermissionMode: state.chatPermissionMode,
        autoSave: state.autoSave,
        autoSaveDelay: state.autoSaveDelay,
      }),
    }
  )
);

// Export default settings for reference
export { DEFAULT_SETTINGS };
