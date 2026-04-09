---
name: code-review
description: Schwarzplan-specific code review checklist
---

# Code Review Skill

Runs a project-specific code review on recent changes.

## Checklist

### Security
- [ ] All Overpass/Nominatim API responses validated with typed interfaces
- [ ] All coordinates pass `isSafeCoord()` before SVG/DXF injection
- [ ] No `any` types in service files
- [ ] CSP headers in electron/main.ts restrict to known domains
- [ ] No secrets, API keys, or credentials in source files

### Performance
- [ ] Overpass queries use `[bbox:]` not `around:` for speed
- [ ] SVG export uses array `.join()` not string concatenation
- [ ] Overpass cache (`OVERPASS_CACHE_TTL`) is active
- [ ] AbortController cancels previous requests on new capture
- [ ] No unnecessary re-renders in MapView (check useEffect deps)

### CSS/Layout
- [ ] All fixed-height sidebar elements have `flex-shrink: 0`
- [ ] No `!important` hacks (use specificity instead)
- [ ] No duplicate CSS selectors
- [ ] Section components don't have redundant internal labels

### Code Quality
- [ ] Constants from `src/services/constants.ts` (no magic numbers)
- [ ] Projection math from `src/services/geo.ts` (no duplication)
- [ ] Paper sizes from `PAPER_SIZES` constant (single source)
- [ ] Commit messages follow Conventional Commits
- [ ] No dead code or unused imports

### UX
- [ ] All async operations have loading indicators
- [ ] Error states show retry button
- [ ] Toast notifications for success/failure
- [ ] Keyboard shortcuts documented in capture-hint
- [ ] Export preview shows correct paper aspect ratio

## Usage

Run after making changes:
```
/code-review
```
