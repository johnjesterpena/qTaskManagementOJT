export const PHASE_ICONS = { dev: "⚙️", qa: "🧪" };

export const RISK = {
  "Low Risk":    { color: "#10b981", bg: "#ecfdf5" },
  "Medium Risk": { color: "#f59e0b", bg: "#fffbeb" },
  "High Risk":   { color: "#ef4444", bg: "#fef2f2" },
};

export const SCHEDULE = {
  "On Track": { color: "#10b981", bg: "#ecfdf5" },
  "At Risk":  { color: "#ef4444", bg: "#fef2f2" },
};

export const QUALITY = (q) =>
  q === 0   ? { color: "#ef4444", bg: "#fef2f2", label: "Poor" }
  : q < 50  ? { color: "#f59e0b", bg: "#fffbeb", label: "Fair" }
  :           { color: "#10b981", bg: "#ecfdf5", label: "Good" };

export const CHART_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

export function getSeverityColor(severity) {
  return severity?.color || CHART_COLORS[severity?.sortOrder - 1] || "#94a3b8";
}