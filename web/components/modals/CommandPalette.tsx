'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';
import { useProjectStore } from '@/lib/stores/projectStore';
import {
  Command,
  Search,
  FileText,
  GitBranch,
  Terminal,
  Moon,
  Sun,
  FolderOpen,
  Save,
  X,
  Eye,
  EyeOff,
  LayoutPanelLeft,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileStore } from '@/lib/stores/fileStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  category: string;
  action: () => void;
}

export function CommandPalette() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { activeModal, closeModal, openModal } = useUIStore();
  const {
    toggleSidebar,
    sidebarVisible,
    toggleTerminal,
    terminalVisible,
    togglePreview,
    previewVisible,
    toggleTerminalMaximized,
    terminalMaximized,
    theme,
    setTheme,
    setActivePanel,
  } = useUIStore();

  const { currentProject } = useProjectStore();
  const { activeFile, saveFile, openFiles } = useFileStore();

  const isOpen = activeModal === 'commandPalette';

  // Focus trap for accessibility
  useFocusTrap(modalRef, isOpen, {
    onEscape: closeModal,
    autoFocus: false, // We handle focus manually to the input
  });

  // Define all commands
  const commands: CommandItem[] = useMemo(() => [
    // File Commands
    {
      id: 'quick-open',
      label: 'Go to File',
      description: 'Quickly open a file by name',
      icon: <Search className="w-4 h-4" />,
      shortcut: '⌘P',
      category: 'File',
      action: () => {
        closeModal();
        setTimeout(() => openModal('quickOpen'), 50);
      },
    },
    {
      id: 'global-search',
      label: 'Search in Files',
      description: 'Search text in all files',
      icon: <FileText className="w-4 h-4" />,
      shortcut: '⌘⇧F',
      category: 'File',
      action: () => {
        closeModal();
        setTimeout(() => openModal('globalSearch'), 50);
      },
    },
    {
      id: 'save-file',
      label: 'Save File',
      description: 'Save the current file',
      icon: <Save className="w-4 h-4" />,
      shortcut: '⌘S',
      category: 'File',
      action: () => {
        if (activeFile) {
          saveFile(activeFile);
        }
        closeModal();
      },
    },

    // View Commands
    {
      id: 'toggle-sidebar',
      label: sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar',
      icon: <LayoutPanelLeft className="w-4 h-4" />,
      shortcut: '⌘B',
      category: 'View',
      action: () => {
        toggleSidebar();
        closeModal();
      },
    },
    {
      id: 'toggle-terminal',
      label: terminalVisible ? 'Hide Terminal' : 'Show Terminal',
      icon: <Terminal className="w-4 h-4" />,
      shortcut: '⌘`',
      category: 'View',
      action: () => {
        toggleTerminal();
        closeModal();
      },
    },
    {
      id: 'toggle-terminal-max',
      label: terminalMaximized ? 'Restore Terminal' : 'Maximize Terminal',
      icon: terminalMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />,
      category: 'View',
      action: () => {
        toggleTerminalMaximized();
        closeModal();
      },
    },
    {
      id: 'toggle-preview',
      label: previewVisible ? 'Hide Preview' : 'Show Preview',
      icon: previewVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />,
      shortcut: '⌘⇧V',
      category: 'View',
      action: () => {
        togglePreview();
        closeModal();
      },
    },

    // Panel Commands
    {
      id: 'show-explorer',
      label: 'Show Explorer',
      icon: <FolderOpen className="w-4 h-4" />,
      category: 'Panels',
      action: () => {
        setActivePanel('explorer');
        closeModal();
      },
    },
    {
      id: 'show-git',
      label: 'Show Source Control',
      icon: <GitBranch className="w-4 h-4" />,
      category: 'Panels',
      action: () => {
        setActivePanel('git');
        closeModal();
      },
    },
    {
      id: 'show-specs',
      label: 'Show Specs',
      icon: <FileText className="w-4 h-4" />,
      category: 'Panels',
      action: () => {
        setActivePanel('specs');
        closeModal();
      },
    },

    // Theme Commands
    {
      id: 'theme-dark',
      label: 'Dark Theme',
      icon: <Moon className="w-4 h-4" />,
      category: 'Preferences',
      action: () => {
        setTheme('dark');
        closeModal();
      },
    },
    {
      id: 'theme-light',
      label: 'Light Theme',
      icon: <Sun className="w-4 h-4" />,
      category: 'Preferences',
      action: () => {
        setTheme('light');
        closeModal();
      },
    },
  ], [
    activeFile, saveFile, sidebarVisible, terminalVisible,
    previewVisible, terminalMaximized, theme, closeModal, openModal,
    toggleSidebar, toggleTerminal, togglePreview,
    toggleTerminalMaximized, setTheme, setActivePanel
  ]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter((cmd) => {
      const searchText = `${cmd.label} ${cmd.description || ''} ${cmd.category}`.toLowerCase();
      return searchText.includes(lowerQuery);
    });
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatCommands = useMemo(() => {
    return Object.values(groupedCommands).flat();
  }, [groupedCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          flatCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeModal();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const items = listElement.querySelectorAll('[data-command-item]');
    const selectedElement = items[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let currentIndex = 0;

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
        className="relative w-full max-w-xl bg-[#12121a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Command className="w-5 h-5 text-purple-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <div className="text-xs text-gray-600 border border-white/10 px-1.5 py-0.5 rounded">
            esc
          </div>
        </div>

        {/* Commands */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto" role="listbox" aria-label="Commands">
          {flatCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-black/20">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const index = currentIndex++;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      data-command-item
                      onClick={() => cmd.action()}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-purple-500/20 border-l-2 border-purple-500'
                          : 'hover:bg-white/5 border-l-2 border-transparent'
                      )}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                    >
                      <div className="text-gray-400">{cmd.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <div className="text-xs text-gray-600 font-mono">
                          {cmd.shortcut}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>↑↓ navigate</span>
            <span>↵ execute</span>
          </div>
        </div>
      </div>
    </div>
  );
}
