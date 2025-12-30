'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGitStore } from '@/lib/stores/gitStore';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  GitCommit,
  Plus,
  Minus,
  Check,
  X,
  RefreshCw,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  FileText,
  FilePlus,
  FileX,
  FileEdit,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

interface GitPanelProps {
  projectPath: string;
}

type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';

function getFileStatusIcon(status: FileStatus) {
  switch (status) {
    case 'added':
      return <FilePlus className="w-4 h-4 text-green-400" />;
    case 'deleted':
      return <FileX className="w-4 h-4 text-red-400" />;
    case 'modified':
      return <FileEdit className="w-4 h-4 text-yellow-400" />;
    case 'renamed':
    case 'copied':
      return <FileText className="w-4 h-4 text-blue-400" />;
    default:
      return <FileText className="w-4 h-4 text-gray-400" />;
  }
}

function getFileStatusBadge(status: FileStatus) {
  const badges: Record<FileStatus, { text: string; color: string }> = {
    added: { text: 'A', color: 'text-green-400 bg-green-400/10' },
    modified: { text: 'M', color: 'text-yellow-400 bg-yellow-400/10' },
    deleted: { text: 'D', color: 'text-red-400 bg-red-400/10' },
    renamed: { text: 'R', color: 'text-blue-400 bg-blue-400/10' },
    copied: { text: 'C', color: 'text-blue-400 bg-blue-400/10' },
  };

  const badge = badges[status];
  return (
    <span className={cn('text-xs font-mono px-1.5 py-0.5 rounded', badge.color)}>
      {badge.text}
    </span>
  );
}

