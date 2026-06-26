const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET /api/statuses
// Returns all statuses ordered by sortOrder.
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM statuses ORDER BY sortOrder ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /statuses error:", err);
    res.status(500).json({ message: "Failed to fetch statuses" });
  }
});

// POST /api/statuses
// Creates a new status.
router.post("/", async (req, res) => {
  const { label, color = "#6b7280", sortOrder = 0, isDefault = 0, isFinal = 0 } = req.body;
  if (!label?.trim())
    return res.status(400).json({ message: "Label is required" });

  try {
    const [result] = await pool.query(
      "INSERT INTO statuses (label, color, sortOrder, isDefault, isFinal) VALUES (?, ?, ?, ?, ?)",
      [label.trim(), color, sortOrder, isDefault ? 1 : 0, isFinal ? 1 : 0]
    );
    const [rows] = await pool.query("SELECT * FROM statuses WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Status label already exists" });
    console.error("POST /statuses error:", err);
    res.status(500).json({ message: "Failed to create status" });
  }
});

// PUT /api/statuses/:id
// Update a status.
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { label, color = "#6b7280", sortOrder, isDefault, isFinal } = req.body;
  try {
    await pool.query(
      "UPDATE statuses SET label = ?, color = ?, sortOrder = ?, isDefault = ?, isFinal = ? WHERE id = ?",
      [label, color, sortOrder, isDefault ? 1 : 0, isFinal ? 1 : 0, id]
    );
    const [rows] = await pool.query("SELECT * FROM statuses WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("PUT /statuses/:id error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// DELETE /api/statuses/:id
// Blocked if any tasks are using this status.
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [tasks] = await pool.query(
      "SELECT COUNT(*) AS count FROM tasks WHERE statusId = ?",
      [id]
    );
    if (tasks[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete: This status is currently in use by active tasks.",
      });
    }
    await pool.query("DELETE FROM statuses WHERE id = ?", [id]);
    res.json({ message: "Status deleted" });
  } catch (err) {
    console.error("DELETE /statuses/:id error:", err);
    res.status(500).json({ message: "Failed to delete status" });
  }
});

module.exports = router;