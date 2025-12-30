'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

let mermaidInitialized = false;

function initMermaid() {
  if (mermaidInitialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    themeVariables: {
      primaryColor: '#8b5cf6',
      primaryTextColor: '#fff',
      primaryBorderColor: '#6d28d9',
      lineColor: '#64748b',
      secondaryColor: '#1e1b4b',
      tertiaryColor: '#1a1a24',
      background: '#0a0a0f',
      mainBkg: '#1a1a24',
      nodeBorder: '#6d28d9',
      clusterBkg: '#1e1b4b',
      clusterBorder: '#4c1d95',
      titleColor: '#e2e8f0',
      edgeLabelBackground: '#1a1a24',
      textColor: '#e2e8f0',
      nodeTextColor: '#fff',
    },
  });

  mermaidInitialized = true;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 11)}`);

  useEffect(() => {
    initMermaid();

    const renderDiagram = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { svg } = await mermaid.render(idRef.current, chart);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [chart]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8 bg-[#1a1a24] rounded-lg', className)}>
        <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
        <span className="ml-2 text-sm text-gray-400">Rendering diagram...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 bg-red-500/10 border border-red-500/30 rounded-lg', className)}>
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Diagram Error</span>
        </div>
        <pre className="text-xs text-red-300/80 overflow-x-auto whitespace-pre-wrap">{error}</pre>
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
            Show source code
          </summary>
          <pre className="mt-2 p-3 text-xs text-gray-400 bg-black/20 rounded overflow-x-auto">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'mermaid-diagram bg-[#1a1a24] rounded-lg p-4 overflow-x-auto',
        '[&_svg]:max-w-full [&_svg]:h-auto',
        className
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
