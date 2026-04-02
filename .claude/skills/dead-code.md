---
name: dead-code
description: Find unused exports, components, CSS classes, and orphan files
user_invocable: true
---

Cross-reference all exports against imports to find dead code.

## Steps

1. **Find unused exports:**
   - For each `export` in `src/lib/*.js` and `src/hooks/*.js`:
     - Grep for its name across all `src/` files
     - If only found in its own file → unused
   - Report: file, export name, suggestion (delete or keep)

2. **Find orphan components:**
   - List all `.jsx` files in `src/components/`
   - For each, check if it's imported anywhere
   - If not imported → orphan

3. **Find unused CSS classes:**
   - Extract all class names from `src/index.css` (regex: `\.[a-z][a-z0-9-]+`)
   - For each class, grep across all `.jsx` files
   - If not referenced → unused
   - Note: some classes are dynamic (template literals) — flag but don't auto-delete

4. **Find unused dependencies:**
   - Read `package.json` dependencies
   - For each, grep for its import across `src/` and `electron/`
   - If not imported → unused

5. **Report:**
   - Unused exports (safe to delete)
   - Orphan components (safe to delete)
   - Potentially unused CSS (review before deleting)
   - Unused npm dependencies (safe to remove)
   - Total dead code: estimated lines

Do NOT delete anything. Report findings only.
