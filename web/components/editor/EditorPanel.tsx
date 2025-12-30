'use client';

import { useFileStore } from '@/lib/stores/fileStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { EditorTabs } from './EditorTabs';
import { Breadcrumbs } from './Breadcrumbs';
import { MonacoEditor } from './MonacoEditor';
import { MarkdownPreview } from './MarkdownPreview';
import { FileText, Eye, Columns, Code2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EditorPanel() {
  const { openFiles, activeFile, navigateBack, navigateForward, canGoBack, canGoForward } = useFileStore();
  const { previewVisible, togglePreview } = useUIStore();

  const activeOpenFile = openFiles.find((f) => f.path === activeFile);
  const isMarkdown = activeOpenFile?.language === 'markdown';

  if (openFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f] text-gray-500">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-white/5 rounded-2xl flex items-center justify-center">
            <Code2 className="w-10 h-10 text-gray-600" />
          </div>
          <div>
            <p className="text-lg text-gray-400">No file open</p>
            <p className="text-sm text-gray-600">Select a file from the explorer to start editing</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Tabs */}
      <div className="flex items-center border-b border-white/10 bg-[#08080c]">
        {/* Navigation buttons */}
        <div className="flex items-center px-1 border-r border-white/10">
          <button
            onClick={navigateBack}
            disabled={!canGoBack()}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              canGoBack()
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-700 cursor-not-allowed'
            )}
            title="Go Back (Alt+Left)"
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={navigateForward}
            disabled={!canGoForward()}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              canGoForward()
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-700 cursor-not-allowed'
            )}
            title="Go Forward (Alt+Right)"
            aria-label="Go forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <EditorTabs />

        {/* Preview toggle for markdown */}
        {isMarkdown && (
          <div className="flex items-center px-2 border-l border-white/10">
            <button
              onClick={togglePreview}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                previewVisible
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-gray-500 hover:text-white hover:bg-white/10'
              )}
              title={previewVisible ? 'Hide Preview' : 'Show Preview'}
              aria-label={previewVisible ? 'Hide preview' : 'Show preview'}
              aria-pressed={previewVisible}
            >
              {previewVisible ? (
                <Columns className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumbs */}
      {activeFile && <Breadcrumbs path={activeFile} />}

      {/* Editor content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Monaco Editor */}
        <div className={cn(
          'h-full',
          previewVisible && isMarkdown ? 'w-1/2' : 'w-full'
        )}>
          {activeOpenFile && <MonacoEditor file={activeOpenFile} />}
        </div>

        {/* Markdown Preview */}
        {previewVisible && isMarkdown && activeOpenFile && (
          <div className="w-1/2 h-full border-l border-white/10 overflow-auto bg-[#0a0a0f]">
            <MarkdownPreview content={activeOpenFile.content} />
          </div>
        )}
      </div>
    </div>
  );
}
