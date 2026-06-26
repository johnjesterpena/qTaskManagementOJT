const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ── GET /api/severities ───────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM severities ORDER BY sortOrder ASC",
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /severities error:", err);
    res.status(500).json({ message: "Failed to fetch severities" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM severities WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Severity not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /severities/:id error:", err);
    res.status(500).json({ message: "Failed to fetch severity" });
  }
});

// ── POST /api/severities ──────────────────────────────────────
router.post("/", async (req, res) => {
  const { label, color, sortOrder = 0 } = req.body;
  if (!label || !label.trim())
    return res.status(400).json({ message: "Label is required" });

  try {
    const [result] = await pool.query(
      "INSERT INTO severities (label, color, sortOrder) VALUES (?, ?, ?)",
      [label.trim(), color ?? null, sortOrder],
    );
    const [rows] = await pool.query(
      "SELECT * FROM severities WHERE id = ?",
      [result.insertId],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "A severity with that label already exists" });
    console.error("POST /severities error:", err);
    res.status(500).json({ message: "Failed to create severity" });
  }
});

// ── PUT /api/severities/:id ───────────────────────────────────
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { label, color, sortOrder } = req.body;
  if (!label || !label.trim())
    return res.status(400).json({ message: "Label is required" });

  try {
    await pool.query(
      "UPDATE severities SET label = ?, color = ?, sortOrder = ? WHERE id = ?",
      [label.trim(), color ?? null, sortOrder ?? 0, id],
    );
    const [rows] = await pool.query(
      "SELECT * FROM severities WHERE id = ?",
      [id],
    );
    if (!rows.length) return res.status(404).json({ message: "Severity not found" });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "A severity with that label already exists" });
    console.error("PUT /severities/:id error:", err);
    res.status(500).json({ message: "Failed to update severity" });
  }
});

// ── DELETE /api/severities/:id ────────────────────────────────
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Check if any task is using this severity
    const [tasks] = await pool.query(
      "SELECT id FROM tasks WHERE severityId = ? LIMIT 1",
      [id],
    );
    if (tasks.length)
      return res.status(409).json({
        message: "Cannot delete: this severity is used by one or more tasks.",
      });

    const [result] = await pool.query(
      "DELETE FROM severities WHERE id = ?",
      [id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Severity not found" });

    res.json({ message: "Severity deleted" });
  } catch (err) {
    console.error("DELETE /severities/:id error:", err);
    res.status(500).json({ message: "Failed to delete severity" });
  }
});

module.exports = router;
