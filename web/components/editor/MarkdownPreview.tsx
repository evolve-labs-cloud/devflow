'use client';

import { useMemo, Suspense, lazy } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Lazy load Mermaid - only loaded when markdown contains mermaid blocks
const MermaidDiagram = lazy(() => import('./MermaidDiagram').then(m => ({ default: m.MermaidDiagram })));

interface MarkdownPreviewProps {
  content: string;
}

function MermaidFallback() {
  return (
    <div className="my-4 p-4 bg-muted rounded-lg animate-pulse">
      <div className="h-32 bg-white/5 rounded" />
    </div>
  );
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  // Memoize components object to prevent recreation on every render
  const components = useMemo(() => ({
    // Custom heading styles
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-2xl font-bold border-b border-border pb-2 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
    ),

    // Code blocks
    code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeContent = String(children).replace(/\n$/, '');

      // Handle mermaid diagrams with lazy loading
      if (language === 'mermaid') {
        return (
          <Suspense fallback={<MermaidFallback />}>
            <MermaidDiagram chart={codeContent} className="my-4" />
          </Suspense>
        );
      }

      // Inline code (no className and no newlines)
      const isInline = !className && !codeContent.includes('\n');
      if (isInline) {
        return (
          <code
            className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      // Block code with optional language label
      return (
        <div className="relative group my-4">
          {language && (
            <div className="absolute top-2 right-2 px-2 py-0.5 text-xs text-gray-500 bg-black/30 rounded">
              {language}
            </div>
          )}
          <code
            className="block p-4 rounded-lg bg-muted text-sm font-mono overflow-x-auto"
            {...props}
          >
            {children}
          </code>
        </div>
      );
    },

    // Tables
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-border">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="border border-border px-3 py-2">{children}</td>
    ),

    // Links
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a
        href={href}
        className="text-primary hover:underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),

    // Blockquotes
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-4">
        {children}
      </blockquote>
    ),

    // Lists
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
    ),

    // Checkboxes (GFM)
    input: ({ type, checked }: { type?: string; checked?: boolean }) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mr-2 rounded"
          />
        );
      }
      return null;
    },
  }), []);

  return (
    <div className="p-6 prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
