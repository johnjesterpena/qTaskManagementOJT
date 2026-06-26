// backend/routes/tasks.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ─── Helper: build a full task object with joined data ───────
async function getTaskById(id) {
  const [rows] = await pool.query(
    `SELECT
       t.id, t.projectId, t.title, t.description, t.progress,
       t.targetDate, t.actualEndDate, t.createdAt, t.updatedAt,
       t.phaseId,      p.label   AS phaseLabel,
       p.isFinal       AS phaseIsFinal,
       p.isDefault     AS phaseIsDefault,
       p.grouping      AS phaseGrouping,
       t.statusId,     s.label   AS statusLabel,
       t.severityId,   sv.label  AS severityLabel,
       t.assigneeId,   u.name    AS assigneeName,   u.username AS assigneeUsername,
       t.qaAssigneeId, qa.name   AS qaAssigneeName, qa.username AS qaAssigneeUsername
     FROM tasks t
     LEFT JOIN phases     p  ON t.phaseId      = p.id
     LEFT JOIN statuses   s  ON t.statusId     = s.id
     LEFT JOIN severities sv ON t.severityId   = sv.id
     LEFT JOIN users      u  ON t.assigneeId   = u.id
     LEFT JOIN users      qa ON t.qaAssigneeId = qa.id
     WHERE t.id = ?`,
    [id],
  );
  if (rows.length === 0) return null;
  const task = rows[0];

  const [subtasks] = await pool.query(
    "SELECT id, title, isDone FROM subtasks WHERE taskId = ? ORDER BY id ASC",
    [id],
  );
  task.subtasks = subtasks;
  return task;
}

// router.get("/", async (req, res) => {
//   const { projectId, statusId, phaseId } = req.query;
//   let query = `
//     SELECT
//       t.*,
//       st.label  AS statusLabel,
//       st.color  AS statusColor,
//       s.label as severityLabel,
//       s.color as severityColor,
//       s.sortOrder as severitySortOrder,
//       st.label as statusLabel,
//       p.label as phaseLabel,
//       p.grouping as phaseGrouping,
//       assignee.name as assigneeName,
//       qaAssignee.name as qaAssigneeName
//     FROM tasks t
//     LEFT JOIN severities s ON t.severityId = s.id
//     LEFT JOIN statuses st ON t.statusId = st.id
//     LEFT JOIN phases p ON t.phaseId = p.id
//     LEFT JOIN users assignee ON t.assigneeId = assignee.id
//     LEFT JOIN users qaAssignee ON t.qaAssigneeId = qaAssignee.id
//     WHERE 1=1
//   `;

//   const params = [];
//   if (projectId) {
//     query += ` AND t.projectId = ?`;
//     params.push(projectId);
//   }
//   if (statusId) {
//     query += ` AND t.statusId = ?`;
//     params.push(statusId);
//   }
//   if (phaseId) {
//     query += ` AND t.phaseId = ?`;
//     params.push(phaseId);
//   }

//   try {
//     const [rows] = await pool.query(query, params);
//     res.json(rows);
//   } catch (err) {
//     console.error("GET /tasks error:", err);
//     res.status(500).json({ message: "Failed to fetch tasks" });
//   }
// });

