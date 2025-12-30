import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { FileNode, OpenFile } from '@/lib/types';
import { getExtension, getFileName, getLanguageFromExtension } from '@/lib/utils';

const MAX_RECENT_FILES = 20;
const MAX_HISTORY_SIZE = 50;

interface FileState {
  // State
  tree: FileNode | null;
  openFiles: OpenFile[];
  activeFile: string | null;
  expandedFolders: Set<string>;
  isLoading: boolean;
  isSaving: boolean;
  savingFile: string | null;
  scrollToLine: number | null;

  // Navigation state (US-019)
  pinnedFiles: string[];
  tabHistory: string[];
  historyIndex: number;
  recentFiles: string[];
  closedTabs: string[];

  // Actions
  loadTree: (projectPath: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  createFile: (path: string, type: 'file' | 'directory', content?: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
  toggleFolder: (path: string) => void;
  setExpandedFolders: (paths: Set<string>) => void;
  setScrollToLine: (line: number | null) => void;

  // Navigation actions (US-019)
  navigateBack: () => void;
  navigateForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  togglePinned: (path: string) => void;
  isPinned: (path: string) => boolean;
  getRecentFiles: () => string[];
  closeOtherTabs: (exceptPath: string) => void;
  closeTabsToRight: (path: string) => void;
  closeAllTabs: () => void;
  reopenClosedTab: () => void;
  copyPath: (path: string) => void;
}

export const useFileStore = create<FileState>()(
  persist(
    (set, get) => ({
      tree: null,
      openFiles: [],
      activeFile: null,
      expandedFolders: new Set(),
      isLoading: false,
      isSaving: false,
      savingFile: null,
      scrollToLine: null,

      // Navigation state (US-019)
      pinnedFiles: [],
      tabHistory: [],
      historyIndex: -1,
      recentFiles: [],
      closedTabs: [],

  loadTree: async (projectPath: string) => {
    set({ isLoading: true });

    try {
      const response = await fetch(
        `/api/files/tree?path=${encodeURIComponent(projectPath)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load file tree');
      }

      set({ tree: data.root, isLoading: false });
    } catch (error) {
      console.error('Failed to load tree:', error);
      set({ isLoading: false });
    }
  },

  openFile: async (path: string) => {
    const { openFiles, pinnedFiles, tabHistory, historyIndex, recentFiles } = get();

    // Helper to add to history and recent
    const addToNavigation = () => {
      // Add to tab history (truncate if navigated back)
      const newHistory = tabHistory.slice(0, historyIndex + 1);
      newHistory.push(path);
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }

      // Add to recent files (no duplicates, max 20)
      const newRecent = [path, ...recentFiles.filter((f) => f !== path)].slice(0, MAX_RECENT_FILES);

      return {
        tabHistory: newHistory,
        historyIndex: newHistory.length - 1,
        recentFiles: newRecent,
      };
    };

    // Check if already open
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      set((state) => ({
        activeFile: path,
        ...addToNavigation(),
      }));
      return;
    }

    try {
      const response = await fetch(
        `/api/files?path=${encodeURIComponent(path)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to read file');
      }

      const ext = getExtension(path);
      const newFile: OpenFile = {
        path,
        name: getFileName(path),
        content: data.content,
        originalContent: data.content,
        isDirty: false,
        language: getLanguageFromExtension(ext),
      };

      // Sort files: pinned first, then by open order
      const isPinned = pinnedFiles.includes(path);

      set((state) => {
        const newOpenFiles = [...state.openFiles, newFile];
        // Sort: pinned first
        newOpenFiles.sort((a, b) => {
          const aPinned = state.pinnedFiles.includes(a.path);
          const bPinned = state.pinnedFiles.includes(b.path);
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;
          return 0;
        });

        return {
          openFiles: newOpenFiles,
          activeFile: path,
          ...addToNavigation(),
        };
      });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  },

  closeFile: (path: string) => {
    set((state) => {
      const newOpenFiles = state.openFiles.filter((f) => f.path !== path);
      let newActiveFile = state.activeFile;

      // If closing active file, select another
      if (state.activeFile === path) {
        const index = state.openFiles.findIndex((f) => f.path === path);
        if (newOpenFiles.length > 0) {
          newActiveFile = newOpenFiles[Math.min(index, newOpenFiles.length - 1)].path;
        } else {
          newActiveFile = null;
        }
      }

      // Add to closed tabs for reopen (max 10)
      const newClosedTabs = [path, ...state.closedTabs.filter((f) => f !== path)].slice(0, 10);

      // Remove from pinned if closing
      const newPinnedFiles = state.pinnedFiles.filter((f) => f !== path);

      return {
        openFiles: newOpenFiles,
        activeFile: newActiveFile,
        closedTabs: newClosedTabs,
        pinnedFiles: newPinnedFiles,
      };
    });
  },

  setActiveFile: (path: string | null) => {
    set({ activeFile: path });
  },

  updateFileContent: (path: string, content: string) => {
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path
          ? {
              ...f,
              content,
              isDirty: content !== f.originalContent,
            }
          : f
      ),
    }));
  },

  saveFile: async (path: string) => {
    const { openFiles } = get();
    const file = openFiles.find((f) => f.path === path);

    if (!file) return;

    set({ isSaving: true, savingFile: path });

    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content: file.content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save file');
      }

      set((state) => ({
        openFiles: state.openFiles.map((f) =>
          f.path === path
            ? {
                ...f,
                originalContent: f.content,
                isDirty: false,
              }
            : f
        ),
        isSaving: false,
        savingFile: null,
      }));

      toast.success('File saved', {
        description: getFileName(path),
      });
    } catch (error) {
      set({ isSaving: false, savingFile: null });
      const message = error instanceof Error ? error.message : 'Failed to save file';
      toast.error('Save failed', {
        description: message,
      });
      console.error('Failed to save file:', error);
    }
  },

  createFile: async (path: string, type: 'file' | 'directory', content?: string) => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, type, content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create file');
      }

