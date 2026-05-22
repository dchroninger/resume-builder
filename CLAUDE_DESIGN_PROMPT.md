# Resume Builder — Front-End Redesign Brief

This document is the brief for redesigning the front end of a personal resume-builder application. Hand this to a design/implementation agent (e.g., Claude in Code, Cursor, etc.) as the source of truth for the redesign.

## Project overview

This is a personal resume-builder app for a senior software engineer who is preparing to switch jobs. The owner is building a **master resume** containing every role, project, accomplishment, and skill from a 9.5-year career, then needs to **tailor versions for specific job applications** by selecting subsets of content. Tailoring is driven by **tagging every entity** (bullets, jobs, skills, projects, education entries) and then filtering by selected tags at generate-time.

The current implementation is a working but visually basic placeholder. The data model is correct and stable — **do not change it**. The redesign goal is to make the editor pleasant and powerful enough to manage 100+ bullets across 8+ roles, and to make the generator confident enough to produce application-ready PDFs in under a minute.

## Stack constraints (must keep)

- Vite + React 18 + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `@react-pdf/renderer` for PDF export
- `localStorage` for persistence (via `src/utils/storage.ts`)
- ESLint configuration as-is

You may add dependencies if they're justified (e.g., `dnd-kit` for drag/drop, `cmdk` for command palette, `framer-motion` for transitions, `react-hotkeys-hook` for shortcuts). Justify each new dependency briefly in a comment.

## Data model (DO NOT CHANGE)

The full schema lives in `src/types/resume.ts`. Summary:

```typescript
PersonalInfo  { name, email, phone?, location?, linkedin?, website? }
Bullet        { id, text, tags: string[] }
Job           { id, company, title, startDate, endDate?, location?, tags, bullets[] }
Skill         { id, name, tags }
SkillCategory { id, name, skills[], tags }
Education     { id, institution, degree, field?, graduationDate?, tags, bullets[] }
Project       { id, name, description?, url?, tags, bullets[] }
TemplateType  'single-column' | 'two-column'
ResumeData    { personalInfo, jobs[], skillCategories[], education[], projects[] }
```

Tags are flat strings, but **conventionally namespaced** with a `prefix:value` pattern. The UI must recognize and group by these namespaces:

- `target:` — which role type this content fits (swe, fe, architect, em)
- `skill:` — which skill area it demonstrates (frontend, backend, infra, identity, observability, ai, leadership, data, devops, security)
- `narrative:` — bullet flavor (technical, impact, leadership)
- `era:` — which career period (current, lead-swe, jr-swe, sd, military, pre-empres)
- `audience:` — what kind of employer it's for (tech-first, healthcare, regulated, startup, enterprise)
- `confidence:` — owner's comfort defending the claim in an interview (high, medium, low)
- `flag:` — special flags (`must-include` always included regardless of filter, `opt-in` excluded by default)

Tags without a recognized prefix should still work but are grouped under a "general" or "untyped" namespace.

## High-level goals for the redesign

1. **Editor mode**: make it pleasant and fast to manage a master resume with 100+ tagged items.
2. **Generator mode**: make it trivially easy to assemble a tailored resume for a specific job application via tag filtering, with confidence the output will look right.
3. **Professional polish**: the app should feel like a tool a senior engineer would actually use daily — not a hackathon prototype. Modern visual design, fluid interactions, no rough edges.
4. **Accessibility & responsiveness**: keyboard-navigable, screen-reader-friendly, usable on a 13" laptop and on tablet. Phone is nice-to-have but not required.

## Editor mode — required features

### Layout
- Replace the current single-column scroll with a **sidebar + main canvas** layout. The sidebar contains a section nav (Personal Info, Work Experience, Skills, Education, Projects) with item counts per section. The main canvas shows the currently-selected section.
- Sticky top bar with: app title, current mode (Edit/Generate toggle), save status indicator, and a search button.

### Section management
- Each section (Work Experience, Skills, etc.) renders a list of cards. Cards can be:
  - **Collapsed** to show just header (title, company, date range, tag count) — default for non-current items.
  - **Expanded** to show full editor inline.
- **Drag-and-drop reordering** within each section using `dnd-kit` (or similar). Order should persist to data (add `order` or rely on array position).
- **Drag-and-drop reordering of bullets within a job/project/education entry.**

