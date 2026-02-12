#!/usr/bin/env node

const { Command } = require('commander');
const { VERSION } = require('../lib/constants');
const { initCommand } = require('../lib/init');
const { updateCommand } = require('../lib/update');
const { webCommand } = require('../lib/web');
const { autopilotCommand } = require('../lib/autopilot');

const program = new Command();

program
  .name('devflow')
  .description('DevFlow - Multi-agent system for software development with Claude Code')
  .version(VERSION, '-v, --version');

program
  .command('init')
  .description('Initialize DevFlow in a project directory')
  .argument('[path]', 'target project directory', '.')
  .option('--agents-only', 'install only agents (minimal setup)')
  .option('--full', 'full installation including .gitignore')
  .option('--web', 'include Web IDE source files')
  .option('-f, --force', 'overwrite existing installation without asking')
  .option('--skip-deps', 'skip dependency checking')
  .action(initCommand);

program
  .command('update')
  .description('Update an existing DevFlow installation')
  .argument('[path]', 'target project directory', '.')
  .option('-f, --force', 'update without confirmation')
  .action(updateCommand);

program
  .command('web')
  .description('Start the DevFlow Web Dashboard')
  .option('-p, --port <port>', 'port number', '3000')
  .option('--project <path>', 'initial project path (defaults to current directory)')
  .option('--dev', 'run in development mode')
  .option('--no-open', 'do not open browser automatically')
  .action(webCommand);

program
  .command('autopilot')
  .description('Run autopilot agents on a spec file')
  .argument('<spec-file>', 'path to the spec markdown file')
  .option('--phases <list>', 'comma-separated agent IDs to run', 'strategist,architect,system-designer,builder,guardian,chronicler')
  .option('--project <path>', 'project directory (default: current directory)')
  .option('--no-update', 'do not auto-update tasks in spec file')
  .option('--verbose', 'show detailed output')
  .action(autopilotCommand);

program.parse();
