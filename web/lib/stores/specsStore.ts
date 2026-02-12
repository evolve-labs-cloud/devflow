import { create } from 'zustand';
import type { Spec, Requirement, DesignDecision, Task, SpecPhase } from '@/lib/types';

// Progress info for a spec
export interface SpecProgress {
  total: number;
  completed: number;
  inProgress: number;
  percentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface SpecsState {
  // State
  specs: Spec[];
  requirements: Requirement[];
  decisions: DesignDecision[];
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  selectedSpecId: string | null;
  activePhase: SpecPhase;
  filterProject: string | null; // null = show all

  // Actions
  loadSpecs: (projectPaths: string[]) => Promise<void>;
  createSpec: (projectPath: string, data: CreateSpecData) => Promise<string | null>;
  setSelectedSpec: (id: string | null) => void;
  setActivePhase: (phase: SpecPhase) => void;
  setFilterProject: (projectPath: string | null) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  getSpecsByPhase: (phase: SpecPhase) => Spec[];
  getRequirementsBySpec: (specId: string) => Requirement[];
  getTasksBySpec: (specId: string) => Task[];
  getDecisionsBySpec: (specId: string) => DesignDecision[];
  getSpecProgress: (specId: string) => SpecProgress;
  getFilteredRequirements: () => Requirement[];
  getFilteredDecisions: () => DesignDecision[];
  getFilteredTasks: () => Task[];
}

interface CreateSpecData {
  type: 'story' | 'adr' | 'spec';
  title: string;
  description?: string;
  priority?: string;
  phase?: SpecPhase;
}

function basename(p: string): string {
  return p.split('/').pop() || p;
}

export const useSpecsStore = create<SpecsState>((set, get) => ({
  specs: [],
  requirements: [],
  decisions: [],
  tasks: [],
  isLoading: false,
  error: null,
  selectedSpecId: null,
  activePhase: 'requirements',
  filterProject: null,

  loadSpecs: async (projectPaths: string[]) => {
    if (projectPaths.length === 0) return;

    set({ isLoading: true, error: null });

    try {
      // Fetch specs from all projects in parallel
      const results = await Promise.all(
        projectPaths.map(async (projectPath) => {
          const response = await fetch(
            `/api/specs?projectPath=${encodeURIComponent(projectPath)}`
          );

          if (!response.ok) {
            console.error(`Failed to load specs from ${basename(projectPath)}`);
            return null;
          }

          const data = await response.json();
          const projectName = basename(projectPath);

          // Tag each item with sourceProject
          return {
            specs: (data.specs || []).map((s: Spec) => ({ ...s, sourceProject: projectPath })),
            requirements: (data.requirements || []).map((r: Requirement) => ({ ...r, sourceProject: projectPath })),
            decisions: (data.decisions || []).map((d: DesignDecision) => ({ ...d, sourceProject: projectPath })),
            tasks: (data.tasks || []).map((t: Task) => ({ ...t, sourceProject: projectPath })),
          };
        })
      );

      // Merge results from all projects
      const allSpecs: Spec[] = [];
      const allRequirements: Requirement[] = [];
      const allDecisions: DesignDecision[] = [];
      const allTasks: Task[] = [];

      for (const result of results) {
        if (!result) continue;
        allSpecs.push(...result.specs);
        allRequirements.push(...result.requirements);
        allDecisions.push(...result.decisions);
        allTasks.push(...result.tasks);
      }

      // Deduplicate by composite key (sourceProject + id)
      const dedup = <T extends { id: string; sourceProject?: string }>(items: T[]) =>
        [...new Map(items.map(i => [`${i.sourceProject || ''}:${i.id}`, i])).values()];

      set({
        specs: dedup(allSpecs),
        requirements: dedup(allRequirements),
        decisions: dedup(allDecisions),
        tasks: dedup(allTasks),
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading specs:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load specs',
        isLoading: false,
      });
    }
  },

  createSpec: async (projectPath: string, data: CreateSpecData) => {
    try {
      const response = await fetch('/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create spec');
      }

      const result = await response.json();

      // Reload specs from all projects that were previously loaded
      const currentPaths = [...new Set(get().specs.map(s => s.sourceProject).filter(Boolean))] as string[];
      if (!currentPaths.includes(projectPath)) {
        currentPaths.push(projectPath);
      }
      await get().loadSpecs(currentPaths);

      return result.id;
    } catch (error) {
      console.error('Error creating spec:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create spec',
      });
      return null;
    }
  },

  setSelectedSpec: (id: string | null) => {
    set({ selectedSpecId: id });
  },

  setActivePhase: (phase: SpecPhase) => {
    set({ activePhase: phase });
  },

  setFilterProject: (projectPath: string | null) => {
    set({ filterProject: projectPath });
  },

  updateTaskStatus: async (taskId: string, status: Task['status']) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === taskId);

    if (!task) return;

    // Update local state immediately for responsive UI
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              completedAt: status === 'completed' ? new Date() : undefined,
            }
          : t
      ),
    }));

    // Persist to file if we have filePath
    if (task.filePath) {
      try {
        const response = await fetch('/api/specs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: task.filePath,
            taskTitle: task.title,
            completed: status === 'completed',
          }),
        });

        if (!response.ok) {
          console.error('Failed to persist task status');
          // Revert on failure
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: task.status,
                    completedAt: task.completedAt,
                  }
                : t
            ),
          }));
        }
      } catch (error) {
        console.error('Error persisting task status:', error);
      }
    }
  },

  getSpecsByPhase: (phase: SpecPhase) => {
    const { specs, filterProject } = get();
    return specs.filter((spec) =>
      spec.phase === phase && (!filterProject || spec.sourceProject === filterProject)
    );
  },

  getRequirementsBySpec: (specId: string) => {
    const { requirements } = get();
    return requirements.filter((req) => req.specId === specId);
  },

  getTasksBySpec: (specId: string) => {
    const { tasks } = get();
    return tasks.filter((task) => task.specId === specId);
  },

  getDecisionsBySpec: (specId: string) => {
    const { decisions } = get();
    return decisions.filter((dec) => dec.specId === specId);
  },

  getSpecProgress: (specId: string) => {
    const { tasks } = get();
    const specTasks = tasks.filter((task) => task.specId === specId);

    if (specTasks.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        percentage: 0,
        status: 'not_started' as const,
      };
    }

    const completed = specTasks.filter((t) => t.status === 'completed').length;
    const inProgress = specTasks.filter((t) => t.status === 'in_progress').length;
    const total = specTasks.length;
    const percentage = Math.round((completed / total) * 100);

    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (completed === total) {
      status = 'completed';
    } else if (completed > 0 || inProgress > 0) {
      status = 'in_progress';
    }

    return { total, completed, inProgress, percentage, status };
  },

  getFilteredRequirements: () => {
    const { requirements, filterProject } = get();
    if (!filterProject) return requirements;
    return requirements.filter(r => r.sourceProject === filterProject);
  },

  getFilteredDecisions: () => {
    const { decisions, filterProject } = get();
    if (!filterProject) return decisions;
    return decisions.filter(d => d.sourceProject === filterProject);
  },

  getFilteredTasks: () => {
    const { tasks, filterProject } = get();
    if (!filterProject) return tasks;
    return tasks.filter(t => t.sourceProject === filterProject);
  },
}));
