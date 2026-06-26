const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ── Helper ────────────────────────────────────────────────────
async function getProjectById(id) {
  const [rows] = await pool.query(
    `SELECT
       p.id, p.title, p.description, p.clientName, p.targetEndDate, p.status, p.createdAt,
       p.pmId, u.name AS pmName, u.username AS pmUsername
     FROM projects p
     LEFT JOIN users u ON p.pmId = u.id
     WHERE p.id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

// ── GET /api/projects/my ─────────────────────────────────────
// Returns projects the requesting Dev/QA user is assigned to
// via the project_users table.
router.get("/my", async (req, res) => {
  const userId = req.headers["x-user-id"]
    ? Number(req.headers["x-user-id"])
    : null;

  if (!userId) return res.status(400).json({ message: "User not identified" });

  try {
    const [rows] = await pool.query(
      `SELECT
         p.id, p.title, p.description, p.clientName, p.targetEndDate, p.status, p.createdAt,
         p.pmId, u.name AS pmName,
         COUNT(DISTINCT t.id) AS taskCount,
         COALESCE(SUM(CASE WHEN s.isDone = 0 THEN 1 ELSE 0 END), 0) AS untickedSubtaskCount
       FROM projects p
       INNER JOIN project_users pu ON pu.project_id = p.id AND pu.user_id = ?
       LEFT JOIN users u ON p.pmId = u.id
       LEFT JOIN tasks t ON t.projectId = p.id
       LEFT JOIN subtasks s ON s.taskId = t.id
       GROUP BY p.id
       ORDER BY p.title ASC`,
      [userId],
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /projects/my error:", err);
    res.status(500).json({ message: "Failed to fetch assigned projects" });
  }
});

// ── GET /api/projects ─────────────────────────────────────────
router.get("/", async (req, res) => {
  const userId = req.headers["x-user-id"]
    ? Number(req.headers["x-user-id"])
    : null;
  const role = req.headers["x-user-role"] ?? null;

  try {
    const isPM = role === "ProjectManager";
    const isAdmin = role === "Admin";

    if (!isPM && !isAdmin)
      return res.status(403).json({ message: "Access denied" });

    const [rows] = await pool.query(
      `SELECT
         p.id, p.title, p.description, p.clientName, p.targetEndDate, p.status, p.createdAt,
         p.pmId, u.name AS pmName, u.username AS pmUsername,
         COUNT(DISTINCT t.id) AS taskCount,
         COALESCE(SUM(CASE WHEN s.isDone = 0 THEN 1 ELSE 0 END), 0) AS untickedSubtaskCount
       FROM projects p
       LEFT JOIN users u ON p.pmId = u.id
       LEFT JOIN tasks t ON t.projectId = p.id
       LEFT JOIN subtasks s ON s.taskId = t.id
       ${isPM ? "WHERE p.pmId = ?" : ""}
       GROUP BY p.id
       ORDER BY p.createdAt DESC`,
      isPM ? [userId] : [],
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// ── POST /api/projects ────────────────────────────────────────
// routes/projects.js

router.post("/", async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const {
      title,
      description,
      pmId,
      clientName,
      targetEndDate,
      status,
      developers = [],
      qas = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    await conn.beginTransaction();

    // 1️⃣ Insert project
    const [result] = await conn.query(
      `INSERT INTO projects 
        (title, description, pmId, clientName, targetEndDate, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, pmId, clientName, targetEndDate, status],
    );

    const projectId = result.insertId;

    // 2️⃣ Insert developers
    for (const userId of developers) {
      await conn.query(
        `INSERT INTO project_users (project_id, user_id, role)
         VALUES (?, ?, 'Developer')`,
        [projectId, userId],
      );
    }

    // 3️⃣ Insert QAs
    for (const userId of qas) {
      await conn.query(
        `INSERT INTO project_users (project_id, user_id, role)
         VALUES (?, ?, 'QA')`,
        [projectId, userId],
      );
    }

    await conn.commit();

    // res.status(201).json({ message: "Project created", projectId });
    const [[project]] = await pool.query(
      `SELECT 
     p.*,
     u.name AS pmName,
     (SELECT COUNT(*) FROM tasks t WHERE t.projectId = p.id) AS taskCount
   FROM projects p
   LEFT JOIN users u ON p.pmId = u.id
   WHERE p.id = ?`,
      [projectId],
    );

    res.status(201).json(project);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// ── POST /api/projects ────────────────────────────────────────
// router.post("/", async (req, res) => {
//   // Added status to destructuring
//   const { title, description, pmId, clientName, targetEndDate, status, developers = [], qas = [] } = req.body;

//   if (!title?.trim())
//     return res.status(400).json({ message: "Title is required" });

//   try {
//     // Added status to INSERT query and values array
//     const [result] = await pool.query(
//       "INSERT INTO projects (title, description, pmId, clientName, targetEndDate, status) VALUES (?, ?, ?, ?, ?, ?)",
//       [title.trim(), description ?? null, pmId ?? null, clientName ?? null, targetEndDate ?? null, status ?? 'ongoing']
//     );
//     const project = await getProjectById(result.insertId);
//     res.status(201).json(project);
//   } catch (err) {
//     if (err.code === "ER_DUP_ENTRY")
//       return res.status(409).json({ message: "Project title already exists" });
//     console.error("POST /projects error:", err);
//     res.status(500).json({ message: "Failed to create project" });
//   }
// });

// ── PUT /api/projects/:id ─────────────────────────────────────
router.put("/:id", async (req, res) => {
  const conn = await pool.getConnection();
  const { id } = req.params;
  // Added status to destructuring
  const {
    title,
    description,
    pmId,
    clientName,
    targetEndDate,
    status,
    devs = [],
    qas = [],
  } = req.body;

  if (!title?.trim())
    return res.status(400).json({ message: "Title is required" });

  try {
    // Added status to UPDATE query and values array
    await conn.beginTransaction();

    await pool.query(
      "UPDATE projects SET title = ?, description = ?, pmId = ?, clientName = ?, targetEndDate = ?, status = ? WHERE id = ?",
      [
        title.trim(),
        description ?? null,
        pmId ?? null,
        clientName ?? null,
        targetEndDate ?? null,
        status ?? "ongoing",
        id,
      ],
    );

    // Update developers
    await pool.query(
      "DELETE FROM project_users WHERE project_id = ? AND role = 'Developer'",
      [id],
    );
    for (const userId of devs) {
      await pool.query(
        `INSERT INTO project_users (project_id, user_id, role)
         VALUES (?, ?, 'Developer')`,
        [id, userId],
      );
    }

    // Update QAs
    await pool.query(
      "DELETE FROM project_users WHERE project_id = ? AND role = 'QA'",
      [id],
    );
    for (const userId of qas) {
      await pool.query(
        `INSERT INTO project_users (project_id, user_id, role)
         VALUES (?, ?, 'QA')`,
        [id, userId],
      );
    }

    await conn.commit();

    const project = await getProjectById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Project title already exists" });
    console.error("PUT /projects/:id error:", err);
    res.status(500).json({ message: "Failed to update project" });
  } finally {
    conn.release();
  }
});

// ── DELETE /api/projects/:id ──────────────────────────────────
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM projects WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("DELETE /projects/:id error:", err);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

module.exports = router;
