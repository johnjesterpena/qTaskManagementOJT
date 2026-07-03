# Calendar Project Visibility Fix — Bugfix Design

## Overview

The Schedule of Activities page (Calendar and Permissions module) renders calendar events
exclusively from `ScheduleController.GetScheduleTasks()`, which queries only `Main_Tasks`.
No backend or frontend path exists to translate a `Project` record itself into a calendar event.
As a result, the project's own timeline bar — spanning its `CreatedDate` through its
`TargetEndDate` — never appears; only task-level entries are shown.

The fix adds a new backend endpoint `GET /api/schedule/projects` that returns project records
shaped as calendar events, and updates the frontend `SchedulePage` to fetch and merge those
project events alongside the existing task events. The approach is purely additive: the existing
task endpoint, its DTO, and all rendering logic remain untouched.

---

## Glossary

- **Bug_Condition (C)**: The condition under which the bug manifests — a project has been
  added to the calendar (i.e., it is accessible to the authenticated user and has a valid
  `TargetEndDate`), yet no event bar spanning the project's date range appears on the calendar.
- **Property (P)**: The desired behavior when the bug condition holds — the calendar SHALL
  render one event bar per accessible project, spanning from `CreatedDate` (inclusive) through
  `TargetEndDate` (inclusive), in every calendar view.
- **Preservation**: All existing task-level event rendering, project dropdown filtering, overdue
  indicators, and view navigation must remain completely unchanged by this fix.
- **`GetScheduleTasks()`**: The existing action in `ScheduleController` (`Controllers/ScheduleController.cs`)
  that returns `ScheduleTaskDto` objects for `Main_Tasks`. This method is NOT modified by this fix.
- **`ScheduleTaskDto`**: The existing record type (`DTO/MainTask/ScheduleTaskDto.cs`) used for
  task-level calendar events. Project events reuse this shape with a discriminating `isRecurring`
  flag set to `false` and an empty `Assignees` list, plus a synthetic negative `Id` to avoid
  key collisions with task IDs.
- **`TargetEndDate`**: The project end date stored on the `Project` model. Used as the `End`
  boundary of the project calendar event.
- **`CreatedDate`**: The project creation date stored on the `Project` model. Used as the `Start`
  boundary of the project calendar event, since `Project` has no explicit `StartDate` field.
- **`fetchScheduleTasks(projectId)`**: The existing API service call in `src/services/api.js`
  that hits `GET /api/schedule/tasks`. Not modified by this fix.
- **`fetchScheduleProjects(projectId)`**: The new API service call to be added to `api.js`
  that hits `GET /api/schedule/projects`.
- **Flashing Red End Date**: A CSS pulse/flash animation applied to the calendar cell or event bar segment that falls on a project's `TargetEndDate`. It uses a red color with repeating opacity animation to draw attention to the project deadline. Applies only to project-level events, not task events.

---

## Bug Details

### Bug Condition

The bug manifests whenever an authenticated user views the Schedule of Activities page and has
at least one project accessible to them. The project's `CreatedDate`–`TargetEndDate` span is
never returned by any API call and is therefore never rendered on the calendar.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { userId, userRole, selectedProjectId | null, calendarView }
  OUTPUT: boolean

  accessibleProjects := getProjectsAccessibleToUser(userId, userRole)

  IF selectedProjectId IS NOT NULL THEN
    relevantProjects := accessibleProjects WHERE id = selectedProjectId
  ELSE
    relevantProjects := accessibleProjects

  RETURN relevantProjects.Any(p =>
    p.TargetEndDate IS NOT NULL
    AND NOT calendarContainsEventForProject(p.Id)
  )
