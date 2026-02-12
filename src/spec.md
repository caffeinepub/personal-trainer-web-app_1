# Specification

## Summary
**Goal:** Update the app’s light theme to use beige-toned backgrounds and black/near-black text with accessible contrast.

**Planned changes:**
- Adjust light-mode CSS theme tokens in `frontend/src/index.css` (`:root`) so main surfaces (`--background`, `--card`, `--popover`, `--sidebar`) render in beige tones instead of pure white.
- Update light-mode foreground/text tokens (`--foreground`, `--card-foreground`, `--popover-foreground`, `--sidebar-foreground`) to resolve to black/near-black for readable contrast across pages.
- Align light-mode interactive/accent tokens (`--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`) to remain consistent and readable on beige backgrounds, while keeping dark theme tokens unchanged unless readability issues appear.

**User-visible outcome:** In light mode, pages (including login, dashboard, and client dashboard) display beige backgrounds with clearly readable black/near-black text, with buttons/inputs/borders remaining visually consistent and dark mode unaffected.
