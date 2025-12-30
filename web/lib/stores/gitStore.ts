import { create } from 'zustand';
import { toast } from 'sonner';
import type { GitStatus, GitCommit, GitBranch } from '@/lib/git';

interface GitState {
  // State
  status: GitStatus | null;
  commits: GitCommit[];
  branches: GitBranch[];
  isLoading: boolean;
  error: string | null;
  selectedFiles: Set<string>;
  diffContent: string | null;
  diffFile: string | null;

  // Actions
  fetchStatus: (projectPath: string) => Promise<void>;
  fetchLog: (projectPath: string, maxCount?: number) => Promise<void>;
  fetchBranches: (projectPath: string) => Promise<void>;
  fetchDiff: (projectPath: string, file?: string, staged?: boolean) => Promise<void>;
  stageFiles: (projectPath: string, files: string[]) => Promise<boolean>;
  unstageFiles: (projectPath: string, files: string[]) => Promise<boolean>;
  stageAll: (projectPath: string) => Promise<boolean>;
  unstageAll: (projectPath: string) => Promise<boolean>;
  commit: (projectPath: string, message: string) => Promise<{ success: boolean; hash?: string; error?: string }>;
  push: (projectPath: string) => Promise<{ success: boolean; error?: string }>;
  pull: (projectPath: string) => Promise<{ success: boolean; error?: string }>;
  checkout: (projectPath: string, branch: string) => Promise<{ success: boolean; error?: string }>;
  createBranch: (projectPath: string, branch: string) => Promise<{ success: boolean; error?: string }>;
  discardChanges: (projectPath: string, files: string[]) => Promise<boolean>;
  initRepo: (projectPath: string) => Promise<{ success: boolean; error?: string }>;
  toggleFileSelection: (file: string) => void;
  selectAllFiles: (files: string[]) => void;
  clearSelection: () => void;
  clearDiff: () => void;
  setError: (error: string | null) => void;
}

