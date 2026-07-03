# Bugfix Requirements Document

## Introduction

In the Schedule of Activities page (Calendar and Permissions module), when a project is selected and added to the calendar, the project itself does not appear as a visible entry on the calendar. Only task-level events are rendered; the project's own span — from its start date through and including its end date (TargetEndDate) — is never shown. This means users cannot see the project's overall timeline on the calendar at a glance.

The fix must ensure that a project added to the calendar is rendered as a calendar event spanning from the project's start date (inclusive) through the project's end date (inclusive), alongside the existing task entries.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a project is selected in the "Select Project" dropdown on the Schedule of Activities page THEN the system does not render any calendar entry for the project itself — only task-level events appear

1.2 WHEN a project has a defined start date and end date (TargetEndDate) and is added to the calendar THEN the system shows no event bar spanning from the project's start date to its end date

1.3 WHEN viewing "ALL" projects on the calendar THEN the system does not display any project-level event bars — only task events are shown

1.4 WHEN viewing the calendar in any view (Day, Week, Month, Year, Agenda) THEN the system fails to show the project entry on days that fall between the project's start date and end date (inclusive)

### Expected Behavior (Correct)

2.1 WHEN a project is added to the calendar THEN the system SHALL render a calendar event entry for the project spanning from its start date through and including its end date (TargetEndDate)

2.2 WHEN a project has a defined start date and end date and is added to the calendar THEN the system SHALL display an event bar for that project on every calendar day from the start date up to and including the end date

2.3 WHEN viewing "ALL" projects on the calendar THEN the system SHALL display project-level event bars for each project alongside task-level events

2.4 WHEN viewing the calendar in any view (Day, Week, Month, Year, Agenda) THEN the system SHALL include the project entry on all days that fall within the project's date range (start date to end date, inclusive)

2.5 WHEN a project event bar is rendered on the calendar THEN the system SHALL display the project name (title) ONLY on the start date and end date cells — intermediate days show only the event bar without the project name text

2.6 WHEN a project event bar is rendered on the calendar THEN the system SHALL display the end date cell with a flashing red visual indicator to signal the project deadline

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a project is added to the calendar THEN the system SHALL CONTINUE TO display all existing task-level events for that project alongside the new project event bar

3.2 WHEN a project is selected in the dropdown THEN the system SHALL CONTINUE TO filter the displayed task events to only those belonging to the selected project

3.3 WHEN a task's start date and end date are set THEN the system SHALL CONTINUE TO render task event bars spanning from the task's start date through its end date on the calendar

3.4 WHEN no project is selected (viewing "ALL") THEN the system SHALL CONTINUE TO display task events from all accessible projects alongside the project-level entries

3.5 WHEN a task is overdue THEN the system SHALL CONTINUE TO display the overdue indicator (red styling and alert icon) on the task's calendar event bar

3.6 WHEN navigating between calendar views (Day, Week, Month, Year, Agenda) THEN the system SHALL CONTINUE TO render all currently visible events correctly in the selected view
