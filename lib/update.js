const fs = require('node:fs');
const path = require('node:path');
const {
  VERSION,
  PACKAGE_ROOT,
  BASE_DIRS,
  DOCS_DIRS,
  GITKEEP_DIRS,
} = require('./constants');
const {
  printHeader,
  success,
  error,
  warn,
  info,
  printUpdateSuccess,
  confirm,
  copyDir,
  copyFile,
  ensureDirs,
  createGitkeep,
  pathExists,
  resolveTarget,
} = require('./utils');

async function updateCommand(targetArg, options) {
  printHeader(VERSION);

  const targetDir = resolveTarget(targetArg);

  // 1. Verify DevFlow is installed
  const hasAgents = await pathExists(path.join(targetDir, '.claude', 'commands', 'agents'));
  const hasDevflow = await pathExists(path.join(targetDir, '.devflow'));

  if (!hasAgents && !hasDevflow) {
    error(`DevFlow not found in: ${targetDir}`);
    info('Use "devflow init" to install for the first time.');
    process.exit(1);
  }

  // 2. Read installed version
  let installedVersion = 'unknown';
  const projectYamlPath = path.join(targetDir, '.devflow', 'project.yaml');
  try {
    const content = await fs.promises.readFile(projectYamlPath, 'utf8');
    const match = content.match(/^\s*version:\s*"?([^"\s]+)"?/m);
    if (match) installedVersion = match[1];
  } catch { /* file may not exist */ }

  info(`Project: ${targetDir}`);
  info(`Installed version: ${installedVersion}`);
  info(`New version: ${VERSION}`);
  console.log();

  // 3. Check if already up to date
  if (installedVersion === VERSION) {
    success('DevFlow is already up to date!');
    return;
  }

  // 4. Confirm update
  if (!options.force) {
    warn('The update will overwrite agent files.');
    warn('Customizations in .claude/commands/agents/ will be lost.');
    console.log();
    const shouldContinue = await confirm('Continue with update?');
    if (!shouldContinue) {
      warn('Update cancelled.');
      return;
    }
  }

  console.log();
  info('Updating DevFlow...');
  console.log();

  // 5. Backup existing agents
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(targetDir, '.devflow', `backup-${timestamp}`);
  await fs.promises.mkdir(backupDir, { recursive: true });

  try {
    await fs.promises.cp(
      path.join(targetDir, '.claude', 'commands', 'agents'),
      path.join(backupDir, 'agents'),
      { recursive: true }
    );
  } catch { /* may not exist */ }

  try {
    await fs.promises.copyFile(
      projectYamlPath,
      path.join(backupDir, 'project.yaml')
    );
  } catch { /* may not exist */ }

  success(`Backup created: .devflow/${path.basename(backupDir)}/`);

  // 6. Update agents
  console.log('  \u2192 Updating agents...');
  await copyDir(
    path.join(PACKAGE_ROOT, '.claude', 'commands', 'agents'),
    path.join(targetDir, '.claude', 'commands', 'agents')
  );
  success('Agents updated (.claude/commands/agents/)');

  // 7. Update quick commands
  console.log('  \u2192 Updating quick commands...');
  await copyDir(
    path.join(PACKAGE_ROOT, '.claude', 'commands', 'quick'),
    path.join(targetDir, '.claude', 'commands', 'quick')
  );
  success('Quick commands updated');

  // 8. Update help & status commands
  console.log('  \u2192 Updating help & status commands...');
  for (const file of ['devflow-help.md', 'devflow-status.md']) {
    try {
      await copyFile(
        path.join(PACKAGE_ROOT, '.claude', 'commands', file),
        path.join(targetDir, '.claude', 'commands', file)
      );
    } catch { /* skip if missing */ }
  }

  // 9. Update .claude_project
  console.log('  \u2192 Updating .claude_project...');
  await copyFile(
    path.join(PACKAGE_ROOT, '.claude_project'),
    path.join(targetDir, '.claude_project')
  );
  success('.claude_project updated');

  // 10. Update .devflow/agents/ meta.yaml files
  console.log('  \u2192 Updating .devflow/agents/ meta.yaml files...');
  await copyDir(
    path.join(PACKAGE_ROOT, '.devflow', 'agents'),
    path.join(targetDir, '.devflow', 'agents')
  );
  success('.devflow/agents/ updated');

  // 11. Update project.yaml version
  console.log('  \u2192 Updating project.yaml version...');
  try {
    let content = await fs.promises.readFile(projectYamlPath, 'utf8');
    content = content.replace(
      /version:\s*"?[^"\s]+"?/,
      `version: "${VERSION}"`
    );
    await fs.promises.writeFile(projectYamlPath, content, 'utf8');
    success(`project.yaml version updated to ${VERSION}`);
  } catch {
    await copyFile(
      path.join(PACKAGE_ROOT, '.devflow', 'project.yaml'),
      projectYamlPath
    );
    success('project.yaml created');
  }

  // 12. Ensure directory structure is complete
  console.log('  \u2192 Verifying directory structure...');
  await ensureDirs(targetDir, [...BASE_DIRS, ...DOCS_DIRS]);
  await createGitkeep(targetDir, GITKEEP_DIRS);
  success('Directory structure verified');

  // 13. Success output
  printUpdateSuccess(VERSION);
  info('What was updated:');
  console.log('  \u2022 Agents in .claude/commands/agents/');
  console.log('  \u2022 Quick commands in .claude/commands/quick/');
  console.log('  \u2022 .claude_project orchestration rules');
  console.log('  \u2022 .devflow/agents/ meta.yaml files');
  console.log('  \u2022 Directory structure');
  console.log();
  info(`Backup saved in: .devflow/${path.basename(backupDir)}/`);
  console.log();
  info('Tip: Use /agents:strategist to start a new feature');
  console.log();
}

module.exports = { updateCommand };
