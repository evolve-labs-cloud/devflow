'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';
import { useFileStore } from '@/lib/stores/fileStore';
import { useProjectStore } from '@/lib/stores/projectStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useListNavigation } from '@/hooks/useListNavigation';
import { File, FileText, FileCode, FileJson, Clock, Pin } from 'lucide-react';
import { cn, getFileName } from '@/lib/utils';

interface RecentFileItem {
  path: string;
  name: string;
  relativePath: string;
  extension: string;
  isOpen: boolean;
  isPinned: boolean;
}

const getFileIcon = (extension: string) => {
  switch (extension) {
    case 'md':
      return <FileText className="w-4 h-4 text-blue-400" aria-hidden="true" />;
    case 'json':
    case 'yaml':
    case 'yml':
      return <FileJson className="w-4 h-4 text-yellow-400" aria-hidden="true" />;
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-green-400" aria-hidden="true" />;
    default:
      return <File className="w-4 h-4 text-gray-400" aria-hidden="true" />;
  }
};

/**
 * Recent Files modal (Ctrl+Tab).
 * Shows recently opened files for quick navigation.
 */
export function RecentFiles() {
  const modalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { activeModal, closeModal } = useUIStore();
  const { recentFiles, openFiles, pinnedFiles, openFile, activeFile } = useFileStore();
  const { currentProject } = useProjectStore();

  const isOpen = activeModal === 'recentFiles';

  // Build list of recent files with metadata
  const fileItems = useMemo((): RecentFileItem[] => {
    const projectPath = currentProject?.path || '';

    return recentFiles.map((path) => {
      let relativePath = path;
      if (projectPath && path.startsWith(projectPath)) {
        relativePath = path.slice(projectPath.length);
        if (relativePath.startsWith('/')) {
          relativePath = relativePath.slice(1);
        }
      }

      const name = getFileName(path);
      const extension = name.includes('.') ? name.split('.').pop() || '' : '';

      return {
        path,
        name,
        relativePath,
        extension,
        isOpen: openFiles.some((f) => f.path === path),
        isPinned: pinnedFiles.includes(path),
      };
    });
  }, [recentFiles, openFiles, pinnedFiles, currentProject]);

  // Keyboard navigation
  const { selectedIndex, setSelectedIndex, handleKeyDown, isSelected } = useListNavigation({
    items: fileItems,
    onSelect: (item) => {
      openFile(item.path);
      closeModal();
    },
    onEscape: closeModal,
  });

  // Focus trap
  useFocusTrap(modalRef, isOpen, {
    onEscape: closeModal,
  });

  // Reset selection when opened
  useEffect(() => {
    if (isOpen) {
      // Find current active file in the list and select it, or default to 0
      const activeIndex = fileItems.findIndex((f) => f.path === activeFile);
      setSelectedIndex(activeIndex >= 0 ? activeIndex : 0);
    }
  }, [isOpen, fileItems, activeFile, setSelectedIndex]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current || !isOpen) return;
    const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-lg bg-[#12121a] border border-white/10 rounded-xl shadow-2xl overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Recent files"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Clock className="w-5 h-5 text-purple-400" aria-hidden="true" />
          <h2 className="text-sm font-medium text-white">Recent Files</h2>
          <div className="flex-1" />
          <div className="text-xs text-gray-600 border border-white/10 px-1.5 py-0.5 rounded">
            esc
          </div>
        </div>

        {/* File List */}
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto"
          role="listbox"
          aria-label="Recent files list"
        >
          {fileItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No recent files
            </div>
          ) : (
            fileItems.map((file, index) => (
              <button
                key={file.path}
                onClick={() => {
                  openFile(file.path);
                  closeModal();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  isSelected(index)
                    ? 'bg-purple-500/20 border-l-2 border-purple-500'
                    : 'hover:bg-white/5 border-l-2 border-transparent'
                )}
                role="option"
                aria-selected={isSelected(index)}
                tabIndex={isSelected(index) ? 0 : -1}
              >
                {getFileIcon(file.extension)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white truncate">{file.name}</span>
                    {file.isPinned && (
                      <Pin className="w-3 h-3 text-purple-400 flex-shrink-0" aria-label="Pinned" />
                    )}
                    {file.isOpen && (
                      <span className="text-xs text-gray-500 flex-shrink-0">• open</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{file.relativePath}</div>
                </div>

                {file.path === activeFile && (
                  <span className="text-xs text-purple-400 flex-shrink-0">current</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
          </div>
          <div>{fileItems.length} files</div>
        </div>
      </div>
    </div>
  );
}
