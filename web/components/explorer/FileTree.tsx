'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import { useFileStore } from '@/lib/stores/fileStore';
import type { FileNode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FileContextMenu } from './FileContextMenu';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  Bot,
  ListTodo,
  Scale,
  Settings
} from 'lucide-react';

interface FileTreeProps {
  node: FileNode;
  level: number;
  focusedNodeId?: string | null;
  onFocusNode?: (id: string) => void;
  isFocused?: (id: string) => boolean;
}

// Zustand selectors - subscribe only to what we need
const selectExpandedFolders = (state: ReturnType<typeof useFileStore.getState>) => state.expandedFolders;
const selectToggleFolder = (state: ReturnType<typeof useFileStore.getState>) => state.toggleFolder;
const selectOpenFile = (state: ReturnType<typeof useFileStore.getState>) => state.openFile;
const selectActiveFile = (state: ReturnType<typeof useFileStore.getState>) => state.activeFile;

// Get icon based on file type
function getFileIcon(node: FileNode) {
  if (node.type === 'directory') {
    if (node.name === '.devflow') return Settings;
    if (node.name === 'agents') return Bot;
    if (node.name === 'stories') return ListTodo;
    if (node.name === 'decisions') return Scale;
    return Folder;
  }

  switch (node.extension) {
    case 'md':
      return FileText;
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return FileCode;
    case 'json':
      return FileJson;
    case 'yaml':
    case 'yml':
      return Settings;
    default:
      return File;
  }
}

// Get icon color based on file type
function getIconColor(node: FileNode): string {
  if (node.type === 'directory') return 'text-amber-400';

  switch (node.extension) {
    case 'md':
      return 'text-blue-400';
    case 'ts':
    case 'tsx':
      return 'text-blue-500';
    case 'js':
    case 'jsx':
      return 'text-yellow-400';
    case 'json':
      return 'text-amber-400';
    case 'yaml':
    case 'yml':
      return 'text-purple-400';
    default:
      return 'text-gray-400';
  }
}

function FileTreeComponent({ node, level, focusedNodeId, onFocusNode, isFocused }: FileTreeProps) {
  // Use selectors to subscribe only to what we need
  const expandedFolders = useFileStore(selectExpandedFolders);
  const toggleFolder = useFileStore(selectToggleFolder);
  const openFile = useFileStore(selectOpenFile);
  const activeFile = useFileStore(selectActiveFile);
  const itemRef = useRef<HTMLDivElement>(null);

  const isExpanded = expandedFolders.has(node.path);
  const isActive = activeFile === node.path;
  const isNodeFocused = isFocused ? isFocused(node.path) : false;
  const Icon = getFileIcon(node);
  const iconColor = getIconColor(node);

  // Scroll focused item into view
  useEffect(() => {
    if (isNodeFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isNodeFocused]);

  const handleClick = useCallback(() => {
    // Update focus when clicking
    if (onFocusNode) {
      onFocusNode(node.path);
    }

    if (node.type === 'directory') {
      toggleFolder(node.path);
    } else {
      openFile(node.path);
    }
  }, [node.path, node.type, onFocusNode, toggleFolder, openFile]);

  // Don't render root node name, just children
  if (level === 0 && node.type === 'directory') {
    return (
      <div className="py-1" role="group">
        {node.children?.map((child) => (
          <FileTree
            key={child.path}
            node={child}
            level={1}
            focusedNodeId={focusedNodeId}
            onFocusNode={onFocusNode}
            isFocused={isFocused}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <FileContextMenu node={node}>
        <div
          ref={itemRef}
          className={cn(
            'flex items-center gap-1 py-1 px-2 cursor-pointer transition-colors',
            isActive
              ? 'bg-purple-500/20 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5',
            isNodeFocused && 'ring-1 ring-inset ring-purple-500/50 bg-purple-500/10'
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={handleClick}
          role="treeitem"
          aria-expanded={node.type === 'directory' ? isExpanded : undefined}
          aria-selected={isActive}
          aria-level={level}
          tabIndex={isNodeFocused ? 0 : -1}
          id={`tree-item-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
        >
          {/* Expand/collapse arrow for directories */}
          {node.type === 'directory' ? (
            <span className="w-4 h-4 flex items-center justify-center text-gray-500" aria-hidden="true">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          ) : (
            <span className="w-4" aria-hidden="true" />
          )}

          {/* Icon */}
          {node.type === 'directory' && isExpanded ? (
            <FolderOpen className={cn('w-4 h-4 flex-shrink-0', iconColor)} aria-hidden="true" />
          ) : (
            <Icon className={cn('w-4 h-4 flex-shrink-0', iconColor)} aria-hidden="true" />
          )}

          {/* Name */}
          <span className="text-sm truncate">{node.name}</span>
        </div>
      </FileContextMenu>

      {/* Children */}
      {node.type === 'directory' && isExpanded && node.children && (
        <div role="group" aria-label={`Contents of ${node.name}`}>
          {node.children.map((child) => (
            <FileTree
              key={child.path}
              node={child}
              level={level + 1}
              focusedNodeId={focusedNodeId}
              onFocusNode={onFocusNode}
              isFocused={isFocused}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Memoized FileTree - only re-renders when props change
// Note: Store subscriptions still trigger re-renders, but memo prevents
// cascading re-renders from parent prop changes
export const FileTree = memo(FileTreeComponent, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific things change
  return (
    prevProps.node.path === nextProps.node.path &&
    prevProps.node.name === nextProps.node.name &&
    prevProps.node.type === nextProps.node.type &&
    prevProps.level === nextProps.level &&
    prevProps.focusedNodeId === nextProps.focusedNodeId &&
    prevProps.onFocusNode === nextProps.onFocusNode &&
    prevProps.isFocused === nextProps.isFocused &&
    // Deep compare children paths (for directory updates)
    JSON.stringify(prevProps.node.children?.map(c => c.path)) ===
    JSON.stringify(nextProps.node.children?.map(c => c.path))
  );
});
