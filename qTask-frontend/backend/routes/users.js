const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("../config/db");

const SALT_ROUNDS = 10;

// ── GET /api/users ────────────────────────────────────────────
// Public — returns active users for assignee dropdown.
// Admin — pass ?all=true to get all users including inactive.
router.get("/", async (req, res) => {
  try {
    const showAll = req.query.all === "true";
    const [rows] = await pool.query(
      `SELECT id, name, username, role, isActive
       FROM users
       ${showAll ? "" : "WHERE isActive = 1"}
       ORDER BY name ASC`,
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ── GET /api/users/project/:id ────────────────────────────────────────────
// Return a specific line of users that is assigned to the project
router.get("/project/:id", async (req, res) => {
  const projectId = req.params.id;

  try {
    const [rows] = await pool.query(
      `SELECT pu.id, pu.project_id, pu.user_id, pu.role, u.name
       FROM project_users pu
       INNER JOIN users u ON pu.user_id = u.id
       WHERE project_id = ?
      `,
      [projectId],
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /users/project/id:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ── POST /api/users ───────────────────────────────────────────
// Admin only — create a new user.
router.post("/", async (req, res) => {
  const { name, username, password, role } = req.body;

  if (!name?.trim())
    return res.status(400).json({ message: "Name is required" });
  if (!username?.trim())
    return res.status(400).json({ message: "Username is required" });
  if (!password?.trim())
    return res.status(400).json({ message: "Password is required" });
  if (!role) return res.status(400).json({ message: "Role is required" });

  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      `INSERT INTO users (name, username, password, role, isActive)
       VALUES (?, ?, ?, ?, 1)`,
      [name.trim(), username.trim().toLowerCase(), hashed, role],
    );
    const [rows] = await pool.query(
      "SELECT id, name, username, role, isActive FROM users WHERE id = ?",
      [result.insertId],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Username already exists" });
    console.error("POST /users error:", err);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// ── PUT /api/users/:id ────────────────────────────────────────
// Admin only — update name, username, role.
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, username, role } = req.body;

  if (!name?.trim())
    return res.status(400).json({ message: "Name is required" });
  if (!username?.trim())
    return res.status(400).json({ message: "Username is required" });
  if (!role) return res.status(400).json({ message: "Role is required" });

  try {
    await pool.query(
      "UPDATE users SET name = ?, username = ?, role = ? WHERE id = ?",
      [name.trim(), username.trim().toLowerCase(), role, id],
    );
    const [rows] = await pool.query(
      "SELECT id, name, username, role, isActive FROM users WHERE id = ?",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Username already exists" });
    console.error("PUT /users/:id error:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// ── PATCH /api/users/:id/password ────────────────────────────
// Admin only — reset a user's password.
router.patch("/:id/password", async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword?.trim())
    return res.status(400).json({ message: "New password is required" });
  if (newPassword.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });

  try {
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const [result] = await pool.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashed, id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("PATCH /users/:id/password error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// ── PATCH /api/users/:id/status ──────────────────────────────
// Admin only — toggle isActive.
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (isActive === undefined)
    return res.status(400).json({ message: "isActive is required" });

  try {
    const [result] = await pool.query(
      "UPDATE users SET isActive = ? WHERE id = ?",
      [isActive ? 1 : 0, id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });
    const [rows] = await pool.query(
      "SELECT id, name, username, role, isActive FROM users WHERE id = ?",
      [id],
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("PATCH /users/:id/status error:", err);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

// ── DELETE /api/users/:id ─────────────────────────────────────
// Admin only — permanently delete a user.
// Blocked if user has assigned tasks.
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [tasks] = await pool.query(
      "SELECT COUNT(*) AS count FROM tasks WHERE assigneeId = ?",
      [id],
    );
    if (tasks[0].count > 0)
      return res.status(400).json({
        message:
          "Cannot delete: this user has assigned tasks. Reassign or remove their tasks first.",
      });

    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("DELETE /users/:id error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;
