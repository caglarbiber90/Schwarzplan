---
name: version-release
description: "Schwarzplan semantic versioning rules and the release checklist. Use when bumping the version or publishing a release."
---

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
6. Portable EXE distribution → `Y:\KI\Software\Schwarzplan-Portable.exe`

### On every export/release

1. Bump version in `package.json`
2. Update window title in `electron/main.ts`
3. Commit with message: `release: vX.Y.Z — short description`
4. Tag: `git tag vX.Y.Z`
5. Build EXE: `npm run build && npx electron-builder --win --config.win.target=portable`
6. Copy EXE to shared drive: `cp release/Schwarzplan-Portable.exe "Y:/KI/Software/Schwarzplan-Portable.exe"`
7. Create GitHub release: `gh release create vX.Y.Z --title "Schwarzplan vX.Y.Z" release/Schwarzplan-Portable.exe`
