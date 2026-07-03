import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sortable from "sortablejs";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CornerDownRight,
  Plus,
  Trash2,
  UserCircle2,
} from "lucide-react";
import {
  fetchEisenhowerTasks,
  moveEisenhowerTask,
  quickAddEisenhowerTask,
} from "../../services/api";

const T = {
  brand: "#0078D7",
  brandDark: "#1C61A1",
  brandDeep: "#20476E",
  border: "#DCDCDC",
  muted: "#4f6070",
  red: "#dc2626",
};

const QUADRANTS = [
  {
    id: "q1",
    title: "Urgent & Important",
    icon: AlertTriangle,
    accent: "#fa0303ff",
    bg: "#fef2f2",
  },
  {
    id: "q2",
    title: "Not Urgent & Important",
    icon: CalendarClock,
    accent: "#2563eb",
    bg: "#eff6ff",
  },
  {
    id: "q3",
    title: "Urgent & Not Important",
    icon: CornerDownRight,
    accent: "#d97706",
    bg: "#fffbeb",
  },
  {
    id: "q4",
    title: "Not Urgent & Not Important",
    icon: Trash2,
    accent: "#64748b",
    bg: "#f8fafc",
  },
];

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name) {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function taskAssignee(task) {
  if (task.assigneeName) {
    return { name: task.assigneeName, role: "Dev" };
  }
  if (task.qaAssigneeName) {
    return { name: task.qaAssigneeName, role: "QA" };
  }
  return null;
}

function MatrixCard({ task, showProjectPrefix }) {
  const assignee = taskAssignee(task);
  const overdue = task.isOverdue;

  return (
    <article
      data-id={task.id}
      style={{
        background: "#fff",
        border: `1px solid ${overdue ? "#fecaca" : T.border}`,
        borderLeft: `4px solid ${overdue ? T.red : task.severityColor || T.brand}`,
        borderRadius: 8,
        padding: 10,
        cursor: "grab",
        boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              color: T.brandDeep,
              fontWeight: 900,
              fontSize: "var(--fs-sm)",
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {showProjectPrefix && (
              <span style={{ color: T.brandDark }}>[{task.projectName}] </span>
            )}
            {task.title}
          </h3>
          {task.description && (
            <p
              style={{
                color: T.muted,
                fontSize: "var(--fs-xs)",
                marginTop: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {task.description}
            </p>
          )}
        </div>
        {assignee && (
          <div
            title={`${assignee.name} (${assignee.role})`}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: assignee.role === "QA" ? "#7c3aed" : T.brand,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 10,
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            {initials(assignee.name)}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: task.severityColor || T.brandDeep, background: `${task.severityColor || T.brand}15`, borderRadius: 999, padding: "3px 7px" }}>
          {task.severityLabel}
        </span>
        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: task.isUrgent ? T.red : T.muted, background: task.isUrgent ? "#fee2e2" : "#f1f5f9", borderRadius: 999, padding: "3px 7px" }}>
          {formatDate(task.targetDate)}
        </span>
        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: T.muted, background: "#f1f5f9", borderRadius: 999, padding: "3px 7px" }}>
          {task.progress}%
        </span>
      </div>
    </article>
  );
}

function QuickAdd({ quadrantId, disabled, onAdd }) {
  const [value, setValue] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const title = value.trim();
    if (!title) return;
    await onAdd(quadrantId, title);
    setValue("");
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 6 }}>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        placeholder={disabled ? "Select a project to add" : "Quick add task"}
        style={{
          flex: 1,
          minWidth: 0,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: "7px 9px",
          fontSize: "var(--fs-xs)",
          color: T.brandDeep,
          background: disabled ? "#f8fafc" : "#fff",
        }}
      />
      <button
        type="submit"
        disabled={disabled}
        aria-label="Add task"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: `1px solid ${T.border}`,
          background: disabled ? "#f8fafc" : T.brand,
          color: disabled ? "#94a3b8" : "#fff",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Plus size={15} />
      </button>
    </form>
  );
}

