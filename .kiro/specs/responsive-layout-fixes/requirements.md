# Requirements Document

## Introduction

The qTaskManagement frontend is a desktop-only internal tool targeting viewport widths from 1024 px (small laptops / 13-inch displays) through 1536 px and wider. A code review identified several layout issues that appear at 1024 px: content areas starved of horizontal space, quadrant cards growing without bound on wide screens, double-scroll regions in the schedule week view, a fixed-width date column that clips on certain locales, filter bars wrapping onto too many rows, and inconsistent page padding. This feature establishes observable, verifiable layout requirements for each affected area so that a developer can confirm each fix with a resize test.

The target viewport range is **1024 px ≤ viewport width**. No mobile or tablet support is in scope.

---

## Glossary

- **App Shell**: The top-level layout composed of a collapsible sidebar and a scrollable main content area.
- **Sidebar (expanded)**: The sidebar in its default, expanded state — 240 px wide.
- **Sidebar (collapsed)**: The sidebar in its collapsed state — 64 px wide.
- **Main Content Area**: The area to the right of the sidebar that renders the active page.
- **Page Wrapper**: The padding container that wraps each page's content inside the Main Content Area.
- **Horizontal Scroll Container**: A designated element that is permitted to show a horizontal scrollbar — specifically the table wrapper inside AllTasksPage and MasterMonitoringPage.
- **Eisenhower Matrix**: The 2×2 quadrant grid on EisenhowerMatrixPage.
- **Quadrant Card**: One of the four cells in the Eisenhower Matrix.
- **Week View**: The 7-column day grid rendered by SchedulePage when the "Week" view is selected.
- **Agenda View**: The date-grouped list rendered by SchedulePage when the "Agenda" view is selected.
- **Filter Bar**: The row or grid of filter controls at the top of MasterMonitoringPage and AllTasksPage.
- **KPI Row**: The row of four metric cards at the top of DashboardPage.
- **Dashboard Bottom Grid**: The two-column section below the KPI Row on DashboardPage containing "At-Risk Projects" and "Recent Activity".

---

## Requirements

### Requirement 1: No App-Level Horizontal Scrollbar

**User Story:** As a user, I want the application to never show a horizontal scrollbar at the outermost browser level, so that the layout always fills the viewport cleanly without side-scrolling the entire page.

#### Acceptance Criteria

1. WHILE the viewport width is between 1024 px and 1536 px and the Sidebar is expanded, THE App Shell SHALL NOT cause a horizontal scrollbar to appear on the `<html>` or `<body>` element.
2. WHILE the viewport width is between 1024 px and 1536 px and the Sidebar is collapsed, THE App Shell SHALL NOT cause a horizontal scrollbar to appear on the `<html>` or `<body>` element.
3. WHILE any page is active, THE App Shell SHALL confine all horizontal overflow to designated Horizontal Scroll Containers — specifically the table wrappers in AllTasksPage and MasterMonitoringPage — and nowhere else.
4. WHEN the Sidebar transitions between expanded and collapsed states, THE App Shell SHALL maintain the absence of an app-level horizontal scrollbar without a visible layout jump.

---

### Requirement 2: Sidebar and Main Content Area Width Allocation

**User Story:** As a user, I want the main content area to always receive adequate usable width, so that page content is readable and not cramped at any supported viewport size.

#### Acceptance Criteria

1. WHILE the viewport width is 1024 px and the Sidebar is expanded, THE Main Content Area SHALL have a usable width of at least 760 px.
2. WHILE the viewport width is 1024 px and the Sidebar is collapsed, THE Main Content Area SHALL have a usable width of at least 940 px.
3. WHILE the viewport width is 1536 px or wider and the Sidebar is expanded, THE Main Content Area SHALL occupy all remaining horizontal space after the Sidebar.
4. THE Sidebar SHALL NOT overlap or obscure the Main Content Area content at any supported viewport width.

---

### Requirement 3: Consistent Page Padding Rhythm

**User Story:** As a user, I want page padding to be proportional to the available viewport width, so that content is neither cramped on small desktops nor wastefully padded on wide screens.

#### Acceptance Criteria

1. WHILE the viewport width is between 1024 px and 1279 px, THE Page Wrapper SHALL apply a padding of 16 px on all sides (equivalent to Tailwind `p-4`).
2. WHILE the viewport width is 1280 px or wider, THE Page Wrapper SHALL apply a padding of 24 px on all sides (equivalent to Tailwind `p-6`).
3. THE Page Wrapper padding SHALL be consistent across all pages that use the shared `renderPage` wrapper in AppShell — Dashboard, All Tasks, All Subtasks, Schedule, Eisenhower Matrix, Master Monitoring, and Analytics pages.
4. WHEN the viewport is resized from above 1280 px to below 1280 px, THE Page Wrapper SHALL update its padding without requiring a page reload.

---

### Requirement 4: Eisenhower Matrix Quadrant Card Sizing

**User Story:** As a user, I want the Eisenhower Matrix quadrant cards to use the available screen space efficiently at both small and large desktop sizes, so that cards are neither too small nor unreasonably wide.

#### Acceptance Criteria

