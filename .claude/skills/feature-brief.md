---
name: feature-brief
description: Generate a structured feature brief with user stories and affected files
user_invocable: true
---

Given a feature name/description, generate a complete brief for implementation.

## Arguments

First argument: feature name or description (e.g., "drag and drop pages in tree")

## Steps

1. **Read CLAUDE.md** for current architecture

2. **Analyze the feature:**
   - What problem does it solve?
   - Who benefits (user persona)?
   - What existing features does it relate to?

3. **Generate user stories:**
   - Format: "Como [persona], quiero [acción], para [beneficio]"
   - Maximum 5 stories
   - Include edge cases

4. **Identify affected files:**
   - Which hooks need changes?
   - Which components need changes?
   - New files needed?
   - IPC handlers needed?
   - CSS changes?

5. **Estimate complexity:**
   - Lines of code (rough)
   - Number of files touched
   - Dependencies needed
   - Risk areas

6. **Define acceptance criteria:**
   - What tests need to pass?
   - What should the user see?
   - What should NOT change?

7. **Output the brief** in markdown format ready to paste into a PR or plan.

Do NOT write code. Generate the brief only.
