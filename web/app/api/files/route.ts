import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

    // Security check
    if (filePath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    try {
      const stat = await fs.stat(filePath);

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

      const content = await fs.readFile(filePath, 'utf-8');

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

    // Security check
    if (filePath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    await fs.writeFile(filePath, content, 'utf-8');

    const stat = await fs.stat(filePath);

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

    // Security check
    if (filePath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Check if already exists
    try {
      await fs.access(filePath);
      return NextResponse.json(
        { error: 'Path already exists' },
        { status: 409 }
      );
    } catch {
      // Path doesn't exist, good to create
    }

    if (type === 'directory') {
      await fs.mkdir(filePath, { recursive: true });
    } else {
      // Ensure parent directory exists
      const parentDir = path.dirname(filePath);
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
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

    // Security check
    if (oldPath.includes('..') || newPath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Check if old path exists
    try {
      await fs.access(oldPath);
    } catch {
      return NextResponse.json(
        { error: 'Source path not found' },
        { status: 404 }
      );
    }

    // Check if new path already exists
    try {
      await fs.access(newPath);
      return NextResponse.json(
        { error: 'Destination path already exists' },
        { status: 409 }
      );
    } catch {
      // Path doesn't exist, good to rename
    }

    await fs.rename(oldPath, newPath);

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

    // Security check
    if (filePath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      await fs.rm(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
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
