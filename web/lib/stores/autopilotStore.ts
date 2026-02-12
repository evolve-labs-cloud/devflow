import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Autopilot Store - Terminal-based execution
 * Agents run inside the terminal PTY with streaming output.
 */

export type AgentId = 'strategist' | 'architect' | 'system-designer' | 'builder' | 'guardian' | 'chronicler';
export type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type RunStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface PhaseResult {
  agent: AgentId;
  name: string;
  status: PhaseStatus;
  output?: string;
  error?: string;
  duration?: number;
  tasksCompleted?: string[];
}

export interface AutopilotConfig {
  phases: AgentId[];
}

// Default phases
export const DEFAULT_PHASES: { id: AgentId; name: string }[] = [
  { id: 'strategist', name: 'Planning' },
  { id: 'architect', name: 'Design' },
  { id: 'system-designer', name: 'System Design' },
  { id: 'builder', name: 'Implementation' },
  { id: 'guardian', name: 'Validation' },
  { id: 'chronicler', name: 'Documentation' },
];

export const DEFAULT_CONFIG: AutopilotConfig = {
  phases: ['strategist', 'architect', 'system-designer', 'builder', 'guardian', 'chronicler'],
};

interface AutopilotState {
  // State
  status: RunStatus;
  currentPhaseIndex: number;
  phases: PhaseResult[];
  error: string | null;
  specId: string | null;
  specTitle: string | null;

  // Terminal session for autopilot execution
  terminalSessionId: string | null;

  // Config modal
  isConfigModalOpen: boolean;
  selectedSpecId: string | null;
  selectedSpecTitle: string | null;
  selectedSpecContent: string | null;
  selectedSpecFilePath: string | null;

  // Actions
  openConfigModal: (specId: string, specTitle: string, specContent: string, specFilePath?: string) => void;
  closeConfigModal: () => void;
  setTerminalSessionId: (sessionId: string) => void;
  startRun: (config: AutopilotConfig, projectPath: string) => Promise<void>;
  abortRun: () => Promise<void>;
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
      terminalSessionId: null,
      isConfigModalOpen: false,
      selectedSpecId: null,
      selectedSpecTitle: null,
      selectedSpecContent: null,
      selectedSpecFilePath: null,

      openConfigModal: (specId, specTitle, specContent, specFilePath) => {
        set({
          isConfigModalOpen: true,
          selectedSpecId: specId,
          selectedSpecTitle: specTitle,
          selectedSpecContent: specContent,
          selectedSpecFilePath: specFilePath || null,
        });
      },

      closeConfigModal: () => {
        set({
          isConfigModalOpen: false,
          selectedSpecId: null,
          selectedSpecTitle: null,
          selectedSpecContent: null,
          selectedSpecFilePath: null,
        });
      },

      setTerminalSessionId: (sessionId) => {
        set({ terminalSessionId: sessionId });
      },

      startRun: async (config, projectPath) => {
        const { selectedSpecId, selectedSpecTitle, selectedSpecContent, selectedSpecFilePath, terminalSessionId } = get();

        if (!selectedSpecId || !selectedSpecTitle || !selectedSpecContent) {
          throw new Error('No spec selected');
        }

        if (!terminalSessionId) {
          throw new Error('No terminal session available. Open the terminal first.');
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

        // Execute phases sequentially via terminal
        let previousOutputs: string[] = [];

        for (let i = 0; i < config.phases.length; i++) {
          // Check if aborted
          if (get().status !== 'running') return;

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
            const response = await fetch('/api/autopilot/terminal-execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: terminalSessionId,
                agent: agentId,
                specContent: selectedSpecContent,
                specFilePath: selectedSpecFilePath,
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

            if (!result.success) {
              throw new Error(result.error || `Phase ${agentId} failed`);
            }

            previousOutputs.push(result.output || '');

            // Update phase as completed
            set((state) => ({
              phases: state.phases.map((p, idx) =>
                idx === i
                  ? {
                      ...p,
                      status: 'completed',
                      output: result.output,
                      duration,
                      tasksCompleted: result.tasksCompleted || [],
                    }
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

      abortRun: async () => {
        const { terminalSessionId, currentPhaseIndex } = get();

        // Send Ctrl+C to the terminal to interrupt the current command
        if (terminalSessionId) {
          try {
            await fetch('/api/terminal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'write',
                sessionId: terminalSessionId,
                data: '\x03', // Ctrl+C
              }),
            });
          } catch {
            // Ignore errors
          }
        }

        // Mark current phase as failed, remaining as skipped
        set((state) => ({
          status: 'failed',
          error: 'Aborted by user',
          phases: state.phases.map((p, idx) =>
            idx === currentPhaseIndex
              ? { ...p, status: 'failed', error: 'Aborted' }
              : idx > currentPhaseIndex
              ? { ...p, status: 'skipped' }
              : p
          ),
        }));
      },

      reset: () => {
        set({
          status: 'idle',
          currentPhaseIndex: -1,
          phases: [],
          error: null,
          specId: null,
          specTitle: null,
          terminalSessionId: null,
          isConfigModalOpen: false,
          selectedSpecId: null,
          selectedSpecTitle: null,
          selectedSpecContent: null,
          selectedSpecFilePath: null,
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
