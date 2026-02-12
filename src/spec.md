# Specification

## Summary
**Goal:** Restore the app’s original light theme using a white background with beige/brown (light brown) accents, and remove any remaining dark-theme behavior.

**Planned changes:**
- Update theme tokens in `frontend/src/index.css` so Tailwind/shadcn components consistently use a white + beige/brown palette (background, primary, secondary, muted, accent, border, ring).
- Replace remaining blue/purple or dark-mode-derived accent styling (e.g., buttons, icons, gradient badges) with beige/brown accents across trainer, client, and admin pages.
- Neutralize/disable dark theme activation so the UI remains light even when OS-level dark mode is enabled and no `.dark` class/dark variables can cause dark styling.

**User-visible outcome:** All pages render with a consistent white background and beige/brown accents, with no dark/black theme appearance even if the device is set to dark mode.
