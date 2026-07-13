# Accessibility and mobile checks

Playwright checks all 18 rendered routes at 390x844 and 1440x900: Home, Today, Explore, Review, Status, Trends, Packages, Repos, Reference shelf, Notes, seven topic routes, and 404. Axe runs in both projects; `serious` and `critical` violations fail. Accessible-name rules fail at any impact because unnamed controls block basic operation.

Targeted assertions cover title, one primary heading, one main landmark and skip target, first-focus skip-link behavior, active-route semantics, topic breadcrumbs, the 404 navigation exception, textual health and score states, horizontal overflow, exact route ordering, a 44-52px single-row sticky primary rail with 44x44 CSS-pixel link targets, a nonsticky secondary rail, initial Today action visibility, anchor/focus clearance, and card text containment. Content controls retain the existing 24x24 CSS-pixel floor.

No accessibility exceptions are currently accepted. Any future exception must name the axe rule, affected route, reason, owner, and removal condition here; do not disable a rule globally for a route-specific issue.
