// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");

// router.get("/", async (req, res) => {
//   const { taskId, userId, from, to } = req.query;

//   const conditions = [];
//   const params = [];

//   if (taskId) {
//     conditions.push("al.taskId = ?");
//     params.push(taskId);
//   }
//   if (userId) {
//     conditions.push("al.userId = ?");
//     params.push(userId);
//   }
//   if (from) {
//     conditions.push("al.createdAt >= ?");
//     params.push(from);
//   }
//   if (to) {
//     conditions.push("al.createdAt <= ?");
//     params.push(to + " 23:59:59");
//   }

//   const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

//   try {
//     const [rows] = await pool.query(
//       `SELECT
//          al.id,
//          al.action,
//          al.createdAt,
//          al.taskId,   t.title  AS taskTitle,
//          al.userId,   u.name   AS userName, u.role AS userRole
//        FROM activity_logs al
//        LEFT JOIN tasks t ON al.taskId = t.id
//        LEFT JOIN users u ON al.userId = u.id
//        ${where}
//        ORDER BY al.createdAt DESC`,
//       params,
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error("GET /activity-logs error:", err);
//     res.status(500).json({ message: "Failed to fetch activity logs" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  const { taskId, userId, from, to, page = 1, limit = 10 } = req.query;

  const conditions = [];
  const params = [];

  if (taskId) {
    conditions.push("al.taskId = ?");
    params.push(taskId);
  }
  if (userId) {
    conditions.push("al.userId = ?");
    params.push(userId);
  }
  if (from) {
    conditions.push("al.createdAt >= ?");
    params.push(from);
  }
  if (to) {
    conditions.push("al.createdAt <= ?");
    params.push(to + " 23:59:59");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  try {
    // 🔥 Main query (with LIMIT)
    const [rows] = await pool.query(
      `SELECT
         al.id,
         al.action,
         al.createdAt,
         al.taskId,   t.title  AS taskTitle,
         al.userId,   u.name   AS userName, u.role AS userRole
       FROM activity_logs al
       LEFT JOIN tasks t ON al.taskId = t.id
       LEFT JOIN users u ON al.userId = u.id
       ${where}
       ORDER BY al.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset],
    );

    // 🔥 Total count (for pagination UI)
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM activity_logs al
       ${where}`,
      params,
    );

    res.json({
      data: rows,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("GET /activity-logs error:", err);
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
});

module.exports = router;
