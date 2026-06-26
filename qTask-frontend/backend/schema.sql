-- ============================================================
-- Q-Task Kanban Database Schema
-- Database: qtask_db
-- Run this file once to set up all tables and seed data.
-- ============================================================

CREATE DATABASE IF NOT EXISTS qtask_db;
USE qtask_db;

-- ------------------------------------------------------------
-- 1. STATUSES
-- Drives the Kanban columns. isFinal triggers the Done modal.
-- isDefault is where new tasks land automatically.
-- sortOrder controls the left-to-right column order.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS statuses (
  id          INT           NOT NULL AUTO_INCREMENT,
  label       VARCHAR(100)  NOT NULL,
  sortOrder   INT           NOT NULL DEFAULT 0,
  isDefault   TINYINT(1)    NOT NULL DEFAULT 0,
  isFinal     TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_status_label (label)
);

INSERT IGNORE INTO statuses (label, sortOrder, isDefault, isFinal) VALUES
  ('Not Started',         1, 1, 0),
  ('Active',              2, 0, 0),
  ('Blocked',             3, 0, 0),
  ('Bug Fixing',          4, 0, 0),
  ('Clarification Needed',5, 0, 0),
  ('For Verification',    6, 0, 0),
  ('Failed',              7, 0, 0),
  ('Passed',              8, 0, 1);

-- ------------------------------------------------------------
-- 2. PHASES
-- Categorical label set by the PM at task creation.
-- Represents what stage of the project lifecycle the task belongs to.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS phases (
  id    INT          NOT NULL AUTO_INCREMENT,
  label VARCHAR(100) NOT NULL,
  sortOrder INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_phase_label (label)
);

INSERT IGNORE INTO phases (label, sortOrder) VALUES
  ('Backlog (Requirements)', 1),
  ('To Do (Ready for Dev)',  2),
  ('In Progress',            3),
  ('For Review (Dev Done)',  4),
  ('Client Review - UAT',   5),
  ('QA Execution',           6),
  ('Deployed (Go-Live)',     7),
  ('Completed',              8);

-- ------------------------------------------------------------
-- 3. SEVERITIES
-- How critical the task is. Set by PM at creation.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS severities (
  id    INT          NOT NULL AUTO_INCREMENT,
  label VARCHAR(100) NOT NULL,
  sortOrder INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_severity_label (label)
);

INSERT IGNORE INTO severities (label, sortOrder) VALUES
  ('1 - Critical / Showstopper', 1),
  ('2 - High',                   2),
  ('3 - Medium',                 3),
  ('4 - Low',                    4),
  ('5 - Cosmetic Fix',           5),
  ('Nice to Have',               6);

-- ------------------------------------------------------------
-- 4. ASSESSMENTS
-- QA verdict after a task is reviewed. Set by QA role only.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
  id    INT          NOT NULL AUTO_INCREMENT,
  label VARCHAR(100) NOT NULL,
  sortOrder INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assessment_label (label)
);

INSERT IGNORE INTO assessments (label, sortOrder) VALUES
  ('Existing',                   1),
  ('Development / Customization',2),
  ('Enhancement',                3),
  ('Not Applicable',             4),
  ('Out of Scope',               5),
  ('Defect',                     6);

-- ------------------------------------------------------------
-- 5. USERS
-- Simulated list of team members assigned to the project.
-- In the full system this will tie into the accounts table.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         INT           NOT NULL AUTO_INCREMENT,
  name       VARCHAR(150)  NOT NULL,
  username   VARCHAR(100)  NOT NULL,
  role       ENUM('Admin', 'ProjectManager', 'Developer', 'QA') NOT NULL DEFAULT 'Developer',
  isActive   TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username)
);

INSERT IGNORE INTO users (name, username, role, isActive) VALUES
  ('Admin User',    'admin',   'Admin',          1),
  ('Carlo Reyes',   'carlo',   'Developer',      1),
  ('Ana Santos',    'ana',     'Developer',      1),
  ('Dana Cruz',     'dana',    'QA',             1),
  ('Ben Torres',    'ben',     'Developer',      1),
  ('Maria Lopez',   'maria',   'ProjectManager', 1);

-- ------------------------------------------------------------
-- 6. TASKS
-- Core task table. statusId is a FK to statuses.
-- phaseId, severityId, assigneeId are also FKs.
-- actualEndDate is set when the task is moved to a final column.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id             INT           NOT NULL AUTO_INCREMENT,
  title          VARCHAR(255)  NOT NULL,
  description    TEXT,
  statusId       INT           NOT NULL,
  phaseId        INT,
  severityId     INT,
  assigneeId     INT,
  targetDate     DATE,
  actualEndDate  DATE,
  progress       INT           NOT NULL DEFAULT 0,
  createdAt      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_task_status   FOREIGN KEY (statusId)   REFERENCES statuses(id),
  CONSTRAINT fk_task_phase    FOREIGN KEY (phaseId)    REFERENCES phases(id),
  CONSTRAINT fk_task_severity FOREIGN KEY (severityId) REFERENCES severities(id),
  CONSTRAINT fk_task_assignee FOREIGN KEY (assigneeId) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- 7. SUBTASKS
-- Each subtask belongs to one parent task.
-- Progress of the parent is calculated from subtask completion.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subtasks (
  id       INT          NOT NULL AUTO_INCREMENT,
  taskId   INT          NOT NULL,
  title    VARCHAR(255) NOT NULL,
  isDone   TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_subtask_task FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 8. ACTIVITY LOGS  (SRS §5.1 — Audit Trail)
-- Every status change on a task is recorded here automatically.
-- Records cannot be deleted.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id        INT          NOT NULL AUTO_INCREMENT,
  taskId    INT          NOT NULL,
  userId    INT,
  action    TEXT         NOT NULL,
  createdAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_log_task FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Seed tasks (optional demo data — comment out if not needed)
-- ------------------------------------------------------------
INSERT IGNORE INTO tasks (id, title, description, statusId, phaseId, severityId, assigneeId, targetDate, progress) VALUES
  (1, 'Design login page',  'Create Figma mockup and implement HTML/CSS.',  1, 3, 2, 3, '2025-04-10', 0),
  (2, 'Write API docs',     'Document all Express routes via Postman.',      1, 3, 4, 5, '2025-04-20', 0),
  (3, 'Build dashboard UI', 'Implement analytics dashboard with charts.',    2, 3, 2, 2, '2025-04-15', 55),
  (4, 'Auth endpoints',     'Express JWT auth with bcrypt hashing.',         6, 3, 1, 4, '2025-04-12', 90),
  (5, 'Project repo setup', 'Initialise GitHub repo and branch rules.',      8, 7, 3, 2, '2025-04-01', 100);
