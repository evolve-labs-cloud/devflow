import simpleGit, { SimpleGit, StatusResult, DiffResult, LogResult } from 'simple-git';

export interface GitStatus {
  isRepo: boolean;
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  untracked: string[];
  conflicted: string[];
}

export interface GitFileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  oldPath?: string;
}

export interface GitCommit {
  hash: string;
  hashShort: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  commit: string;
  label: string;
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  chunks: GitDiffChunk[];
}

export interface GitDiffChunk {
  header: string;
  lines: GitDiffLine[];
}

export interface GitDiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLineNo?: number;
  newLineNo?: number;
}

function mapFileStatus(index: string, workingDir: string): 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' {
  const status = index !== ' ' ? index : workingDir;
  switch (status) {
    case 'A': return 'added';
    case 'M': return 'modified';
    case 'D': return 'deleted';
    case 'R': return 'renamed';
    case 'C': return 'copied';
    default: return 'modified';
  }
}

export async function getGitStatus(cwd: string): Promise<GitStatus> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return {
        isRepo: false,
        branch: '',
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: [],
      };
    }

    const status: StatusResult = await git.status();

    const staged: GitFileChange[] = [];
    const unstaged: GitFileChange[] = [];

    // Process files
    status.files.forEach((file) => {
      // Staged changes (index)
      if (file.index !== ' ' && file.index !== '?') {
        staged.push({
          path: file.path,
          status: mapFileStatus(file.index, ' '),
        });
      }

      // Unstaged changes (working directory)
      if (file.working_dir !== ' ' && file.working_dir !== '?') {
        unstaged.push({
          path: file.path,
          status: mapFileStatus(' ', file.working_dir),
        });
      }
    });

    return {
      isRepo: true,
      branch: status.current || 'HEAD',
      ahead: status.ahead,
      behind: status.behind,
      staged,
      unstaged,
      untracked: status.not_added,
      conflicted: status.conflicted,
    };
  } catch (error) {
    console.error('Git status error:', error);
    return {
      isRepo: false,
      branch: '',
      ahead: 0,
      behind: 0,
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
    };
  }
}

export async function getGitLog(cwd: string, maxCount: number = 50): Promise<GitCommit[]> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    const log: LogResult = await git.log({ maxCount });

    return log.all.map((commit) => ({
      hash: commit.hash,
      hashShort: commit.hash.substring(0, 7),
      author: commit.author_name,
      email: commit.author_email,
      date: commit.date,
      message: commit.message,
    }));
  } catch (error) {
    console.error('Git log error:', error);
    return [];
  }
}

export async function getGitBranches(cwd: string): Promise<GitBranch[]> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    const branches = await git.branchLocal();

    return branches.all.map((name) => ({
      name,
      current: name === branches.current,
      commit: branches.branches[name]?.commit || '',
      label: branches.branches[name]?.label || name,
    }));
  } catch (error) {
    console.error('Git branches error:', error);
    return [];
  }
}

export async function getGitDiff(cwd: string, file?: string, staged: boolean = false): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    const args = staged ? ['--cached'] : [];
    if (file) {
      args.push('--', file);
    }

    const diff = await git.diff(args);
    return diff;
  } catch (error) {
    console.error('Git diff error:', error);
    return '';
  }
}

export async function gitStage(cwd: string, files: string[]): Promise<boolean> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    await git.add(files);
    return true;
  } catch (error) {
    console.error('Git stage error:', error);
    return false;
  }
}

export async function gitUnstage(cwd: string, files: string[]): Promise<boolean> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    await git.reset(['HEAD', '--', ...files]);
    return true;
  } catch (error) {
    console.error('Git unstage error:', error);
    return false;
  }
}

export async function gitCommit(cwd: string, message: string): Promise<{ success: boolean; hash?: string; error?: string }> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    const result = await git.commit(message);
    return {
      success: true,
      hash: result.commit,
    };
  } catch (error) {
    console.error('Git commit error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Commit failed',
    };
  }
}

export async function gitPush(cwd: string, remote: string = 'origin', branch?: string): Promise<{ success: boolean; error?: string }> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    const status = await git.status();
    const targetBranch = branch || status.current || 'main';
    await git.push(remote, targetBranch);
    return { success: true };
  } catch (error) {
    console.error('Git push error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Push failed',
    };
  }
}

export async function gitPull(cwd: string, remote: string = 'origin', branch?: string): Promise<{ success: boolean; error?: string }> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    const status = await git.status();
    const targetBranch = branch || status.current || 'main';
    await git.pull(remote, targetBranch);
    return { success: true };
  } catch (error) {
    console.error('Git pull error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Pull failed',
    };
  }
}

export async function gitCheckout(cwd: string, branch: string): Promise<{ success: boolean; error?: string }> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    await git.checkout(branch);
    return { success: true };
  } catch (error) {
    console.error('Git checkout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Checkout failed',
    };
  }
}

export async function gitCreateBranch(cwd: string, branch: string, checkout: boolean = true): Promise<{ success: boolean; error?: string }> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    if (checkout) {
      await git.checkoutLocalBranch(branch);
    } else {
      await git.branch([branch]);
    }
    return { success: true };
  } catch (error) {
    console.error('Git create branch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Create branch failed',
    };
  }
}

export async function gitDiscard(cwd: string, files: string[]): Promise<boolean> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    await git.checkout(['--', ...files]);
    return true;
  } catch (error) {
    console.error('Git discard error:', error);
    return false;
  }
}

export async function gitInit(cwd: string): Promise<{ success: boolean; error?: string }> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    await git.init();
    return { success: true };
  } catch (error) {
    console.error('Git init error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Init failed',
    };
  }
}

export async function getRemotes(cwd: string): Promise<{ name: string; url: string }[]> {
  const git: SimpleGit = simpleGit(cwd);

  try {
    const remotes = await git.getRemotes(true);
    return remotes.map((r) => ({
      name: r.name,
      url: r.refs.fetch || r.refs.push || '',
    }));
  } catch (error) {
    console.error('Git remotes error:', error);
    return [];
  }
}
