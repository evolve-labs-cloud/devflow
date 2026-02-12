const { execSync, spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { PACKAGE_ROOT } = require('./constants');

/**
 * devflow web - Start the DevFlow Web Dashboard
 */
async function webCommand(options) {
  const port = options.port || '3000';
  const webDir = path.join(PACKAGE_ROOT, 'web');

  // 1. Verify web/ directory exists
  if (!fs.existsSync(webDir)) {
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

  // 5. Start the web server
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
      const url = `http://localhost:${port}`;
      try {
        const openCmd = process.platform === 'darwin' ? 'open'
          : process.platform === 'win32' ? 'start'
          : 'xdg-open';
        execSync(`${openCmd} ${url}`, { stdio: 'ignore' });
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
