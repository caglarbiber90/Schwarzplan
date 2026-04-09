# CLAUDE.md — Schwarzplan Project Guidelines

## Versioning (Semantic Versioning — Apple-style)

Format: `vMAJOR.MINOR.PATCH`

### Rules

| Change Type | Version Bump | Example |
|------------|-------------|---------|
| **Bug fix, typo, CSS tweak** | PATCH +1 | v1.0.0 → v1.0.1 |
| **New feature, new layer, new export format** | MINOR +1, PATCH reset | v1.0.3 → v1.1.0 |
| **Breaking change, full UI redesign, architecture rewrite** | MAJOR +1, rest reset | v1.5.2 → v2.0.0 |

### Where version appears

1. `package.json` → `"version"` field
2. `electron/main.ts` → `title: 'Schwarzplan vX.Y.Z – TEK TO NIK'`
3. `git tag` → `vX.Y.Z`
4. GitHub Release → `vX.Y.Z`
5. EXE filename → `Schwarzplan-Portable.exe` (no version in filename)

### On every export/release

1. Bump version in `package.json`
2. Update window title in `electron/main.ts`
3. Commit with message: `release: vX.Y.Z — short description`
4. Tag: `git tag vX.Y.Z`
5. Build EXE: `npm run build && npx electron-builder --win --config.win.target=portable`
6. Create GitHub release: `gh release create vX.Y.Z --title "Schwarzplan vX.Y.Z" release/Schwarzplan-Portable.exe`

## Project Structure

- `electron/` — Electron main process (main.ts, preload.ts)
- `src/components/` — React UI components
- `src/services/` — Business logic (overpass, geocoding, export, geo utils)
- `src/styles/` — CSS
- `resources/` — App icon (icon.png)
- `release/` — Built EXE output (gitignored)

## Key Architecture Decisions

- **No framework** — Plain React + Vite + Electron (no Next.js, no SSR)
- **PDFKit for PDF** — Not Electron printToPDF (was unreliable with SVG)
- **bbox queries** — Overpass uses bbox instead of around: for speed
- **Capture/Release workflow** — Map locks during editing, unlocks to reposition
- **All constants in `src/services/constants.ts`** — Single source of truth
- **All projection math in `src/services/geo.ts`** — No duplication

## Build Commands

```bash
npm run dev          # Vite + Electron dev mode
npm run build        # Production build (renderer + electron)
npm run dist         # Build + package EXE (NSIS + Portable)
```

## Coding Conventions

- TypeScript strict mode
- No `any` types — use proper interfaces
- All API responses validated before use
- XSS-safe coordinate validation via `isSafeCoord()`
- German UI text, English code/comments
- Commit messages follow Conventional Commits (feat:, fix:, release:)
