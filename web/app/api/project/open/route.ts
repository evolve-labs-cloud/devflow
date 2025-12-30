import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface ProjectInfo {
  path: string;
  name: string;
  isValid: boolean;
  hasDevflow: boolean;
  hasClaudeProject: boolean;
  stats: {
    specs: number;
    stories: number;
    adrs: number;
    agents: number;
  };
}

/**
 * POST /api/project/open
 * Opens a DevFlow project and returns its metadata
 */
export async function POST(req: NextRequest) {
  try {
    const { path: projectPath } = await req.json();

    // Validate path
    if (!projectPath || typeof projectPath !== 'string') {
      return NextResponse.json(
        { error: 'Project path is required' },
        { status: 400 }
      );
    }

    // Security: Check for path traversal
    if (projectPath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Check if path exists
    try {
      await fs.access(projectPath);
    } catch {
      return NextResponse.json(
        { error: 'Path does not exist' },
        { status: 404 }
      );
    }

    // Check if it's a directory
    const stat = await fs.stat(projectPath);
    if (!stat.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is not a directory' },
        { status: 400 }
      );
    }

    // Check for DevFlow markers
    let hasDevflow = false;
    let hasClaudeProject = false;

    try {
      await fs.access(path.join(projectPath, '.devflow'));
      hasDevflow = true;
    } catch {}

    try {
      await fs.access(path.join(projectPath, '.claude_project'));
      hasClaudeProject = true;
    } catch {}

    // Get stats
    const stats = {
      specs: 0,
      stories: 0,
      adrs: 0,
      agents: 0,
    };

    // Count stories
    try {
      const storiesPath = path.join(projectPath, 'docs', 'planning', 'stories');
      const stories = await fs.readdir(storiesPath);
      stats.stories = stories.filter(f => f.endsWith('.md') && f !== '.gitkeep').length;
    } catch {}

    // Count ADRs
    try {
      const adrsPath = path.join(projectPath, 'docs', 'decisions');
      const adrs = await fs.readdir(adrsPath);
      stats.adrs = adrs.filter(f => f.endsWith('.md') && !f.startsWith('000-')).length;
    } catch {}

    // Count agents
    try {
      const agentsPath = path.join(projectPath, '.devflow', 'agents');
      const agents = await fs.readdir(agentsPath);
      stats.agents = agents.filter(f => f.endsWith('.md')).length;
    } catch {}

    // Count specs (planning/*.md)
    try {
      const planningPath = path.join(projectPath, 'docs', 'planning');
      const files = await fs.readdir(planningPath);
      stats.specs = files.filter(f => f.endsWith('.md')).length;
    } catch {}

    const projectName = path.basename(projectPath);

    const project: ProjectInfo = {
      path: projectPath,
      name: projectName,
      isValid: hasDevflow || hasClaudeProject,
      hasDevflow,
      hasClaudeProject,
      stats,
    };

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Error opening project:', error);
    return NextResponse.json(
      { error: 'Failed to open project' },
      { status: 500 }
    );
  }
}
