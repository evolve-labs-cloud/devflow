import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileNode[];
}

// Folders to prioritize (shown first)
const PRIORITY_FOLDERS = ['.devflow', 'docs'];

// Files/folders to exclude
const EXCLUDED = [
  'node_modules',
  '.git',
  '.DS_Store',
  '.next',
  'dist',
  'build',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'venv',
];

/**
 * GET /api/files/tree?path=/project/path
 * Returns file tree for a project
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectPath = searchParams.get('path');

    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project path is required' },
        { status: 400 }
      );
    }

    // Security check
    if (projectPath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    const root = await buildFileTree(projectPath, projectPath);

    return NextResponse.json({ root });
  } catch (error) {
    console.error('Error building file tree:', error);
    return NextResponse.json(
      { error: 'Failed to build file tree' },
      { status: 500 }
    );
  }
}

async function buildFileTree(
  basePath: string,
  currentPath: string,
  depth: number = 0
): Promise<FileNode> {
  const stat = await fs.stat(currentPath);
  const name = path.basename(currentPath);
  const relativePath = path.relative(basePath, currentPath) || '.';

  if (stat.isFile()) {
    const ext = path.extname(name).slice(1);
    return {
      name,
      path: currentPath,
      type: 'file',
      extension: ext || undefined,
    };
  }

  // Directory
  let children: FileNode[] = [];

  // Limit depth to prevent huge trees
  if (depth < 10) {
    try {
      const entries = await fs.readdir(currentPath);

      // Filter and sort entries
      const filteredEntries = entries.filter(
        (entry) => !EXCLUDED.includes(entry) && !entry.startsWith('.')
      );

      // Include priority hidden folders
      const priorityHidden = entries.filter(
        (entry) => PRIORITY_FOLDERS.includes(entry)
      );

      const allEntries = [...priorityHidden, ...filteredEntries];
      const uniqueEntries = [...new Set(allEntries)];

      // Sort: directories first, then priority folders, then alphabetically
      const sorted = await sortEntries(currentPath, uniqueEntries);

      children = await Promise.all(
        sorted.map((entry) =>
          buildFileTree(basePath, path.join(currentPath, entry), depth + 1)
        )
      );
    } catch (error) {
      console.error(`Error reading directory ${currentPath}:`, error);
    }
  }

  return {
    name,
    path: currentPath,
    type: 'directory',
    children,
  };
}

async function sortEntries(
  dirPath: string,
  entries: string[]
): Promise<string[]> {
  const withTypes = await Promise.all(
    entries.map(async (entry) => {
      try {
        const stat = await fs.stat(path.join(dirPath, entry));
        return {
          name: entry,
          isDirectory: stat.isDirectory(),
          isPriority: PRIORITY_FOLDERS.includes(entry),
        };
      } catch {
        return { name: entry, isDirectory: false, isPriority: false };
      }
    })
  );

  return withTypes
    .sort((a, b) => {
      // Priority folders first
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;

      // Directories before files
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;

      // Alphabetically
      return a.name.localeCompare(b.name);
    })
    .map((e) => e.name);
}
