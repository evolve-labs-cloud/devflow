'use client';

import { useState, useCallback } from 'react';
import { useFileStore } from '@/lib/stores/fileStore';
import { cn, getFileName } from '@/lib/utils';
import { X, FileText, FileCode, FileJson, Settings, Loader2, Pin, ChevronLeft, ChevronRight } from 'lucide-react';
import { TabContextMenu } from './TabContextMenu';

// Get icon by language
function getLanguageIcon(language: string) {
  switch (language) {
    case 'markdown':
      return FileText;
    case 'typescript':
    case 'javascript':
      return FileCode;
    case 'json':
      return FileJson;
    case 'yaml':
      return Settings;
    default:
      return FileText;
  }
}

// Get color by language
function getLanguageColor(language: string): string {
  switch (language) {
    case 'typescript':
      return 'text-blue-400';
    case 'javascript':
      return 'text-yellow-400';
    case 'markdown':
      return 'text-gray-400';
    case 'json':
      return 'text-amber-400';
    case 'yaml':
      return 'text-purple-400';
    default:
      return 'text-gray-400';
  }
}

interface ContextMenuState {
  path: string;
  position: { x: number; y: number };
}

export function EditorTabs() {
  const {
    openFiles,
    activeFile,
    setActiveFile,
    closeFile,
    isSaving,
    savingFile,
    pinnedFiles,
    navigateBack,
    navigateForward,
    canGoBack,
    canGoForward,
  } = useFileStore();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleNavigateBack = useCallback(() => {
    if (canGoBack()) {
      navigateBack();
    }
  }, [canGoBack, navigateBack]);

  const handleNavigateForward = useCallback(() => {
    if (canGoForward()) {
      navigateForward();
    }
  }, [canGoForward, navigateForward]);

  const handleClose = useCallback((e: React.MouseEvent, path: string) => {
    e.stopPropagation();

    // Check if dirty
    const file = openFiles.find((f) => f.path === path);
    if (file?.isDirty) {
      const shouldClose = confirm('File has unsaved changes. Close anyway?');
      if (!shouldClose) return;
    }

    closeFile(path);
  }, [openFiles, closeFile]);

  const handleMiddleClick = useCallback((e: React.MouseEvent, path: string) => {
    if (e.button === 1) {
      handleClose(e, path);
    }
  }, [handleClose]);

  const handleContextMenu = useCallback((e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      path,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <>
      {/* Navigation buttons */}
      <div className="flex items-center gap-0.5 px-1 border-r border-white/10">
        <button
          onClick={handleNavigateBack}
          disabled={!canGoBack()}
          className={cn(
            'p-1.5 rounded transition-colors',
            canGoBack()
              ? 'text-gray-400 hover:text-white hover:bg-white/10'
              : 'text-gray-600 cursor-not-allowed'
          )}
          aria-label="Go back"
          title="Go back (Alt+Left)"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={handleNavigateForward}
          disabled={!canGoForward()}
          className={cn(
            'p-1.5 rounded transition-colors',
            canGoForward()
              ? 'text-gray-400 hover:text-white hover:bg-white/10'
              : 'text-gray-600 cursor-not-allowed'
          )}
          aria-label="Go forward"
          title="Go forward (Alt+Right)"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div
        className="flex-1 flex items-center overflow-x-auto"
        role="tablist"
        aria-label="Open files"
      >
        {openFiles.map((file) => {
          const Icon = getLanguageIcon(file.language);
          const iconColor = getLanguageColor(file.language);
          const isActive = activeFile === file.path;
          const isPinned = pinnedFiles.includes(file.path);

          return (
            <div
              key={file.path}
              className={cn(
                'group flex items-center gap-2 px-3 py-2 border-r border-white/10 cursor-pointer transition-colors',
                isActive
                  ? 'bg-[#0a0a0f] text-white'
                  : 'bg-[#08080c] text-gray-400 hover:text-white hover:bg-white/5',
                isPinned && 'border-l-2 border-l-purple-500/50'
              )}
              onClick={() => setActiveFile(file.path)}
              onMouseDown={(e) => handleMiddleClick(e, file.path)}
              onContextMenu={(e) => handleContextMenu(e, file.path)}
              role="tab"
              aria-selected={isActive}
              aria-label={`${file.name}${file.isDirty ? ' (unsaved)' : ''}${isPinned ? ' (pinned)' : ''}`}
              tabIndex={isActive ? 0 : -1}
            >
              {/* Pin indicator */}
              {isPinned && (
                <Pin
                  className="w-3 h-3 text-purple-400 flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              <Icon className={cn('w-4 h-4 flex-shrink-0', iconColor)} aria-hidden="true" />

              <span className="text-sm truncate max-w-[120px]">
                {file.name}
              </span>

              {/* Saving/Dirty indicator */}
              {isSaving && savingFile === file.path ? (
                <Loader2
                  className="w-3 h-3 animate-spin text-purple-400 flex-shrink-0"
                  aria-label="Saving"
                />
              ) : file.isDirty ? (
                <span
                  className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"
                  aria-label="Unsaved changes"
                />
              ) : null}

              {/* Close button - hidden for pinned tabs unless hovered */}
              <button
                onClick={(e) => handleClose(e, file.path)}
                className={cn(
                  'p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0',
                  isPinned
                    ? 'opacity-0 group-hover:opacity-100'
                    : isActive
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100'
                )}
                aria-label={`Close ${file.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <TabContextMenu
          path={contextMenu.path}
          position={contextMenu.position}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
}
