/**
 * Specs Parser - Extract structured data from markdown files
 */

import type { Spec, Requirement, DesignDecision, Task, SpecPhase } from './types';

// Frontmatter regex
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;

// Task checkbox regex
const TASK_REGEX = /^[\s]*[-*]\s*\[([ xX])\]\s*(.+)$/gm;

// Section regex
const SECTION_REGEX = /^##\s+(.+)$/gm;

interface ParsedFrontmatter {
  title?: string;
  status?: string;
  priority?: string;
  type?: string;
  agent?: string;
  created?: string;
  updated?: string;
  [key: string]: string | undefined;
}

/**
 * Parse frontmatter from markdown content
 */
export function parseFrontmatter(content: string): { frontmatter: ParsedFrontmatter; body: string } {
  const match = content.match(FRONTMATTER_REGEX);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterStr = match[1];
  const body = content.slice(match[0].length).trim();

  const frontmatter: ParsedFrontmatter = {};

  for (const line of frontmatterStr.split('\n')) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      frontmatter[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
    }
  }

  return { frontmatter, body };
}

/**
 * Extract tasks from markdown content (checkbox items)
 */
export function extractTasks(content: string, specId: string, filePath?: string): Task[] {
  const tasks: Task[] = [];
  let match;
  let index = 0;

  const taskRegex = /^[\s]*[-*]\s*\[([ xX])\]\s*(.+)$/gm;

  while ((match = taskRegex.exec(content)) !== null) {
    const isCompleted = match[1].toLowerCase() === 'x';
    const title = match[2].trim();

    // Try to extract priority from title (e.g., [HIGH] or [P1])
    const priorityMatch = title.match(/\[(HIGH|MEDIUM|LOW|CRITICAL|P[0-3])\]/i);
    let priority: Task['priority'] = 'medium';
    let cleanTitle = title;

    if (priorityMatch) {
      const p = priorityMatch[1].toUpperCase();
      if (p === 'HIGH' || p === 'P1') priority = 'high';
      else if (p === 'CRITICAL' || p === 'P0') priority = 'critical';
      else if (p === 'LOW' || p === 'P3') priority = 'low';
      cleanTitle = title.replace(priorityMatch[0], '').trim();
    }

    // Try to extract assigned agent from title (e.g., @Builder or @architect)
    const agentMatch = cleanTitle.match(/@(strategist|architect|builder|guardian|chronicler)/i);
    let assignedAgent: string | undefined;

    if (agentMatch) {
      assignedAgent = agentMatch[1].toLowerCase();
      cleanTitle = cleanTitle.replace(agentMatch[0], '').trim();
    }

    tasks.push({
      id: `${specId}-task-${index++}`,
      specId,
      filePath,
      title: cleanTitle,
      description: '',
      status: isCompleted ? 'completed' : 'pending',
      priority,
      dependencies: [],
      assignedAgent,
      createdAt: new Date(),
      completedAt: isCompleted ? new Date() : undefined,
    });
  }

  return tasks;
}

/**
 * Extract sections from markdown
 */
export function extractSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = content.split('\n');
  let currentSection = 'intro';
  let currentContent: string[] = [];

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      // Save previous section
      if (currentContent.length > 0) {
        sections.set(currentSection, currentContent.join('\n').trim());
      }
      currentSection = sectionMatch[1].toLowerCase().replace(/\s+/g, '-');
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections.set(currentSection, currentContent.join('\n').trim());
  }

  return sections;
}

/**
 * Parse a user story markdown file
 */
