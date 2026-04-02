---
name: arch-review
description: Validate architecture against CLAUDE.md and detect code smells
user_invocable: true
---

Review the codebase architecture for consistency and quality.

## Steps

1. **Read CLAUDE.md** — this is the source of truth for architecture

2. **Validate hook dependency chain:**
   - Read `src/App.jsx` — verify hooks are instantiated in correct order
   - Check that no hook imports another hook (they communicate via refs/props)
   - Verify the chain: editor → vault(editor) → backup → connectors → search → tabs → favorites → workflow

3. **Check file sizes:**
   - `find src -name "*.jsx" -o -name "*.js" | xargs wc -l | sort -rn | head -20`
   - Flag any file over 200 lines (project convention)

4. **Detect circular dependencies:**
   - For each hook in `src/hooks/`, check what it imports
   - For each component, check what hooks/libs it imports
   - Report any A→B→A import cycles

5. **Verify component hierarchy matches CLAUDE.md:**
   - Compare the architecture diagram in CLAUDE.md with actual imports in App.jsx
   - Flag components that exist but aren't in the diagram
   - Flag diagram entries that no longer exist

6. **Check conventions:**
   - Spanish UI strings in components (not English)
   - No state management libraries (only hooks + refs)
   - `const api = window.notesApi` pattern in files that need IPC
   - `@/` path alias used consistently

7. **Report:**
   - Architecture conformance: matches / drifted
   - Files over limit with line counts
   - Circular deps found
   - Convention violations
   - Suggested actions

Do NOT make code changes. Report findings only.
