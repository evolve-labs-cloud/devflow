# AI Optimization Guide - Maximizing DevFlow Capabilities

This guide explains how to get the most out of DevFlow when working with AI assistants like Claude.

---

## 1. Context Loading Strategy

### Problem
AI has limited context window. Loading all agent files wastes tokens.

### Solution: Lazy Loading Pattern

```
GOOD: Load only what you need
├─ Starting new feature? → Load @strategist first
├─ Need architecture? → Load @architect
├─ Ready to code? → Load @builder
└─ Need review? → Load @guardian

BAD: Load everything at once
└─ Wastes context window
└─ AI may confuse responsibilities
```

### Implementation
Always start with:
```
@strategist analyze [your request]
```

Let the agent chain handle the rest through mandatory delegation.

---

## 2. Structured Prompts for Better Results

### Use Agent Commands
Each agent has specific commands. Use them:

| Agent | Best Commands |
|-------|---------------|
| @strategist | `/analyze`, `/prd`, `/stories`, `/prioritize` |
| @architect | `/design`, `/adr`, `/diagram`, `/review-arch` |
| @builder | `/implement`, `/review`, `/refactor`, `/debug` |
| @guardian | `/test-plan`, `/security-check`, `/perf-review` |
| @chronicler | `/document`, `/snapshot`, `/sync-check` |

### Example: Feature Request
```
BAD:  "I want to add authentication"
GOOD: "@strategist /analyze We need JWT authentication for our API"
```

---

## 3. Leverage the Knowledge Graph

### What It Does
`.devflow/knowledge-graph.json` maps relationships between:
- Decisions (ADRs)
- Features
- Agents
- Documents

### How AI Uses It
AI can quickly answer:
- "What decisions affect feature X?"
- "Which agent handles Y?"
- "What documents reference Z?"

### Keep It Updated
After major changes:
```
@chronicler /document
```

This updates the knowledge graph automatically.

---

## 4. Snapshot Strategy for Long Projects

### When to Create Snapshots

| Event | Action |
|-------|--------|
| Sprint end | `@chronicler /snapshot` |
| Major feature complete | `@chronicler /snapshot` |
| Before vacation/break | `@chronicler /snapshot` |
| Architecture change | `@chronicler /snapshot` |

### Why It Matters
Next session, AI reads snapshot first:
```
Session starts
  → AI reads .devflow/snapshots/latest.json (2ms)
  → AI knows EVERYTHING about project
  → Zero re-explanation needed
```

---

## 5. Dual Format for Maximum Speed

### For Humans (Markdown)
- Readable narratives
- Examples and explanations
- Visual formatting

### For AI (YAML/JSON)
- Structured data
- Fast parsing (100x faster)
- Zero ambiguity

### Example
```
strategist.md      → Human reads this
strategist.meta.yaml → AI parses this instantly
```

**Result**: AI finds the right agent in <5ms instead of reading all markdown.

---

## 6. Effective Delegation Chains

### Let Agents Delegate
Don't manually call each agent. Let them chain:

```
You: "@strategist /prd User authentication system"

Strategist: Creates PRD
  └→ "Ready for @architect to design"

You: "@architect proceed"

Architect: Creates design
  └→ "Ready for @builder to implement"

[continues automatically]
```

### Benefits
- Proper handoffs
- Nothing skipped
- Documentation automatic

---

## 7. Preventing Context Drift

### The Problem
```
Day 1: Implement feature X
Day 5: AI forgot about feature X
Result: Duplicate work, conflicts
```

### The Solution
DevFlow's automatic documentation:

1. **CHANGELOG.md** - Updated after every significant change
2. **Snapshots** - Project state captured
3. **Knowledge Graph** - Relationships tracked
4. **ADRs** - Decisions preserved

### Your Part
Just use the agents. `@chronicler` handles the rest.

---

## 8. Optimizing for Different Task Types

### Quick Bug Fix
```
@builder /debug [description]
```
Skip strategist/architect for simple fixes.