export function GitPanel({ projectPath }: GitPanelProps) {
  const {
    status,
    branches,
    isLoading,
    error,
    fetchStatus,
    fetchBranches,
    stageFiles,
    unstageFiles,
    stageAll,
    unstageAll,
    commit,
    push,
    pull,
    checkout,
    createBranch,
    discardChanges,
    initRepo,
    setError,
  } = useGitStore();

  const [commitMessage, setCommitMessage] = useState('');
  const [showBranches, setShowBranches] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [stagedExpanded, setStagedExpanded] = useState(true);
  const [unstagedExpanded, setUnstagedExpanded] = useState(true);
  const [untrackedExpanded, setUntrackedExpanded] = useState(true);

  // Fetch status on mount and set up polling
  useEffect(() => {
    fetchStatus(projectPath);
    fetchBranches(projectPath);

    // Poll for status every 5 seconds
    const interval = setInterval(() => {
      fetchStatus(projectPath);
    }, 5000);

    return () => clearInterval(interval);
  }, [projectPath, fetchStatus, fetchBranches]);

  const handleRefresh = useCallback(() => {
    fetchStatus(projectPath);
    fetchBranches(projectPath);
  }, [projectPath, fetchStatus, fetchBranches]);

  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) return;

    const result = await commit(projectPath, commitMessage);
    if (result.success) {
      setCommitMessage('');
    }
  }, [projectPath, commitMessage, commit]);

  const handlePush = useCallback(() => {
    push(projectPath);
  }, [projectPath, push]);

  const handlePull = useCallback(() => {
    pull(projectPath);
  }, [projectPath, pull]);

  const handleCheckout = useCallback(async (branch: string) => {
    await checkout(projectPath, branch);
    setShowBranches(false);
  }, [projectPath, checkout]);

  const handleCreateBranch = useCallback(async () => {
    if (!newBranchName.trim()) return;

    const result = await createBranch(projectPath, newBranchName);
    if (result.success) {
      setNewBranchName('');
      setShowNewBranch(false);
    }
  }, [projectPath, newBranchName, createBranch]);

  const handleInit = useCallback(() => {
    initRepo(projectPath);
  }, [projectPath, initRepo]);

  // Not a git repo
  if (status && !status.isRepo) {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0f]">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Source Control
          </h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <GitBranch className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-sm text-gray-400 mb-4">
            This folder is not a Git repository
          </p>
          <button
            onClick={handleInit}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            Initialize Repository
          </button>
        </div>
      </div>
    );
  }

  const totalChanges = (status?.staged.length || 0) + (status?.unstaged.length || 0) + (status?.untracked.length || 0);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Source Control
            {totalChanges > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                {totalChanges}
              </span>
            )}
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* Branch Selector */}
        <div className="relative">
          <button
            onClick={() => setShowBranches(!showBranches)}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span className="text-white">{status?.branch || 'main'}</span>
            </div>
            <div className="flex items-center gap-2">
              {status?.ahead ? (
                <span className="text-xs text-green-400">{status.ahead}</span>
              ) : null}
              {status?.behind ? (
                <span className="text-xs text-yellow-400">{status.behind}</span>
              ) : null}
              <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', showBranches && 'rotate-180')} />
            </div>
          </button>

          {/* Branch Dropdown */}
          {showBranches && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#12121a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {branches.map((branch) => (
                  <button
                    key={branch.name}
                    onClick={() => handleCheckout(branch.name)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors',
                      branch.current && 'bg-purple-500/10'
                    )}
                  >
                    {branch.current && <Check className="w-4 h-4 text-purple-400" />}
                    {!branch.current && <div className="w-4" />}
                    <span className={branch.current ? 'text-purple-400' : 'text-gray-300'}>
                      {branch.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-white/10 p-2">
                {showNewBranch ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                      placeholder="New branch name"
                      className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                    <button
                      onClick={handleCreateBranch}
                      className="p-1 text-green-400 hover:bg-white/10 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setShowNewBranch(false); setNewBranchName(''); }}
                      className="p-1 text-red-400 hover:bg-white/10 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewBranch(true)}
                    className="w-full flex items-center gap-2 px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create new branch
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-3 mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-400 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Changes */}
      <div className="flex-1 overflow-y-auto">
        {/* Staged Changes */}
        {status?.staged && status.staged.length > 0 && (
          <div className="border-b border-white/5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setStagedExpanded(!stagedExpanded)}
              onKeyDown={(e) => e.key === 'Enter' && setStagedExpanded(!stagedExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {stagedExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-medium text-green-400">Staged Changes</span>
                <span className="text-xs text-gray-500">{status.staged.length}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); unstageAll(projectPath); }}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                title="Unstage All"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>

            {stagedExpanded && (
              <div className="pb-2">
                {status.staged.map((file) => (
                  <div
                    key={file.path}
                    className="group flex items-center gap-2 px-3 py-1 hover:bg-white/5 transition-colors"
                  >
                    {getFileStatusIcon(file.status)}
                    <span className="flex-1 text-xs text-gray-300 truncate" title={file.path}>
                      {file.path}
                    </span>
                    {getFileStatusBadge(file.status)}
                    <button
                      onClick={() => unstageFiles(projectPath, [file.path])}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-opacity"
                      title="Unstage"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unstaged Changes */}
        {status?.unstaged && status.unstaged.length > 0 && (
          <div className="border-b border-white/5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setUnstagedExpanded(!unstagedExpanded)}
              onKeyDown={(e) => e.key === 'Enter' && setUnstagedExpanded(!unstagedExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {unstagedExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-medium text-yellow-400">Changes</span>
                <span className="text-xs text-gray-500">{status.unstaged.length}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); discardChanges(projectPath, status.unstaged.map(f => f.path)); }}
                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded"
                  title="Discard All"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); stageFiles(projectPath, status.unstaged.map(f => f.path)); }}
                  className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                  title="Stage All"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {unstagedExpanded && (
              <div className="pb-2">
                {status.unstaged.map((file) => (
                  <div
                    key={file.path}
                    className="group flex items-center gap-2 px-3 py-1 hover:bg-white/5 transition-colors"
                  >
                    {getFileStatusIcon(file.status)}
                    <span className="flex-1 text-xs text-gray-300 truncate" title={file.path}>
                      {file.path}
                    </span>
                    {getFileStatusBadge(file.status)}
                    <button
                      onClick={() => discardChanges(projectPath, [file.path])}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-opacity"
                      title="Discard"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => stageFiles(projectPath, [file.path])}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-opacity"
                      title="Stage"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Untracked Files */}
        {status?.untracked && status.untracked.length > 0 && (
          <div className="border-b border-white/5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setUntrackedExpanded(!untrackedExpanded)}
              onKeyDown={(e) => e.key === 'Enter' && setUntrackedExpanded(!untrackedExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {untrackedExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-medium text-gray-400">Untracked</span>
                <span className="text-xs text-gray-500">{status.untracked.length}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); stageFiles(projectPath, status.untracked); }}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                title="Stage All"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {untrackedExpanded && (
              <div className="pb-2">
                {status.untracked.map((file) => (
                  <div
                    key={file}
                    className="group flex items-center gap-2 px-3 py-1 hover:bg-white/5 transition-colors"
                  >
                    <FilePlus className="w-4 h-4 text-green-400" />
                    <span className="flex-1 text-xs text-gray-300 truncate" title={file}>
                      {file}
                    </span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded text-green-400 bg-green-400/10">U</span>
                    <button
                      onClick={() => stageFiles(projectPath, [file])}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-opacity"
                      title="Stage"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Changes */}
        {totalChanges === 0 && status?.isRepo && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Check className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-sm text-gray-400">No changes</p>
            <p className="text-xs text-gray-600">Working tree clean</p>
          </div>
        )}
      </div>

      {/* Commit Section */}
      {status?.isRepo && (
        <div className="border-t border-white/10 p-3">
          {/* Commit Message */}
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            rows={3}
          />

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || !status?.staged?.length || isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              <GitCommit className="w-4 h-4" />
              Commit
            </button>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={handlePull}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-3 h-3" />
              Pull
            </button>
            <button
              onClick={handlePush}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload className="w-3 h-3" />
              Push
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
