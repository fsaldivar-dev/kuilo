---
name: docs
description: Update all documentation to match current code, including screenshots
user_invocable: true
---

Update all project documentation to reflect the current state of the code.

## Steps

1. **Read CLAUDE.md** to understand current architecture

2. **Scan for changes** — compare docs vs actual code:
   - `scripts/docs-mcp.mjs` → MCP tools count and list
   - `src/hooks/` → hooks list
   - `src/components/` → component tree
   - `src/lib/` → utilities
   - `electron/preload.cjs` → IPC methods
   - `.claude/skills/` → skills list

3. **Update existing docs** that are outdated:
   - Each `docs/*.md` file — verify content matches code
   - Verify each doc has a screenshot or usage example
   - Keep each doc under 60 lines

4. **Create new docs** for features without documentation:
   - Follow existing doc pattern (title, sections, tables)
   - Include at least one code example or usage description

5. **Update README.md:**
   - Badges: test count, MCP tool count, skill count
   - Capabilities table: all features with doc links (no "—" entries)
   - Dev commands section

6. **Update CLAUDE.md:**
   - Architecture section: hooks + components diagram
   - Key files table
   - IPC API surface
   - PR checklist

7. **Verify completeness:**
   - Every feature in README links to a doc
   - Every doc describes a feature that still exists
   - No broken links

Do NOT run tests or create PRs. Just update docs.
