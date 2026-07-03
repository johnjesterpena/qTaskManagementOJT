# Implementation Plan

## Overview

This plan follows the exploratory bugfix workflow for the calendar project visibility fix.
Tasks are ordered so that tests are written and run on unfixed code first (to confirm the bug
and establish a baseline), then the fix is implemented, and finally the same tests are re-run
to validate the fix and confirm no regressions.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Project Events Missing from Calendar
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate project events are never returned or rendered
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases — any authenticated user with at least one project whose `TargetEndDate` is set, calling `GET /api/schedule/projects`, should receive a non-empty array; and after merging with task data, the events array should contain at least one entry with `phaseLabel = "Project"`
  - Test that `GET /api/schedule/projects` returns **404** on unfixed code (endpoint does not exist)
  - For the frontend: assert that after `fetchScheduleTasks(selectedProjectId)` resolves, the `events` state contains **zero** entries where `phaseLabel === "Project"` — confirming no project bars are rendered
  - For the merged-event assertion: generate arbitrary sets of `{ projectId, createdDate, targetEndDate }` tuples; call `GET /api/schedule/projects` for each accessible project; assert the response array is non-empty and each entry has `id < 0`, `start = createdDate`, `end = targetEndDate`, `phaseLabel = "Project"`, `isProjectEvent = true`
  - Run tests on **UNFIXED** code
  - **EXPECTED OUTCOME**: Tests FAIL — `GET /api/schedule/projects` returns 404; no project-level event bars exist in the frontend events array (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g., "`GET /api/schedule/projects` → 404"; "events array after fetch: zero entries with phaseLabel='Project'")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Task Events and Existing Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on **UNFIXED** code for non-buggy inputs (all task-level event rendering)
  - Observe: `fetchScheduleTasks(selectedProjectId)` returns task events with correct `title`, `start`, `end`, `statusColor`, `isOverdue`, `assignees` fields
  - Observe: Filtering by `selectedProjectId` returns only tasks belonging to that project
  - Observe: An overdue task (where `end < today` and `statusIsFinal = 0`) has `isOverdue = true`
  - Observe: The `events` state passed to all five views (`MonthView`, `WeekView`, `DayView`, `YearView`, `AgendaView`) contains only task events, sorted by `end` date ascending
  - Write property-based tests: for all task event arrays with varying statuses, phases, date ranges, and assignees, assert that `sortedEvents` on unfixed code equals `sortedEvents` on fixed code when the input contains no project events — i.e., `[...projectData, ...taskData].filter(e => !e.isProjectEvent)` sorted by `end` must be identical to `taskData` sorted by `end`
  - Write property-based test: for all `projectId` filter values (null and any valid project ID), task events returned by `GET /api/schedule/tasks?projectId=N` are scoped to that project only — this behavior must be unchanged after the fix
  - Write property-based test: for arbitrary combinations of positive task IDs and negative synthetic project IDs, the merged array has no duplicate `id` values
  - Verify all preservation tests **PASS** on UNFIXED code before proceeding
  - **EXPECTED OUTCOME**: Tests PASS — baseline task-event behavior is confirmed and captured
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for project events not appearing on the Schedule of Activities calendar

  - [x] 3.1 Extend `ScheduleTaskDto` with `IsProjectEvent` discriminator field
    - Open `qTask-backend/DTO/MainTask/ScheduleTaskDto.cs`
    - Add `bool IsProjectEvent` as the last field of the `ScheduleTaskDto` record (after `Assignees`)
    - Update the existing `GetScheduleTasks` call-site in `ScheduleController.cs` to pass `false` for `IsProjectEvent` (preserves existing behavior)
    - _Bug_Condition: isBugCondition(input) where no calendarContainsEventForProject(p.Id) is true for any accessible project with TargetEndDate set_
    - _Expected_Behavior: ScheduleTaskDto shape is extended; existing task usages pass IsProjectEvent=false; project events pass IsProjectEvent=true_
    - _Preservation: All existing ScheduleTaskDto consumers (GetScheduleTasks, frontend EventBar, MonthView, etc.) continue to work unchanged_
    - _Requirements: 2.1, 2.5_

  - [x] 3.2 Add `GetScheduleProjects` action to `ScheduleController.cs`
    - Open `qTask-backend/Controllers/ScheduleController.cs`
    - Add `[HttpGet("projects")]` action below the existing `tasks` action
    - Apply the same `x-user-id` header auth check as `GetScheduleTasks`
    - Apply role-based access control matching `GetScheduleTasks`:
      - `Developer`: projects where `Project_Users` has a matching entry with `Role = "Developer"` for this user
      - `QA`: projects where `Project_Users` has a matching entry with `Role = "QA"` for this user
      - `ProjectManager`: projects where `p.PmId == user.Id`
      - `Admin`: all projects
      - Any other role: return 403
    - Apply optional `?projectId=N` filter identical to the tasks endpoint
    - Map each accessible `Project` to `ScheduleTaskDto` with:
      - `Id`: `p.Id * -1` (synthetic negative to avoid key collisions with task IDs)
      - `ProjectId`: `p.Id`
      - `ProjectName`: `p.Title`
      - `Title`: `p.Title`
      - `Start`: `p.CreatedDate`
      - `End`: `p.TargetEndDate`
      - `PhaseId`: `0`
      - `PhaseLabel`: `"Project"`
      - `PhaseGrouping`: `"project"`
      - `StatusId`: `0`
      - `StatusLabel`: project status string (e.g., `p.Status`)
      - `StatusColor`: `"#0078D7"` (brand blue, visually distinguishes project bars)
      - `StatusIsFinal`: `0`
      - `Progress`: `0`
      - `IsOverdue`: `false`
      - `IsRecurring`: `false`
      - `Assignees`: empty list
      - `IsProjectEvent`: `true`
    - Filter out any projects where `TargetEndDate` is null/default before mapping
    - Return `Ok(projectEvents)`
    - _Bug_Condition: isBugCondition(input) — no GET /api/schedule/projects endpoint exists on unfixed code_
    - _Expected_Behavior: endpoint returns ScheduleTaskDto array, one entry per accessible project, with Id<0, Start=CreatedDate, End=TargetEndDate, PhaseLabel="Project", IsProjectEvent=true_
    - _Preservation: GetScheduleTasks action is untouched; role-based filtering logic is reused, not replaced_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Add `fetchScheduleProjects` function to `api.js`
    - Open `qTask-frontend/src/services/api.js`
    - Add a new exported function directly below `fetchScheduleTasks`:
      ```js
      export const fetchScheduleProjects = (projectId) => {
        const params = new URLSearchParams();
        if (projectId) params.append("projectId", projectId);
        const query = params.toString();
        return request("GET", `/schedule/projects${query ? `?${query}` : ""}`);
      };
      ```
    - Mirror the exact pattern of `fetchScheduleTasks` — same param handling, same `request()` wrapper
    - _Bug_Condition: isBugCondition(input) — no fetchScheduleProjects call exists in unfixed frontend_
    - _Expected_Behavior: fetchScheduleProjects(projectId) calls GET /api/schedule/projects with optional projectId query param and returns the ScheduleTaskDto array_
    - _Preservation: fetchScheduleTasks is untouched; the new function is purely additive_
    - _Requirements: 2.1, 2.3_

  - [x] 3.4 Update `SchedulePage.jsx` — import and parallel fetch
    - Open `qTask-frontend/src/components/pages/SchedulePage.jsx`
    - Add `fetchScheduleProjects` to the existing import line from `../../services/api`
    - In the `loadEvents` async function inside `useEffect`, replace the single `fetchScheduleTasks` call with `Promise.all`:
      ```js
      const [taskData, projectData] = await Promise.all([
        fetchScheduleTasks(selectedProjectId),
        fetchScheduleProjects(selectedProjectId),
      ]);
      if (!cancelled) setEvents([...projectData, ...taskData]);
      ```
    - Project events are placed first so they visually anchor above task bars in each day cell
    - No other changes to `SchedulePage` — `sortedEvents`, `navigateDate`, `rangeLabel`, the project dropdown, or any view component
    - _Bug_Condition: isBugCondition(input) — loadEvents only calls fetchScheduleTasks on unfixed code; events state never contains project entries_
    - _Expected_Behavior: events state is populated with [...projectData, ...taskData]; sortedEvents then sorts all events by end date for all views_
    - _Preservation: cancelled-flag cleanup, error handling, loading state, and all downstream rendering (EventBar, views) are completely unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.4_

  - [x] 3.5 Add flashing red end-date CSS animation and project name visibility logic for project events
    - In `SchedulePage.jsx`, add a `@keyframes pulse-red` CSS-in-JS style or a scoped `<style>` block:
      ```css
      @keyframes pulse-red {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.4; }
      }
      ```
    - In `MonthView`, when rendering a `day` cell that matches the `end` date of a project event (`event.isProjectEvent === true && isSameDay(day, toDate(event.end))`), apply inline style `animation: pulse-red 1s ease-in-out infinite` and a red border or red background tint (e.g., `border: 2px solid #dc2626`) to that day cell's wrapper div
    - In `WeekView` and `DayView`, apply the same animation class/style to the `EventBar` wrapper when `event.isProjectEvent === true && isSameDay(day, toDate(event.end))`
    - **Project name visibility logic**: When rendering project event bars in calendar cells, display the project title text ONLY when the current day matches the start date OR end date: `isSameDay(day, toDate(event.start)) || isSameDay(day, toDate(event.end))`. For intermediate days, render the event bar background/color without displaying the title text.
    - The animation and visibility logic must **not** apply to task events (`event.isProjectEvent !== true`) under any condition
    - _Bug_Condition: isBugCondition(input) — no flashing red indicator exists for project end dates on unfixed code; project names are not conditionally shown on start/end dates only_
    - _Expected_Behavior: the calendar cell or event bar segment on event.end for project events displays a flashing red animation; project title text appears only on start and end date cells; intermediate days show only the bar without text; task event bars and all other cells are visually unchanged_
    - _Preservation: EventBar component itself is not modified; animation and visibility logic are applied externally in view-level renderers only_
    - _Requirements: 2.5, 2.6, 3.3, 3.5_

  - [x] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Project Events Appear on Calendar
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior defined in the design
    - Run: `GET /api/schedule/projects` — assert **200 OK** with array of project events (id < 0, phaseLabel = "Project", isProjectEvent = true)
    - Run: frontend events-array assertion — assert at least one entry with `phaseLabel === "Project"` exists after `Promise.all` fetch
    - Run: property-based test — for all accessible projects with TargetEndDate set, each project produces one event entry spanning `[createdDate, targetEndDate]`
    - **EXPECTED OUTCOME**: All tests PASS — confirms the bug is resolved
    - Verify project title text appears ONLY on start and end date cells, not on intermediate days
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Task Events and Existing Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2 against the fixed code
    - Assert: task events returned by `GET /api/schedule/tasks` are identical before and after the fix (same shape, same overdue flags, same assignees)
    - Assert: project filter still scopes task events correctly — selecting a project ID filters tasks, project events are also filtered to that project only
    - Assert: no `id` collisions in the merged `[...projectData, ...taskData]` array (all project IDs are negative, all task IDs are positive)
    - Assert: overdue task events still render with `isOverdue = true` and correct styling cues in `EventBar`
    - Assert: all five calendar views render task events in identical positions as before the fix
    - **EXPECTED OUTCOME**: All tests PASS — no regressions introduced
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [-] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite (backend unit tests + frontend component/integration tests)
  - Confirm `GET /api/schedule/projects` returns correct role-scoped project events for Developer, QA, ProjectManager, and Admin roles
  - Confirm `GET /api/schedule/projects?projectId=N` returns only the event for project N
  - Confirm the frontend `SchedulePage` renders project event bars in Month, Week, Day, Year, and Agenda views
  - Confirm the flashing red animation appears only on the `TargetEndDate` cell/bar of project events
  - Confirm all task events, overdue indicators, assignee avatars, dropdown filtering, and view navigation remain fully intact
  - Ensure all tests pass; ask the user if questions arise.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3.1"] },
    { "wave": 3, "tasks": ["3.2"] },
    { "wave": 4, "tasks": ["3.3"] },
    { "wave": 5, "tasks": ["3.4", "3.5"] },
    { "wave": 6, "tasks": ["3.6", "3.7"] },
    { "wave": 7, "tasks": ["4"] }
  ]
}
```

## Notes

- Tasks 1 and 2 are **standalone** — they are written and run against unfixed code. Running them confirms the bug and captures baseline behavior. They are expected to fail (task 1) and pass (task 2) respectively.
- All sub-tasks under task 3 are additive changes. No existing endpoint, DTO field (beyond the new `IsProjectEvent`), or frontend function is deleted or renamed.
- The synthetic negative IDs (`p.Id * -1`) for project events prevent React `key` collisions. Verify that no real task ever carries a negative ID before deploying.
- The `isProjectEvent` discriminator field flows from the backend DTO through the JSON response to the frontend event object, where it gates the flashing red animation logic.
- The `TargetEndDate` null-filter in `GetScheduleProjects` ensures projects without an end date set do not produce an event with a null `End` value, which would break date comparisons in all five calendar views.
