---
name: security-review
description: Audit Electron security — preload, CSP, eval, input sanitization
user_invocable: true
---

Security audit of the Electron app focusing on common vulnerabilities.

## Steps

1. **Preload audit:**
   - Read `electron/preload.cjs`
   - Verify `contextIsolation: true` in BrowserWindow config
   - Check that no `nodeIntegration: true` exists
   - Verify all IPC channels use `invoke` (not `send` for sensitive ops)
   - List all exposed APIs — flag any that expose filesystem directly

2. **Dangerous patterns:**
   - `grep -rn "eval\|new Function\|innerHTML\b" src/ electron/` — flag usage
   - `grep -rn "dangerouslySetInnerHTML" src/` — flag usage
   - `grep -rn "shell\.openExternal" electron/` — verify URL validation
   - `grep -rn "require(" electron/` — verify no dynamic requires

3. **Input sanitization:**
   - Read `src/lib/sanitize.js` — verify DOMPurify is used
   - Check all places where user input is rendered as HTML
   - Verify wiki links, AI chat responses, and markdown preview sanitize output

4. **CSP check:**
   - Check if Content-Security-Policy header is set in BrowserWindow
   - Flag `unsafe-eval` or `unsafe-inline` if present
   - Suggest minimal CSP policy

5. **Dependency vulnerabilities:**
   - `npm audit 2>&1` — report results
   - Flag any critical/high severity issues

6. **Report:**
   - Critical issues (must fix)
   - Moderate issues (should fix)
   - Informational (nice to fix)
   - Each with: location, risk, suggested fix

Do NOT make code changes. Report findings only.
