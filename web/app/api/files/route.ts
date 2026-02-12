import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Resolve and validate a file path against the project root.
 * Returns the resolved absolute path or null if invalid.
 */
function safePath(filePath: string): string | null {
  const projectRoot = process.env.DEVFLOW_PROJECT_PATH;
  if (!projectRoot) return null;

  const resolved = path.resolve(projectRoot, filePath);

  // Must be within the project root
  if (!resolved.startsWith(projectRoot + path.sep) && resolved !== projectRoot) {
    return null;
  }

  return resolved;
}

function pathError() {
  return NextResponse.json(
    { error: 'Path must be within the project directory' },
    { status: 403 }
  );
}

/**
 * GET /api/files?path=/path/to/file
 * Read file content
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    const resolved = safePath(filePath);
    if (!resolved) return pathError();

    try {
      const stat = await fs.stat(resolved);

      if (!stat.isFile()) {
        return NextResponse.json(
          { error: 'Path is not a file' },
          { status: 400 }
        );
      }

      // Check file size (limit to 5MB)
      if (stat.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large (max 5MB)' },
          { status: 400 }
        );
      }

      const content = await fs.readFile(resolved, 'utf-8');

      return NextResponse.json({
        path: filePath,
        content,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/files
 * Write file content
 */
export async function PUT(req: NextRequest) {
  try {
    const { path: filePath, content } = await req.json();

    if (!filePath || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Path and content are required' },
        { status: 400 }
      );
    }

    const resolved = safePath(filePath);
    if (!resolved) return pathError();

    await fs.writeFile(resolved, content, 'utf-8');

    const stat = await fs.stat(resolved);

    return NextResponse.json({
      success: true,
      path: filePath,
      modifiedAt: stat.mtime.toISOString(),
    });
  } catch (error) {
    console.error('Error writing file:', error);
    return NextResponse.json(
      { error: 'Failed to write file' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 * Create new file or directory
 */
export async function POST(req: NextRequest) {
  try {
    const { path: filePath, type, content = '' } = await req.json();

    if (!filePath || !type) {
      return NextResponse.json(
        { error: 'Path and type are required' },
        { status: 400 }
      );
    }

    const resolved = safePath(filePath);
    if (!resolved) return pathError();

    // Check if already exists
    try {
      await fs.access(resolved);
      return NextResponse.json(
        { error: 'Path already exists' },
        { status: 409 }
      );
    } catch {
      // Path doesn't exist, good to create
    }

    if (type === 'directory') {
      await fs.mkdir(resolved, { recursive: true });
    } else {
      // Ensure parent directory exists
      const parentDir = path.dirname(resolved);
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(resolved, content, 'utf-8');
    }

    return NextResponse.json({
      success: true,
      path: filePath,
      type,
    });
  } catch (error) {
    console.error('Error creating file:', error);
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/files
 * Rename file or directory
 */
export async function PATCH(req: NextRequest) {
  try {
    const { oldPath, newPath } = await req.json();

    if (!oldPath || !newPath) {
      return NextResponse.json(
        { error: 'Old path and new path are required' },
        { status: 400 }
      );
    }

    const resolvedOld = safePath(oldPath);
    const resolvedNew = safePath(newPath);
    if (!resolvedOld || !resolvedNew) return pathError();

    // Check if old path exists
    try {
      await fs.access(resolvedOld);
    } catch {
      return NextResponse.json(
        { error: 'Source path not found' },
        { status: 404 }
      );
    }

    // Check if new path already exists
    try {
      await fs.access(resolvedNew);
      return NextResponse.json(
        { error: 'Destination path already exists' },
        { status: 409 }
      );
    } catch {
      // Path doesn't exist, good to rename
    }

    await fs.rename(resolvedOld, resolvedNew);

    return NextResponse.json({
      success: true,
      oldPath,
      newPath,
    });
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json(
      { error: 'Failed to rename file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files
 * Delete file or directory
 */
export async function DELETE(req: NextRequest) {
  try {
    const { path: filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    const resolved = safePath(filePath);
    if (!resolved) return pathError();

    const stat = await fs.stat(resolved);

    if (stat.isDirectory()) {
      await fs.rm(resolved, { recursive: true });
    } else {
      await fs.unlink(resolved);
    }

    return NextResponse.json({
      success: true,
      path: filePath,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Path not found' },
        { status: 404 }
      );
    }

    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
