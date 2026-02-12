'use client';

import { useState, useRef, useEffect } from 'react';
import { FolderPlus, X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/lib/stores/projectStore';

export function ProjectSelector() {
  const { projects, activeProjectPath, addProject, removeProject, setActiveProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeProject = projects.find(p => p.path === activeProjectPath) || projects[0];

  useEffect(() => {
    if (showAddInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddInput]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAddInput(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddProject = async () => {
    if (!newPath.trim()) return;
    setIsAdding(true);
    await addProject(newPath.trim());
    setIsAdding(false);
    setNewPath('');
    setShowAddInput(false);
  };

  const getProjectName = (path: string) => path.split('/').pop() || path;

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm w-full"
      >
        <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        <span className="truncate text-white font-medium">
          {activeProject ? getProjectName(activeProject.path) : 'No project'}
        </span>
        {projects.length > 1 && (
          <span className="text-[10px] text-gray-500 flex-shrink-0">+{projects.length - 1}</span>
        )}
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Project list */}
          <div className="max-h-48 overflow-y-auto">
            {projects.map((project) => (
              <div
                key={project.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer group',
                  project.path === activeProjectPath && 'bg-purple-500/10'
                )}
                onClick={() => {
                  setActiveProject(project.path);
                  setIsOpen(false);
                }}
              >
                {project.path === activeProjectPath ? (
                  <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{getProjectName(project.path)}</div>
                  <div className="text-[10px] text-gray-500 truncate">{project.path}</div>
                </div>
                {projects.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProject(project.path);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all text-gray-400 hover:text-red-400"
                    title="Remove project"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add project */}
          <div className="border-t border-white/10">
            {showAddInput ? (
              <div className="p-2 flex gap-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddProject();
                    if (e.key === 'Escape') setShowAddInput(false);
                  }}
                  placeholder="/path/to/project"
                  className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  disabled={isAdding}
                />
                <button
                  onClick={handleAddProject}
                  disabled={isAdding || !newPath.trim()}
                  className="px-2 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors disabled:opacity-50"
                >
                  {isAdding ? '...' : 'Add'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddInput(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Add Project
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
