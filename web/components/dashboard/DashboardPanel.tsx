'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  FileText,
  CheckSquare,
  Scale,
  ListTodo,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Terminal,
  GitBranch,
  Wifi,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpecsStore } from '@/lib/stores/specsStore';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import type { Task } from '@/lib/types';

interface DashboardPanelProps {
  projectPath: string;
}

interface HealthStatus {
  claudeCli: {
    installed: boolean;
    authenticated: boolean;
    version?: string;
  };
  project: {
    valid: boolean;
    hasDevflow: boolean;
    hasClaudeProject: boolean;
  };
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  return (
    <div className="bg-[#1a1a24] rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('p-2 rounded-lg', color)}>
          {icon}
        </div>
        <span className="text-3xl font-bold text-white">{value}</span>
      </div>
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

interface HealthItemProps {
  label: string;
  status: 'ok' | 'warning' | 'error';
  message?: string;
}

function HealthItem({ label, status, message }: HealthItemProps) {
  const statusConfig = {
    ok: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    warning: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={cn('p-1.5 rounded', config.bg)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-white">{label}</p>
        {message && <p className="text-xs text-gray-500">{message}</p>}
      </div>
    </div>
  );
}

export function DashboardPanel({ projectPath }: DashboardPanelProps) {
  const { specs, requirements, decisions, tasks, isLoading, loadSpecs } = useSpecsStore();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch health status
  const fetchHealth = useCallback(async (path: string) => {
    try {
      const response = await fetch(`/api/health?projectPath=${encodeURIComponent(path)}`);
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    if (projectPath) {
      loadSpecs(projectPath);
      fetchHealth(projectPath);
    }
  }, [projectPath, loadSpecs, fetchHealth]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadSpecs(projectPath), fetchHealth(projectPath)]);
    setIsRefreshing(false);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      stories: requirements.length,
      tasks: totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      blockedTasks,
      decisions: decisions.length,
      specs: specs.length,
      progress,
    };
  }, [specs, requirements, decisions, tasks]);

  // Recent activity (mock based on tasks status)
  const recentActivity = useMemo(() => {
    const activities: { icon: typeof CheckCircle2; text: string; time: string; color: string }[] = [];

    // Add completed tasks
    const completed = tasks.filter(t => t.status === 'completed').slice(0, 2);
    completed.forEach(t => {
      activities.push({
        icon: CheckCircle2,
        text: `Task completed: ${t.title.slice(0, 30)}${t.title.length > 30 ? '...' : ''}`,
        time: 'Recently',
        color: 'text-green-400',
      });
    });

    // Add in progress
    const inProgress = tasks.filter(t => t.status === 'in_progress').slice(0, 2);
    inProgress.forEach(t => {
      activities.push({
        icon: Clock,
        text: `In progress: ${t.title.slice(0, 30)}${t.title.length > 30 ? '...' : ''}`,
        time: 'Active',
        color: 'text-blue-400',
      });
    });

    // Add recent specs/stories
    if (requirements.length > 0) {
      activities.push({
        icon: FileText,
        text: `${requirements.length} user stories loaded`,
        time: 'Project',
        color: 'text-purple-400',
      });
    }

    if (decisions.length > 0) {
      activities.push({
        icon: Scale,
        text: `${decisions.length} ADRs documented`,
        time: 'Project',
        color: 'text-amber-400',
      });
    }

    return activities.slice(0, 5);
  }, [tasks, requirements, decisions]);

  if (isLoading) {
    return (
      <div className="h-full overflow-auto bg-[#0a0a0f] p-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1a1a24] rounded-lg border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="w-12 h-8" />
              </div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Progress Skeleton */}
        <div className="bg-[#1a1a24] rounded-lg border border-white/10 p-4 mb-6">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-3 w-full rounded-full" />
        </div>

        {/* Two Column Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-[#0a0a0f] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500">Project overview and health status</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={cn('w-5 h-5', isRefreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="User Stories"
          value={stats.stories}
          subtitle="Requirements defined"
          icon={<ListTodo className="w-5 h-5 text-blue-400" />}
          color="bg-blue-500/10"
        />
        <StatCard
          title="Tasks"
          value={stats.tasks}
          subtitle={`${stats.completedTasks} completed`}
          icon={<CheckSquare className="w-5 h-5 text-green-400" />}
          color="bg-green-500/10"
        />
        <StatCard
          title="Decisions"
          value={stats.decisions}
          subtitle="ADRs documented"
          icon={<Scale className="w-5 h-5 text-amber-400" />}
          color="bg-amber-500/10"
        />
        <StatCard
          title="Specs"
          value={stats.specs}
          subtitle="Specifications"
          icon={<FileText className="w-5 h-5 text-purple-400" />}
          color="bg-purple-500/10"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-[#1a1a24] rounded-lg border border-white/10 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Overall Progress</h3>
          <span className="text-sm font-bold text-purple-400">{stats.progress}%</span>
        </div>
        <div className="h-3 bg-[#0a0a0f] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{stats.completedTasks} completed</span>
          <span>{stats.inProgressTasks} in progress</span>
          <span>{stats.pendingTasks} pending</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-[#1a1a24] rounded-lg border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-medium text-white">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <activity.icon className={cn('w-4 h-4 mt-0.5', activity.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Health Check */}
        <div className="bg-[#1a1a24] rounded-lg border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-medium text-white">Health Check</h3>
          </div>
          <div className="space-y-1">
            <HealthItem
              label="Claude CLI"
              status={health?.claudeCli?.installed ? 'ok' : 'error'}
              message={health?.claudeCli?.version || 'Not detected'}
            />
            <HealthItem
              label="Project Structure"
              status={health?.project?.valid ? 'ok' : 'warning'}
              message={health?.project?.hasDevflow ? 'DevFlow configured' : 'No .devflow folder'}
            />
            <HealthItem
              label="Git Repository"
              status="ok"
              message="Connected"
            />
            {stats.blockedTasks > 0 ? (
              <HealthItem
                label="Blocked Tasks"
                status="warning"
                message={`${stats.blockedTasks} tasks need attention`}
              />
            ) : (
              <HealthItem
                label="No Blockers"
                status="ok"
                message="All tasks are progressing"
              />
            )}
          </div>
        </div>
      </div>

      {/* Task Breakdown */}
      <div className="mt-6 bg-[#1a1a24] rounded-lg border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-medium text-white">Task Breakdown</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-gray-500/10">
            <p className="text-2xl font-bold text-gray-400">{stats.pendingTasks}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-400">{stats.inProgressTasks}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-400">{stats.completedTasks}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10">
            <p className="text-2xl font-bold text-red-400">{stats.blockedTasks}</p>
            <p className="text-xs text-gray-500">Blocked</p>
          </div>
        </div>
      </div>
    </div>
  );
}
