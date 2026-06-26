// backend/routes/subtaskComments.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ─── Shared SELECT used by both GET and POST ──────────────────
const SELECT_COMMENTS = `
  SELECT
    sc.id,
    sc.subtask_id,
    sc.user_id_comment,
    sc.comment,
    sc.comment_date,
    u.name     AS commenterName,
    u.username AS commenterUsername
  FROM subtask_comments sc
  LEFT JOIN users u ON sc.user_id_comment = u.id
`;

// ─── GET /api/subtask-comments/:subtaskId ────────────────────
router.get("/:subtaskId", async (req, res) => {
  const subtaskId = req.params.subtaskId;

  if (!subtaskId)
    return res.status(400).json({ message: "Invalid subtask ID" });

  try {
    const [rows] = await pool.query(
      SELECT_COMMENTS + " WHERE sc.subtask_id = ? ORDER BY sc.id ASC",
      [subtaskId],
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /subtask-comments/:subtaskId error:", err.message);
    res.status(500).json({
      message: "Failed to fetch subtask comments",
      detail: err.message,
    });
  }
});

// ─── POST /api/subtask-comments/:subtaskId ───────────────────
router.post("/:subtaskId", async (req, res) => {
  const subtaskId = req.params.subtaskId;
  const { comment } = req.body;
  const userId = req.headers["x-user-id"];

  if (!subtaskId)
    return res.status(400).json({ message: "Invalid subtask ID" });
  if (!comment?.trim())
    return res.status(400).json({ message: "Comment text is required" });
  if (!userId)
    return res
      .status(400)
      .json({ message: "User not identified — x-user-id header missing" });

  try {
    // Verify the subtask actually exists before inserting
    const [subtaskCheck] = await pool.query(
      "SELECT id FROM subtasks WHERE id = ?",
      [subtaskId],
    );
    if (subtaskCheck.length === 0)
      return res
        .status(404)
        .json({ message: `Subtask ${subtaskId} not found` });

    // Let comment_date use its DEFAULT current_timestamp() — don't pass it manually
    const [result] = await pool.query(
      `INSERT INTO subtask_comments (subtask_id, user_id_comment, comment)
       VALUES (?, ?, ?)`,
      [subtaskId, userId, comment.trim()],
    );

    // Return the newly created comment with commenter name joined
    const [rows] = await pool.query(SELECT_COMMENTS + " WHERE sc.id = ?", [
      result.insertId,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /subtask-comments/:subtaskId error:", err.message);
    res
      .status(500)
      .json({ message: "Failed to add comment", detail: err.message });
  }
});

// ─── DELETE /api/subtask-comments/:subtaskId ──────────────────
router.delete("/:subtaskId", async (req, res) => {
  const subtaskId = req.params.subtaskId;

  if (!subtaskId)
    return res.status(400).json({ message: "Invalid subtask ID" });

  try {
    const [rows] = await pool.query(
      "DELETE FROM subtask_comments WHERE id = ? ORDER BY id ASC",
      [subtaskId],
    );
    res.json(rows);
  } catch (err) {
    console.error("DELETE /subtask-comments/:subtaskId error:", err.message);
    res.status(500).json({
      message: "Failed to delete subtask comments",
      detail: err.message,
    });
  }
});

module.exports = router;
