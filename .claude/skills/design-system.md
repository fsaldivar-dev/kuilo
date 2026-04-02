---
name: design-system
description: Extract and audit the de-facto design tokens from CSS
user_invocable: true
---

Scan all CSS and components to extract the actual design tokens in use and flag inconsistencies.

## Steps

1. **Extract colors:**
   - `grep -roE '#[0-9a-fA-F]{3,8}' src/index.css | sort | uniq -c | sort -rn`
   - `grep -roE 'rgba?\([^)]+\)' src/index.css | sort | uniq -c | sort -rn`
   - Group by semantic purpose: backgrounds, text, borders, accents

2. **Extract typography:**
   - All font-size values
   - All font-weight values
   - All line-height values
   - All font-family declarations

3. **Extract spacing:**
   - All padding values
   - All margin values
   - All gap values
   - Check if they follow a consistent scale (4px, 8px, 12px, 16px, 20px, 24px...)

4. **Extract borders:**
   - All border-radius values
   - All border-width values
   - All border-color values

5. **Flag inconsistencies:**
   - Colors that are 1-2 shades apart (should be the same token)
   - Font sizes that differ by 1px (should be standardized)
   - Spacing that doesn't follow a scale
   - Different border-radius for similar components

6. **Report:**
   - Current token inventory (what you found)
   - Proposed token consolidation (what it should be)
   - Components that use non-standard values
   - Suggested CSS variables / design tokens file

Do NOT make code changes. Report the audit only.
