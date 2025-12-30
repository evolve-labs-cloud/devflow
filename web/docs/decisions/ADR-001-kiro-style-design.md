---
title: "Kiro-style Dark Theme Design"
status: accepted
created: 2025-12-19
---

# ADR-001: Kiro-style Dark Theme Design

## Status

Accepted

## Context

DevFlow IDE needed a modern, professional UI design that would appeal to developers and provide a comfortable experience for long coding sessions. We evaluated several design approaches:

1. Light theme (VS Code style)
2. Dark theme (generic)
3. Kiro-inspired dark theme (AWS)

The user explicitly requested a design similar to [Kiro (https://kiro.dev/)](https://kiro.dev/), AWS's spec-driven development IDE.

## Decision

Adopt a Kiro-inspired dark theme with the following characteristics:

### Color Palette

- **Background**: `#0a0a0f` (near-black)
- **Secondary Background**: `#12121a`
- **Borders**: `white/10` (10% white opacity)
- **Primary Accent**: Purple (`purple-500`, `purple-600`)
- **Text**: White with gray variants

### UI Components

1. **Activity Bar**: Left-side vertical icon bar (48px wide)
2. **Collapsible Sidebar**: Panel-based navigation (Explorer, Specs, etc.)
3. **Dark Editor**: Monaco with `vs-dark` theme
4. **Floating Panels**: Chat, Terminal with semi-transparent backgrounds
5. **Gradient Accents**: Purple gradients for emphasis

### Typography

- **Font Family**: System fonts with JetBrains Mono for code
- **Font Sizes**: Responsive (sm:text-sm for mobile, base for desktop)

## Rationale

1. **User Request**: Direct request from stakeholder
2. **Developer Preference**: Dark themes are preferred for long coding sessions
3. **Modern Aesthetic**: Kiro represents current best practices in IDE design
4. **Consistency**: Purple accents align with Claude/Anthropic branding
5. **Accessibility**: High contrast dark theme with clear color coding

## Alternatives Considered

### 1. VS Code Light Theme
- **Pros**: Familiar to many developers
- **Cons**: Not requested, may cause eye strain

### 2. Generic Dark Theme
- **Pros**: Simpler to implement
- **Cons**: Less distinctive, no clear design language

### 3. Custom Unique Theme
- **Pros**: Original branding
- **Cons**: More design work, user wanted Kiro-style

## Consequences

### Positive

- Modern, professional appearance
- Consistent with spec-driven development philosophy
- Reduced eye strain for developers
- Clear visual hierarchy with purple accents

### Negative

- Tight coupling with Kiro's design language
- May need updates if Kiro changes design
- Purple accents may conflict with future branding

### Risks

- AWS/Kiro may have design patents (mitigated by using inspiration, not copying)
- Dark theme may not suit all users (could add light mode later)

## Implementation Details

### Files Modified

- `app/page.tsx` - Hero section with gradient
- `app/ide/page.tsx` - Activity bar, panel layout
- `components/**/*.tsx` - All components updated
- `app/globals.css` - Custom CSS utilities

### CSS Classes

```css
/* Primary background */
.bg-[#0a0a0f]

/* Secondary background */
.bg-[#12121a]

/* Purple accents */
.text-purple-400, .bg-purple-600, .border-purple-500/30

/* Borders */
.border-white/10

/* Hover states */
.hover:bg-white/10
```

## References

- [Kiro IDE](https://kiro.dev/)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Monaco Editor Themes](https://microsoft.github.io/monaco-editor/)

---

*Decision recorded by @chronicler agent*
