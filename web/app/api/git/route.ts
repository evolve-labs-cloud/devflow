import { NextRequest, NextResponse } from 'next/server';
import {
  getGitStatus,
  getGitLog,
  getGitBranches,
  getGitDiff,
  gitStage,
  gitUnstage,
  gitCommit,
  gitPush,
  gitPull,
  gitCheckout,
  gitCreateBranch,
  gitDiscard,
  gitInit,
  getRemotes,
} from '@/lib/git';

// GET - Get git status, log, branches, or diff
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';
  const projectPath = searchParams.get('projectPath');
  const file = searchParams.get('file');
  const staged = searchParams.get('staged') === 'true';

  if (!projectPath) {
    return NextResponse.json(
      { error: 'projectPath is required' },
      { status: 400 }
    );
  }

  try {
    switch (action) {
      case 'status': {
        const status = await getGitStatus(projectPath);
        return NextResponse.json(status);
      }

      case 'log': {
        const maxCount = parseInt(searchParams.get('maxCount') || '50', 10);
        const log = await getGitLog(projectPath, maxCount);
        return NextResponse.json({ commits: log });
      }

      case 'branches': {
        const branches = await getGitBranches(projectPath);
        return NextResponse.json({ branches });
      }

      case 'diff': {
        const diff = await getGitDiff(projectPath, file || undefined, staged);
        return NextResponse.json({ diff });
      }

      case 'remotes': {
        const remotes = await getRemotes(projectPath);
        return NextResponse.json({ remotes });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Git API error:', error);
    return NextResponse.json(
      { error: 'Git operation failed' },
      { status: 500 }
    );
  }
}

// POST - Perform git operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectPath, files, message, remote, branch } = body;

    if (!projectPath) {
      return NextResponse.json(
        { error: 'projectPath is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'stage': {
        if (!files || !Array.isArray(files) || files.length === 0) {
          return NextResponse.json(
            { error: 'files array is required' },
            { status: 400 }
          );
        }
        const success = await gitStage(projectPath, files);
        return NextResponse.json({ success });
      }

      case 'unstage': {
        if (!files || !Array.isArray(files) || files.length === 0) {
          return NextResponse.json(
            { error: 'files array is required' },
            { status: 400 }
          );
        }
        const success = await gitUnstage(projectPath, files);
        return NextResponse.json({ success });
      }

      case 'commit': {
        if (!message) {
          return NextResponse.json(
            { error: 'message is required' },
            { status: 400 }
          );
        }
        const result = await gitCommit(projectPath, message);
        return NextResponse.json(result);
      }

      case 'push': {
        const result = await gitPush(projectPath, remote || 'origin', branch);
        return NextResponse.json(result);
      }

      case 'pull': {
        const result = await gitPull(projectPath, remote || 'origin', branch);
        return NextResponse.json(result);
      }

      case 'checkout': {
        if (!branch) {
          return NextResponse.json(
            { error: 'branch is required' },
            { status: 400 }
          );
        }
        const result = await gitCheckout(projectPath, branch);
        return NextResponse.json(result);
      }

      case 'createBranch': {
        if (!branch) {
          return NextResponse.json(
            { error: 'branch is required' },
            { status: 400 }
          );
        }
        const checkout = body.checkout !== false;
        const result = await gitCreateBranch(projectPath, branch, checkout);
        return NextResponse.json(result);
      }

      case 'discard': {
        if (!files || !Array.isArray(files) || files.length === 0) {
          return NextResponse.json(
            { error: 'files array is required' },
            { status: 400 }
          );
        }
        const success = await gitDiscard(projectPath, files);
        return NextResponse.json({ success });
      }

      case 'init': {
        const result = await gitInit(projectPath);
        return NextResponse.json(result);
      }

      case 'stageAll': {
        const success = await gitStage(projectPath, ['.']);
        return NextResponse.json({ success });
      }

      case 'unstageAll': {
        const status = await getGitStatus(projectPath);
        const stagedFiles = status.staged.map(f => f.path);
        if (stagedFiles.length > 0) {
          const success = await gitUnstage(projectPath, stagedFiles);
          return NextResponse.json({ success });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Git API error:', error);
    return NextResponse.json(
      { error: 'Git operation failed' },
      { status: 500 }
    );
  }
}
