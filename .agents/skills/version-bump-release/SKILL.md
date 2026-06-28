---
name: version-bump-release
description: Bump the @version in the userscript metadata, update README badge, validate, and create a GitHub release. Use when preparing a new version for release.
---

# Version Bump & Release

## Overview

The userscript version lives in the `==UserScript==` metadata block and is mirrored in the README badge. This skill documents the complete release checklist.

## Files to Update

### 1. `ai-anti-frust.user.js` - Metadata Block

The version is on line 4 (may shift with edits):

```
// @version      8.5
```

Bump according to semver-ish convention:
- **Patch** (8.5 -> 8.6): Bug fixes, minor tweaks
- **Minor** (8.5 -> 9.0): New features, new platform support
- **Major**: Reserved for breaking changes to storage format or behavior

### 2. `README.md` - Version Badge

Update the badge near the top:

```markdown
![Version](https://img.shields.io/badge/version-8.5-green.svg)
```

Change the version number in the badge URL.

### 3. `README.md` - Feature Sections

If the new version adds features, add a section like:

```markdown
### Section Title (Neu in vX.Y)
```

## Validation

Run the metadata validator:

```bash
npm run validate:meta
```

This checks that the `==UserScript==` block is well-formed. Fix any reported issues before committing.

## Release Checklist

1. **Bump version** in `ai-anti-frust.user.js` metadata block
2. **Update README.md** badge version number
3. **Add feature documentation** to README if applicable
4. **Run validation**: `npm run validate:meta`
5. **Run lint**: `npm run lint`
6. **Run tests**: `npm test`
7. **Commit** with message format: `release: bump version to X.Y`
8. **Create PR** targeting `main`
9. **After merge**, create GitHub release:

```bash
gh release create vX.Y \
  --title "v X.Y - Brief Description" \
  --notes "## What's New\n- Feature 1\n- Feature 2\n\n## Bug Fixes\n- Fix 1" \
  ai-anti-frust.user.js
```

This attaches the userscript file to the release so users can download it directly.

## Version History Convention

The README doesn't maintain a full changelog. New features are documented inline with "(Neu in vX.Y)" markers. For a release with many changes, consider adding a brief section.

## Secrets Needed

None - standard git operations.