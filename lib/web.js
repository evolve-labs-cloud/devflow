const { execSync, spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { PACKAGE_ROOT, VERSION, WEB_COPY_DIRS, WEB_COPY_FILES } = require('./constants');

/**
 * Fix node-pty spawn-helper permissions.
 * npm install may strip the execute bit from prebuilt binaries.
 */
function fixSpawnHelperPermissions(webDir) {
  try {
    const prebuildsDir = path.join(webDir, 'node_modules', 'node-pty', 'prebuilds');
    if (!fs.existsSync(prebuildsDir)) return;
    const platforms = fs.readdirSync(prebuildsDir);
    for (const platform of platforms) {
      const helper = path.join(prebuildsDir, platform, 'spawn-helper');
      if (fs.existsSync(helper)) {
        fs.chmodSync(helper, 0o755);
      }
    }
  } catch {
    // Non-critical on Windows or if prebuilds don't exist
  }
}

/**
 * When installed via npm, the web/ directory lives inside node_modules.
 * Next.js/SWC does not properly compile TypeScript files within node_modules,
 * so we copy the source to ~/.devflow/_web/ (a normal directory) and run from there.
 */
function resolveWebDir() {
  const packageWebDir = path.join(PACKAGE_ROOT, 'web');

  if (!fs.existsSync(packageWebDir)) {
    return null;
  }

  // If not inside node_modules, use directly (dev mode / cloned repo)
  if (!PACKAGE_ROOT.includes('node_modules')) {
    return packageWebDir;
  }

  // Running from npm install — copy source to local cache
  const cacheDir = path.join(os.homedir(), '.devflow', '_web');
  const versionFile = path.join(cacheDir, '.devflow-version');
  const cachedVersion = fs.existsSync(versionFile)
    ? fs.readFileSync(versionFile, 'utf-8').trim()
    : '';

  if (cachedVersion === VERSION && fs.existsSync(path.join(cacheDir, 'package.json'))) {
    return cacheDir;
  }

  console.log('Setting up web dashboard files...');

  // Clean previous cache
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
  fs.mkdirSync(cacheDir, { recursive: true });

  // Copy source directories
  for (const dir of WEB_COPY_DIRS) {
    const srcDir = path.join(PACKAGE_ROOT, dir);
    const destDir = path.join(cacheDir, dir.replace(/^web\//, ''));
    if (fs.existsSync(srcDir)) {
      fs.cpSync(srcDir, destDir, { recursive: true });
    }
  }

  // Copy individual files
  for (const file of WEB_COPY_FILES) {
    const srcFile = path.join(PACKAGE_ROOT, file);
    const destFile = path.join(cacheDir, file.replace(/^web\//, ''));
    if (fs.existsSync(srcFile)) {
      const destDir = path.dirname(destFile);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcFile, destFile);
    }
  }

  // Write version marker
  fs.writeFileSync(versionFile, VERSION);

  return cacheDir;
}

/**
 * devflow web - Start the DevFlow Web Dashboard
 */
async function webCommand(options) {
  const port = options.port || '3000';
  const webDir = resolveWebDir();

  // 1. Verify web/ directory exists
  if (!webDir) {
    console.error('Error: Web IDE files not found.');
    console.error('Re-install devflow with: npm install -g @evolve.labs/devflow');
    process.exit(1);
  }

  // 2. Check if package.json exists
  const pkgPath = path.join(webDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('Error: web/package.json not found.');
    process.exit(1);
  }

  // 3. Install dependencies if needed
  const nodeModules = path.join(webDir, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    console.log('Installing web dependencies...');
    try {
      execSync('npm install', {
        cwd: webDir,
        stdio: 'inherit',
        timeout: 120_000,
      });

      // Fix node-pty spawn-helper permissions (npm may strip execute bit)
      fixSpawnHelperPermissions(webDir);
    } catch {
      console.error('Failed to install dependencies.');
      process.exit(1);
    }
  }

  // 4. Determine the project path to open
  const projectPath = options.project || process.cwd();
  const resolvedProject = path.resolve(projectPath);

  if (!fs.existsSync(resolvedProject)) {
    console.error(`Project path not found: ${resolvedProject}`);
    process.exit(1);
  }

  // 5. Validate port
  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    console.error(`Invalid port: ${port}`);
    process.exit(1);
  }

  // 6. Start the web server
  const isDev = options.dev || false;
  const cmd = isDev ? 'dev' : 'start';

  // Build first if not dev mode and no valid production build exists
  if (!isDev) {
    const buildIdPath = path.join(webDir, '.next', 'BUILD_ID');
    if (!fs.existsSync(buildIdPath)) {
      console.log('Building web dashboard (first run, may take a minute)...');
      // Remove stale .next directory if it exists without BUILD_ID
      const nextDir = path.join(webDir, '.next');
      if (fs.existsSync(nextDir)) {
        fs.rmSync(nextDir, { recursive: true, force: true });
      }
      try {
        execSync('npx next build --webpack', {
          cwd: webDir,
          stdio: 'inherit',
          timeout: 300_000,
        });
      } catch {
        console.error('Build failed. Try running with --dev flag for development mode.');
        process.exit(1);
      }
    }
  }

  console.log(`\nStarting DevFlow Web Dashboard on port ${port}...`);
  console.log(`Project: ${resolvedProject}\n`);

  // Set environment variables
  const env = {
    ...process.env,
    PORT: port,
    DEVFLOW_PROJECT_PATH: resolvedProject,
  };

  // Start the server
  const child = spawn('npx', ['next', cmd, '-p', port], {
    cwd: webDir,
    env,
    stdio: 'inherit',
  });

  // Open browser after a short delay (unless --no-open)
  if (options.open !== false) {
    setTimeout(() => {
      const url = `http://localhost:${portNum}`;
      try {
        const openCmd = process.platform === 'darwin' ? 'open'
          : process.platform === 'win32' ? 'start'
          : 'xdg-open';
        execSync(`${openCmd} ${JSON.stringify(url)}`, { stdio: 'ignore' });
      } catch {
        console.log(`Open your browser at: ${url}`);
      }
    }, 3000);
  }

  // Handle process signals
  const cleanup = () => {
    child.kill();
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

module.exports = { webCommand };
