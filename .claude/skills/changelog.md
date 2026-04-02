---
name: changelog
description: Generate changelog from git commits since last tag
user_invocable: true
---

Generate a user-facing changelog in Spanish from git history.

## Steps

1. **Find last tag:** `git describe --tags --abbrev=0`

2. **Get commits since tag:** `git log <tag>..HEAD --oneline --no-merges`

3. **Categorize each commit:**
   - **Nuevas features** — commits starting with "Add", "feat:", "New"
   - **Correcciones** — commits with "Fix", "fix:", "Hotfix"
   - **Mejoras** — commits with "Update", "Improve", "Refactor"
   - **Documentación** — commits with "docs", "README", "CLAUDE"
   - **Infraestructura** — commits with "CI", "workflow", "build"

4. **Write CHANGELOG.md** (or update if exists) with format:
   ```markdown
   ## [version] — YYYY-MM-DD

   ### Nuevas features
   - Feature description (PR #N)

   ### Correcciones
   - Fix description

   ### Mejoras
   - Improvement description
   ```

5. **Report** the changelog content for review.

Rules:
- Write descriptions in Spanish (user-facing)
- One line per change, not per commit (group related commits)
- Include PR numbers when available
- Skip merge commits and version bumps