router.get("/", async (req, res) => {
  const { projectId, statusId, phaseId } = req.query;

  let query = `
    SELECT 
      t.*,
      st.label  AS statusLabel,
      st.color  AS statusColor,
      s.label as severityLabel,
      s.color as severityColor,
      s.sortOrder as severitySortOrder,
      p.label as phaseLabel,
      p.grouping as phaseGrouping,
      assignee.name as assigneeName,
      qaAssignee.name as qaAssigneeName
    FROM tasks t
    LEFT JOIN severities s ON t.severityId = s.id
    LEFT JOIN statuses st ON t.statusId = st.id
    LEFT JOIN phases p ON t.phaseId = p.id
    LEFT JOIN users assignee ON t.assigneeId = assignee.id
    LEFT JOIN users qaAssignee ON t.qaAssigneeId = qaAssignee.id
    WHERE 1=1
  `;

  const params = [];

  if (projectId) {
    query += ` AND t.projectId = ?`;
    params.push(projectId);
  }

  if (statusId) {
    query += ` AND t.statusId = ?`;
    params.push(statusId);
  }

  if (phaseId) {
    query += ` AND t.phaseId = ?`;
    params.push(phaseId);
  }

  try {
    // ── 1. Fetch tasks ───────────────────────────────
    const [tasks] = await pool.query(query, params);

    if (tasks.length === 0) {
      return res.json([]);
    }

    // ── 2. Get all task IDs ─────────────────────────
    const taskIds = tasks.map((t) => t.id);

    // ── 3. Fetch all subtasks in ONE query ──────────
    const [subtasks] = await pool.query(
      `SELECT id, taskId, title, isDone 
       FROM subtasks 
       WHERE taskId IN (?) 
       ORDER BY id ASC`,
      [taskIds],
    );

    // ── 4. Group subtasks by taskId ────────────────
    const subtaskMap = {};

    for (const sub of subtasks) {
      if (!subtaskMap[sub.taskId]) {
        subtaskMap[sub.taskId] = [];
      }
      subtaskMap[sub.taskId].push({
        id: sub.id,
        title: sub.title,
        isDone: !!sub.isDone,
      });
    }

    // ── 5. Attach subtasks to each task ─────────────
    const result = tasks.map((task) => ({
      ...task,
      subtasks: subtaskMap[task.id] || [],
    }));

    // ── 6. Return final result ─────────────────────
    res.json(result);
  } catch (err) {
    console.error("GET /tasks error:", err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      t.*,
      s.label as severityLabel,
      s.color as severityColor,
      s.sortOrder as severitySortOrder,
      st.label as statusLabel,
      p.label as phaseLabel,
      p.grouping as phaseGrouping,
      assignee.name as assigneeName,
      qaAssignee.name as qaAssigneeName
    FROM tasks t
    LEFT JOIN severities s ON t.severityId = s.id
    LEFT JOIN statuses st ON t.statusId = st.id
    LEFT JOIN phases p ON t.phaseId = p.id
    LEFT JOIN users assignee ON t.assigneeId = assignee.id
    LEFT JOIN users qaAssignee ON t.qaAssigneeId = qaAssignee.id
    WHERE t.id = ?
  `;

  try {
    const [rows] = await pool.query(query, [id]);
    if (!rows.length)
      return res.status(404).json({ message: "Task not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /tasks/:id error:", err);
    res.status(500).json({ message: "Failed to fetch task" });
  }
});

// ─── POST /api/tasks ─────────────────────────────────────────
router.post("/", async (req, res) => {
  const {
    title,
    description,
    projectId,
    phaseId,
    statusId,
    severityId,
    assigneeId,
    qaAssigneeId,
    targetDate,
  } = req.body;
  const userId = req.headers["x-user-id"]
    ? Number(req.headers["x-user-id"])
    : null;

  if (!title?.trim())
    return res.status(400).json({ message: "Title is required" });
  if (!projectId)
    return res.status(400).json({ message: "projectId is required" });

  try {
    let resolvedPhaseId = phaseId;
    if (!resolvedPhaseId) {
      const [defaults] = await pool.query(
        "SELECT id FROM phases WHERE isDefault = 1 LIMIT 1",
      );
      if (defaults.length === 0)
        return res
          .status(500)
          .json({ message: "No default phase configured." });
      resolvedPhaseId = defaults[0].id;
    }

    const [result] = await pool.query(
      `INSERT INTO tasks
         (projectId, title, description, phaseId, statusId, severityId,
          assigneeId, qaAssigneeId, targetDate, progress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        projectId,
        title.trim(),
        description ?? null,
        resolvedPhaseId,
        statusId ?? null,
        severityId ?? null,
        assigneeId ?? null,
        qaAssigneeId ?? null,
        targetDate ?? null,
      ],
    );

    await pool.query(
      "INSERT INTO activity_logs (taskId, userId, action) VALUES (?, ?, ?)",
      [result.insertId, userId, "Task created"],
    );

    const task = await getTaskById(result.insertId);
    res.status(201).json(task);
  } catch (err) {
    console.error("POST /tasks error:", err);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// ─── PATCH /api/tasks/:id/phase ──────────────────────────────
router.patch("/:id/phase", async (req, res) => {
  const { id } = req.params;
  const { phaseId, actualEndDate } = req.body;
  const userId = req.headers["x-user-id"]
    ? Number(req.headers["x-user-id"])
    : null;

  if (!phaseId) return res.status(400).json({ message: "phaseId is required" });

  try {
    const [current] = await pool.query(
      `SELECT t.phaseId, p.label AS oldLabel
       FROM tasks t
       LEFT JOIN phases p ON t.phaseId = p.id
       WHERE t.id = ?`,
      [id],
    );
    if (current.length === 0)
      return res.status(404).json({ message: "Task not found" });

    const [newPhase] = await pool.query(
      "SELECT label, isFinal, grouping FROM phases WHERE id = ?",
      [phaseId],
    );
    if (newPhase.length === 0)
      return res.status(404).json({ message: "Phase not found" });

    const isFinal = newPhase[0].isFinal;
    const resolvedEnd = isFinal
      ? (actualEndDate ?? new Date().toISOString().split("T")[0])
      : null;

    await pool.query(
      `UPDATE tasks
       SET phaseId       = ?,
           actualEndDate = CASE WHEN ? = 1 THEN ? ELSE actualEndDate END,
           progress      = CASE WHEN ? = 1 THEN 100 ELSE progress END
       WHERE id = ?`,
      [phaseId, isFinal ? 1 : 0, resolvedEnd, isFinal ? 1 : 0, id],
    );

    // ── Log the phase change ──────────────────────────────
    const logAction =
      `Phase changed from "${current[0].oldLabel}" to "${newPhase[0].label}"` +
      (isFinal && resolvedEnd ? ` — Actual End Date: ${resolvedEnd}` : "");

    await pool.query(
      "INSERT INTO activity_logs (taskId, userId, action) VALUES (?, ?, ?)",
      [id, userId, logAction],
    );

    const task = await getTaskById(id);
    res.json(task);
  } catch (err) {
    console.error("PATCH /tasks/:id/phase error:", err);
    res.status(500).json({ message: "Failed to update task phase" });
  }
});

// ─── PATCH /api/tasks/:id/subtasks ───────────────────────────
router.patch("/:id/subtasks", async (req, res) => {
  const { id } = req.params;
  const { subtasks } = req.body;

  if (!Array.isArray(subtasks))
    return res.status(400).json({ message: "subtasks must be an array" });

  try {
    await pool.query("DELETE FROM subtasks WHERE taskId = ?", [id]);

    for (const s of subtasks) {
      await pool.query(
        "INSERT INTO subtasks (taskId, title, isDone) VALUES (?, ?, ?)",
        [id, s.title, s.isDone ? 1 : 0],
      );
    }

    const total = subtasks.length;
    const done = subtasks.filter((s) => s.isDone).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    await pool.query("UPDATE tasks SET progress = ? WHERE id = ?", [
      progress,
      id,
    ]);

    const task = await getTaskById(id);

    res.json(task);
  } catch (err) {
    console.error("PATCH /tasks/:id/subtasks error:", err);
    res.status(500).json({ message: "Failed to update subtasks" });
  }
});

// ─── PUT /api/tasks/:id ──────────────────────────────────────
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    statusId,
    severityId,
    assigneeId,
    qaAssigneeId,
    targetDate,
  } = req.body;
  const userId = req.headers["x-user-id"]
    ? Number(req.headers["x-user-id"])
    : null;

  try {
    // ── Fetch current task state for comparison ───────────
    const [current] = await pool.query(
      `SELECT
         t.assigneeId,   u.name  AS assigneeName,
         t.qaAssigneeId, qa.name AS qaAssigneeName,
         t.statusId,     s.label AS statusLabel,
         t.severityId,   sv.label AS severityLabel
       FROM tasks t
       LEFT JOIN users      u  ON t.assigneeId   = u.id
       LEFT JOIN users      qa ON t.qaAssigneeId = qa.id
       LEFT JOIN statuses   s  ON t.statusId     = s.id
       LEFT JOIN severities sv ON t.severityId   = sv.id
       WHERE t.id = ?`,
      [id],
    );

    if (current.length === 0)
      return res.status(404).json({ message: "Task not found" });

    const prev = current[0];

    await pool.query(
      `UPDATE tasks
       SET title        = ?, description  = ?, statusId     = ?,
           severityId   = ?, assigneeId   = ?, qaAssigneeId = ?,
           targetDate   = ?
       WHERE id = ?`,
      [
        title,
        description ?? null,
        statusId ?? null,
        severityId ?? null,
        assigneeId ?? null,
        qaAssigneeId ?? null,
        targetDate ?? null,
        id,
      ],
    );

    // ── Build specific log messages ────────────────────────
    const changes = [];

    if (Number(assigneeId) !== prev.assigneeId) {
      // Fetch new assignee name if assigned
      let newName = "Unassigned";
      if (assigneeId) {
        const [u] = await pool.query("SELECT name FROM users WHERE id = ?", [
          assigneeId,
        ]);
        if (u.length > 0) newName = u[0].name;
      }
      const oldName = prev.assigneeName ?? "Unassigned";
      changes.push(`Dev assignee changed from "${oldName}" to "${newName}"`);
    }

    if (Number(qaAssigneeId) !== prev.qaAssigneeId) {
      let newName = "Unassigned";
      if (qaAssigneeId) {
        const [u] = await pool.query("SELECT name FROM users WHERE id = ?", [
          qaAssigneeId,
        ]);
        if (u.length > 0) newName = u[0].name;
      }
      const oldName = prev.qaAssigneeName ?? "Unassigned";
      changes.push(`QA assignee changed from "${oldName}" to "${newName}"`);
    }

    if (Number(statusId) !== prev.statusId) {
      let newLabel = "None";
      if (statusId) {
        const [s] = await pool.query(
          "SELECT label FROM statuses WHERE id = ?",
          [statusId],
        );
        if (s.length > 0) newLabel = s[0].label;
      }
      const oldLabel = prev.statusLabel ?? "None";
      changes.push(`Status changed from "${oldLabel}" to "${newLabel}"`);
    }

    if (Number(severityId) !== prev.severityId) {
      let newLabel = "None";
      if (severityId) {
        const [sv] = await pool.query(
          "SELECT label FROM severities WHERE id = ?",
          [severityId],
        );
        if (sv.length > 0) newLabel = sv[0].label;
      }
      const oldLabel = prev.severityLabel ?? "None";
      changes.push(`Severity changed from "${oldLabel}" to "${newLabel}"`);
    }

    // Fall back to generic message if nothing specific changed
    const logAction =
      changes.length > 0 ? changes.join(" · ") : "Task details updated";

    await pool.query(
      "INSERT INTO activity_logs (taskId, userId, action) VALUES (?, ?, ?)",
      [id, userId, logAction],
    );

    const task = await getTaskById(id);
    res.json(task);
  } catch (err) {
    console.error("PUT /tasks/:id error:", err);
    res.status(500).json({ message: "Failed to update task" });
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("DELETE /tasks/:id error:", err);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;
