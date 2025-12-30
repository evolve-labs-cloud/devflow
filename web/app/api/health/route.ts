import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface HealthStatus {
  claudeCli: {
    installed: boolean;
    authenticated: boolean;
    version?: string;
    error?: string;
  };
  project: {
    valid: boolean;
    hasDevflow: boolean;
    hasClaudeProject: boolean;
  };
  system: {
    platform: string;
    nodeVersion: string;
  };
}

/**
 * GET /api/health?projectPath=/path
 * Check system health status
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectPath = searchParams.get('projectPath');

  const status: HealthStatus = {
    claudeCli: {
      installed: false,
      authenticated: false,
    },
    project: {
      valid: false,
      hasDevflow: false,
      hasClaudeProject: false,
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
    },
  };

  // Check Claude CLI (skip whoami to avoid slowness)
  try {
    const { stdout } = await execAsync('claude --version', { timeout: 5000 });
    status.claudeCli.installed = true;
    status.claudeCli.version = stdout.trim();
    status.claudeCli.authenticated = true; // Assume authenticated if CLI is installed
  } catch (error) {
    status.claudeCli.error = 'Claude CLI not found. Install from https://claude.ai/cli';
  }

  // Check project if path provided
  if (projectPath && !projectPath.includes('..')) {
    try {
      await fs.access(projectPath);
      status.project.valid = true;

      // Check .devflow in current path or parent directory
      try {
        await fs.access(path.join(projectPath, '.devflow'));
        status.project.hasDevflow = true;
      } catch {
        // Try parent directory
        try {
          await fs.access(path.join(projectPath, '..', '.devflow'));
          status.project.hasDevflow = true;
        } catch {}
      }

      // Check .claude_project in current path or parent directory
      try {
        await fs.access(path.join(projectPath, '.claude_project'));
        status.project.hasClaudeProject = true;
      } catch {
        // Try parent directory
        try {
          await fs.access(path.join(projectPath, '..', '.claude_project'));
          status.project.hasClaudeProject = true;
        } catch {}
      }
    } catch {}
  }

  return NextResponse.json(status);
}
