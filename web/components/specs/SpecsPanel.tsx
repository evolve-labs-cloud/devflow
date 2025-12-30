'use client';

import { useEffect, useState, useRef, useCallback, KeyboardEvent } from 'react';
import {
  FileText,
  Cpu,
  ListTodo,
  Plus,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  X,
  Loader2,
  Rocket,
} from 'lucide-react';
import type { SpecPhase, Spec, Requirement, DesignDecision, Task } from '@/lib/types';
import { useSpecsStore, type SpecProgress } from '@/lib/stores/specsStore';
import { useFileStore } from '@/lib/stores/fileStore';
import { useAutopilotStore } from '@/lib/stores/autopilotStore';
import { AGENTS } from '@/lib/constants/agents';
import { cn } from '@/lib/utils';
import { useListNavigation } from '@/hooks/useListNavigation';

interface SpecsPanelProps {
  projectPath: string;
}

// Workflow phases
const PHASES: { id: SpecPhase; name: string; icon: React.ReactNode; color: string }[] = [
  { id: 'requirements', name: 'Requirements', icon: <FileText className="w-4 h-4" />, color: 'text-blue-400' },
  { id: 'design', name: 'Design', icon: <Cpu className="w-4 h-4" />, color: 'text-purple-400' },
  { id: 'tasks', name: 'Tasks', icon: <ListTodo className="w-4 h-4" />, color: 'text-amber-400' },
];

