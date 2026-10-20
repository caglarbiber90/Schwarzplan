# CLAUDE.md — Schwarzplan Project Guidelines

## Key Architecture Decisions

- **PDFKit for PDF** — Not Electron printToPDF (was unreliable with SVG)
- **bbox queries** — Overpass uses bbox instead of around: for speed
- **Capture/Release workflow** — Map locks during editing, unlocks to reposition
- **All constants in `src/services/constants.ts`** — Single source of truth
- **All projection math in `src/services/geo.ts`** — No duplication

## Coding Conventions

- No `any` types — use proper interfaces
- All API responses validated before use
- XSS-safe coordinate validation via `isSafeCoord()`
- German UI text, English code/comments
- Commit messages follow Conventional Commits (feat:, fix:, release:)