export const useGitStore = create<GitState>((set, get) => ({
  // Initial state
  status: null,
  commits: [],
  branches: [],
  isLoading: false,
  error: null,
  selectedFiles: new Set(),
  diffContent: null,
  diffFile: null,

  // Actions
  fetchStatus: async (projectPath: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/git?action=status&projectPath=${encodeURIComponent(projectPath)}`);
      if (!response.ok) throw new Error('Failed to fetch status');
      const status = await response.json();
      set({ status, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch status', isLoading: false });
    }
  },

  fetchLog: async (projectPath: string, maxCount: number = 50) => {
    try {
      const response = await fetch(`/api/git?action=log&projectPath=${encodeURIComponent(projectPath)}&maxCount=${maxCount}`);
      if (!response.ok) throw new Error('Failed to fetch log');
      const { commits } = await response.json();
      set({ commits });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch log' });
    }
  },

  fetchBranches: async (projectPath: string) => {
    try {
      const response = await fetch(`/api/git?action=branches&projectPath=${encodeURIComponent(projectPath)}`);
      if (!response.ok) throw new Error('Failed to fetch branches');
      const { branches } = await response.json();
      set({ branches });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch branches' });
    }
  },

  fetchDiff: async (projectPath: string, file?: string, staged: boolean = false) => {
    try {
      let url = `/api/git?action=diff&projectPath=${encodeURIComponent(projectPath)}&staged=${staged}`;
      if (file) {
        url += `&file=${encodeURIComponent(file)}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch diff');
      const { diff } = await response.json();
      set({ diffContent: diff, diffFile: file || null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch diff' });
    }
  },

  stageFiles: async (projectPath: string, files: string[]) => {
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stage', projectPath, files }),
      });
      if (!response.ok) throw new Error('Failed to stage files');
      const { success } = await response.json();
      if (success) {
        await get().fetchStatus(projectPath);
      }
      return success;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to stage files' });
      return false;
    }
  },

  unstageFiles: async (projectPath: string, files: string[]) => {
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unstage', projectPath, files }),
      });
      if (!response.ok) throw new Error('Failed to unstage files');
      const { success } = await response.json();
      if (success) {
        await get().fetchStatus(projectPath);
      }
      return success;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to unstage files' });
      return false;
    }
  },

  stageAll: async (projectPath: string) => {
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stageAll', projectPath }),
      });
      if (!response.ok) throw new Error('Failed to stage all');
      const { success } = await response.json();
      if (success) {
        await get().fetchStatus(projectPath);
      }
      return success;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to stage all' });
      return false;
    }
  },

  unstageAll: async (projectPath: string) => {
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unstageAll', projectPath }),
      });
      if (!response.ok) throw new Error('Failed to unstage all');
      const { success } = await response.json();
      if (success) {
        await get().fetchStatus(projectPath);
      }
      return success;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to unstage all' });
      return false;
    }
  },

  commit: async (projectPath: string, message: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'commit', projectPath, message }),
      });
      if (!response.ok) throw new Error('Failed to commit');
      const result = await response.json();
      if (result.success) {
        await get().fetchStatus(projectPath);
        await get().fetchLog(projectPath);
        toast.success('Changes committed', {
          description: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        });
      }
      set({ isLoading: false });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to commit';
      set({ error: errorMsg, isLoading: false });
      toast.error('Commit failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  push: async (projectPath: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push', projectPath }),
      });
      if (!response.ok) throw new Error('Failed to push');
      const result = await response.json();
      if (result.success) {
        await get().fetchStatus(projectPath);
        toast.success('Pushed to remote', {
          description: 'Changes uploaded successfully',
        });
      }
      set({ isLoading: false });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to push';
      set({ error: errorMsg, isLoading: false });
      toast.error('Push failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  pull: async (projectPath: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', projectPath }),
      });
      if (!response.ok) throw new Error('Failed to pull');
      const result = await response.json();
      if (result.success) {
        await get().fetchStatus(projectPath);
        await get().fetchLog(projectPath);
        toast.success('Pulled from remote', {
          description: 'Changes downloaded successfully',
        });
      }
      set({ isLoading: false });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to pull';
      set({ error: errorMsg, isLoading: false });
      toast.error('Pull failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  checkout: async (projectPath: string, branch: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', projectPath, branch }),
      });
      if (!response.ok) throw new Error('Failed to checkout');
      const result = await response.json();
      if (result.success) {
        await get().fetchStatus(projectPath);
        await get().fetchBranches(projectPath);
        toast.success('Branch switched', {
          description: `Now on ${branch}`,
        });
      }
      set({ isLoading: false });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to checkout';
      set({ error: errorMsg, isLoading: false });
      toast.error('Checkout failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  createBranch: async (projectPath: string, branch: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createBranch', projectPath, branch }),
      });
      if (!response.ok) throw new Error('Failed to create branch');
      const result = await response.json();
      if (result.success) {
        await get().fetchStatus(projectPath);
        await get().fetchBranches(projectPath);
        toast.success('Branch created', {
          description: branch,
        });
      }
      set({ isLoading: false });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create branch';
      set({ error: errorMsg, isLoading: false });
      toast.error('Create branch failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  discardChanges: async (projectPath: string, files: string[]) => {
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discard', projectPath, files }),
      });
      if (!response.ok) throw new Error('Failed to discard changes');
      const { success } = await response.json();
      if (success) {
        await get().fetchStatus(projectPath);
        toast.success('Changes discarded', {
          description: `${files.length} file${files.length > 1 ? 's' : ''} reverted`,
        });
      }
      return success;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to discard changes';
      set({ error: errorMsg });
      toast.error('Discard failed', { description: errorMsg });
      return false;
    }
  },

  initRepo: async (projectPath: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init', projectPath }),
      });
      if (!response.ok) throw new Error('Failed to init repo');
      const result = await response.json();
      if (result.success) {
        await get().fetchStatus(projectPath);
        toast.success('Repository initialized', {
          description: 'Git repository created successfully',
        });
      }
      set({ isLoading: false });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to init repo';
      set({ error: errorMsg, isLoading: false });
      toast.error('Init failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  toggleFileSelection: (file: string) => {
    const { selectedFiles } = get();
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(file)) {
      newSelection.delete(file);
    } else {
      newSelection.add(file);
    }
    set({ selectedFiles: newSelection });
  },

  selectAllFiles: (files: string[]) => {
    set({ selectedFiles: new Set(files) });
  },

  clearSelection: () => {
    set({ selectedFiles: new Set() });
  },

  clearDiff: () => {
    set({ diffContent: null, diffFile: null });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
