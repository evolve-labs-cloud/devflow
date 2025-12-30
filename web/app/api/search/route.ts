import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface SearchResult {
  filePath: string;
  relativePath: string;
  fileName: string;
  matches: {
    line: number;
    content: string;
    matchStart: number;
    matchEnd: number;
  }[];
}

interface FileResult {
  filePath: string;
  relativePath: string;
  fileName: string;
  extension: string;
}

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '__pycache__',
  '.cache',
];

// File extensions to search
const SEARCHABLE_EXTENSIONS = [
  '.md',
  '.txt',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.yaml',
  '.yml',
  '.css',
  '.scss',
  '.html',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.c',
  '.cpp',
  '.h',
  '.sh',
  '.env',
  '.toml',
];

async function getAllFiles(
  dir: string,
  basePath: string,
  files: FileResult[] = []
): Promise<FileResult[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.includes(entry.name) && !entry.name.startsWith('.')) {
          await getAllFiles(fullPath, basePath, files);
        }
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (SEARCHABLE_EXTENSIONS.includes(ext) || entry.name.startsWith('.')) {
          files.push({
            filePath: fullPath,
            relativePath,
            fileName: entry.name,
            extension: ext,
          });
        }
      }
    }
  } catch {
    // Ignore permission errors
  }

  return files;
}

async function searchInFile(
  file: FileResult,
  query: string,
  caseSensitive: boolean,
  isRegex: boolean
): Promise<SearchResult | null> {
  try {
    const content = await fs.readFile(file.filePath, 'utf-8');
    const lines = content.split('\n');
    const matches: SearchResult['matches'] = [];

    let searchPattern: RegExp;
    try {
      if (isRegex) {
        searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } else {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchPattern = new RegExp(escapedQuery, caseSensitive ? 'g' : 'gi');
      }
    } catch {
      // Invalid regex, return null
      return null;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match: RegExpExecArray | null;
      searchPattern.lastIndex = 0;

      while ((match = searchPattern.exec(line)) !== null) {
        matches.push({
          line: i + 1,
          content: line.slice(0, 200), // Limit line length
          matchStart: match.index,
          matchEnd: match.index + match[0].length,
        });

        // Prevent infinite loop for zero-length matches
        if (match[0].length === 0) break;
      }
    }

    if (matches.length > 0) {
      return {
        filePath: file.filePath,
        relativePath: file.relativePath,
        fileName: file.fileName,
        matches: matches.slice(0, 50), // Limit matches per file
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * GET /api/search - Search for files or content
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const projectPath = searchParams.get('projectPath');
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'files'; // 'files' or 'content'
    const caseSensitive = searchParams.get('caseSensitive') === 'true';
    const isRegex = searchParams.get('regex') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!projectPath) {
      return NextResponse.json(
        { error: 'projectPath is required' },
        { status: 400 }
      );
    }

    // Security: Validate path
    if (projectPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Get all files
    const allFiles = await getAllFiles(projectPath, projectPath);

    if (type === 'files') {
      // Quick Open - search file names
      let results = allFiles;

      if (query && query.trim()) {
        const lowerQuery = query.toLowerCase();
        results = allFiles
          .filter((file) => {
            const lowerPath = file.relativePath.toLowerCase();
            const lowerName = file.fileName.toLowerCase();
            return lowerPath.includes(lowerQuery) || lowerName.includes(lowerQuery);
          })
          .sort((a, b) => {
            // Prioritize exact filename matches
            const aNameMatch = a.fileName.toLowerCase().includes(lowerQuery);
            const bNameMatch = b.fileName.toLowerCase().includes(lowerQuery);
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;

            // Then by path length (shorter = better)
            return a.relativePath.length - b.relativePath.length;
          });
      }

      return NextResponse.json({
        type: 'files',
        results: results.slice(0, limit),
        total: results.length,
      });
    } else if (type === 'content') {
      // Global Search - search file contents
      if (!query || !query.trim()) {
        return NextResponse.json({
          type: 'content',
          results: [],
          total: 0,
        });
      }

      const searchPromises = allFiles.map((file) =>
        searchInFile(file, query, caseSensitive, isRegex)
      );

      const searchResults = await Promise.all(searchPromises);
      const validResults = searchResults.filter(
        (result): result is SearchResult => result !== null
      );

      // Sort by number of matches
      validResults.sort((a, b) => b.matches.length - a.matches.length);

      return NextResponse.json({
        type: 'content',
        results: validResults.slice(0, limit),
        total: validResults.length,
        totalMatches: validResults.reduce((sum, r) => sum + r.matches.length, 0),
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