export function SpecsPanel({ projectPath }: SpecsPanelProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    specs,
    requirements,
    decisions,
    tasks,
    isLoading,
    error,
    activePhase,
    selectedSpecId,
    loadSpecs,
    setActivePhase,
    setSelectedSpec,
  } = useSpecsStore();

  const { openFile } = useFileStore();
  const { status: autopilotStatus } = useAutopilotStore();

  // Load specs when project path changes
  useEffect(() => {
    if (projectPath) {
      loadSpecs(projectPath);
    }
  }, [projectPath, loadSpecs]);

  // Refresh specs when autopilot completes
  useEffect(() => {
    if (autopilotStatus === 'completed' || autopilotStatus === 'failed') {
      // Delay refresh to allow file writes to complete
      const timer = setTimeout(() => {
        loadSpecs(projectPath);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autopilotStatus, projectPath, loadSpecs]);

  const handleOpenSpec = (spec: Spec) => {
    if (spec.filePath) {
      openFile(spec.filePath);
    }
  };

  // Filter by phase
  const requirementSpecs = specs.filter(s => s.phase === 'requirements');
  const designSpecs = specs.filter(s => s.phase === 'design');

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="font-semibold flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">Specs</span>
          </h2>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0" role="toolbar" aria-label="Specs actions">
            <button
              onClick={() => loadSpecs(projectPath)}
              className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Refresh"
              aria-label="Refresh specs"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} aria-hidden="true" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="New Spec"
              aria-label="Create new spec"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Phase Tabs - Responsive */}
        <div
          className="flex gap-1 bg-white/5 rounded-lg p-1 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label="Spec phases"
        >
          {PHASES.map((phase) => {
            const count = phase.id === 'requirements'
              ? requirements.length
              : phase.id === 'design'
              ? decisions.length
              : tasks.length;

            return (
              <button
                key={phase.id}
                onClick={() => setActivePhase(phase.id)}
                role="tab"
                aria-selected={activePhase === phase.id}
                aria-controls={`${phase.id}-panel`}
                id={`${phase.id}-tab`}
                className={cn(
                  'flex-1 min-w-0 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                  activePhase === phase.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <span className={cn('flex-shrink-0', phase.color)} aria-hidden="true">{phase.icon}</span>
                <span className="hidden sm:inline truncate">{phase.name}</span>
                {count > 0 && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 bg-white/10 rounded text-[10px]" aria-label={`${count} items`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-3 sm:mx-4 mt-2 sm:mt-3 p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs sm:text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 overflow-auto p-3 sm:p-4"
        role="tabpanel"
        id={`${activePhase}-panel`}
        aria-labelledby={`${activePhase}-tab`}
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center" aria-label="Loading specs">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400" aria-hidden="true" />
          </div>
        ) : (
          <>
            {activePhase === 'requirements' && (
              <RequirementsView
                requirements={requirements}
                specs={requirementSpecs}
                projectPath={projectPath}
                onOpenSpec={handleOpenSpec}
                onCreateNew={() => setShowCreateModal(true)}
              />
            )}
            {activePhase === 'design' && (
              <DesignView
                decisions={decisions}
                specs={designSpecs}
                onOpenSpec={handleOpenSpec}
                onCreateNew={() => setShowCreateModal(true)}
              />
            )}
            {activePhase === 'tasks' && (
              <TasksView
                tasks={tasks}
                onCreateNew={() => setShowCreateModal(true)}
              />
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSpecModal
          projectPath={projectPath}
          activePhase={activePhase}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ progress }: { progress: SpecProgress }) {
  if (progress.total === 0) return null;

  const getBarColor = () => {
    if (progress.status === 'completed') return 'bg-green-500';
    if (progress.percentage >= 50) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
        <span>{progress.completed}/{progress.total} tasks</span>
        <span className={cn(
          progress.status === 'completed' && 'text-green-400',
          progress.status === 'in_progress' && 'text-blue-400'
        )}>
          {progress.percentage}%
        </span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', getBarColor())}
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
    </div>
  );
}

// Requirements View
function RequirementsView({
  requirements,
  specs,
  projectPath,
  onOpenSpec,
  onCreateNew,
}: {
  requirements: Requirement[];
  specs: Spec[];
  projectPath: string;
  onOpenSpec: (spec: Spec) => void;
  onCreateNew: () => void;
}) {
  const { getSpecProgress } = useSpecsStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((req: Requirement) => {
    const spec = specs.find(s => s.id === req.specId);
    if (spec) {
      onOpenSpec(spec);
    }
  }, [specs, onOpenSpec]);

  const { selectedIndex, handleKeyDown, isSelected } = useListNavigation({
    items: requirements,
    onSelect: handleSelect,
    getItemText: (req) => req.title,
    typeAhead: true,
  });

  if (requirements.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-8 h-8" />}
        title="No Requirements Yet"
        description="Start by describing what you want to build. Create user stories with acceptance criteria."
        action="Create Requirement"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="space-y-2 sm:space-y-3 focus:outline-none"
      role="listbox"
      aria-label="Requirements list"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {requirements.map((req, index) => {
        const spec = specs.find(s => s.id === req.specId);
        const progress = getSpecProgress(req.specId);
        return (
          <RequirementCard
            key={req.id}
            requirement={req}
            spec={spec}
            progress={progress}
            projectPath={projectPath}
            onClick={() => spec && onOpenSpec(spec)}
            isSelected={isSelected(index)}
          />
        );
      })}
    </div>
  );
}

function RequirementCard({
  requirement,
  spec,
  progress,
  projectPath,
  onClick,
  isSelected = false,
}: {
  requirement: Requirement;
  spec?: Spec;
  progress: SpecProgress;
  projectPath: string;
  onClick: () => void;
  isSelected?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);
  const { openConfigModal, status: autopilotStatus, specId: autopilotSpecId } = useAutopilotStore();

  const priorityColors = {
    must: 'bg-red-500/20 text-red-400 border-red-500/30',
    should: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    could: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    wont: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  // Dynamic status based on progress
  const getStatusIcon = () => {
    if (progress.status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    }
    if (progress.status === 'in_progress') {
      return <Clock className="w-4 h-4 text-blue-400" />;
    }
    if (requirement.status === 'approved') {
      return <CheckCircle2 className="w-4 h-4 text-amber-400" />;
    }
    return <Circle className="w-4 h-4 text-gray-400" />;
  };

  // Border color based on progress
  const getBorderClass = () => {
    if (progress.status === 'completed') return 'border-green-500/30 bg-green-500/5';
    if (progress.status === 'in_progress') return 'border-blue-500/30 bg-blue-500/5';
    return 'border-white/10';
  };

  // Handle Autopilot button click
  const handleAutopilotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (spec) {
      // Read spec content from the file
      const specContent = `# ${requirement.title}\n\n${requirement.description}\n\n## Acceptance Criteria\n${requirement.acceptanceCriteria.map(c => `- ${c}`).join('\n')}`;
      openConfigModal(spec.id, requirement.title, specContent);
    }
  };

  const isAutopilotRunning = autopilotStatus === 'running' && autopilotSpecId === spec?.id;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={cn(
        'p-2 sm:p-3 bg-white/5 border rounded-lg hover:border-purple-500/30 hover:bg-white/[0.07] transition-all cursor-pointer group',
        getBorderClass(),
        isSelected && 'ring-1 ring-inset ring-purple-500/50'
      )}
      role="option"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start sm:items-center gap-1 sm:gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm text-white break-words line-clamp-2 sm:line-clamp-1">{requirement.title}</span>
            <span className={cn(
              'flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium border',
              priorityColors[requirement.priority]
            )}>
              {requirement.priority.toUpperCase()}
            </span>
            {progress.status === 'completed' && (
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                DONE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 line-clamp-2 break-words">{requirement.description}</p>

          {/* Progress Bar */}
          <ProgressBar progress={progress} />

          {/* Autopilot Button */}
          {progress.status !== 'completed' && spec && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleAutopilotClick}
                disabled={!!isAutopilotRunning}
                aria-label={isAutopilotRunning ? 'Autopilot running' : 'Start Autopilot'}
                className={cn(
                  'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all',
                  isAutopilotRunning
                    ? 'bg-purple-500/20 text-purple-400 cursor-wait'
                    : 'bg-white/10 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400 opacity-0 group-hover:opacity-100'
                )}
              >
                {isAutopilotRunning ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                    Running...
                  </>
                ) : (
                  <>
                    <Rocket className="w-3 h-3" aria-hidden="true" />
                    Autopilot
                  </>
                )}
              </button>
            </div>
          )}

          {requirement.acceptanceCriteria.length > 0 && progress.total === 0 && !spec && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{requirement.acceptanceCriteria.length} criteria</span>
            </div>
          )}
        </div>
        <ExternalLink className="w-4 h-4 flex-shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" aria-hidden="true" />
      </div>
    </div>
  );
}

// Design View
function DesignView({
  decisions,
  specs,
  onOpenSpec,
  onCreateNew,
}: {
  decisions: DesignDecision[];
  specs: Spec[];
  onOpenSpec: (spec: Spec) => void;
  onCreateNew: () => void;
}) {
  const { getSpecProgress } = useSpecsStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((dec: DesignDecision) => {
    const spec = specs.find(s => s.id === dec.specId);
    if (spec) {
      onOpenSpec(spec);
    }
  }, [specs, onOpenSpec]);

  const { selectedIndex, handleKeyDown, isSelected } = useListNavigation({
    items: decisions,
    onSelect: handleSelect,
    getItemText: (dec) => dec.title,
    typeAhead: true,
  });

  if (decisions.length === 0) {
    return (
      <EmptyState
        icon={<Cpu className="w-8 h-8" />}
        title="No Design Decisions"
        description="Create Architecture Decision Records (ADRs) to document technical choices."
        action="Create ADR"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="space-y-2 sm:space-y-3 focus:outline-none"
      role="listbox"
      aria-label="Design decisions list"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {decisions.map((dec, index) => {
        const spec = specs.find(s => s.id === dec.specId);
        const progress = getSpecProgress(dec.specId);
        return (
          <DecisionCard
            key={dec.id}
            decision={dec}
            progress={progress}
            onClick={() => spec && onOpenSpec(spec)}
            isSelected={isSelected(index)}
          />
        );
      })}
    </div>
  );
}

function DecisionCard({
  decision,
  progress,
  onClick,
  isSelected = false,
}: {
  decision: DesignDecision;
  progress: SpecProgress;
  onClick: () => void;
  isSelected?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  const statusColors = {
    proposed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
    deprecated: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  // Border color based on progress
  const getBorderClass = () => {
    if (progress.status === 'completed') return 'border-green-500/30 bg-green-500/5';
    if (progress.status === 'in_progress') return 'border-purple-500/30 bg-purple-500/5';
    return 'border-white/10';
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={cn(
        'p-2 sm:p-3 bg-white/5 border rounded-lg hover:border-purple-500/30 hover:bg-white/[0.07] transition-all cursor-pointer group',
        getBorderClass(),
        isSelected && 'ring-1 ring-inset ring-purple-500/50'
      )}
      role="option"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <Cpu className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start sm:items-center gap-1 sm:gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm text-white break-words line-clamp-2 sm:line-clamp-1">{decision.title}</span>
            <span className={cn(
              'flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium border',
              statusColors[decision.status]
            )}>
              {decision.status.toUpperCase()}
            </span>
            {progress.status === 'completed' && (
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                DONE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 line-clamp-2 break-words">{decision.context}</p>

          {/* Progress Bar */}
          <ProgressBar progress={progress} />

          {decision.consequences.length > 0 && progress.total === 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{decision.consequences.length} consequences</span>
            </div>
          )}
        </div>
        <ExternalLink className="w-4 h-4 flex-shrink-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" aria-hidden="true" />
      </div>
    </div>
  );
}

// Tasks View
function TasksView({
  tasks,
  onCreateNew,
}: {
  tasks: Task[];
  onCreateNew: () => void;
}) {
  const { updateTaskStatus } = useSpecsStore();

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ListTodo className="w-8 h-8" />}
        title="No Tasks Yet"
        description="Tasks are extracted from your specs. Create a spec with checkbox items to see tasks here."
        action="Create Spec"
        onAction={onCreateNew}
      />
    );
  }

  const groupedTasks = {
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    pending: tasks.filter(t => t.status === 'pending'),
    blocked: tasks.filter(t => t.status === 'blocked'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {groupedTasks.in_progress.length > 0 && (
        <TaskGroup
          title="In Progress"
          tasks={groupedTasks.in_progress}
          color="text-blue-400"
          onToggle={(id, current) => updateTaskStatus(id, current === 'completed' ? 'pending' : 'completed')}
        />
      )}
      {groupedTasks.pending.length > 0 && (
        <TaskGroup
          title="Pending"
          tasks={groupedTasks.pending}
          color="text-gray-400"
          onToggle={(id, current) => updateTaskStatus(id, current === 'completed' ? 'pending' : 'completed')}
        />
      )}
      {groupedTasks.blocked.length > 0 && (
        <TaskGroup
          title="Blocked"
          tasks={groupedTasks.blocked}
          color="text-red-400"
          onToggle={(id, current) => updateTaskStatus(id, current === 'completed' ? 'pending' : 'completed')}
        />
      )}
      {groupedTasks.completed.length > 0 && (
        <TaskGroup
          title="Completed"
          tasks={groupedTasks.completed}
          color="text-green-400"
          onToggle={(id, current) => updateTaskStatus(id, current === 'completed' ? 'pending' : 'completed')}
        />
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  color,
  onToggle,
}: {
  title: string;
  tasks: Task[];
  color: string;
  onToggle: (id: string, currentStatus: Task['status']) => void;
}) {
  return (
    <div>
      <h3 className={cn('text-xs font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2', color)}>
        <span className="truncate">{title}</span>
        <span className="flex-shrink-0 px-1.5 py-0.5 bg-white/10 rounded text-[10px]">{tasks.length}</span>
      </h3>
      <div className="space-y-1.5 sm:space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string, currentStatus: Task['status']) => void;
}) {
  const priorityDots = {
    low: 'bg-gray-400',
    medium: 'bg-blue-400',
    high: 'bg-amber-400',
    critical: 'bg-red-400',
  };

  const agentColors: Record<string, string> = {
    strategist: 'text-blue-400 bg-blue-400/10',
    architect: 'text-cyan-400 bg-cyan-400/10',
    builder: 'text-amber-400 bg-amber-400/10',
    guardian: 'text-green-400 bg-green-400/10',
    chronicler: 'text-purple-400 bg-purple-400/10',
  };

  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const isBlocked = task.status === 'blocked';

  // Status-based styling
  const getStatusStyles = () => {
    if (isCompleted) return 'bg-green-500/5 border-green-500/20';
    if (isInProgress) return 'bg-blue-500/10 border-blue-500/30';
    if (isBlocked) return 'bg-red-500/5 border-red-500/20 opacity-60';
    // Pending - not yet started
    return 'bg-white/5 border-white/10 hover:border-white/20';
  };

  return (
    <div
      className={cn(
        'p-2 sm:p-3 border rounded-lg transition-all group',
        getStatusStyles()
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <button
          onClick={() => onToggle(task.id, task.status)}
          className="mt-0.5 flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : isInProgress ? (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          ) : isBlocked ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Circle className="w-4 h-4 text-gray-500 hover:text-white transition-colors" />
          )}
        </button>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityDots[task.priority])} />
            <span className={cn(
              'font-medium text-sm break-words line-clamp-2',
              isCompleted ? 'line-through text-gray-500' : 'text-white'
            )}>
              {task.title}
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1 break-words">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Status Badge */}
            {isInProgress && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                In Progress
              </span>
            )}
            {isBlocked && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                Blocked
              </span>
            )}
            {isCompleted && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                Done
              </span>
            )}
            {task.status === 'pending' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
                Pending
              </span>
            )}

            {/* Agent Badge */}
            {task.assignedAgent && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                agentColors[task.assignedAgent] || 'text-gray-400 bg-gray-400/10'
              )}>
                @{task.assignedAgent}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State
function EmptyState({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-500 mb-3 sm:mb-4">
        {icon}
      </div>
      <h3 className="font-medium mb-1 sm:mb-2 text-white text-sm sm:text-base">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 max-w-[200px] sm:max-w-[220px]">{description}</p>
      <button
        onClick={onAction}
        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
      >
        {action}
      </button>
    </div>
  );
}

// Create Spec Modal
function CreateSpecModal({
  projectPath,
  activePhase,
  onClose,
}: {
  projectPath: string;
  activePhase: SpecPhase;
  onClose: () => void;
}) {
  const [type, setType] = useState<'story' | 'adr' | 'spec'>(
    activePhase === 'design' ? 'adr' : 'story'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('should');
  const [isCreating, setIsCreating] = useState(false);

  const { createSpec } = useSpecsStore();
  const { openFile } = useFileStore();

  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsCreating(true);

    const id = await createSpec(projectPath, {
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      phase: activePhase,
    });

    setIsCreating(false);

    if (id) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-[#12121a] border border-white/10 rounded-xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
          <h3 className="font-semibold text-white text-sm sm:text-base">Create New Spec</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Type</label>
            <div className="flex gap-1.5 sm:gap-2">
              {[
                { id: 'story', label: 'Story', fullLabel: 'User Story', icon: <FileText className="w-4 h-4" /> },
                { id: 'adr', label: 'ADR', fullLabel: 'ADR', icon: <Cpu className="w-4 h-4" /> },
                { id: 'spec', label: 'Spec', fullLabel: 'Spec', icon: <ListTodo className="w-4 h-4" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id as 'story' | 'adr' | 'spec')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm transition-all',
                    type === t.id
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  )}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.fullLabel}</span>
                  <span className="sm:hidden">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'story' ? 'User authentication flow' : type === 'adr' ? 'Use PostgreSQL for database' : 'Feature specification'}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Priority (for stories) */}
          {type === 'story' && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Priority</label>
              <div className="flex gap-1.5 sm:gap-2">
                {[
                  { id: 'must', label: 'Must', color: 'text-red-400' },
                  { id: 'should', label: 'Should', color: 'text-amber-400' },
                  { id: 'could', label: 'Could', color: 'text-blue-400' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={cn(
                      'flex-1 px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm transition-all',
                      priority === p.id
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    <span className={p.color}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
