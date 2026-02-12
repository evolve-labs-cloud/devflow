import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModelId, AutopilotConfig } from '@/lib/types';

type Theme = 'light' | 'dark' | 'system';
type SidebarPanel = 'specs' | 'git' | 'dashboard';
type RightPanel = 'chat' | 'tasks';
type ModalType = 'quickOpen' | 'globalSearch' | 'commandPalette' | 'recentFiles' | null;

interface UIState {
  // State
  theme: Theme;
  sidebarVisible: boolean;
  sidebarWidth: number;
  chatPanelVisible: boolean;
  chatPanelWidth: number;
  activePanel: SidebarPanel;
  activeRightPanel: RightPanel;
  terminalVisible: boolean;
  terminalHeight: number;
  terminalMaximized: boolean;
  previewVisible: boolean;
  specsPanelVisible: boolean;
  specsPanelWidth: number;

  // Modal State
  activeModal: ModalType;

  // Model & Autopilot
  selectedModel: ModelId;
  autopilot: AutopilotConfig;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleChatPanel: () => void;
  setChatPanelWidth: (width: number) => void;
  setActivePanel: (panel: SidebarPanel) => void;
  setActiveRightPanel: (panel: RightPanel) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (height: number) => void;
  toggleTerminalMaximized: () => void;
  togglePreview: () => void;
  toggleSpecsPanel: () => void;
  setSpecsPanelWidth: (width: number) => void;
  setSelectedModel: (model: ModelId) => void;
  setAutopilot: (config: Partial<AutopilotConfig>) => void;
  toggleAutopilot: () => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarVisible: true,
      sidebarWidth: 280,
      chatPanelVisible: true,
      chatPanelWidth: 420,
      activePanel: 'specs',
      activeRightPanel: 'chat',
      terminalVisible: false,
      terminalHeight: 200,
      terminalMaximized: false,
      previewVisible: false,
      specsPanelVisible: true,
      specsPanelWidth: 300,

      // Modal state
      activeModal: null,

      // Default model and autopilot config
      selectedModel: 'claude-sonnet-4',
      autopilot: {
        enabled: false,
        maxIterations: 10,
        pauseOnError: true,
        requireApproval: 'files',
      },

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
              .matches
              ? 'dark'
              : 'light';
            document.documentElement.classList.add(systemTheme);
          } else {
            document.documentElement.classList.add(theme);
          }
        }
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarVisible: !state.sidebarVisible }));
      },

      setSidebarWidth: (width) => {
        set({ sidebarWidth: Math.max(200, Math.min(500, width)) });
      },

      toggleChatPanel: () => {
        set((state) => ({ chatPanelVisible: !state.chatPanelVisible }));
      },

      setChatPanelWidth: (width) => {
        set({ chatPanelWidth: Math.max(320, Math.min(600, width)) });
      },

      setActivePanel: (panel) => {
        set({ activePanel: panel });
      },

      setActiveRightPanel: (panel) => {
        set({ activeRightPanel: panel });
      },

      toggleTerminal: () => {
        set((state) => ({ terminalVisible: !state.terminalVisible }));
      },

      setTerminalHeight: (height) => {
        set({ terminalHeight: Math.max(150, Math.min(600, height)) });
      },

      toggleTerminalMaximized: () => {
        set((state) => ({ terminalMaximized: !state.terminalMaximized }));
      },

      togglePreview: () => {
        set((state) => ({ previewVisible: !state.previewVisible }));
      },

      toggleSpecsPanel: () => {
        set((state) => ({ specsPanelVisible: !state.specsPanelVisible }));
      },

      setSpecsPanelWidth: (width) => {
        set({ specsPanelWidth: Math.max(250, Math.min(450, width)) });
      },

      setSelectedModel: (model) => {
        set({ selectedModel: model });
      },

      setAutopilot: (config) => {
        set((state) => ({
          autopilot: { ...state.autopilot, ...config }
        }));
      },

      toggleAutopilot: () => {
        set((state) => ({
          autopilot: { ...state.autopilot, enabled: !state.autopilot.enabled }
        }));
      },

      openModal: (modal) => {
        set({ activeModal: modal });
      },

      closeModal: () => {
        set({ activeModal: null });
      },
    }),
    {
      name: 'devflow-ui-store',
    }
  )
);