      toast.success(type === 'directory' ? 'Folder created' : 'File created', {
        description: getFileName(path),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create file';
      toast.error('Create failed', {
        description: message,
      });
      console.error('Failed to create file:', error);
    }
  },

  deleteFile: async (path: string) => {
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete file');
      }

      // Close if open
      get().closeFile(path);

      toast.success('Deleted', {
        description: getFileName(path),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete file';
      toast.error('Delete failed', {
        description: message,
      });
      console.error('Failed to delete file:', error);
    }
  },

  renameFile: async (oldPath: string, newPath: string) => {
    try {
      const response = await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to rename file');
      }

      // Update open files if the renamed file was open
      const { openFiles, activeFile } = get();
      const renamedFile = openFiles.find((f) => f.path === oldPath);

      if (renamedFile) {
        const ext = getExtension(newPath);
        set({
          openFiles: openFiles.map((f) =>
            f.path === oldPath
              ? {
                  ...f,
                  path: newPath,
                  name: getFileName(newPath),
                  language: getLanguageFromExtension(ext),
                }
              : f
          ),
          activeFile: activeFile === oldPath ? newPath : activeFile,
        });
      }

      toast.success('Renamed', {
        description: `${getFileName(oldPath)} → ${getFileName(newPath)}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename file';
      toast.error('Rename failed', {
        description: message,
      });
      console.error('Failed to rename file:', error);
    }
  },

  toggleFolder: (path: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedFolders: newExpanded };
    });
  },

  setExpandedFolders: (paths: Set<string>) => {
    set({ expandedFolders: paths });
  },

  setScrollToLine: (line: number | null) => {
    set({ scrollToLine: line });
  },

  // Navigation actions (US-019)
  navigateBack: () => {
    const { tabHistory, historyIndex, openFile } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const path = tabHistory[newIndex];
      set({ historyIndex: newIndex, activeFile: path });
    }
  },

  navigateForward: () => {
    const { tabHistory, historyIndex } = get();
    if (historyIndex < tabHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const path = tabHistory[newIndex];
      set({ historyIndex: newIndex, activeFile: path });
    }
  },

  canGoBack: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canGoForward: () => {
    const { tabHistory, historyIndex } = get();
    return historyIndex < tabHistory.length - 1;
  },

  togglePinned: (path: string) => {
    set((state) => {
      const isPinned = state.pinnedFiles.includes(path);
      const newPinnedFiles = isPinned
        ? state.pinnedFiles.filter((f) => f !== path)
        : [...state.pinnedFiles, path];

      // Re-sort open files: pinned first
      const newOpenFiles = [...state.openFiles].sort((a, b) => {
        const aPinned = newPinnedFiles.includes(a.path);
        const bPinned = newPinnedFiles.includes(b.path);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });

      toast.success(isPinned ? 'Tab unpinned' : 'Tab pinned', {
        description: getFileName(path),
      });

      return {
        pinnedFiles: newPinnedFiles,
        openFiles: newOpenFiles,
      };
    });
  },

  isPinned: (path: string) => {
    return get().pinnedFiles.includes(path);
  },

  getRecentFiles: () => {
    return get().recentFiles;
  },

  closeOtherTabs: (exceptPath: string) => {
    const { openFiles, pinnedFiles, closeFile } = get();

    // Close all non-pinned tabs except the specified one
    const tabsToClose = openFiles
      .filter((f) => f.path !== exceptPath && !pinnedFiles.includes(f.path))
      .map((f) => f.path);

    tabsToClose.forEach((path) => {
      get().closeFile(path);
    });

    toast.success('Closed other tabs', {
      description: `${tabsToClose.length} tabs closed`,
    });
  },

  closeTabsToRight: (path: string) => {
    const { openFiles, pinnedFiles } = get();
    const index = openFiles.findIndex((f) => f.path === path);

    if (index === -1) return;

    // Close all tabs to the right that are not pinned
    const tabsToClose = openFiles
      .slice(index + 1)
      .filter((f) => !pinnedFiles.includes(f.path))
      .map((f) => f.path);

    tabsToClose.forEach((tabPath) => {
      get().closeFile(tabPath);
    });

    if (tabsToClose.length > 0) {
      toast.success('Closed tabs to right', {
        description: `${tabsToClose.length} tabs closed`,
      });
    }
  },

  closeAllTabs: () => {
    const { openFiles, pinnedFiles } = get();

    // Close all non-pinned tabs
    const tabsToClose = openFiles
      .filter((f) => !pinnedFiles.includes(f.path))
      .map((f) => f.path);

    tabsToClose.forEach((path) => {
      get().closeFile(path);
    });

    toast.success('Closed all tabs', {
      description: `${tabsToClose.length} tabs closed`,
    });
  },

  reopenClosedTab: () => {
    const { closedTabs, openFile } = get();

    if (closedTabs.length === 0) {
      toast.info('No closed tabs to reopen');
      return;
    }

    const pathToReopen = closedTabs[0];

    // Remove from closed tabs
    set((state) => ({
      closedTabs: state.closedTabs.slice(1),
    }));

    // Open the file
    openFile(pathToReopen);

    toast.success('Tab reopened', {
      description: getFileName(pathToReopen),
    });
  },

  copyPath: (path: string) => {
    navigator.clipboard.writeText(path).then(() => {
      toast.success('Path copied', {
        description: path,
      });
    }).catch(() => {
      toast.error('Failed to copy path');
    });
  },
    }),
    {
      name: 'devflow-file-store',
      partialize: (state) => ({
        pinnedFiles: state.pinnedFiles,
        recentFiles: state.recentFiles,
        closedTabs: state.closedTabs,
      }),
    }
  )
);
