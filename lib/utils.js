const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

// ANSI color helpers (no chalk dependency)
const c = {
  red:    (s) => `\x1b[0;31m${s}\x1b[0m`,
  green:  (s) => `\x1b[0;32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[1;33m${s}\x1b[0m`,
  blue:   (s) => `\x1b[0;34m${s}\x1b[0m`,
};

function printHeader(version) {
  const line = c.blue('\u2501'.repeat(55));
  console.log(line);
  console.log(c.blue(`  DevFlow CLI v${version}`));
  console.log(line);
  console.log();
}

function success(msg) { console.log(`${c.green('\u2713')} ${msg}`); }
function error(msg)   { console.log(`${c.red('\u2717')} ${msg}`); }
function warn(msg)    { console.log(`${c.yellow('\u26A0')} ${msg}`); }
function info(msg)    { console.log(`${c.blue('\u2139')} ${msg}`); }

function printSuccess(version) {
  const line = c.green('\u2501'.repeat(55));
  console.log();
  console.log(line);
  console.log(c.green(`  \u2713 DevFlow v${version} installed successfully!`));
  console.log(line);
  console.log();
}

function printUpdateSuccess(version) {
  const line = c.green('\u2501'.repeat(55));
  console.log();
  console.log(line);
  console.log(c.green(`  \u2713 DevFlow updated to v${version}!`));
  console.log(line);
  console.log();
}

// Interactive y/N confirmation
function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${question} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Check if a CLI command exists
function commandExists(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check required/recommended dependencies
function checkDependencies() {
  const platform = process.platform === 'darwin' ? 'macOS'
    : process.platform === 'win32' ? 'Windows'
    : 'Linux';
  info(`System: ${platform}`);
  console.log();

  if (commandExists('claude')) {
    success('Claude Code: installed');
  } else {
    warn('Claude Code: not found');
    console.log('  Install: npm install -g @anthropic-ai/claude-code');
  }

  if (commandExists('git')) {
    success('Git: installed');
  } else {
    warn('Git: not found (recommended)');
  }

  console.log();
}

// Copy directory recursively using Node 18+ fs.cp
async function copyDir(src, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.cp(src, dest, { recursive: true, force: true });
}

// Copy single file, creating parent dirs as needed
async function copyFile(src, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.copyFile(src, dest);
}

// Create multiple directories
async function ensureDirs(root, dirs) {
  for (const dir of dirs) {
    await fs.promises.mkdir(path.join(root, dir), { recursive: true });
  }
}

// Create .gitkeep in directories that should be tracked but are empty
async function createGitkeep(root, dirs) {
  for (const dir of dirs) {
    const gitkeepPath = path.join(root, dir, '.gitkeep');
    try {
      await fs.promises.access(gitkeepPath);
    } catch {
      await fs.promises.writeFile(gitkeepPath, '');
    }
  }
}

// Check if a path exists
async function pathExists(p) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

// Resolve target path relative to cwd
function resolveTarget(targetArg) {
  return path.resolve(process.cwd(), targetArg);
}

module.exports = {
  c,
  printHeader,
  success,
  error,
  warn,
  info,
  printSuccess,
  printUpdateSuccess,
  confirm,
  commandExists,
  checkDependencies,
  copyDir,
  copyFile,
  ensureDirs,
  createGitkeep,
  pathExists,
  resolveTarget,
};
