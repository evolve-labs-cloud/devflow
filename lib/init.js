const fs = require('node:fs');
const path = require('node:path');
const {
  VERSION,
  PACKAGE_ROOT,
  BASE_DIRS,
  DOCS_DIRS,
  GITKEEP_DIRS,
  AGENTS_COPY,
  DOC_FILES,
  WEB_COPY_DIRS,
  WEB_COPY_FILES,
} = require('./constants');
const {
  printHeader,
  success,
  error,
  warn,
  info,
  printSuccess,
  confirm,
  checkDependencies,
  copyDir,
  copyFile,
  ensureDirs,
  createGitkeep,
  pathExists,
  resolveTarget,
} = require('./utils');

async function initCommand(targetArg, options) {
  printHeader(VERSION);

  const targetDir = resolveTarget(targetArg);

  // 1. Check dependencies
  if (!options.skipDeps) {
    checkDependencies();
  }

  // 2. Validate/create target directory
  if (!(await pathExists(targetDir))) {
    info(`Directory does not exist: ${targetDir}`);
    const shouldCreate = options.force || await confirm('Create this directory?');
    if (!shouldCreate) {
      error('Installation cancelled.');
      process.exit(1);
    }
    await fs.promises.mkdir(targetDir, { recursive: true });
    success(`Directory created: ${targetDir}`);
  }

  info(`Installing DevFlow in: ${targetDir}`);
  console.log();

  // 3. Check for existing installation
  if (await pathExists(path.join(targetDir, '.devflow'))) {
    warn('.devflow/ already exists in target directory!');
    if (!options.force) {
      const shouldOverwrite = await confirm('Overwrite existing installation?');
      if (!shouldOverwrite) {
        error('Installation cancelled.');
        process.exit(1);
      }
    }
    console.log();
  }

  // 4. Determine install mode
  let mode = 'default';
  if (options.agentsOnly) mode = 'agents-only';
  if (options.full) mode = 'full';

  const modeLabels = {
    'agents-only': 'Agents only (minimal)',
    'default': 'Agents + documentation structure',
    'full': 'Full installation',
  };
  info(`Install mode: ${modeLabels[mode]}`);
  console.log();

  // 5. Create base directory structure
  await ensureDirs(targetDir, BASE_DIRS);

  // 6. Copy agent files and core config
  for (const item of AGENTS_COPY) {
    const src = path.join(PACKAGE_ROOT, item.src);
    const dest = path.join(targetDir, item.dest);
    try {
      if (item.type === 'dir') {
        await copyDir(src, dest);
      } else {
        await copyFile(src, dest);
      }
    } catch (err) {
      warn(`Could not copy ${item.src}: ${err.message}`);
    }
  }

  success('Agents installed (.claude/commands/agents/)');
  success('Quick commands installed (.claude/commands/quick/)');
  success('.claude_project orchestration rules installed');
  success('.devflow/ structure created');

  // 7. Default/full: create docs structure with gitkeep files
  if (mode === 'default' || mode === 'full') {
    await ensureDirs(targetDir, DOCS_DIRS);
    await createGitkeep(targetDir, GITKEEP_DIRS);

    // Copy doc template files
    for (const file of DOC_FILES) {
      const src = path.join(PACKAGE_ROOT, file);
      const dest = path.join(targetDir, file);
      try {
        if (!(await pathExists(dest))) {
          await copyFile(src, dest);
        }
      } catch { /* skip if source missing */ }
    }

    success('Documentation structure created (docs/)');
  }

  // 8. Full: copy .gitignore
  if (mode === 'full') {
    const gitignoreSrc = path.join(PACKAGE_ROOT, '.gitignore-template');
    const gitignoreDest = path.join(targetDir, '.gitignore');

    if (await pathExists(gitignoreSrc)) {
      if (await pathExists(gitignoreDest)) {
        warn('.gitignore already exists - appending DevFlow entries');
        const existing = await fs.promises.readFile(gitignoreDest, 'utf8');
        if (!existing.includes('# DevFlow')) {
          const devflowIgnore = await fs.promises.readFile(gitignoreSrc, 'utf8');
          await fs.promises.appendFile(
            gitignoreDest,
            `\n\n# --- DevFlow entries ---\n${devflowIgnore}`
          );
        }
        success('.gitignore updated with DevFlow entries');
      } else {
        await copyFile(gitignoreSrc, gitignoreDest);
        success('.gitignore created');
      }
    }
  }

  // 9. Optional: copy Web IDE
  if (options.web) {
    info('Installing Web IDE source files...');

    // Copy web directories
    for (const dir of WEB_COPY_DIRS) {
      const src = path.join(PACKAGE_ROOT, dir);
      const dest = path.join(targetDir, dir);
      try {
        await copyDir(src, dest);
      } catch (err) {
        warn(`Could not copy ${dir}: ${err.message}`);
      }
    }

    // Copy web files
    for (const file of WEB_COPY_FILES) {
      const src = path.join(PACKAGE_ROOT, file);
      const dest = path.join(targetDir, file);
      try {
        await copyFile(src, dest);
      } catch { /* skip if source missing */ }
    }

    success('Web IDE source files installed (web/)');
  }

  // 10. Success output
  printSuccess(VERSION);
  info('Next steps:');
  console.log();
  console.log('1. Open the project in Claude Code:');
  console.log(`   cd ${targetDir}`);
  console.log('   claude');
  console.log();
  console.log('2. In Claude Code, test an agent:');
  console.log('   /agents:strategist Hello! Introduce yourself');
  console.log();
  console.log('3. Create your first feature:');
  console.log('   /agents:strategist I want to create [your feature]');

  if (options.web) {
    console.log();
    console.log('4. Start the Web IDE:');
    console.log(`   cd ${path.join(targetDir, 'web')}`);
    console.log('   npm install');
    console.log('   npm run dev');
    console.log('   # Open http://localhost:3000');
  }
  console.log();
}

module.exports = { initCommand };
