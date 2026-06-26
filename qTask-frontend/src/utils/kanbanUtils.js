/** Generate a unique id string */
export const uid = () => String(Date.now() + Math.random());

/** Severity badge color config */
export const SEVERITY_COLORS = {
  Critical: { text: "#991b1b", bg: "#fee2e2" },
  High:     { text: "#92400e", bg: "#fef3c7" },
  Medium:   { text: "#1e40af", bg: "#dbeafe" },
  Low:      { text: "#374151", bg: "#f3f4f6" },
};

/**
 * Returns the Tailwind top-border accent class for a column.
 * Falls back gracefully for custom user-added columns.
 */
export const colAccentClass = (col) => {
  if (col.isFinal)              return "border-t-emerald-400";
  if (col.key === "inProgress") return "border-t-amber-400";
  if (col.key === "forReview")  return "border-t-purple-400";
  return "border-t-gray-300";
};

/**
 * Format a date string to "Apr 10" style using en-PH locale.
 */
export const formatShortDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Calculate progress from subtasks — SRS §3.4.
 * Supports both field names:
 *   isDone — returned by the Express API (MySQL column name)
 *   done   — used in legacy local-only state
 *
 * Returns null if there are no subtasks (caller should fall back to
 * task.progress instead).
 */
export const calcProgressFromSubtasks = (subtasks) => {
  if (!subtasks || subtasks.length === 0) return null;
  // Accept either isDone (DB) or done (local legacy)
  const doneCount = subtasks.filter((s) => s.isDone || s.done).length;
  return Math.round((doneCount / subtasks.length) * 100);
};
