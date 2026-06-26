-- Add this to your existing schema, or run standalone if tables already exist.
-- ============================================================
-- 9. TASK ATTACHMENTS  (SRS §6 — File Management Constraints)
-- Stores metadata about uploaded files. The file itself lives
-- on disk at /uploads/<taskId>/<filename>.
-- ============================================================

CREATE TABLE IF NOT EXISTS task_attachments (
  id           INT           NOT NULL AUTO_INCREMENT,
  taskId       INT           NOT NULL,
  originalName VARCHAR(255)  NOT NULL,
  storedName   VARCHAR(255)  NOT NULL,
  mimeType     VARCHAR(100)  NOT NULL,
  sizeBytes    INT           NOT NULL,
  uploadedAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_attachment_task
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);
