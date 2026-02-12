'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Maximize2,
  Minimize2,
  SkipForward,
  StopCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAutopilotStore,
  type PhaseResult,
  type AgentId,
} from '@/lib/stores/autopilotStore';

const AGENT_INFO: Record<AgentId, { icon: string; color: string; name: string }> = {
  strategist: { icon: '📊', color: 'text-blue-400', name: 'Strategist' },
  architect: { icon: '🏗️', color: 'text-purple-400', name: 'Architect' },
  'system-designer': { icon: '⚙️', color: 'text-cyan-400', name: 'System Designer' },
  builder: { icon: '🔨', color: 'text-amber-400', name: 'Builder' },
  guardian: { icon: '🛡️', color: 'text-green-400', name: 'Guardian' },
  chronicler: { icon: '📝', color: 'text-pink-400', name: 'Chronicler' },
};

export function AutopilotPanel() {
  const { status, phases, specTitle, error, reset, currentPhaseIndex, abortRun } = useAutopilotStore();
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Update elapsed time
  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startTime]);

  // Don't show if idle
  if (status === 'idle' || phases.length === 0) return null;

  const completedPhases = phases.filter((p) => p.status === 'completed').length;
  const progress = Math.round((completedPhases / phases.length) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return `${mins}m ${remainSecs}s`;
  };

  const isRunning = status === 'running';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isDone = isCompleted || isFailed;

  return (
    <div
      className={cn(
        'fixed bg-[#12121a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 transition-all duration-300 flex flex-col',
        isMaximized ? 'inset-4 w-auto h-auto' : 'bottom-4 right-4 w-[480px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-white text-sm">Autopilot</span>
          {isRunning && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full animate-pulse">
              Running
            </span>
          )}
          {isCompleted && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
              Complete
            </span>
          )}
          {isFailed && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
              Failed
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isRunning && (
            <button
              onClick={abortRun}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
              title="Abort autopilot"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          {isDone && (
            <button
              onClick={reset}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Spec Title */}
      <div className="px-4 py-2 border-b border-white/5">
        <p className="text-xs text-gray-400 truncate">{specTitle}</p>
        {isRunning && (
          <p className="text-[10px] text-gray-500 mt-0.5">Output streaming in Terminal tab</p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Phases */}
      <div className={cn('overflow-y-auto', isMaximized ? 'flex-1' : 'max-h-80')}>
        {phases.map((phase, index) => (
          <PhaseItem
            key={`${phase.agent}-${index}`}
            phase={phase}
            index={index}
            isCurrent={index === currentPhaseIndex}
            isExpanded={expandedPhase === index || isMaximized}
            onToggle={() => setExpandedPhase(expandedPhase === index ? null : index)}
            isMaximized={isMaximized}
            formatDuration={formatDuration}
          />
        ))}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(elapsed)}
            </span>
            <span>
              {completedPhases}/{phases.length} phases
            </span>
          </div>
          <span className="text-purple-400 font-medium">{progress}%</span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isCompleted ? 'bg-green-500' : isFailed ? 'bg-red-500' : 'bg-purple-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function PhaseItem({
  phase,
  index,
  isCurrent,
  isExpanded,
  onToggle,
  isMaximized,
  formatDuration,
}: {
  phase: PhaseResult;
  index: number;
  isCurrent: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isMaximized?: boolean;
  formatDuration: (ms?: number) => string;
}) {
  const agent = AGENT_INFO[phase.agent];

  const getStatusIcon = () => {
    switch (phase.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'skipped':
        return <SkipForward className="w-4 h-4 text-gray-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  const hasOutput = phase.output && phase.output.length > 0;

  return (
    <div
      className={cn(
        'border-b border-white/5 last:border-0',
        isCurrent && phase.status === 'running' && 'bg-purple-500/5'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors"
        disabled={!hasOutput && !isMaximized}
      >
        {getStatusIcon()}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium', agent.color)}>
              {agent.icon} {phase.name}
            </span>
            <span className="text-xs text-gray-500">@{phase.agent}</span>
            {phase.duration && (
              <span className="text-xs text-gray-600">{formatDuration(phase.duration)}</span>
            )}
          </div>
          {phase.status === 'running' && (
            <p className="text-xs text-gray-500 mt-0.5">Processing...</p>
          )}
          {phase.error && <p className="text-xs text-red-400 mt-0.5 truncate">{phase.error}</p>}
        </div>
        {hasOutput && !isMaximized && (
          <div className="text-gray-500">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </button>

      {/* Tasks completed */}
      {phase.tasksCompleted && phase.tasksCompleted.length > 0 && (
        <div className="px-4 py-2 bg-green-500/5 border-t border-white/5">
          <p className="text-[10px] text-green-400/70 uppercase tracking-wider mb-1">Tasks completed</p>
          {phase.tasksCompleted.map((task, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-green-400 py-0.5">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{task}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expanded output */}
      {isExpanded && hasOutput && (
        <div className="px-4 py-3 bg-black/20 border-t border-white/5">
          <pre
            className={cn(
              'text-xs text-gray-400 whitespace-pre-wrap overflow-y-auto font-mono',
              isMaximized ? 'max-h-[300px]' : 'max-h-40'
            )}
          >
            {phase.output}
          </pre>
        </div>
      )}
    </div>
  );
}