END FUNCTION
```

### Examples

- **Confirmed example**: Project "dasdacompleteddsadasd" (start: Jul 3 2026 via CreatedDate,
  end: Jul 31 2026 via TargetEndDate) — Month view for July 2026 shows zero project event bar;
  only task entries within that project appear.
- **"ALL" projects view**: Admin selects no project filter. Calendar shows many task bars but
  zero project-level bars, even though multiple projects with defined date ranges exist.
- **Single project selected**: PM selects one project from the dropdown. Task events for that
  project appear, but the project itself is invisible as a spanning event bar.
- **Edge case — project with only CreatedDate**: If `TargetEndDate` equals `CreatedDate`, a
  single-day project event bar should still appear on that day.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All task-level event bars returned by `GET /api/schedule/tasks` must continue to render
  exactly as before — same shape, same overdue logic, same assignee avatars.
- The project dropdown filter must continue to filter task events to only those belonging to
  the selected project.
- Overdue styling (red background, `AlertTriangle` icon) on task events must not be affected.
- All five calendar views (Day, Week, Month, Year, Agenda) must continue to render existing
  task events correctly.
- Navigation (Today, Previous, Next, view switching) must remain fully functional.

**Scope:**
All inputs that do NOT correspond to the bug condition — specifically, all non-project calendar
events (task events, mouse interactions, view navigation) — must be completely unaffected by
this fix. The new code path is entirely parallel to the existing one.

---

## Hypothesized Root Cause

Based on inspection of `ScheduleController.cs`, `SchedulePage.jsx`, and `api.js`, the root
cause is a complete omission rather than incorrect logic:

1. **Missing backend endpoint**: `ScheduleController` has only `GET /api/schedule/tasks`.
   There is no `GET /api/schedule/projects` or equivalent action that maps `Project` records
   into event-shaped DTOs. The controller never touches the `Projects` DbSet for calendar output.

2. **Missing frontend fetch**: `SchedulePage` calls only `fetchScheduleTasks(selectedProjectId)`
   inside its `useEffect`. There is no second fetch for project-level events. The `events` state
   array is populated exclusively from task data.

3. **No project-event DTO or mapping**: No DTO, mapper, or utility function exists to convert
   a `Project` into a calendar event shape. The `ScheduleTaskDto` record is task-specific and
   is never instantiated with project data.

4. **No StartDate field on Project**: The `Project` model (`Models/Project.cs`) has `CreatedDate`
   and `TargetEndDate` but no explicit `StartDate`. The fix must use `CreatedDate` as the
   project event's start date. This is a data-model constraint, not a bug itself.

---

## Correctness Properties

Property 1: Bug Condition — Project Events Appear on Calendar

_For any_ authenticated user with at least one accessible project whose `TargetEndDate` is set,
after the fix the calendar SHALL render one event bar for each such project spanning from the
project's `CreatedDate` (inclusive) through its `TargetEndDate` (inclusive), visible in every
calendar view (Day, Week, Month, Year, Agenda) on every day within that range. The project name
(title) SHALL be displayed ONLY on the start date and end date cells — intermediate days show
only the event bar without text. The calendar cell or event bar segment on the `TargetEndDate`
SHALL display a flashing red visual indicator.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Preservation — Task Events and All Existing Behavior Unchanged

_For any_ input that does NOT involve the rendering of a project-level event bar (i.e., all
task event rendering, dropdown filtering, overdue indicators, view navigation, and calendar
layout), the fixed code SHALL produce exactly the same output as the original code, preserving
all existing functionality without modification.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

---

## Fix Implementation

### Changes Required

The fix is entirely additive. No existing file is modified except to extend it with new, parallel
logic. The existing `GetScheduleTasks` action and `fetchScheduleTasks` function are not touched.

---

**File**: `qTask-backend/Controllers/ScheduleController.cs`

**New Action**: `GetScheduleProjects`

**Specific Changes**:
1. **Add new `[HttpGet("projects")]` action** below the existing `tasks` action.
2. **Apply the same role-based access logic** as `GetScheduleTasks` to determine which projects
   are accessible to the authenticated user:
   - `Developer`/`QA`: projects where `Project_Users` has a matching entry for the user's role.
   - `ProjectManager`: projects where `PmId == user.Id`.
   - `Admin`: all projects.
3. **Apply the same `projectId` filter** — if `?projectId=N` is present in the query string,
   return only that project's event.
4. **Map each accessible `Project` to a `ScheduleTaskDto`** using:
   - `Id`: use a synthetic negative value (e.g., `p.Id * -1`) to avoid collision with task IDs
     in the frontend `key` prop. Alternatively, prefix with a large constant (`-10000 - p.Id`).
   - `ProjectId`: `p.Id`
   - `ProjectName`: `p.Title`
   - `Title`: `p.Title` (the project name is the event title)
   - `Start`: `p.CreatedDate`
   - `End`: `p.TargetEndDate`
   - `PhaseId`: `0` (sentinel — no phase applies to a project event)
   - `PhaseLabel`: `"Project"`
   - `PhaseGrouping`: `"project"`
   - `StatusId`: `0`
   - `StatusLabel`: `p.Status` (e.g., "ongoing", "completed")
   - `StatusColor`: a fixed project-brand color, e.g., `"#0078D7"` — distinguishes project bars visually
   - `StatusIsFinal`: `0`
   - `Progress`: `0`
   - `IsOverdue`: `false`
   - `IsRecurring`: `false`
   - `Assignees`: empty list
   - `IsProjectEvent`: `true` (new discriminator field — signals to frontend that this is a project-level event, used to apply flashing red end-date styling)

---

**File**: `qTask-frontend/src/services/api.js`

**New Function**: `fetchScheduleProjects`

**Specific Changes**:
1. Add a new exported function `fetchScheduleProjects(projectId)` that calls
   `GET /api/schedule/projects?projectId={N}` (omitting the param when `projectId` is null),
   mirroring the existing `fetchScheduleTasks` implementation.

---

**File**: `qTask-frontend/src/components/pages/SchedulePage.jsx`

**Modified Component**: `SchedulePage` (the `useEffect` and import)

**Specific Changes**:
1. **Import `fetchScheduleProjects`** from `../../services/api` alongside the existing import.
2. **In the `useEffect`**, run both fetches in parallel using `Promise.all`:
   ```
   const [taskData, projectData] = await Promise.all([
     fetchScheduleTasks(selectedProjectId),
     fetchScheduleProjects(selectedProjectId),
   ]);
   setEvents([...projectData, ...taskData]);
   ```
3. **No changes** to `EventBar`, `MonthView`, `WeekView`, `DayView`, `YearView`, `AgendaView`,
   `sortedEvents`, navigation logic, or the project dropdown. The merged event array drops
   directly into the existing rendering pipeline unchanged.

4. **Flashing red end date**: In the calendar cell/day renderer (e.g., `MonthView`), when rendering
   a day cell that matches the `end` date of a project event (`event.isProjectEvent === true`),
   apply a CSS animation class (e.g., `animate-pulse` with red background or red border) to that
   day cell or to the event bar's trailing edge. This visually signals the project deadline.
   - Use a CSS keyframe animation: `@keyframes pulse-red` with alternating red opacity.
   - Apply only to the calendar cell or event bar segment that falls on `event.end` date.
   - Must not affect task event bars or any other calendar cells.

5. **Project name visibility**: When rendering project event bars, display the project name (title)
   text ONLY on calendar cells that match the start date OR the end date of the project. For all
   intermediate days between start and end, render only the event bar visual (background color/bar)
   without displaying the project title text. This keeps the calendar uncluttered while clearly
   marking project boundaries.
   - Check: `isSameDay(day, toDate(event.start)) || isSameDay(day, toDate(event.end))`
   - If true: render event bar WITH project title text
   - If false (intermediate day): render event bar WITHOUT project title text

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples on unfixed
code to confirm the root cause, then verify the fix produces correct behavior and preserves
existing task-event rendering.

---

### Exploratory Bug Condition Checking

**Goal**: Confirm that `GET /api/schedule/projects` does not exist on unfixed code and that
`SchedulePage` never shows project event bars. Establish a baseline for preservation tests.

**Test Plan**: Issue HTTP requests to the unfixed backend and inspect `SchedulePage` DOM on the
unfixed frontend to observe that no project-level events are present.

**Test Cases**:
1. **Missing endpoint test**: Call `GET /api/schedule/projects` on unfixed code — expect `404`.
2. **Month view — no project bar**: Load SchedulePage for July 2026 with project
   "dasdacompleteddsadasd" selected — assert no event bar with that project title spans Jul 3–31.
3. **ALL projects view — no project bars**: Load SchedulePage with no project filter — assert
   zero project-level event bars appear alongside task bars.
4. **Task events still present**: Confirm task events DO appear, validating that the bug is
   specifically the absence of project events, not a total calendar failure.

**Expected Counterexamples**:
- `GET /api/schedule/projects` returns 404 (endpoint missing).
- No DOM element with class/text matching the project title appears as a spanning bar in the
  calendar grid — only task entries are rendered.
- Possible causes confirmed: missing controller action, missing frontend fetch, no DTO mapping.

---

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed system renders the
correct project event bar.

**Pseudocode:**
```
FOR ALL user WHERE user.canAccessAtLeastOneProject DO
  FOR ALL project IN getAccessibleProjects(user) DO
    input := { userId: user.Id, selectedProjectId: project.Id OR null, view: anyView }
    IF isBugCondition(input) THEN
      result := renderCalendar(input)
      ASSERT result CONTAINS eventBar(
        title: project.Title,
        start: project.CreatedDate,
        end: project.TargetEndDate
      )
    END IF
  END FOR
