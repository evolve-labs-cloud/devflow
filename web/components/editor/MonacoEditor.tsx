'use client';

import { useCallback, useEffect, useRef, memo } from 'react';
import dynamic from 'next/dynamic';
import { useFileStore } from '@/lib/stores/fileStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { OpenFile } from '@/lib/types';
import type { editor } from 'monaco-editor';
import type * as Monaco from 'monaco-editor';

// Editor Loading Skeleton
function EditorSkeleton() {
  return (
    <div className="h-full bg-[#0a0a0f] p-4">
      {/* Line numbers + code skeleton */}
      <div className="flex gap-4">
        <div className="flex flex-col gap-2 w-8">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-6" />
          ))}
        </div>
        <div className="flex-1 space-y-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4"
              style={{ width: `${Math.random() * 40 + 30}%` }}
            />
          ))}
        </div>
      </div>
      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-sm text-gray-400">Loading editor...</span>
        </div>
      </div>
    </div>
  );
}

// Lazy load Monaco Editor
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

interface MonacoEditorProps {
  file: OpenFile;
}

function MonacoEditorComponent({ file }: MonacoEditorProps) {
  const { updateFileContent, saveFile, scrollToLine, setScrollToLine } = useFileStore();
  const {
    editorFontSize,
    editorTabSize,
    editorWordWrap,
    editorMinimap,
    editorLineNumbers,
  } = useSettingsStore();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Add save command (Cmd/Ctrl + S)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          saveFile(file.path);
        }
      );

      // Focus the editor
      editor.focus();
    },
    [file.path, saveFile]
  );

  // Scroll to specific line when requested
  useEffect(() => {
    if (scrollToLine && editorRef.current && monacoRef.current) {
      const editor = editorRef.current;
      const monaco = monacoRef.current;

      // Set cursor position to the line
      editor.setPosition({ lineNumber: scrollToLine, column: 1 });

      // Reveal the line in the center of the viewport
      editor.revealLineInCenter(scrollToLine);

      // Add a highlight decoration
      const decorations = editor.deltaDecorations([], [
        {
          range: new monaco.Range(scrollToLine, 1, scrollToLine, 1),
          options: {
            isWholeLine: true,
            className: 'highlight-line-animation',
            linesDecorationsClassName: 'highlight-line-margin',
          },
        },
      ]);

      // Remove decoration after animation
      setTimeout(() => {
        editor.deltaDecorations(decorations, []);
      }, 2000);

      // Clear the scrollToLine state
      setScrollToLine(null);
    }
  }, [scrollToLine, setScrollToLine]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        updateFileContent(file.path, value);
      }
    },
    [file.path, updateFileContent]
  );

  // Focus editor when file changes
  useEffect(() => {
    editorRef.current?.focus();
  }, [file.path]);

  return (
    <Editor
      height="100%"
      language={file.language}
      value={file.content}
      theme="vs-dark"
      onChange={handleChange}
      onMount={handleEditorDidMount}
      options={{
        fontSize: editorFontSize,
        fontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, monospace',
        minimap: { enabled: editorMinimap },
        wordWrap: editorWordWrap ? 'on' : 'off',
        lineNumbers: editorLineNumbers ? 'on' : 'off',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: editorTabSize,
        insertSpaces: true,
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        guides: {
          indentation: true,
          bracketPairs: true,
        },
        padding: { top: 16, bottom: 16 },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
      }}
    />
  );
}

// Memoize to prevent unnecessary re-renders
// Note: Settings changes will trigger re-render via useSettingsStore hook
export const MonacoEditor = memo(MonacoEditorComponent, (prevProps, nextProps) => {
  // Only re-render if file path or language changes
  // Content updates are handled internally by Monaco
  // Settings updates are handled via Zustand subscription
  return (
    prevProps.file.path === nextProps.file.path &&
    prevProps.file.language === nextProps.file.language
  );
});
