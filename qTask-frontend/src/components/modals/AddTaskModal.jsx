import { useState } from "react";

/**
 * AddTaskModal
 *
 * Props:
 *   onAdd       — fn(payload)
 *   onClose     — fn()
 *   users       — [{ id, name, role }]
 *   phases      — [{ id, label, isDefault, isFinal }]  ← Kanban columns
 *   severities  — [{ id, label }]
 */
export default function AddTaskModal({
  onAdd,
  onClose,
  users = [],
  phases = [],
  severities = [],
  activeProject,
  projectUsers = [],
}) {
  const defaultPhase = phases.find((p) => p.isDefault) ?? phases[0];

  // Filter projectUsers by role — fall back to all users if no project is selected
  const devUsers =
    projectUsers.length > 0
      ? projectUsers.filter((u) => u.role === "Developer")
      : users.filter((u) => u.role === "Developer");

  const qaUsers =
    projectUsers.length > 0
      ? projectUsers.filter((u) => u.role === "QA")
      : users.filter((u) => u.role === "QA");

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    qaAssigneeId: "",
    severityId: "",
    startDate: "",
    targetDate: "",
  });
  const [adding, setAdding] = useState(false);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim() || null,
    phaseId: defaultPhase?.id ?? undefined,
    statusId: 1,
    assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
    qaAssigneeId: form.qaAssigneeId ? Number(form.qaAssigneeId) : null,
    severityId: form.severityId ? Number(form.severityId) : null,
    startDate: form.startDate || null,
    targetDate: form.targetDate || null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || adding) return;
    setAdding(true);
    try {
      await onAdd(buildPayload());
    } finally {
      setAdding(false);
    }
  };

  // Enter on the title field = quick-add to the default phase
  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (form.title.trim()) handleSubmit(e);
    }
  };

  const canSubmit = form.title.trim().length > 0 && !adding;

  // load specific users tied to the project
  // useEffect(() => {
  //   const getProjectUsers = async () => {
  //     try {
  //       const data = await fetchProjectUsers(activeProject);
  //       setUsers(data);
  //     } catch (err) {
  //       alert("Error fetching users");
  //     }
  //   };

  //   getProjectUsers();
  // }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ border: "1px solid #DCDCDC" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ fontSize: "var(--fs-lg)", color: "#20476E" }}>Add task</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Title *
            </label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="Task title — press Enter for quick add"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ border: "1px solid #DCDCDC", fontSize: "var(--fs-sm)" }}
            />
            {form.title.trim().length > 0 && (
              <p className="text-xs text-blue-500">
                Press Enter to add instantly to{" "}
                <span className="font-medium">
                  {defaultPhase?.label ?? "default phase"}
                </span>
                , or fill in details below.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {/* Dev and QA Assignee */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Dev Assignee
              </label>
              <select
                value={form.assigneeId}
                onChange={(e) => set("assigneeId", e.target.value)}
                className="w-full rounded-lg px-2 py-2 bg-white"
                style={{ border: "1px solid #DCDCDC", fontSize: "var(--fs-sm)", color: "#20476E" }}
              >
                <option value="">Unassigned</option>
                {devUsers.map((u) => (
                  <option key={u.userId} value={u.userId ?? u.userId}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">QA Assignee</label>
              <select
                value={form.qaAssigneeId}
                onChange={(e) => set("qaAssigneeId", e.target.value)}
                className="w-full rounded-lg px-2 py-2 bg-white"
                style={{ border: "1px solid #DCDCDC", fontSize: "var(--fs-sm)", color: "#20476E" }}
              >
                <option value="">Unassigned</option>
                {qaUsers.map((u) => (
                  <option key={u.userId} value={u.userId ?? u.userId}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Severity
            </label>
            <select
              value={form.severityId}
              onChange={(e) => set("severityId", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">None</option>
              {severities.map((sv) => (
                <option key={sv.id} value={sv.id}>
                  {sv.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide ">
              Start date
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Target date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Target date
            </label>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => set("targetDate", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition"
              style={{ background: "linear-gradient(135deg, #1C61A1, #0078D7)", color: "#fff" }}
            >
              {adding ? "Adding…" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
