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
  projects: ProjectInfo[];
  activeProjectPath: string | null;
  currentProject: ProjectInfo | null; // Derived from projects + activeProjectPath
  recentProjects: RecentProject[];
  health: HealthStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  addProject: (path: string) => Promise<void>;
  removeProject: (path: string) => void;
  setActiveProject: (path: string) => void;
  openProject: (path: string) => Promise<void>;
  restoreProjects: () => Promise<void>;
  closeProject: () => void;
  refreshHealth: () => Promise<void>;
  setError: (error: string | null) => void;
}

function deriveCurrentProject(projects: ProjectInfo[], activeProjectPath: string | null): ProjectInfo | null {
  if (!activeProjectPath) return projects[0] || null;
  return projects.find(p => p.path === activeProjectPath) || projects[0] || null;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectPath: null,
      currentProject: null,
      recentProjects: [],
      health: null,
      isLoading: false,
      error: null,

      addProject: async (projectPath: string) => {
        const existing = get().projects;
        // If already added, just activate it
        if (existing.some(p => p.path === projectPath)) {
          set({
            activeProjectPath: projectPath,
            currentProject: deriveCurrentProject(existing, projectPath),
          });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/project/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: projectPath }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to open project');
          }

          const project = data.project as ProjectInfo;

          // Update recent projects
          const recentProjects = get().recentProjects.filter(
            (p) => p.path !== projectPath
          );
          recentProjects.unshift({
            path: projectPath,
            name: project.name,
            lastOpened: new Date(),
          });
          if (recentProjects.length > 10) {
            recentProjects.pop();
          }

          const newProjects = [...get().projects, project];

          set({
            projects: newProjects,
            activeProjectPath: projectPath,
            currentProject: deriveCurrentProject(newProjects, projectPath),
            recentProjects,
            isLoading: false,
          });

          get().refreshHealth();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      removeProject: (projectPath: string) => {
        const newProjects = get().projects.filter(p => p.path !== projectPath);
        const newActive = get().activeProjectPath === projectPath
          ? (newProjects[0]?.path || null)
          : get().activeProjectPath;

        set({
          projects: newProjects,
          activeProjectPath: newActive,
          currentProject: deriveCurrentProject(newProjects, newActive),
        });
      },

      setActiveProject: (projectPath: string) => {
        set({
          activeProjectPath: projectPath,
          currentProject: deriveCurrentProject(get().projects, projectPath),
        });
      },

      // Backward-compatible alias
      openProject: async (path: string) => {
        await get().addProject(path);
      },

      restoreProjects: async () => {
        // Read persisted paths from localStorage (saved by partialize)
        try {
          const raw = localStorage.getItem('devflow-project-store');
          if (!raw) return;
          const stored = JSON.parse(raw);
          const paths: string[] = stored.state?.projectPaths || [];
          const savedActive: string | null = stored.state?.activeProjectPath || null;

          if (paths.length === 0) return;

          // Restore each project sequentially to avoid race conditions
          for (const p of paths) {
            await get().addProject(p);
          }

          // Restore the active project (addProject sets it to the last added)
          if (savedActive && get().projects.some(proj => proj.path === savedActive)) {
            get().setActiveProject(savedActive);
          }
        } catch {
          // Ignore restoration errors
        }
      },

      closeProject: () => {
        set({
          projects: [],
          activeProjectPath: null,
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
        projectPaths: state.projects.map(p => p.path),
        activeProjectPath: state.activeProjectPath,
      }),
    }
  )
);