export function parseUserStory(
  content: string,
  filePath: string
): { spec: Spec; requirement: Requirement; tasks: Task[] } {
  const { frontmatter, body } = parseFrontmatter(content);
  const sections = extractSections(body);

  const id = filePath.split('/').pop()?.replace('.md', '') || `story-${Date.now()}`;

  // Extract title from first H1 or frontmatter
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = frontmatter.title || titleMatch?.[1] || id;

  // Extract description (first paragraph after title)
  const descMatch = body.match(/^#\s+.+\n\n([\s\S]*?)(?=\n##|\n\n##|$)/);
  const description = descMatch?.[1]?.trim() || '';

  // Extract acceptance criteria
  const acSection = sections.get('acceptance-criteria') || sections.get('criterios-de-aceitacao') || '';
  const acceptanceCriteria = acSection
    .split('\n')
    .filter(line => line.match(/^[-*]\s+/))
    .map(line => line.replace(/^[-*]\s+/, '').trim());

  // Map priority
  const priorityMap: Record<string, Requirement['priority']> = {
    'must': 'must',
    'should': 'should',
    'could': 'could',
    'wont': 'wont',
    'alta': 'must',
    'media': 'should',
    'baixa': 'could',
  };

  // Map status
  const statusMap: Record<string, Requirement['status']> = {
    'draft': 'draft',
    'rascunho': 'draft',
    'approved': 'approved',
    'aprovado': 'approved',
    'implemented': 'implemented',
    'implementado': 'implemented',
    'done': 'implemented',
  };

  const spec: Spec = {
    id,
    name: title,
    description,
    phase: 'requirements',
    status: statusMap[frontmatter.status?.toLowerCase() || ''] || 'draft',
    createdAt: frontmatter.created ? new Date(frontmatter.created) : new Date(),
    updatedAt: frontmatter.updated ? new Date(frontmatter.updated) : new Date(),
    filePath,
  };

  const requirement: Requirement = {
    id: `req-${id}`,
    specId: id,
    title,
    description,
    type: 'functional',
    priority: priorityMap[frontmatter.priority?.toLowerCase() || ''] || 'should',
    acceptanceCriteria,
    status: spec.status,
    filePath,
  };

  const tasks = extractTasks(body, id, filePath);

  return { spec, requirement, tasks };
}

/**
 * Parse an ADR (Architecture Decision Record) markdown file
 */
export function parseADR(
  content: string,
  filePath: string
): { spec: Spec; decision: DesignDecision } {
  const { frontmatter, body } = parseFrontmatter(content);
  const sections = extractSections(body);

  const id = filePath.split('/').pop()?.replace('.md', '') || `adr-${Date.now()}`;

  // Extract title
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = frontmatter.title || titleMatch?.[1] || id;

  // Extract sections
  const context = sections.get('context') || sections.get('contexto') || '';
  const decision = sections.get('decision') || sections.get('decisao') || sections.get('decisão') || '';
  const consequencesSection = sections.get('consequences') || sections.get('consequencias') || sections.get('consequências') || '';
  const alternativesSection = sections.get('alternatives') || sections.get('alternativas') || '';

  const consequences = consequencesSection
    .split('\n')
    .filter(line => line.match(/^[-*]\s+/))
    .map(line => line.replace(/^[-*]\s+/, '').trim());

  const alternatives = alternativesSection
    .split('\n')
    .filter(line => line.match(/^[-*]\s+/))
    .map(line => line.replace(/^[-*]\s+/, '').trim());

  // Map status
  const statusMap: Record<string, DesignDecision['status']> = {
    'proposed': 'proposed',
    'proposto': 'proposed',
    'accepted': 'accepted',
    'aceito': 'accepted',
    'deprecated': 'deprecated',
    'deprecado': 'deprecated',
  };

  const spec: Spec = {
    id,
    name: title,
    description: context.slice(0, 200),
    phase: 'design',
    status: statusMap[frontmatter.status?.toLowerCase() || ''] === 'accepted' ? 'approved' : 'draft',
    createdAt: frontmatter.created ? new Date(frontmatter.created) : new Date(),
    updatedAt: frontmatter.updated ? new Date(frontmatter.updated) : new Date(),
    filePath,
  };

  const designDecision: DesignDecision = {
    id: `design-${id}`,
    specId: id,
    title,
    context,
    decision,
    consequences,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    status: statusMap[frontmatter.status?.toLowerCase() || ''] || 'proposed',
    filePath,
  };

  return { spec, decision: designDecision };
}

/**
 * Determine spec type from file path
 */
export function getSpecType(filePath: string): 'story' | 'adr' | 'spec' | 'unknown' {
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.includes('/stories/') || lowerPath.includes('us-')) {
    return 'story';
  }
  if (lowerPath.includes('/decisions/') || lowerPath.includes('adr-') || lowerPath.includes('/adr/')) {
    return 'adr';
  }
  if (lowerPath.includes('/specs/') || lowerPath.includes('/planning/')) {
    return 'spec';
  }

  return 'unknown';
}
