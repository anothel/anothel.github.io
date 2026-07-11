# Accessibility and mobile checks

Playwright checks the five critical routes at a 390x844 mobile viewport and in desktop Chromium. Axe failures are limited to `serious` and `critical`; accessible-name rules fail at any impact because unnamed controls block basic operation.

Targeted assertions cover title, one primary heading, main and navigation landmarks, textual health and score states, horizontal overflow, single-row primary navigation, initial Today action visibility, sticky-header occlusion, card text containment, and 24x24 CSS-pixel minimum primary controls.

No accessibility exceptions are currently accepted. Any future exception must name the axe rule, affected route, reason, owner, and removal condition here; do not disable a rule globally for a route-specific issue.
