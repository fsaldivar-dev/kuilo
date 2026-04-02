---
name: tutorial
description: Generate step-by-step tutorial with screenshots for a feature
user_invocable: true
---

Create a tutorial guide for a feature with annotated screenshots.

## Arguments

First argument: feature name (e.g., "workflow board", "ai chat", "wiki links")

## Steps

1. **Identify the feature's entry point** — which button/shortcut starts it?

2. **Plan the walkthrough steps:**
   - Step 1: How to open/access the feature
   - Step 2-N: Key interactions in order
   - Final step: Expected result

3. **For each step, capture a screenshot:**
   - Use Playwright to navigate to the state
   - If Electron-only, inject HTML mockup into the page
   - Use `toHaveScreenshot("tutorial-{feature}-step-{N}.png")`

4. **Write the tutorial** in `docs/tutorials/{feature}.md`:
   ```markdown
   # Cómo usar [Feature]

   ## Paso 1: [Acción]
   [Descripción de qué hacer]
   ![Paso 1](screenshots/tutorial-feature-step-1.png)

   ## Paso 2: [Acción]
   ...
   ```

5. **Read each screenshot** to verify it shows the right state

6. **Report:**
   - Tutorial file created
   - Number of steps
   - Screenshots captured
   - Any steps that couldn't be captured (need Electron)

Write the tutorial file. Do NOT modify app code.
