'use client';

import { useState, useCallback } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/ContextMenu';
import { useFileStore } from '@/lib/stores/fileStore';
import { useProjectStore } from '@/lib/stores/projectStore';
import type { FileNode } from '@/lib/types';
import {
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
  Copy,
  FileText,
} from 'lucide-react';

interface FileContextMenuProps {
  node: FileNode;
  children: React.ReactNode;
}

export function FileContextMenu({ node, children }: FileContextMenuProps) {
  const { deleteFile, renameFile, createFile, loadTree } = useFileStore();
  const { currentProject } = useProjectStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [createName, setCreateName] = useState('');

  const handleCopyPath = useCallback(() => {
    navigator.clipboard.writeText(node.path);
  }, [node.path]);

  const handleDelete = useCallback(async () => {
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      await deleteFile(node.path);
      if (currentProject) {
        await loadTree(currentProject.path);
      }
    }
  }, [node.name, node.path, deleteFile, loadTree, currentProject]);

  const handleRename = useCallback(async () => {
    if (newName && newName !== node.name) {
      const parentPath = node.path.substring(0, node.path.lastIndexOf('/'));
      const newPath = `${parentPath}/${newName}`;
      await renameFile(node.path, newPath);
      if (currentProject) {
        await loadTree(currentProject.path);
      }
    }
    setIsRenaming(false);
  }, [newName, node.name, node.path, renameFile, loadTree, currentProject]);

  const handleCreate = useCallback(async (type: 'file' | 'folder') => {
    if (!createName) return;

    const basePath = node.type === 'directory' ? node.path : node.path.substring(0, node.path.lastIndexOf('/'));
    const newPath = `${basePath}/${createName}`;

    await createFile(newPath, type === 'folder' ? 'directory' : 'file', type === 'file' ? '' : undefined);
    if (currentProject) {
      await loadTree(currentProject.path);
    }
    setIsCreating(null);
    setCreateName('');
  }, [createName, node.type, node.path, createFile, loadTree, currentProject]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setIsCreating(null);
    }
  }, []);

  // Show rename input
  if (isRenaming) {
    return (
      <div className="flex items-center gap-1 py-1 px-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => handleKeyDown(e, handleRename)}
          autoFocus
          className="flex-1 bg-[#1a1a24] border border-purple-500 rounded px-2 py-0.5 text-sm text-white outline-none"
        />
      </div>
    );
  }

  // Show create input
  if (isCreating) {
    return (
      <div className="flex items-center gap-1 py-1 px-2">
        <span className="text-gray-400">
          {isCreating === 'file' ? <FileText className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
        </span>
        <input
          type="text"
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          onBlur={() => { setIsCreating(null); setCreateName(''); }}
          onKeyDown={(e) => handleKeyDown(e, () => handleCreate(isCreating))}
          placeholder={isCreating === 'file' ? 'filename.ext' : 'folder name'}
          autoFocus
          className="flex-1 bg-[#1a1a24] border border-purple-500 rounded px-2 py-0.5 text-sm text-white outline-none"
        />
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {node.type === 'directory' && (
          <>
            <ContextMenuItem onClick={() => { setIsCreating('file'); setCreateName(''); }}>
              <FilePlus className="w-4 h-4" />
              New File
            </ContextMenuItem>
            <ContextMenuItem onClick={() => { setIsCreating('folder'); setCreateName(''); }}>
              <FolderPlus className="w-4 h-4" />
              New Folder
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={() => { setIsRenaming(true); setNewName(node.name); }}>
          <Pencil className="w-4 h-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleDelete}
          className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleCopyPath}>
          <Copy className="w-4 h-4" />
          Copy Path
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
