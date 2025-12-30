'use client';

import { useProjectStore } from '@/lib/stores/projectStore';
import { useFileStore } from '@/lib/stores/fileStore';
import { useUIStore } from '@/lib/stores/uiStore';
import {
  FolderOpen,
  GitBranch,
  CheckCircle,
  XCircle,
  Zap,
  Sparkles
} from 'lucide-react';

export function StatusBar() {
  const { currentProject, health } = useProjectStore();
  const { activeFile, openFiles } = useFileStore();
  const { selectedModel, autopilot } = useUIStore();

  const activeOpenFile = openFiles.find(f => f.path === activeFile);

  const modelNames: Record<string, string> = {
    'claude-sonnet-4': 'Sonnet 4',
    'claude-opus-4': 'Opus 4',
    'auto': 'Auto',
  };

  return (
    <div className="h-7 bg-[#12121a] border-t border-white/10 text-gray-400 flex items-center justify-between px-3 text-xs">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Project name */}
        {currentProject && (
          <div className="flex items-center gap-1.5 text-gray-300">
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>{currentProject.name}</span>
          </div>
        )}

        {/* Git branch */}
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5" />
          <span>main</span>
        </div>

        {/* Claude CLI status */}
        <div className="flex items-center gap-1.5">
          {health?.claudeCli.installed ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Claude CLI</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Claude CLI not found</span>
            </>
          )}
        </div>

              </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Autopilot indicator */}
        {autopilot.enabled && (
          <div className="flex items-center gap-1.5 text-purple-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Autopilot</span>
          </div>
        )}

        {/* Model */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>{modelNames[selectedModel] || selectedModel}</span>
        </div>

        {/* File info */}
        {activeOpenFile && (
          <>
            <span>Ln 1, Col 1</span>
            <span className="text-gray-500">|</span>
            <span>{activeOpenFile.language}</span>
            <span className="text-gray-500">|</span>
            <span>UTF-8</span>
          </>
        )}

        {/* Stats */}
        {currentProject && (
          <div className="flex items-center gap-2 text-gray-500">
            <span>{currentProject.stats.stories} stories</span>
            <span>{currentProject.stats.adrs} ADRs</span>
          </div>
        )}
      </div>
    </div>
  );
}