END FOR
```

**Test Cases**:
1. **Single project selected, Month view**: Project "dasdacompleteddsadasd" — assert project
   event bar appears on all days from Jul 3 through Jul 31 2026.
2. **ALL projects, Month view**: Assert one project event bar per accessible project appears.
3. **Project event in Week view**: Navigate to the week containing Jul 3 2026 — assert project
   bar is present.
4. **Single-day project** (`CreatedDate == TargetEndDate`): Assert event bar appears on exactly
   that one day.
5. **`GET /api/schedule/projects` returns correct shape**: Assert response array contains
   entries with negative `id`, correct `start` = `createdDate`, `end` = `targetEndDate`,
   `phaseLabel` = "Project".

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (all task event
rendering, filtering, and navigation), the fixed code produces identical output to the original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT render_original(input) = render_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is appropriate for preservation checking because:
- Task events vary across many projects, phases, statuses, and date ranges.
- It automatically generates combinations of task data and asserts the rendering pipeline is
  unchanged.
- It catches subtle regressions (e.g., key collisions, event-sort disruption) that manual tests
  might miss.

**Test Plan**: Capture baseline task event rendering on unfixed code, then assert the same
output after the fix.

**Test Cases**:
1. **Task events preserved**: With the fix applied, assert all task bars that appeared before
   still appear with the same title, color, overdue flag, and assignee avatars.
2. **Project filter still filters tasks**: Select a specific project — assert task events are
   still filtered to that project only (project events for other projects do not leak in).
3. **Overdue indicator preserved**: An overdue task still renders with red background and
   `AlertTriangle` icon after the fix.
4. **View navigation preserved**: Switching between Day, Week, Month, Year, Agenda views still
   renders the same task events in the correct positions.
5. **"ALL" projects task events preserved**: With no project filter selected, all task events
   from all accessible projects continue to appear alongside the new project bars.

---

### Unit Tests

- Test `GetScheduleProjects` returns 200 with correct `ScheduleTaskDto` shape for each
  accessible project (verify `start`, `end`, `phaseLabel = "Project"`, `statusColor`).
- Test that `GetScheduleProjects` with `?projectId=N` returns only the event for project N.
- Test role-based access: Developer only sees projects they are assigned to; PM only sees their
  own projects; Admin sees all.
- Test `fetchScheduleProjects` in isolation: mock `fetch`, assert correct URL is called with
  and without `projectId` parameter.
- Test that merging `[...projectData, ...taskData]` in `SchedulePage` does not cause React
  key collisions (project event IDs are negative; task event IDs are positive).

---

### Property-Based Tests

- **Fix property**: Generate random sets of projects with varying `CreatedDate` and
  `TargetEndDate` values; assert each project produces exactly one event bar with
  `start ≤ end` that appears on every day in `[start, end]` across Month view.
- **Preservation property**: Generate random task lists (varying status, phase, dates); assert
  that with the fix applied, `sortedEvents` contains the same task entries in the same order
  as without the fix — project events are additional, not replacements.
- **No key collision property**: Generate arbitrary combinations of project IDs and task IDs;
  assert that after merging `projectData` and `taskData`, all `event.id` values in the merged
  array are unique.

---

### Integration Tests

- **Full flow — PM user**: Log in as ProjectManager, open Schedule page, select a project,
  verify the project event bar appears spanning the full project date range while task events
  remain intact.
- **Full flow — Admin, ALL view**: Log in as Admin with no project filter; verify project event
  bars appear for every project alongside all task events.
- **Cross-view consistency**: For a project spanning multiple months, verify the project event
  bar appears correctly in Month, Week, Day, Year, and Agenda views without duplication or gaps.
- **Event bar visual distinction**: Verify project event bars are visually distinguishable from
  task event bars (e.g., `phaseLabel = "Project"` or distinct color) so users can identify them.
