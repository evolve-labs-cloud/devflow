import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  parseUserStory,
  parseADR,
  getSpecType,
  parseFrontmatter,
  extractTasks,
} from '@/lib/specsParser';
import type { Spec, Requirement, DesignDecision, Task } from '@/lib/types';

interface SpecsResponse {
  specs: Spec[];
  requirements: Requirement[];
  decisions: DesignDecision[];
  tasks: Task[];
}

/**
 * GET /api/specs - List all specs from a project
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const projectPath = searchParams.get('projectPath');

    if (!projectPath) {
      return NextResponse.json(
        { error: 'projectPath is required' },
        { status: 400 }
      );
    }

    // Security: Validate path
    if (projectPath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    const response: SpecsResponse = {
      specs: [],
      requirements: [],
      decisions: [],
      tasks: [],
    };

    // Directories to scan for specs
    const specDirs = [
      'docs/planning/stories',
      'docs/planning/specs',
      'docs/planning',
      'docs/decisions',
      '.devflow/specs',
      '.devflow/stories',
      'specs',
      'stories',
    ];

    for (const dir of specDirs) {
      const fullPath = path.join(projectPath, dir);

      try {
        const stat = await fs.stat(fullPath);
        if (!stat.isDirectory()) continue;

        const files = await fs.readdir(fullPath);

        for (const file of files) {
          if (!file.endsWith('.md')) continue;

          const filePath = path.join(fullPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const specType = getSpecType(filePath);

          try {
            if (specType === 'story' || specType === 'spec') {
              const { spec, requirement, tasks } = parseUserStory(content, filePath);
              response.specs.push(spec);
              response.requirements.push(requirement);
              response.tasks.push(...tasks);
            } else if (specType === 'adr') {
              const { spec, decision } = parseADR(content, filePath);
              response.specs.push(spec);
              response.decisions.push(decision);
            } else {
              // Generic spec parsing
              const { frontmatter, body } = parseFrontmatter(content);
              const titleMatch = body.match(/^#\s+(.+)$/m);
              const id = file.replace('.md', '');

              const spec: Spec = {
                id,
                name: frontmatter.title || titleMatch?.[1] || id,
                description: body.slice(0, 200).replace(/^#.+\n/, '').trim(),
                phase: 'requirements',
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date(),
                filePath,
              };

              response.specs.push(spec);
              response.tasks.push(...extractTasks(body, id, filePath));
            }
          } catch (parseError) {
            console.error(`Error parsing ${filePath}:`, parseError);
          }
        }
      } catch {
        // Directory doesn't exist, skip
      }
    }

    // Deduplicate by ID
    response.specs = [...new Map(response.specs.map(s => [s.id, s])).values()];
    response.requirements = [...new Map(response.requirements.map(r => [r.id, r])).values()];
    response.decisions = [...new Map(response.decisions.map(d => [d.id, d])).values()];
    response.tasks = [...new Map(response.tasks.map(t => [t.id, t])).values()];

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error loading specs:', error);
    return NextResponse.json(
      { error: 'Failed to load specs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/specs - Create a new spec
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectPath, type, title, description, priority, phase } = body;

    if (!projectPath || !type || !title) {
      return NextResponse.json(
        { error: 'projectPath, type, and title are required' },
        { status: 400 }
      );
    }

    // Security: Validate path
    if (projectPath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Determine directory based on type
    let dir: string;
    let prefix: string;
    let template: string;

    switch (type) {
      case 'story':
        dir = 'docs/planning/stories';
        prefix = 'US';
        template = generateStoryTemplate(title, description, priority);
        break;
      case 'adr':
        dir = 'docs/decisions';
        prefix = 'ADR';
        template = generateADRTemplate(title, description);
        break;
      case 'spec':
      default:
        dir = 'docs/planning/specs';
        prefix = 'SPEC';
        template = generateSpecTemplate(title, description, phase);
        break;
    }

    // Create directory if it doesn't exist
    const fullDir = path.join(projectPath, dir);
    await fs.mkdir(fullDir, { recursive: true });

    // Find next ID
    const files = await fs.readdir(fullDir).catch(() => []);
    const existingIds = files
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const match = f.match(new RegExp(`${prefix}-(\\d+)`));
        return match ? parseInt(match[1], 10) : 0;
      });
    const nextId = Math.max(0, ...existingIds) + 1;

    // Generate filename
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    const filename = `${prefix}-${String(nextId).padStart(3, '0')}-${slug}.md`;
    const filePath = path.join(fullDir, filename);

    // Write file
    await fs.writeFile(filePath, template, 'utf-8');

    return NextResponse.json({
      success: true,
      filePath,
      id: `${prefix}-${String(nextId).padStart(3, '0')}`,
    });
  } catch (error) {
    console.error('Error creating spec:', error);
    return NextResponse.json(
      { error: 'Failed to create spec' },
      { status: 500 }
    );
  }
}

// Template generators
function generateStoryTemplate(title: string, description?: string, priority?: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `---
title: "${title}"
status: draft
priority: ${priority || 'should'}
created: ${date}
---

# ${title}

${description || 'Description of the user story.'}

## User Story

As a [type of user],
I want [goal/desire],
So that [benefit].

## Acceptance Criteria

- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

## Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes

_Additional notes and context._
`;
}

function generateADRTemplate(title: string, description?: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `---
title: "${title}"
status: proposed
created: ${date}
---

# ${title}

## Status

Proposed

## Context

${description || 'Describe the context and problem statement.'}

## Decision

Describe the decision made.

## Consequences

- Positive consequence 1
- Positive consequence 2
- Negative consequence 1

## Alternatives

- Alternative 1: Description
- Alternative 2: Description
`;
}

function generateSpecTemplate(title: string, description?: string, phase?: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `---
title: "${title}"
status: draft
phase: ${phase || 'requirements'}
created: ${date}
---

# ${title}

${description || 'Description of the specification.'}

## Overview

Provide an overview of this specification.

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2

## Implementation Notes

_Notes for implementation._
`;
}

/**
 * PATCH /api/specs - Update task status in a spec file
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { filePath, taskTitle, completed } = body;

    if (!filePath || taskTitle === undefined || completed === undefined) {
      return NextResponse.json(
        { error: 'filePath, taskTitle, and completed are required' },
        { status: 400 }
      );
    }

    // Security: Validate path
    if (filePath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Read the file
    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Find and update the task checkbox
    // Task format: - [ ] Task title or - [x] Task title
    const escapedTitle = taskTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const taskRegex = new RegExp(
      `^(\\s*[-*]\\s*)\\[([ xX])\\](\\s*(?:\\[[^\\]]+\\]\\s*)?)${escapedTitle}`,
      'gm'
    );

    let found = false;
    const newContent = content.replace(taskRegex, (match, prefix, _checkbox, priorityAndSpace) => {
      found = true;
      const newCheckbox = completed ? 'x' : ' ';
      return `${prefix}[${newCheckbox}]${priorityAndSpace}${taskTitle}`;
    });

    if (!found) {
      // Try a more lenient match (just the title anywhere in a checkbox line)
      const lenientRegex = new RegExp(
        `^(\\s*[-*]\\s*)\\[([ xX])\\](\\s*.*)${escapedTitle}(.*)$`,
        'gm'
      );

      const newContentLenient = content.replace(lenientRegex, (match, prefix, _checkbox, beforeTitle, afterTitle) => {
        found = true;
        const newCheckbox = completed ? 'x' : ' ';
        return `${prefix}[${newCheckbox}]${beforeTitle}${taskTitle}${afterTitle}`;
      });

      if (found) {
        await fs.writeFile(filePath, newContentLenient, 'utf-8');
        return NextResponse.json({ success: true, updated: true });
      }

      return NextResponse.json(
        { error: 'Task not found in file' },
        { status: 404 }
      );
    }

    // Write the updated content
    await fs.writeFile(filePath, newContent, 'utf-8');

    return NextResponse.json({ success: true, updated: true });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