### Tag input UX (this is the most important UX surface — get it right)
- Tag inputs are everywhere: on jobs, bullets, skills, skill categories, education, projects. They must be **consistent** across all these surfaces.
- The TagInput component should support:
  - **Autocomplete** from `allTags` (the existing union of all used tags).
  - **Namespace-aware suggestions**: when the user types `target:`, suggest only known `target:*` values. When typing `skill:`, suggest only `skill:*` values.
  - **Visual chips** for applied tags. Each chip is color-coded by namespace (use a 7-color palette mapped to namespaces in a constant; same namespace = same color across the app).
  - **Keyboard-first**: Enter adds, Backspace on empty removes the last, comma also commits.
  - **Quick-pick popover**: a button next to the input opens a popover showing all known tags grouped by namespace, with checkboxes. Useful for bulk tagging.
- A new **"Tag manager" panel** (accessible from the top bar) lets the user:
  - See every tag in use and its occurrence count.
  - Rename a tag globally (updates all entities that reference it).
  - Delete a tag globally.
  - See which entities use a given tag (click-through).

### Bullet editor
- The bullet text area should support inline-edit (no separate modal).
- Show character count as a soft guide (sweet spot: 110–180 chars for resume bullets — display in muted color, no enforcement).
- Show tags inline below the text with the TagInput component.
- A **clone button** on each bullet (duplicate the bullet with same text + tags — useful when authoring multiple variants of an accomplishment).

### Bulk operations
- Multi-select bullets with checkboxes.
- Bulk apply or remove tags across selected bullets.
- Bulk delete with confirmation.

### Quality-of-life
- **Search** (Cmd/Ctrl+K opens a command palette): full-text search across all bullet text, job titles, skill names, project names. Selecting a result scrolls to and highlights the item.
- **Untagged badge**: any entity with `tags.length === 0` shows a subtle warning badge ("untagged"). Useful for the owner to spot items he forgot to tag.
- **Save indicator**: subtle text in top bar — "Saved" / "Saving..." (debounced indicator since localStorage writes are sync). No need for a separate save button; it's autosave.
- **Undo / redo** via Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z. Implement with a simple history stack on the resume data (last 50 states is fine). This is critical because bulk operations and deletes are scary without it.
- **Import / Export**: keep existing JSON import/export. Add Markdown export and DOCX export (the latter as a stretch — `docx` package).

### Empty states
- Each section has a polished empty state with a one-line explanation and a primary "Add your first X" CTA. No empty grey boxes.

## Generator mode — required features

### Layout
- **Two-pane layout**: left pane = tag filter controls + template + export controls. Right pane = live resume preview at high fidelity.

### Tag filter UI
- Tags grouped by namespace, with each group **collapsible**.
- Per-namespace toggle: **OR** (any tag in this namespace matches) vs **AND** (all tags must match). Default OR.
- Cross-namespace logic is always **AND** (a bullet must satisfy all enabled namespace filters). Show this rule in a small explainer near the filter.
- **Clear all** button.
- **Saved presets**: user can save a tag selection by name (e.g., "Senior FE at tech-first companies"). Saved presets appear as buttons; clicking applies the saved tag set. Presets live in `localStorage` under a separate key.
- **Bullet count preview**: as the user toggles tags, show a live count somewhere like "12 bullets across 4 roles will appear." If the count is zero, show a friendly empty-state message in the preview.

### Section visibility
- Toggle switches to hide Sections (Projects, Education, Skills, Experience) entirely from the generated resume. Useful for very short resumes.

### Template & layout controls
- Template picker remains (single / two column) — but redesigned as visual thumbnails, not a `<select>`.
- Add controls for: font family (2–3 system-safe options like Inter, IBM Plex Sans, Source Serif), font size scale (small / medium / large), accent color (small palette).
- All settings persist to `localStorage`.

### Preview
- High-fidelity live preview that matches the PDF output. Either:
  - (a) Render the same `@react-pdf/renderer` PDF as an iframe via `pdf().toBlob()` and refresh on data change (debounced — full re-render is expensive). Recommended.
  - (b) Render an HTML version that's *visually identical* to the PDF templates. Maintenance burden but smoother UX.
- Pick one and commit to it. Document the choice.

### Export
- PDF export (existing).
- Markdown export (for the owner to paste into other tools).
- Plain text export.
- DOCX export (stretch).
- Each export uses the **currently filtered data** and the current template/settings.

## Visual design direction

