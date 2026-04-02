---
name: bundle-audit
description: Analyze bundle size and identify heavy imports
user_invocable: true
---

Audit the production bundle for size optimization opportunities.

## Steps

1. **Build:** `npm run build 2>&1` — capture output with chunk sizes

2. **Parse chunk sizes** from build output:
   - Total bundle size
   - Largest chunks
   - CSS size

3. **Identify heavy imports:**
   - Read `package.json` dependencies
   - For each major dependency, estimate its contribution:
     - `@tiptap/*` — editor core
     - `lucide-react` — icons (tree-shakeable?)
     - `@hello-pangea/dnd` — drag and drop
     - `recharts` — charts
     - `mermaid` — diagrams (usually largest)
     - `katex` — math
     - `xterm` + `node-pty` — terminal

4. **Suggest optimizations:**
   - Lazy loading candidates (components not needed on first render)
   - Dynamic imports for heavy features (mermaid, katex, recharts)
   - Tree-shaking issues (barrel exports)
   - CSS that could be split

5. **Report:**
   - Current total size (JS + CSS)
   - Top 5 heaviest dependencies
   - Lazy loading opportunities with estimated savings
   - Quick wins vs major refactors

Do NOT make code changes. Report analysis only.
