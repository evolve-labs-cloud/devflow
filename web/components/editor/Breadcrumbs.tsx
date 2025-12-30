'use client';

import { useMemo } from 'react';
import { ChevronRight, Folder, FileText, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileStore } from '@/lib/stores/fileStore';
import { useProjectStore } from '@/lib/stores/projectStore';

interface BreadcrumbsProps {
  path: string;
  className?: string;
}

interface BreadcrumbSegment {
  name: string;
  path: string;
  isFile: boolean;
  isLast: boolean;
}

/**
 * Breadcrumbs component for file path navigation.
 * Displays the current file path as clickable segments.
 * Clicking a folder segment expands it in the file explorer.
 */
export function Breadcrumbs({ path, className }: BreadcrumbsProps) {
  const { setExpandedFolders, expandedFolders, toggleFolder } = useFileStore();
  const { currentProject } = useProjectStore();
  const projectPath = currentProject?.path;

  const segments = useMemo((): BreadcrumbSegment[] => {
    if (!path) return [];

    // Get relative path from project root
    let relativePath = path;
    if (projectPath && path.startsWith(projectPath)) {
      relativePath = path.slice(projectPath.length);
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.slice(1);
      }
    }

    const parts = relativePath.split('/').filter(Boolean);
    let currentPath = projectPath || '';

    return parts.map((name, index) => {
      currentPath = currentPath ? `${currentPath}/${name}` : name;
      const isLast = index === parts.length - 1;

      return {
        name,
        path: currentPath,
        isFile: isLast,
        isLast,
      };
    });
  }, [path, projectPath]);

  const handleSegmentClick = (segment: BreadcrumbSegment) => {
    if (segment.isFile) return;

    // Toggle folder expansion and ensure all parent folders are expanded
    const parentPath = segment.path;
    const pathParts = parentPath.split('/');
    const newExpanded = new Set(expandedFolders);

    // Expand all parent folders
    let buildPath = '';
    for (const part of pathParts) {
      buildPath = buildPath ? `${buildPath}/${part}` : part;
      newExpanded.add(buildPath);
    }

    setExpandedFolders(newExpanded);
  };

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        'flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 bg-[#0a0a0f] border-b border-white/5 overflow-x-auto',
        className
      )}
      aria-label="File path breadcrumb"
    >
      {/* Project root icon */}
      <button
        onClick={() => {
          // Collapse all folders to show root
          setExpandedFolders(new Set());
        }}
        className="flex items-center gap-1 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
        aria-label="Go to project root"
        title="Project root"
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      {segments.map((segment, index) => (
        <div key={segment.path} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" aria-hidden="true" />

          {segment.isFile ? (
            // File segment - not clickable
            <span
              className="flex items-center gap-1.5 text-gray-300 font-medium"
              aria-current="page"
            >
              <FileText className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
              <span className="truncate max-w-[150px]">{segment.name}</span>
            </span>
          ) : (
            // Folder segment - clickable
            <button
              onClick={() => handleSegmentClick(segment)}
              className={cn(
                'flex items-center gap-1.5 hover:text-white transition-colors',
                'p-1 rounded hover:bg-white/5',
                'focus:outline-none focus:ring-1 focus:ring-purple-500/50'
              )}
              title={`Open folder: ${segment.path}`}
            >
              <Folder className="w-3.5 h-3.5 text-yellow-500/70" aria-hidden="true" />
              <span className="truncate max-w-[100px]">{segment.name}</span>
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}
