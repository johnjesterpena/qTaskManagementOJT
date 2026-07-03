import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Download,
  FilterX,
  Search,
} from "lucide-react";
import { fetchMasterMonitoringTasks } from "../../services/api";

const T = {
  brand: "#0078D7",
  brandDark: "#1C61A1",
  brandDeep: "#20476E",
  border: "#DCDCDC",
  muted: "#4f6070",
  red: "#dc2626",
};

const COLUMNS = [
  { key: "projectName", label: "Project" },
  { key: "title", label: "Task Title" },
  { key: "phaseLabel", label: "Phase" },
  { key: "severitySortOrder", label: "Severity" },
  { key: "statusLabel", label: "Status" },
  { key: "assigneeName", label: "Assignee" },
  { key: "targetDate", label: "Target Date" },
  { key: "progress", label: "Progress" },
];

function formatDate(value) {
  if (!value) return "-";
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

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function assigneeLabel(task) {
  if (task.assigneeName) return task.assigneeName;
  if (task.qaAssigneeName) return task.qaAssigneeName;
  return "Unassigned";
}

function ProgressCell({ task }) {
  const ratio = task.subtaskTotal > 0
    ? `${task.subtaskDone}/${task.subtaskTotal}`
    : `${task.progress}%`;

  return (
    <div style={{ minWidth: 128 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
        <span style={{ color: T.brandDeep, fontWeight: 800 }}>{task.progress}%</span>
        <span style={{ color: T.muted, fontSize: "var(--fs-xs)", fontWeight: 700 }}>{ratio}</span>
      </div>
      <div style={{ height: 7, background: "#F0F8FF", borderRadius: 999, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <div
          style={{
            width: `${Math.max(0, Math.min(100, task.progress ?? 0))}%`,
            height: "100%",
            background: task.progress === 100 ? "#22c55e" : T.brand,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function SortIcon({ columnKey, sort }) {
  if (sort.key !== columnKey) return null;
  return sort.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
}

const selectStyle = {
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  padding: "7px 10px",
  color: T.brandDeep,
  background: "#fff",
  minWidth: 160,
  fontWeight: 700,
  fontSize: "var(--fs-sm)",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: T.muted,
  fontSize: "var(--fs-xs)",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

export default function MasterMonitoringPage({
  projects,
  users,
  statuses,
  phases,
  severities,
}) {
  const [filters, setFilters] = useState({
    projectId: "",
    assigneeId: "",
    statusId: "",
    phaseId: "",
    severityId: "",
    targetDateFrom: "",
    targetDateTo: "",
    pastDue: "",
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState({ key: "targetDate", direction: "asc" });
  const [search, setSearch] = useState("");

  const phaseOptions = useMemo(
    () => [...phases].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [phases],
  );

  const assigneeOptions = useMemo(
    () => users
      .filter((user) => user.role === "Developer" || user.role === "QA")
      .sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...filters,
        pastDue: filters.pastDue === "pastDue" ? true : "",
      };
      const data = await fetchMasterMonitoringTasks(payload);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const searched = needle
      ? tasks.filter((task) =>
          [
            task.projectName,
            task.title,
            task.phaseLabel,
            task.severityLabel,
            task.statusLabel,
            assigneeLabel(task),
          ].some((value) => String(value ?? "").toLowerCase().includes(needle)),
        )
      : tasks;

    return [...searched].sort((a, b) => {
      let left = a[sort.key];
      let right = b[sort.key];

      if (sort.key === "targetDate") {
        left = new Date(left).getTime();
        right = new Date(right).getTime();
      }

      if (sort.key === "assigneeName") {
        left = assigneeLabel(a);
        right = assigneeLabel(b);
      }

      if (left == null && right == null) return 0;
      if (left == null) return 1;
      if (right == null) return -1;
      if (left < right) return sort.direction === "asc" ? -1 : 1;
      if (left > right) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [tasks, search, sort]);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      projectId: "",
      assigneeId: "",
      statusId: "",
      phaseId: "",
      severityId: "",
      targetDateFrom: "",
      targetDateTo: "",
      pastDue: "",
    });
    setSearch("");
  };

  const handleSort = (key) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const exportCsv = () => {
    const headers = [
      "Project",
      "Task Title",
      "Phase",
      "Severity",
      "Status",
      "Assignee",
      "Target Date",
      "Progress",
      "Checklist",
      "Past Due",
    ];

    const rows = filteredTasks.map((task) => [
      task.projectName,
      task.title,
      task.phaseLabel,
      task.severityLabel,
      task.statusLabel,
      assigneeLabel(task),
      formatDate(task.targetDate),
      `${task.progress}%`,
      task.subtaskTotal > 0 ? `${task.subtaskDone}/${task.subtaskTotal}` : "",
      task.isOverdue ? "Yes" : "No",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qtask-master-monitoring-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasFilters = Object.values(filters).some(Boolean) || search.trim();

  return (
    <div className="space-y-5 pb-10" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <p style={{ fontSize: "var(--fs-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 4 }}>
            Advanced multi-filter reports
          </p>
          <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 900, color: T.brandDeep, lineHeight: 1.1 }}>
            Master Task Monitoring
            <span style={{ fontSize: "var(--fs-sm)", color: T.muted, marginLeft: 12, fontWeight: 700 }}>
              {filteredTasks.length} row{filteredTasks.length !== 1 ? "s" : ""}
            </span>
          </h1>
        </div>

        <button
          onClick={exportCsv}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${T.brand}`,
            borderRadius: 8,
            background: T.brand,
            color: "#fff",
            padding: "9px 13px",
            fontWeight: 900,
            fontSize: "var(--fs-sm)",
          }}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <section
        style={{
          background: "#fff",
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          alignItems: "end",
        }}
      >
        <label style={labelStyle}>
          Project
          <select style={selectStyle} value={filters.projectId} onChange={(event) => setFilter("projectId", event.target.value)}>
            <option value="">ALL</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          Assignee
          <select style={selectStyle} value={filters.assigneeId} onChange={(event) => setFilter("assigneeId", event.target.value)}>
            <option value="">ALL</option>
            {assigneeOptions.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          Status
          <select style={selectStyle} value={filters.statusId} onChange={(event) => setFilter("statusId", event.target.value)}>
            <option value="">ALL</option>
            {statuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          Phase
          <select style={selectStyle} value={filters.phaseId} onChange={(event) => setFilter("phaseId", event.target.value)}>
            <option value="">ALL</option>
            {phaseOptions.map((phase) => <option key={phase.id} value={phase.id}>{phase.label}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          Severity
          <select style={selectStyle} value={filters.severityId} onChange={(event) => setFilter("severityId", event.target.value)}>
            <option value="">ALL</option>
            {severities.map((severity) => <option key={severity.id} value={severity.id}>{severity.label}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          From
          <input
            type="date"
            value={filters.targetDateFrom}
            onChange={(event) => setFilter("targetDateFrom", event.target.value)}
            style={selectStyle}
          />
        </label>

        <label style={labelStyle}>
          To
          <input
            type="date"
            value={filters.targetDateTo}
            onChange={(event) => setFilter("targetDateTo", event.target.value)}
            style={selectStyle}
          />
        </label>

        <label style={labelStyle}>
          Target State
          <select style={selectStyle} value={filters.pastDue} onChange={(event) => setFilter("pastDue", event.target.value)}>
            <option value="">ALL</option>
            <option value="pastDue">Past Due</option>
          </select>
        </label>

        <label style={labelStyle}>
          Search
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: T.muted }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find text"
              style={{ ...selectStyle, paddingLeft: 30, width: "100%" }}
            />
          </div>
        </label>

        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              border: "1px solid #fecaca",
              borderRadius: 8,
              background: "#fee2e2",
              color: T.red,
              padding: "9px 12px",
              fontWeight: 900,
              fontSize: "var(--fs-sm)",
            }}
          >
            <FilterX size={15} />
            Clear
          </button>
        )}
      </section>

      {error && (
        <div style={{ padding: 14, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, color: T.red }}>
          {error}
        </div>
      )}

      <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="qt-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 1120 }}>
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    onClick={() => handleSort(column.key)}
                    style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {column.label}
                      <SortIcon columnKey={column.key} sort={sort} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 36, color: T.muted }}>
                    Loading monitoring report...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 36, color: T.muted }}>
                    No tasks match the selected filters
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td style={{ color: T.brandDeep, fontWeight: 500, whiteSpace: "nowrap" }}>{task.projectName}</td>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {task.isOverdue && <AlertTriangle size={14} style={{ color: T.red, flexShrink: 0 }} />}
                        <span style={{ color: T.brandDeep, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, padding: "3px 8px", borderRadius: 999, background: task.phaseGrouping === "qa" ? "#f5f3ff" : "#eff6ff", color: task.phaseGrouping === "qa" ? "#7c3aed" : T.brandDark }}>
                        {task.phaseLabel}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, padding: "3px 8px", borderRadius: 999, background: `${task.severityColor}18`, color: task.severityColor }}>
                        {task.severityLabel}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, padding: "3px 8px", borderRadius: 999, background: `${task.statusColor}18`, color: task.statusColor }}>
                        {task.statusLabel}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 26, height: 26, borderRadius: "50%", background: task.qaAssigneeName && !task.assigneeName ? "#7c3aed" : T.brand, color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 900 }}>
                          {initials(assigneeLabel(task)) || "-"}
                        </span>
                        <span style={{ color: T.brandDeep, fontWeight: 500, whiteSpace: "nowrap" }}>{assigneeLabel(task)}</span>
                      </div>
                    </td>
                    <td style={{ color: task.isOverdue ? T.red : T.muted, fontWeight: 500, whiteSpace: "nowrap" }}>
                      {formatDate(task.targetDate)}
                    </td>
                    <td>
                      <ProgressCell task={task} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
