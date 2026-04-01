---
name: docs
description: Update all documentation to match current code
user_invocable: true
---

Update all project documentation to reflect the current state of the code.

## Steps

1. **Read CLAUDE.md** to understand current architecture

2. **Scan for changes** — compare what's in `docs/*.md` vs what actually exists:
   - Check `scripts/docs-mcp.mjs` for MCP tools count and list
   - Check `src/hooks/` for any new hooks
   - Check `src/components/` for any new components
   - Check `src/lib/` for any new utilities
   - Check `electron/preload.cjs` for IPC methods

3. **Update existing docs** that are outdated:
   - `docs/MCP.md` — tools count and table
   - `docs/EXPORT.md` — export formats
   - `docs/EDITOR.md` — block types
   - Any other doc where the feature changed

4. **Create new docs** for features that don't have one:
   - Follow the pattern of existing docs (title, sections, tables)
   - Keep each doc under 60 lines

5. **Update README.md**:
   - Badges (test count, MCP tool count)
   - Capabilities table (all features with doc links)
   - Dev commands section

6. **Update CLAUDE.md**:
   - Architecture section if hooks/components changed
   - Key files table if new files added
   - IPC API surface if new methods

7. Report what was updated/created.

Do NOT run tests or create PRs. Just update docs.
