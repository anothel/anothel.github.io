# Architecture

This site ships as checked-in HTML, CSS, JavaScript, and JSON for GitHub Pages.

## Architecture PoC Gate

- Scope: Review queue.
- Routes: no public route changes.
- Fallback: checked-in HTML remains useful without JavaScript.
- Storage: preserve `anothel.explore.saved.v1`, including legacy array reads and versioned record payloads.
- Budget: no framework code on `main` until a measured vanilla JS blocker exists.
- Budget: PoC may add at most 20 KB raw shipped JavaScript.
- Exit: failed PoC deletes cleanly without changing product behavior.

Explore filter panel is the backup scope only if Review queue has no measured blocker.
