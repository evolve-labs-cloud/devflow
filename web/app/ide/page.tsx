'use client';

import { useEffect, useCallback } from 'react';
import { useProjectStore } from '@/lib/stores/projectStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { SpecsPanel } from '@/components/specs/SpecsPanel';
import { TerminalPanel } from '@/components/terminal/TerminalPanel';
import { GitPanel } from '@/components/git/GitPanel';
import { DashboardPanel } from '@/components/dashboard/DashboardPanel';
import { StatusBar } from '@/components/layout/StatusBar';
import { ResizeHandle } from '@/components/ui/ResizeHandle';
import { QuickOpen } from '@/components/modals/QuickOpen';
import { GlobalSearch } from '@/components/modals/GlobalSearch';
import { CommandPalette } from '@/components/modals/CommandPalette';
import { RecentFiles } from '@/components/modals/RecentFiles';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { AutopilotPanel } from '@/components/autopilot/AutopilotPanel';
import { AutopilotConfigModal } from '@/components/autopilot/AutopilotConfigModal';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { SkipLinks } from '@/components/ui/SkipLinks';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  FileText,
  Terminal,
  LayoutDashboard,
  Zap,
  Settings,
  GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function IDEPage() {
  const { currentProject, projects, activeProjectPath } = useProjectStore();
  const { openSettings } = useSettingsStore();
  const projectPaths = projects.map(p => p.path);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  const {
    sidebarVisible,
    sidebarWidth,
    activePanel,
    setActivePanel,
    terminalVisible,
    terminalHeight,
    terminalMaximized,
    toggleSidebar,
    toggleTerminal,
    toggleTerminalMaximized,
    setSidebarWidth,
    setTerminalHeight,
  } = useUIStore();

  // Resize handlers
  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth(sidebarWidth + delta);
  }, [sidebarWidth, setSidebarWidth]);

  const sidebarItems = [
    { id: 'specs', icon: FileText, label: 'Specs' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ] as const;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white overflow-hidden">
      {/* Skip Links for accessibility */}
      <SkipLinks />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" role="main">
        {/* Activity Bar */}
        <div className="w-12 bg-[#08080c] border-r border-white/10 flex flex-col items-center py-2">
          {/* Logo */}
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-4">
            <Zap className="w-4 h-4 text-white" />
          </div>

          {/* Nav Items */}
          <div className="flex-1 flex flex-col gap-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (activePanel === item.id && sidebarVisible) {
                    toggleSidebar();
                  } else {
                    setActivePanel(item.id);
                    if (!sidebarVisible) toggleSidebar();
                  }
                }}
                className={cn(
                  'w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                  activePanel === item.id && sidebarVisible
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                )}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col gap-1">
            <button
              onClick={toggleTerminal}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                terminalVisible
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              )}
              title="Terminal"
            >
              <Terminal className="w-5 h-5" />
            </button>
            <button
              onClick={openSettings}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              title="Settings (Cmd+,)"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Panel */}
        {sidebarVisible && (
          <>
            <aside
              id="main-sidebar"
              className="h-full bg-[#0a0a0f] flex-shrink-0 overflow-hidden flex flex-col"
              style={{ width: sidebarWidth }}
              aria-label="Sidebar"
            >
              {/* Project Selector */}
              <div className="px-2 pt-2 pb-1 flex-shrink-0">
                <ProjectSelector />
              </div>

              {/* Panel Content */}
              <div className="flex-1 min-h-0 overflow-hidden">
              {activePanel === 'git' && currentProject && (
                <GitPanel projectPath={currentProject.path} />
              )}
              {activePanel === 'specs' && projectPaths.length > 0 && (
                <SpecsPanel projectPaths={projectPaths} activeProjectPath={activeProjectPath} />
              )}
              {activePanel === 'dashboard' && currentProject && (
                <DashboardPanel projectPath={currentProject.path} />
              )}
              </div>
            </aside>
            {/* Sidebar Resize Handle */}
            <ResizeHandle
              direction="horizontal"
              side="right"
              onResize={handleSidebarResize}
              className="bg-white/5 hover:bg-purple-500/30"
            />
          </>
        )}

        {/* Editor + Terminal Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Editor */}
          <div
            id="main-editor"
            className={cn(
              'flex-1 min-h-0',
              terminalVisible && !terminalMaximized && 'pb-0'
            )}
            tabIndex={-1}
          >
            <EditorPanel />
          </div>

          {/* Terminal */}
          {terminalVisible && currentProject && (
            <TerminalPanel
              projectPath={currentProject.path}
              isMaximized={terminalMaximized}
              onToggleMaximize={toggleTerminalMaximized}
              onClose={toggleTerminal}
              height={terminalHeight}
              onHeightChange={setTerminalHeight}
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Modals */}
      <QuickOpen />
      <GlobalSearch />
      <CommandPalette />
      <RecentFiles />
      <SettingsPanel />

      {/* Autopilot */}
      {currentProject && (
        <>
          <AutopilotConfigModal projectPath={currentProject.path} />
          <AutopilotPanel />
        </>
      )}
    </div>
  );
}
