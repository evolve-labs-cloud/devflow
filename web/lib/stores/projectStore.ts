import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectInfo, HealthStatus } from '@/lib/types';

interface RecentProject {
  path: string;
  name: string;
  lastOpened: Date;
}

interface ProjectState {
  // State
  currentProject: ProjectInfo | null;
  recentProjects: RecentProject[];
  health: HealthStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  openProject: (path: string) => Promise<void>;
  closeProject: () => void;
  refreshHealth: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      recentProjects: [],
      health: null,
      isLoading: false,
      error: null,

      openProject: async (path: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/project/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to open project');
          }

          const project = data.project as ProjectInfo;

          // Update recent projects
          const recentProjects = get().recentProjects.filter(
            (p) => p.path !== path
          );
          recentProjects.unshift({
            path,
            name: project.name,
            lastOpened: new Date(),
          });

          // Keep only last 10
          if (recentProjects.length > 10) {
            recentProjects.pop();
          }

          set({
            currentProject: project,
            recentProjects,
            isLoading: false,
          });

          // Refresh health status
          get().refreshHealth();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      closeProject: () => {
        set({
          currentProject: null,
          health: null,
          error: null,
        });
      },

      refreshHealth: async () => {
        const project = get().currentProject;
        if (!project) return;

        try {
          const response = await fetch(
            `/api/health?projectPath=${encodeURIComponent(project.path)}`
          );
          const health = await response.json();
          set({ health });
        } catch (error) {
          console.error('Failed to fetch health:', error);
        }
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: 'devflow-project-store',
      partialize: (state) => ({
        recentProjects: state.recentProjects,
      }),
    }
  )
);
