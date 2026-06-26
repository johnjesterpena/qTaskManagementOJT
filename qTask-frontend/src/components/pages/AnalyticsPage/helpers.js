export function isCancelled(task) {
  return task.statusLabel === "Cancelled" ||
    task.status === "cancelled" ||
    (task.statusLabel && task.statusLabel.toLowerCase() === "cancelled");
}

export function computeRiskLevel(tasks) {
  const activeTasks = tasks.filter(t => !isCancelled(t));
  if (!activeTasks.length) return "Low Risk";

  const total = activeTasks.length;
  const high = activeTasks.filter((t) => t.statusLabel === "Blocked" || t.statusLabel === "Failed").length;
  const med  = activeTasks.filter((t) => t.statusLabel === "Clarification Needed" || t.statusLabel === "Bug Fixing").length;

  if (high / total > 0.3) return "High Risk";
  if (med  / total > 0.3) return "Medium Risk";
  return "Low Risk";
}

export function computeScheduleHealth(tasks, phases) {
  const activeTasks = tasks.filter(t => !isCancelled(t));
  const finalPhase = phases.find((p) => p.isFinal);
  if (!finalPhase) return "On Track";

  const total = activeTasks.length || 1;
  const overdue = activeTasks.filter(
    (t) => t.targetDate && new Date(t.targetDate) < new Date() && t.phaseId !== finalPhase.id
  ).length;

  return overdue / total > 0.3 ? "At Risk" : "On Track";
}

export function computeQuality(tasks, phases) {
  const activeTasks = tasks.filter(t => !isCancelled(t));
  const finalPhase = phases.find((p) => p.isFinal);
  if (!activeTasks.length || !finalPhase) return 0;

  const passed = activeTasks.filter((t) => t.phaseId === finalPhase.id || t.statusLabel === "Passed").length;
  return Math.round((passed / activeTasks.length) * 100);
}

export function computeProgress(tasks) {
  const activeTasks = tasks.filter(t => !isCancelled(t));
  if (!activeTasks.length) return 0;
  return Math.round(activeTasks.reduce((acc, t) => acc + (t.progress ?? 0), 0) / activeTasks.length);
}

export function computeVelocity(tasks) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const activeTasks = tasks.filter(t => !isCancelled(t));
  return activeTasks.filter(
    (t) => t.phaseLabel?.includes("In Progress") && new Date(t.updatedAt) >= cutoff
  ).length;
}

export function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function fmtShort(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}