- **Tone**: modern, calm, professional. Think Linear, Vercel dashboard, Anthropic's own design language. Generous whitespace, clear typography, soft shadows, no gradients-as-decoration.
- **Color**: neutral palette as base (warm grays). Reserve color for: tag namespaces (the 7-color palette), interactive accents (primary button color), and status indicators.
- **Typography**: pick one sans-serif for UI (system or Inter). Reserve a slight font-weight difference for hierarchy, not size jumps.
- **Dark mode**: required. Auto-detect system preference with a manual override toggle in the top bar.
- **Motion**: subtle. Tags animate in/out when added/removed. Cards animate when expanded/collapsed. No bouncy springs; gentle easing.
- **Icons**: pick a consistent set (Lucide or Phosphor). No mixing.
- **Density**: prefer comfortable density over compact. The owner is going to be looking at this app for hours; eye strain matters.

## Out of scope (do not implement)

- No backend / server / database. Everything is client-side, localStorage-backed.
- No user accounts, auth, or multi-user features.
- No AI features yet (we'll add a "suggest bullets" / "rewrite for X audience" feature in a later phase; design with this in mind but don't build it now).
- No template *editor* (i.e., user can't create new templates from the UI). The two built-in templates plus the settings (font, size, accent) are sufficient for v2.
- No collaboration / sharing / public URLs.

## Files / structure expectations

Keep the existing structure (`components/DataEditor/*`, `components/Templates/*`, `components/PDF/*`, `hooks/*`, `utils/*`, `types/*`). Add new directories as needed:

- `src/components/ui/` for shadcn-style primitive components (Button, Input, Card, Popover, etc. — written from scratch on Tailwind, no shadcn dependency required unless you want it).
- `src/components/CommandPalette/`
- `src/components/TagManager/`
- `src/components/Preview/` — extend with PDF iframe version
- `src/hooks/useUndoRedo.ts`
- `src/hooks/useKeyboard.ts`
- `src/hooks/usePresets.ts`
- `src/utils/tag-namespace.ts` — helpers for parsing/grouping namespaced tags
- `src/utils/export-markdown.ts`, `src/utils/export-docx.ts`, `src/utils/export-text.ts`

## Acceptance criteria

When the redesign is complete, the following should be true:

1. The owner can sit down, add a new role with 8 bullets, tag each bullet across 3 namespaces, and reorder them in under 5 minutes without touching the mouse beyond one or two clicks.
2. The owner can switch to Generate mode, pick a saved preset, and have a tailored PDF in under 60 seconds.
3. The owner can confidently delete a bullet knowing Cmd+Z brings it back.
4. The owner can search for a single word and find every bullet containing it in under 1 second.
5. The Tag Manager surfaces every tag in use with counts and supports global rename.
6. The app is keyboard-navigable end-to-end. Test with no mouse.
7. The app is responsive down to ~1100px wide (laptop) without horizontal scroll.
8. Dark mode looks polished, not "I inverted the colors."
9. Empty states are friendly and instructive, not blank.
10. PDF export matches the on-screen preview pixel-for-pixel.

## Implementation phasing (suggested)

If you're delivering in multiple PRs, suggested order:

1. **Foundation**: design tokens (colors per namespace, typography, spacing), base UI primitives (Button, Input, Card, Popover, Checkbox, Switch), Layout shell with sidebar + top bar, dark mode toggle.
2. **Tag UX**: TagInput component with autocomplete + namespace coloring, Tag Manager panel, namespace-aware filter UI.
3. **Editor mode**: redesigned section cards with collapse/expand, drag-and-drop reorder, bulk operations, search/command palette, undo/redo.
4. **Generator mode**: redesigned filter pane, saved presets, bullet count preview, section-visibility toggles, font/size/accent controls, PDF preview iframe.
5. **Polish**: empty states, motion, keyboard shortcuts, accessibility audit, responsive behavior down to 1100px, DOCX/Markdown/Text export.

## Notes for the implementer

- **Read** `src/types/resume.ts`, `src/hooks/useResumeData.ts`, and `src/hooks/useTags.ts` first. Those are the contract.
- **Do not** rename, restructure, or modify the existing types in `src/types/resume.ts`. The data model is stable. If a new field is genuinely required, propose it as a separate change and explain why.
- **Do** feel free to refactor `App.tsx` heavily — it's currently a god-component and should be broken up into route-like views as part of the redesign.
- **Do** preserve the existing JSON import/export contract so the owner's existing data continues to load.
- **Test the PDF export path early.** It's the user's primary output, and `@react-pdf/renderer` has quirks (no flex on text, limited CSS, etc.). Don't ship a redesign that breaks PDF.
