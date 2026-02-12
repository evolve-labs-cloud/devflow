const path = require('node:path');

const VERSION = '0.7.0';

// Root of the installed npm package (where source files live)
const PACKAGE_ROOT = path.resolve(__dirname, '..');

// Directories to create in all install modes
const BASE_DIRS = [
  '.claude/commands',
  '.devflow/agents',
  '.devflow/memory',
  '.devflow/sessions',
  'docs/snapshots',
  'docs/system-design/sdd',
  'docs/system-design/rfc',
  'docs/system-design/capacity',
  'docs/system-design/trade-offs',
];

// Additional directories for default/full modes
const DOCS_DIRS = [
  'docs/planning/stories',
  'docs/architecture/diagrams',
  'docs/decisions',
  'docs/security',
  'docs/performance',
  'docs/api',
  'docs/migration',
];

// Directories that should have .gitkeep files
const GITKEEP_DIRS = [
  'docs/planning',
  'docs/planning/stories',
  'docs/architecture',
  'docs/architecture/diagrams',
  'docs/decisions',
  'docs/security',
  'docs/performance',
  'docs/api',
  'docs/migration',
  'docs/snapshots',
  'docs/system-design/sdd',
  'docs/system-design/rfc',
  'docs/system-design/capacity',
  'docs/system-design/trade-offs',
  '.devflow/sessions',
];

// Files and directories to copy during init
const AGENTS_COPY = [
  { src: '.claude/commands/agents',          dest: '.claude/commands/agents',          type: 'dir' },
  { src: '.claude/commands/quick',           dest: '.claude/commands/quick',           type: 'dir' },
  { src: '.claude/commands/devflow-help.md', dest: '.claude/commands/devflow-help.md', type: 'file' },
  { src: '.claude/commands/devflow-status.md', dest: '.claude/commands/devflow-status.md', type: 'file' },
  { src: '.claude_project',                  dest: '.claude_project',                  type: 'file' },
  { src: '.devflow/project.yaml',            dest: '.devflow/project.yaml',            type: 'file' },
  { src: '.devflow/agents',                  dest: '.devflow/agents',                  type: 'dir' },
];

// Doc files to copy in default/full modes
const DOC_FILES = [
  'docs/decisions/000-template.md',
];

// Web IDE source directories to copy (excludes node_modules, .next, etc.)
const WEB_COPY_DIRS = [
  'web/app',
  'web/components',
  'web/hooks',
  'web/lib',
];

const WEB_COPY_FILES = [
  'web/package.json',
  'web/next.config.js',
  'web/tsconfig.json',
  'web/tailwind.config.ts',
  'web/postcss.config.js',
  'web/README.md',
  'web/CHANGELOG.md',
];

module.exports = {
  VERSION,
  PACKAGE_ROOT,
  BASE_DIRS,
  DOCS_DIRS,
  GITKEEP_DIRS,
  AGENTS_COPY,
  DOC_FILES,
  WEB_COPY_DIRS,
  WEB_COPY_FILES,
};