1. WHILE the viewport width is 1024 px with the Sidebar expanded, THE Eisenhower Matrix SHALL display all four Quadrant Cards in a 2×2 grid without any card being clipped or hidden.
2. WHILE the viewport width is 1536 px or wider, THE Eisenhower Matrix SHALL constrain each Quadrant Card width so that cards do not grow beyond a readable maximum width.
3. THE Eisenhower Matrix SHALL fill the remaining vertical space of the Main Content Area without the Quadrant Cards overflowing below the visible viewport.
4. WHEN the page header above the Eisenhower Matrix changes height (for example, due to wrapping filter controls), THE Quadrant Cards SHALL resize vertically to fit within the remaining space, with no card content being clipped.
5. WHILE a Quadrant Card contains more task items than fit in its visible area, THE Quadrant Card SHALL show a vertical scrollbar within the card rather than growing taller and pushing other cards off-screen.

---

### Requirement 5: Schedule — Week View Scroll Behaviour

**User Story:** As a user, I want the schedule week view to scroll horizontally within its own container, so that I can see all seven day columns without the page itself scrolling sideways.

#### Acceptance Criteria

1. WHILE the viewport width is 1024 px with the Sidebar expanded and the Week view is active, THE Week View SHALL scroll horizontally within its own container to reveal all seven day columns.
2. THE Week View horizontal scrollbar SHALL be visible and reachable — the scrollbar thumb SHALL NOT be clipped or hidden by any ancestor overflow container.
3. THE Week View SHALL NOT cause the Main Content Area or the App Shell to scroll horizontally.
4. WHILE the viewport width is 1536 px or wider and all seven day columns fit within the available width, THE Week View SHALL display all seven day columns without a horizontal scrollbar.

---

### Requirement 6: Schedule — Agenda View Date Column

**User Story:** As a user, I want the agenda view date column to be wide enough to display date text without clipping at any supported locale, so that dates are always fully readable.

#### Acceptance Criteria

1. WHILE the Agenda View is active, THE Agenda View date column SHALL be wide enough to display a formatted date string (e.g., "Wed, Jan 01, 2025") without truncation or wrapping at the 1024 px viewport width.
2. WHILE the Agenda View is active, THE Agenda View date column width SHALL adapt to the available space rather than being fixed at a value that clips text on wider date strings.
3. WHILE the Agenda View is active and the Main Content Area is 760 px or wider, THE event list column in the Agenda View SHALL fill all remaining horizontal space after the date column.

---

### Requirement 7: Master Monitoring — Filter Bar Row Count

**User Story:** As a user, I want the master monitoring filter bar to fit in at most two rows at 1024 px with the sidebar expanded, so that filters do not push the data table too far down the page.

#### Acceptance Criteria

1. WHILE the viewport width is 1024 px with the Sidebar expanded and all nine filter controls are visible, THE Filter Bar SHALL display all controls within at most two rows.
2. WHILE the viewport width is 1280 px or wider, THE Filter Bar SHALL display all filter controls in a single row.
3. WHEN the number of active filters decreases (for example, after clearing filters), THE Filter Bar height SHALL decrease or remain the same — it SHALL NOT increase.
4. THE Filter Bar SHALL NOT cause horizontal overflow at any supported viewport width.

---

### Requirement 8: Master Monitoring — Table Horizontal Scroll Accessibility

**User Story:** As a user, I want the master monitoring table's horizontal scroll thumb to always be visible and reachable, so that I can scroll the table to see all columns without the scrollbar being hidden behind another element.

#### Acceptance Criteria

1. WHILE the Master Monitoring table is wider than the available container width, THE Horizontal Scroll Container wrapping the table SHALL display a horizontal scrollbar that is fully visible within the viewport.
2. THE horizontal scrollbar thumb for the Master Monitoring table SHALL NOT be clipped or hidden by the outer page container or the App Shell.
3. WHILE the Master Monitoring table content fits within the available container width, THE Horizontal Scroll Container SHALL NOT display a horizontal scrollbar.

---

### Requirement 9: All Tasks — Filter Bar Controls

**User Story:** As a user, I want the All Tasks page filter bar controls to be appropriately sized at 1024 px, so that the filter row does not waste space or cause excessive wrapping.

#### Acceptance Criteria

1. WHILE the viewport width is 1024 px with the Sidebar expanded, THE AllTasksPage Filter Bar SHALL display all filter controls (Phase, Severity, Status, and Assignee when visible) in at most two rows.
2. WHILE the viewport width is 1280 px or wider, THE AllTasksPage Filter Bar SHALL display all filter controls in a single row.
3. THE Filter Bar controls SHALL have a minimum width small enough to fit all controls within the available content width at 1024 px — no individual control SHALL force the Filter Bar to scroll horizontally.
4. THE AllTasksPage Filter Bar SHALL NOT cause horizontal overflow of the Main Content Area at any supported viewport width.

---

### Requirement 10: Dashboard — KPI Row and Bottom Grid

**User Story:** As a user, I want the Dashboard KPI cards and bottom grid to use available vertical space naturally without hard-coded height floors that waste space on 1024 px tall screens.

#### Acceptance Criteria

1. WHILE the viewport width is 1024 px, THE Dashboard KPI Row SHALL display all four KPI cards in a single row without any card being hidden or clipped.
2. WHILE the viewport height is less than 900 px, THE Dashboard Bottom Grid SHALL NOT enforce a minimum height that pushes its lower edge below the visible viewport, requiring the user to scroll to see content that would fit at the natural height.
3. WHILE the viewport height is 900 px or taller, THE Dashboard Bottom Grid SHALL expand vertically to fill the remaining available height below the KPI Row.
4. THE Dashboard Bottom Grid columns ("At-Risk Projects" and "Recent Activity") SHALL each fill their available height with vertically scrollable content, rather than clipping content or adding a second outer scroll region.

