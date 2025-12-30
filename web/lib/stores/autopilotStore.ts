import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Autopilot Store - Versão simplificada
 * Execução sequencial sem streaming
 */

export type AgentId = 'strategist' | 'architect' | 'builder' | 'guardian' | 'chronicler';
export type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type RunStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface PhaseResult {
  agent: AgentId;
  name: string;
  status: PhaseStatus;
  output?: string;
  error?: string;
  duration?: number;
}

export interface AutopilotConfig {
  phases: AgentId[];
}

// Default phases
export const DEFAULT_PHASES: { id: AgentId; name: string }[] = [
  { id: 'strategist', name: 'Planning' },
  { id: 'architect', name: 'Design' },
  { id: 'builder', name: 'Implementation' },
  { id: 'guardian', name: 'Validation' },
  { id: 'chronicler', name: 'Documentation' },
];

export const DEFAULT_CONFIG: AutopilotConfig = {
  phases: ['strategist', 'architect', 'builder', 'guardian', 'chronicler'],
};

interface AutopilotState {
  // State
  status: RunStatus;
  currentPhaseIndex: number;
  phases: PhaseResult[];
  error: string | null;
  specId: string | null;
  specTitle: string | null;

  // Config modal
  isConfigModalOpen: boolean;
  selectedSpecId: string | null;
  selectedSpecTitle: string | null;
  selectedSpecContent: string | null;

  // Actions
  openConfigModal: (specId: string, specTitle: string, specContent: string) => void;
  closeConfigModal: () => void;
  startRun: (config: AutopilotConfig, projectPath: string) => Promise<void>;
  reset: () => void;
}

export const useAutopilotStore = create<AutopilotState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      currentPhaseIndex: -1,
      phases: [],
      error: null,
      specId: null,
      specTitle: null,
      isConfigModalOpen: false,
      selectedSpecId: null,
      selectedSpecTitle: null,
      selectedSpecContent: null,

      openConfigModal: (specId, specTitle, specContent) => {
        set({
          isConfigModalOpen: true,
          selectedSpecId: specId,
          selectedSpecTitle: specTitle,
          selectedSpecContent: specContent,
        });
      },

      closeConfigModal: () => {
        set({
          isConfigModalOpen: false,
          selectedSpecId: null,
          selectedSpecTitle: null,
          selectedSpecContent: null,
        });
      },

      startRun: async (config, projectPath) => {
        const { selectedSpecId, selectedSpecTitle, selectedSpecContent } = get();

        if (!selectedSpecId || !selectedSpecTitle || !selectedSpecContent) {
          throw new Error('No spec selected');
        }

        // Initialize phases
        const initialPhases: PhaseResult[] = config.phases.map((agentId) => {
          const phaseInfo = DEFAULT_PHASES.find((p) => p.id === agentId);
          return {
            agent: agentId,
            name: phaseInfo?.name || agentId,
            status: 'pending',
          };
        });

        set({
          status: 'running',
          currentPhaseIndex: 0,
          phases: initialPhases,
          error: null,
          specId: selectedSpecId,
          specTitle: selectedSpecTitle,
          isConfigModalOpen: false,
        });

        // Execute phases sequentially
        let previousOutputs: string[] = [];

        for (let i = 0; i < config.phases.length; i++) {
          const agentId = config.phases[i];

          // Update current phase to running
          set((state) => ({
            currentPhaseIndex: i,
            phases: state.phases.map((p, idx) =>
              idx === i ? { ...p, status: 'running' } : p
            ),
          }));

          const startTime = Date.now();

          try {
            const response = await fetch('/api/autopilot/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agent: agentId,
                specContent: selectedSpecContent,
                previousOutputs,
                projectPath,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              throw new Error(errorData.error || `Phase ${agentId} failed`);
            }

            const result = await response.json();
            const duration = Date.now() - startTime;

            previousOutputs.push(result.output || '');

            // Update phase as completed
            set((state) => ({
              phases: state.phases.map((p, idx) =>
                idx === i
                  ? { ...p, status: 'completed', output: result.output, duration }
                  : p
              ),
            }));

          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Update phase as failed
            set((state) => ({
              status: 'failed',
              error: errorMessage,
              phases: state.phases.map((p, idx) =>
                idx === i
                  ? { ...p, status: 'failed', error: errorMessage, duration }
                  : idx > i
                  ? { ...p, status: 'skipped' }
                  : p
              ),
            }));

            return; // Stop execution
          }
        }

        // All phases completed
        set({ status: 'completed' });
      },

      reset: () => {
        set({
          status: 'idle',
          currentPhaseIndex: -1,
          phases: [],
          error: null,
          specId: null,
          specTitle: null,
          isConfigModalOpen: false,
          selectedSpecId: null,
          selectedSpecTitle: null,
          selectedSpecContent: null,
        });
      },
    }),
    {
      name: 'autopilot-storage',
      partialize: (state) => ({
        status: state.status,
        phases: state.phases,
        specId: state.specId,
        specTitle: state.specTitle,
      }),
    }
  )
);