export default function EisenhowerMatrixPage({ projects, users, currentUser }) {
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const listRefs = useRef({});
  const sortableRefs = useRef({});

  const selectedProjectId = projectId ? Number(projectId) : null;
  const selectedAssigneeId = assigneeId ? Number(assigneeId) : null;
  const canQuickAdd = currentUser.role === "ProjectManager" || currentUser.role === "Admin";
  const showProjectPrefix = selectedProjectId === null;

  const availableUsers = useMemo(() => {
    const allowedRoles = new Set(["Developer", "QA"]);
    return users
      .filter((user) => allowedRoles.has(user.role))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const groupedTasks = useMemo(() => {
    const base = Object.fromEntries(QUADRANTS.map((quadrant) => [quadrant.id, []]));
    for (const task of tasks) {
      const key = base[task.quadrant] ? task.quadrant : "q4";
      base[key].push(task);
    }
    return base;
  }, [tasks]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEisenhowerTasks(selectedProjectId, selectedAssigneeId);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedAssigneeId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    QUADRANTS.forEach((quadrant) => {
      const element = listRefs.current[quadrant.id];
      if (!element || sortableRefs.current[quadrant.id]) return;

      sortableRefs.current[quadrant.id] = Sortable.create(element, {
        group: "eisenhower",
        animation: 150,
        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen",
        onEnd: async (event) => {
          const taskId = Number(event.item.dataset.id);
          const targetQuadrant = event.to.dataset.quadrant;
          if (!taskId || !targetQuadrant) return;

          try {
            setBusyTaskId(taskId);
            await moveEisenhowerTask(taskId, targetQuadrant);
            await loadTasks();
          } catch (err) {
            alert(`Move failed: ${err.message}`);
            await loadTasks();
          } finally {
            setBusyTaskId(null);
          }
        },
      });
    });

    return () => {
      Object.values(sortableRefs.current).forEach((sortable) => sortable.destroy());
      sortableRefs.current = {};
    };
  }, [loadTasks]);

  const handleQuickAdd = async (quadrant, title) => {
    const projectForNewTask = selectedProjectId ?? (projects.length === 1 ? projects[0].id : null);
    if (!projectForNewTask) {
      alert("Select a specific project before quick-adding a task.");
      return;
    }

    const selectedUser = users.find((user) => user.id === selectedAssigneeId);

    try {
      await quickAddEisenhowerTask({
        title,
        projectId: projectForNewTask,
        quadrant,
        assigneeId: selectedUser?.role === "Developer" ? selectedUser.id : null,
        qaAssigneeId: selectedUser?.role === "QA" ? selectedUser.id : null,
      });
      await loadTasks();
    } catch (err) {
      alert(`Quick add failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 pb-10 h-full flex flex-col" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        .sortable-ghost { opacity: 0.35; }
        .sortable-chosen { box-shadow: 0 0 0 2px #0078D7, 0 10px 24px rgba(0, 120, 215, 0.16); }
      `}</style>

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <p style={{ fontSize: "var(--fs-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 4 }}>
            Urgent vs. important prioritization
          </p>
          <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 900, color: T.brandDeep, lineHeight: 1.1 }}>
            Eisenhower Matrix
          </h1>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)", fontWeight: 800, color: T.brandDeep }}>
            Select Project:
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", color: T.brandDeep, background: "#fff", minWidth: 190 }}
            >
              <option value="">ALL</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)", fontWeight: 800, color: T.brandDeep }}>
            Select Assignee:
            <select
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", color: T.brandDeep, background: "#fff", minWidth: 190 }}
            >
              <option value="">ALL</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div style={{ padding: 14, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, color: T.red }}>
          {error}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(280px, 1fr))",
          gap: 12,
          minHeight: 0,
          flex: 1,
        }}
      >
        {QUADRANTS.map((quadrant) => {
          const Icon = quadrant.icon;
          const quadrantTasks = groupedTasks[quadrant.id] ?? [];
          const quickAddDisabled = !canQuickAdd || (!selectedProjectId && projects.length !== 1);

          return (
            <div
              key={quadrant.id}
              style={{
                minHeight: 300,
                maxHeight: "calc((100vh - 250px) / 2)",
                background: "#fff",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <header
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 12px",
                  background: quadrant.bg,
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: `${quadrant.accent}18`,
                      color: quadrant.accent,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ color: T.brandDeep, fontSize: "var(--fs-base)", fontWeight: 900, lineHeight: 1.1 }}>
                      {quadrant.title}
                    </h2>
                    <p style={{ color: T.muted, fontSize: "var(--fs-xs)", fontWeight: 800, marginTop: 2 }}>
                      {quadrant.subtitle}
                    </p>
                  </div>
                </div>
                <span style={{ color: quadrant.accent, fontSize: "var(--fs-xs)", fontWeight: 900, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 999, padding: "3px 8px" }}>
                  {quadrantTasks.length}
                </span>
              </header>

              <div style={{ padding: 10, borderBottom: `1px solid ${T.border}` }}>
                <QuickAdd
                  quadrantId={quadrant.id}
                  disabled={quickAddDisabled}
                  onAdd={handleQuickAdd}
                />
              </div>

              <div
                ref={(element) => {
                  listRefs.current[quadrant.id] = element;
                }}
                data-quadrant={quadrant.id}
                style={{
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflowY: "auto",
                  minHeight: 0,
                  flex: 1,
                  background: "#fbfdff",
                }}
              >
                {loading ? (
                  <p style={{ color: T.muted, fontSize: "var(--fs-sm)", padding: 8 }}>Loading tasks...</p>
                ) : quadrantTasks.length === 0 ? (
                  <div style={{ color: "#94a3b8", fontSize: "var(--fs-sm)", padding: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center" }}>
                    <CheckCircle2 size={16} />
                    No tasks here
                  </div>
                ) : (
                  quadrantTasks.map((task) => (
                    <div key={task.id} style={{ opacity: busyTaskId === task.id ? 0.5 : 1 }}>
                      <MatrixCard task={task} showProjectPrefix={showProjectPrefix} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </section>

      <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.muted, fontSize: "var(--fs-xs)", fontWeight: 700 }}>
        <UserCircle2 size={14} />
        <span>Tasks are categorized automatically from Severity and Target Date. Dragging a card updates those fields.</span>
      </div>
    </div>
  );
}