### New Feature (Small)
```
@strategist /analyze [feature]
  → @builder implements
  → Done
```

### New Feature (Complex)
```
@strategist /prd [feature]
  → @architect /design
  → @builder /implement [stories]
  → @guardian /test-plan
  → @chronicler documents
```

### Architecture Decision
```
@architect /adr [decision topic]
```

### Security Audit
```
@guardian /security-check src/
```

---

## 9. Metadata Best Practices

### Keep project.yaml Updated
This is the AI's "quick reference":
```yaml
project:
  version: "0.3.0"
  phase: "development"

features:
  - id: "auth"
    status: "implemented"
```

### Use Tags in ADRs
```yaml
---
tags: ["security", "authentication", "jwt"]
---
```

AI uses tags for quick queries:
- "Show all security decisions"
- "What ADRs affect authentication?"

---

## 10. Performance Metrics

### What DevFlow Provides

| Without DevFlow | With DevFlow | Improvement |
|-----------------|--------------|-------------|
| Context loading: 3-4s | 15ms | **200x faster** |
| Agent selection: uncertain | 5ms | **Instant** |
| Drift detection: manual | automatic | **Zero effort** |
| Documentation: 15-20% done | 95%+ done | **5x more** |

### Track Your Metrics
After each sprint, review:
- How many times did AI need re-explanation?
- Were stories generated automatically?
- Is CHANGELOG up to date?

---

## 11. Advanced: Custom Triggers

### Add Project-Specific Triggers
In `chronicler.meta.yaml`:
```yaml
automation:
  auto_triggers:
    - event: "deploy"
      action: "create_snapshot"
    - event: "hotfix"
      action: "update_changelog"
```

### Add Custom Keywords
In `strategist.meta.yaml`:
```yaml
triggers:
  keywords:
    - "PRD"
    - "requirement"
    - "your-custom-term"  # Add your domain terms
```

---

## 12. Troubleshooting

### Agent Not Following Rules?
1. Check if hard stops are at TOP of .md file
2. Verify .meta.yaml has correct `hard_stops` section
3. Explicitly mention the rule: "Remember, you NEVER write code"

### Stories Not Generated?
1. Check `docs/planning/stories/` exists
2. Run `@chronicler /document` manually
3. Verify PRD was created first

### Context Lost Between Sessions?
1. Create snapshot: `@chronicler /snapshot`
2. Check `.devflow/snapshots/` has recent file
3. Start next session with: "Read the latest snapshot first"

---

## 13. Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│                    DEVFLOW QUICK REF                │
├─────────────────────────────────────────────────────┤
│ NEW FEATURE:     @strategist /prd [name]            │
│ ARCHITECTURE:    @architect /design [system]        │
│ IMPLEMENT:       @builder /implement [story]        │
│ SECURITY:        @guardian /security-check src/     │
│ DOCUMENT:        @chronicler /document              │
├─────────────────────────────────────────────────────┤
│ SNAPSHOT:        @chronicler /snapshot              │
│ SYNC CHECK:      @chronicler /sync-check            │
│ ADR:             @architect /adr [decision]         │
├─────────────────────────────────────────────────────┤
│ FLOW: strategist → architect → builder → guardian   │
│       └→ chronicler documents automatically         │
└─────────────────────────────────────────────────────┘
```

---

## 14. Future Enhancements to Consider

### Potential Improvements

1. **Agent Memory**
   - Persist agent state between sessions
   - Remember user preferences

2. **Automated Testing Integration**
   - Guardian triggers test runs
   - Results feed back to builder

3. **CI/CD Integration**
   - Guardian configures pipelines
   - Chronicler updates on deploy

4. **Multi-Project Support**
   - Share agents across projects
   - Central knowledge graph

5. **Analytics Dashboard**
   - Track agent usage
   - Measure documentation coverage
   - Monitor drift metrics

---

*Guide version: 0.3.0*
*Last updated: 2025-12-05*
