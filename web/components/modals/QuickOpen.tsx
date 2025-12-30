'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';
import { useProjectStore } from '@/lib/stores/projectStore';
import { useFileStore } from '@/lib/stores/fileStore';
import { Search, File, FileText, FileCode, FileJson, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface FileResult {
  filePath: string;
  relativePath: string;
  fileName: string;
  extension: string;
}

const getFileIcon = (extension: string) => {
  switch (extension) {
    case '.md':
      return <FileText className="w-4 h-4 text-blue-400" />;
    case '.json':
    case '.yaml':
    case '.yml':
      return <FileJson className="w-4 h-4 text-yellow-400" />;
    case '.ts':
    case '.tsx':
    case '.js':
    case '.jsx':
      return <FileCode className="w-4 h-4 text-green-400" />;
    default:
      return <File className="w-4 h-4 text-gray-400" />;
  }
};

export function QuickOpen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { activeModal, closeModal } = useUIStore();
  const { currentProject } = useProjectStore();
  const { openFile } = useFileStore();

  const isOpen = activeModal === 'quickOpen';

  // Focus trap for accessibility
  useFocusTrap(modalRef, isOpen, {
    onEscape: closeModal,
    autoFocus: false, // We handle focus manually to the input
  });

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search files
  const searchFiles = useCallback(async (searchQuery: string) => {
    if (!currentProject) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        projectPath: currentProject.path,
        query: searchQuery,
        type: 'files',
        limit: '50',
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (data.results) {
        setResults(data.results);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      searchFiles(query);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen, searchFiles]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
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

    const selectedElement = listElement.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = (file: FileResult) => {
    openFile(file.filePath);
    closeModal();
  };

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
        className="relative w-full max-w-2xl bg-[#12121a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Quick open file"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files by name..."
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

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto" role="listbox" aria-label="Search results">
          {isLoading && results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              {query ? 'No files found' : 'Type to search files...'}
            </div>
          ) : (
            results.map((file, index) => (
              <button
                key={file.filePath}
                onClick={() => handleSelect(file)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-purple-500/20 border-l-2 border-purple-500'
                    : 'hover:bg-white/5 border-l-2 border-transparent'
                )}
                role="option"
                aria-selected={index === selectedIndex}
                tabIndex={index === selectedIndex ? 0 : -1}
              >
                {getFileIcon(file.extension)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{file.fileName}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {file.relativePath}
                  </div>
                </div>
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
          <div>
            {results.length > 0 && `${results.length} files`}
          </div>
        </div>
      </div>
    </div>
  );
}
