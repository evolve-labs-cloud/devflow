---
title: "Specs Workflow System Architecture"
status: accepted
created: 2025-12-19
---

# ADR-002: Specs Workflow System Architecture

## Status

Accepted

## Context

DevFlow IDE is designed for spec-driven development. We needed a system to:

1. Parse existing markdown spec files from project directories
2. Display specs in a structured workflow UI
3. Allow creation of new specs (user stories, ADRs, generic specs)
4. Track tasks extracted from spec files
5. Integrate with the file editor for editing specs

## Decision

Implement a three-phase specs workflow system with markdown-based storage.

### Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Markdown Files │────▶│ specsParser  │────▶│  specsStore  │
│  (docs/, .devflow)    │  (parser.ts) │     │  (Zustand)   │
└─────────────────┘     └──────────────┘     └──────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────┐
                               │        SpecsPanel           │
                               │  ┌─────┬─────┬─────┐       │
                               │  │Reqs │Design│Tasks│       │
                               │  └─────┴─────┴─────┘       │
                               └─────────────────────────────┘
```

### Three-Phase Workflow

1. **Requirements**: User stories with acceptance criteria
2. **Design**: Architecture Decision Records (ADRs)
3. **Tasks**: Extracted checkbox items from specs

### File Locations

Scan these directories for specs:
- `docs/planning/stories/` - User stories
- `docs/planning/specs/` - Generic specs
- `docs/decisions/` - ADRs
- `.devflow/specs/` - DevFlow-specific specs
- `.devflow/stories/` - DevFlow-specific stories

### Markdown Format

#### User Story
```markdown
---
title: "Feature Name"
status: draft
priority: should
created: 2025-12-19
---

# Feature Name

Description...

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Tasks
- [ ] Task 1
- [ ] Task 2
```

#### ADR
```markdown
---
title: "Decision Title"
status: proposed
created: 2025-12-19
---

# Decision Title

## Context
Problem description...

## Decision
What was decided...

## Consequences
- Positive effect
- Negative effect
```

### API Endpoints

- `GET /api/specs?projectPath=...` - List all specs
- `POST /api/specs` - Create new spec

### State Management

```typescript
interface SpecsState {
  specs: Spec[];
  requirements: Requirement[];
  decisions: DesignDecision[];
  tasks: Task[];
  activePhase: 'requirements' | 'design' | 'tasks';
}
```

## Rationale

1. **Markdown-based**: Version-controllable, human-readable, tool-agnostic
2. **Frontmatter**: Standard for metadata in markdown (Jekyll, Hugo, etc.)
3. **Three phases**: Maps to common development workflow
4. **Task extraction**: Checkbox items are natural task format
5. **Zustand**: Lightweight, TypeScript-friendly state management

## Alternatives Considered

### 1. Database Storage
- **Pros**: Better querying, relationships
- **Cons**: Requires server, not version-controllable

### 2. JSON Files
- **Pros**: Structured, easy to parse
- **Cons**: Not human-friendly for editing

### 3. YAML Files
- **Pros**: More readable than JSON
- **Cons**: Less common for documentation

### 4. Notion/External Tool
- **Pros**: Rich features, collaboration
- **Cons**: External dependency, not integrated

## Consequences

### Positive

- Specs are version-controllable with git
- Human-readable and editable in any editor
- No database required
- Works offline
- Integrates with existing markdown tooling

### Negative

- No complex querying
- Parsing can be fragile
- No real-time collaboration
- Limited relationship modeling

### Risks

- Inconsistent markdown formatting may break parsing
- Large projects may have many spec files (performance)

## Implementation Details

### Parser Functions

```typescript
// lib/specsParser.ts
export function parseFrontmatter(content: string)
export function extractTasks(content: string, specId: string)
export function parseUserStory(content: string, filePath: string)
export function parseADR(content: string, filePath: string)
export function getSpecType(filePath: string)
```

### Store Actions

```typescript
// lib/stores/specsStore.ts
loadSpecs(projectPath: string)
createSpec(projectPath: string, data: CreateSpecData)
updateTaskStatus(taskId: string, status: Task['status'])
getSpecsByPhase(phase: SpecPhase)
```

## References

- [YAML Frontmatter](https://jekyllrb.com/docs/front-matter/)
- [Keep a Changelog](https://keepachangelog.com/)
- [ADR GitHub](https://adr.github.io/)
- [Zustand](https://github.com/pmndrs/zustand)

---

*Decision recorded by @chronicler agent*
