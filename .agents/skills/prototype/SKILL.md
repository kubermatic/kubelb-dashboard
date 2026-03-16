---
name: prototype
description: Use when proposing visual/UI changes and you need the user to compare before/after states interactively. Generates a single HTML file with toggle controls for each change group.
---

Create an interactive before/after prototype as a **single self-contained HTML file**.

## What to Build

A full-page mockup of the affected UI area that lets the user toggle each proposed change independently.

## Mandatory Elements

1. **Read the codebase first** — pull actual fonts, CSS variables, colors, spacing, component structure from the project. Do NOT guess or use placeholder values.

2. **Fixed control bar** (top-right, dark background, high z-index):
   - **Master toggles**: "All Before" / "All After"
   - **Per-change toggles**: one button per change group, independently toggleable
   - **Dark mode toggle** (if project supports it)

3. **Floating description panel** (bottom-center): updates to show which changes are active and a one-line summary of each.

4. **Real content**: use actual labels, nav items, counts, colors from the project — not lorem ipsum.

## Architecture

```
const state = { change1: false, change2: false, ... };

function applyState() {
  // Read full state, update all affected DOM elements
  // Use inline style overrides, NOT DOM rebuild
  // Update toggle button active states
  // Update description panel
}

function toggle(key) {
  state[key] = !state[key];
  // Handle dependencies (e.g., dark sidebar needs new palette)
  applyState();
}
```

- All state in one object, one `applyState()` function
- Toggles flip a key and call `applyState()` — no conflicting handlers
- Use CSS transitions on affected properties for smooth switching
- Load icons from CDN (e.g., `unpkg.com/lucide@latest`)
- Load fonts from Google Fonts matching the project

## Change Group Dependencies

If change B visually requires change A (e.g., dark sidebar needs new palette), auto-enable A when B is toggled on. Document this coupling in the description panel.

## Output

Save the file as `{name}-prototype.html` in the project root. Tell the user to open it in their browser.

## Anti-Patterns

- Don't rebuild DOM on toggle — swap inline styles only
- Don't use placeholder content when real data is available
- Don't make toggles that require page reload
- Don't hardcode only one theme — support both light and dark if the project does
