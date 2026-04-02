#!/usr/bin/env node
// Force ANSI color codes even when stdout is piped (e.g. Claude Code bash tool)
process.env.FORCE_COLOR = '1';

const { Command } = require('commander');
const { VERSION } = require('../lib/constants');
const { initCommand } = require('../lib/init');
const { updateCommand } = require('../lib/update');
const { autopilotCommand } = require('../lib/autopilot');
const { challengeCommand } = require('../lib/challenge');

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
  .command('autopilot')
  .description('Run autopilot agents on a spec file')
  .argument('<spec-file>', 'path to the spec markdown file')
  .option('--phases <list>', 'comma-separated agent IDs to run', 'strategist,architect,system-designer,builder,guardian,chronicler')
  .option('--project <path>', 'project directory (default: current directory)')
  .option('--no-update', 'do not auto-update tasks in spec file')
  .option('--adaptive', 'use LLM to decide which phases to run (skips unnecessary phases)')
  .option('--full-context', 'pass all previous outputs to each agent (disables context isolation)')
  .option('--challenger', 'run OpenAI adversarial review after guardian (requires OPENAI_API_KEY)')
  .option('--challenger-model <model>', 'model for challenger: gpt-5.4 (default), o3-mini, o3', 'gpt-5.4')
  .option('--verbose', 'show detailed output')
  .action(autopilotCommand);

program
  .command('challenge')
  .description('Run OpenAI adversarial review (standalone, without autopilot)')
  .argument('[review-file]', 'Guardian review file to challenge (.md)')
  .option('--project <path>', 'project directory (default: current directory)')
  .option('--spec <file>', 'spec file for additional context')
  .option('--input <file>', 'input file to review, e.g. builder-output.md')
  .option('--output <file>', 'write challenger review to this file (.md)')
  .option('--model <model>', 'model to use: gpt-5.4 (default), o3-mini, o3', 'gpt-5.4')
  .option('--timeout <seconds>', 'timeout in seconds', '300')
  .action(challengeCommand);

program.parse();
