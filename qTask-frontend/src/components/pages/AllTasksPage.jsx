import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronUp, ChevronDown, ChevronsUpDown, X } from "lucide-react";

// ── Severity colour map ───────────────────────────────────────
const SEVERITY_COLORS = {
  "1 - Critical": { bg: "#fef2f2", color: "#dc2626" },
  "2 - High":     { bg: "#fff7ed", color: "#ea580c" },
  "3 - Medium":   { bg: "#fefce8", color: "#ca8a04" },
  "4 - Low":      { bg: "#f0fdf4", color: "#16a34a" },
};

const PHASE_COLORS = {
  dev: { bg: "#eff6ff", color: "#1C61A1" },
  qa:  { bg: "#f5f3ff", color: "#7c3aed" },
};

const SEVERITY_ORDER = [
  "1 - Critical", "2 - High", "3 - Medium",
  "4 - Low", "5 - Cosmetic Fix", "Nice to Have",
];

const COLUMNS = [
  { key: "title",         label: "Title",       sortable: true  },
  { key: "phaseLabel",    label: "Phase",       sortable: true  },
  { key: "statusLabel",   label: "Status",      sortable: false },
  { key: "severityLabel", label: "Severity",    sortable: true  },
  { key: "assigneeName",  label: "Assignee",    sortable: false },
  { key: "targetDate",    label: "Target Date", sortable: true  },
  { key: "progress",      label: "Progress",    sortable: true  },
];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function compareValues(a, b, key, direction) {
  let valA = a[key], valB = b[key];
  if (valA == null && valB == null) return 0;
  if (valA == null) return 1;
  if (valB == null) return -1;
  if (key === "severityLabel") {
    valA = SEVERITY_ORDER.indexOf(valA);
    valB = SEVERITY_ORDER.indexOf(valB);
  }
  if (key === "targetDate") {
    valA = new Date(valA).getTime();
    valB = new Date(valB).getTime();
  }
  if (valA < valB) return direction === "asc" ? -1 : 1;
  if (valA > valB) return direction === "asc" ?  1 : -1;
  return 0;
}

function SortIcon({ column, sortConfig }) {
  if (!column.sortable) return null;
  if (sortConfig.key !== column.key)
    return <ChevronsUpDown size={12} style={{ color: "#DCDCDC", marginLeft: 4, flexShrink: 0 }} />;
  return sortConfig.direction === "asc"
    ? <ChevronUp   size={12} style={{ color: "#0078D7", marginLeft: 4, flexShrink: 0 }} />
    : <ChevronDown size={12} style={{ color: "#0078D7", marginLeft: 4, flexShrink: 0 }} />;
}

function ProgressBar({ value }) {
  const pct = value ?? 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, background: "#F0F8FF", borderRadius: 999, height: 6, minWidth: 60, border: "1px solid #DCDCDC" }}>
        <div
          style={{
            height: "100%", borderRadius: 999,
            width: `${pct}%`,
            background: pct === 100
              ? "linear-gradient(90deg, #059669, #10b981)"
              : "linear-gradient(90deg, #1C61A1, #0078D7)",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "var(--fs-xs)", color: "#4f6070", width: 32, textAlign: "right", fontWeight: 600 }}>
        {pct}%
      </span>
    </div>
  );
}

// ── select / input shared style ───────────────────────────────
const ctrlStyle = {
  border: "1px solid #DCDCDC",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: "var(--fs-sm)",
  color: "#20476E",
  background: "#FFFFFF",
  cursor: "pointer",
};

export default function AllTasksPage({ tasks, allPhases, currentUser, onCardClick }) {
  const [sortConfig, setSortConfig] = useState({ key: "targetDate", direction: "asc" });
  const [filters, setFilters] = useState({ phase: "", severity: "", status: "", assignee: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const phaseGroupMap = useMemo(() =>
    allPhases.reduce((acc, p) => ({ ...acc, [p.id]: p.grouping }), {}),
  [allPhases]);

  const filterOptions = useMemo(() => ({
    phases:     [...new Set(tasks.map((t) => t.phaseLabel).filter(Boolean))],
    severities: [...new Set(tasks.map((t) => t.severityLabel).filter(Boolean))],
    statuses:   [...new Set(tasks.map((t) => t.statusLabel).filter(Boolean))],
    assignees:  [...new Set(tasks.map((t) => t.assigneeName).filter(Boolean))],
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (currentUser.role === "Developer")
      result = result.filter((t) => t.assigneeId === currentUser.id);
    else if (currentUser.role === "QA")
      result = result.filter((t) => phaseGroupMap[t.phaseId] === "qa");

    if (filters.phase)    result = result.filter((t) => t.phaseLabel    === filters.phase);
    if (filters.severity) result = result.filter((t) => t.severityLabel === filters.severity);
    if (filters.status)   result = result.filter((t) => t.statusLabel   === filters.status);
    if (filters.assignee) result = result.filter((t) => t.assigneeName  === filters.assignee);

    return [...result].sort((a, b) => compareValues(a, b, sortConfig.key, sortConfig.direction));
  }, [tasks, currentUser, phaseGroupMap, filters, sortConfig]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleTasks = filteredTasks.slice(startIndex, endIndex);

  const handleSort   = (col) => { if (!col.sortable) return; setSortConfig((p) => p.key === col.key ? { ...p, direction: p.direction === "asc" ? "desc" : "asc" } : { key: col.key, direction: "asc" }); };
  const handleFilter = (key, val) => { setFilters((p) => ({ ...p, [key]: val })); setCurrentPage(1); };
  const clearFilters = () => { setFilters({ phase: "", severity: "", status: "", assignee: "" }); setCurrentPage(1); };
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const showAssignee = currentUser.role === "ProjectManager" || currentUser.role === "Admin";

  const subtitle = {
    Developer:      "Tasks assigned to you",
    QA:             "Tasks in QA pipeline",
    ProjectManager: "All project tasks",
    Admin:          "All project tasks",
  }[currentUser.role] ?? "All tasks";

  return (
    <div className="space-y-5 pb-10" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Page header ── */}
      <div>
        <p style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#4f6070", marginBottom: 4 }}>
          {subtitle}
        </p>
        <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 900, color: "#20476E", lineHeight: 1.1 }}>
          All Tasks
          <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "#4f6070", marginLeft: 12 }}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </span>
        </h1>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DCDCDC", borderRadius: 12, padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4f6070" }}>Phase</label>
          <select style={ctrlStyle} value={filters.phase} onChange={(e) => handleFilter("phase", e.target.value)}>
            <option value="">All phases</option>
            {filterOptions.phases.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4f6070" }}>Severity</label>
          <select style={ctrlStyle} value={filters.severity} onChange={(e) => handleFilter("severity", e.target.value)}>
            <option value="">All severities</option>
            {filterOptions.severities.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4f6070" }}>Status</label>
          <select style={ctrlStyle} value={filters.status} onChange={(e) => handleFilter("status", e.target.value)}>
            <option value="">All statuses</option>
            {filterOptions.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {showAssignee && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4f6070" }}>Assignee</label>
            <select style={ctrlStyle} value={filters.assignee} onChange={(e) => handleFilter("assignee", e.target.value)}>
              <option value="">All assignees</option>
              {filterOptions.assignees.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 12px", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer" }}
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DCDCDC", borderRadius: 12, overflow: "hidden" }}>
        {visibleTasks.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
            <p style={{ fontSize: "var(--fs-sm)", color: "#4f6070" }}>No tasks match the current filters</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="qt-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col)}
                      style={{
                        textAlign: "left",
                        cursor: col.sortable ? "pointer" : "default",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                        color: sortConfig.key === col.key ? "#7ec8f5" : "#a8ccf0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {col.label}
                        <SortIcon column={col} sortConfig={sortConfig} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map((task, i) => (
                  <tr
                    key={task.id}
                    onClick={() => onCardClick(task)}
                    style={{
                      background: i % 2 === 0 ? "#FFFFFF" : "#F0F8FF",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#daeeff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#FFFFFF" : "#F0F8FF")}
                  >
                    {/* Title */}
                    <td style={{ maxWidth: 220 }}>
                      <p style={{ fontWeight: 600, color: "#20476E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                      {task.description && (
                        <p style={{ fontSize: "var(--fs-xs)", color: "#4f6070", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{task.description}</p>
                      )}
                    </td>

                    {/* Phase */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {task.phaseLabel ? (
                        <span style={{
                          fontSize: "var(--fs-xs)", fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                          background: PHASE_COLORS[phaseGroupMap[task.phaseId]]?.bg ?? "#f1f5f9",
                          color: PHASE_COLORS[phaseGroupMap[task.phaseId]]?.color ?? "#4f6070",
                        }}>
                          {task.phaseLabel}
                        </span>
                      ) : "—"}
                    </td>

                    {/* Status */}
                    <td style={{ whiteSpace: "nowrap", color: "#4f6070" }}>
                      {task.statusLabel ?? "—"}
                    </td>

                    {/* Severity */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {task.severityLabel ? (
                        <span style={{
                          fontSize: "var(--fs-xs)", fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                          background: SEVERITY_COLORS[task.severityLabel]?.bg ?? "#f1f5f9",
                          color: SEVERITY_COLORS[task.severityLabel]?.color ?? "#4f6070",
                          border: `1px solid ${SEVERITY_COLORS[task.severityLabel]?.color ?? "#DCDCDC"}30`,
                        }}>
                          {task.severityLabel}
                        </span>
                      ) : "—"}
                    </td>

                    {/* Assignee */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {task.assigneeName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #1C61A1, #0078D7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-xs)", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {task.assigneeName.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ color: "#20476E" }}>{task.assigneeName}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#DCDCDC", fontStyle: "italic" }}>Unassigned</span>
                      )}
                    </td>

                    {/* Target Date */}
                    <td style={{ whiteSpace: "nowrap", color: "#4f6070" }}>
                      {formatDate(task.targetDate)}
                    </td>

                    {/* Progress */}
                    <td style={{ minWidth: 130 }}>
                      <ProgressBar value={task.progress} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination Controls ── */}
      {filteredTasks.length > 0 && (
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #DCDCDC",
          borderRadius: 12,
          padding: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}>
          {/* Items per page selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "#4f6070" }}>
              Items per page:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={ctrlStyle}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Pagination info */}
          <div style={{ fontSize: "var(--fs-sm)", color: "#4f6070", fontWeight: 600 }}>
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length}
          </div>

          {/* Pagination buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #DCDCDC",
                background: currentPage === 1 ? "#f1f5f9" : "#FFFFFF",
                color: currentPage === 1 ? "#94a3b8" : "#20476E",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              ← Previous
            </button>

            {/* Page numbers */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isVisible =
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                if (!isVisible && (pageNum !== 2 && pageNum !== totalPages - 1))
                  return null;

                if (pageNum === 2 && currentPage > 3 && totalPages > 5)
                  return (
                    <span key="dots-start" style={{ color: "#DCDCDC", padding: "0 4px" }}>
                      …
                    </span>
                  );

                if (pageNum === totalPages - 1 && currentPage < totalPages - 2 && totalPages > 5)
                  return (
                    <span key="dots-end" style={{ color: "#DCDCDC", padding: "0 4px" }}>
                      …
                    </span>
                  );

                if (!isVisible) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: "6px 10px",
                      minWidth: 32,
                      borderRadius: 6,
                      border: pageNum === currentPage ? "1px solid #0078D7" : "1px solid #DCDCDC",
                      background: pageNum === currentPage ? "#0078D7" : "#FFFFFF",
                      color: pageNum === currentPage ? "#FFFFFF" : "#20476E",
                      cursor: "pointer",
                      fontSize: "var(--fs-sm)",
                      fontWeight: pageNum === currentPage ? 700 : 500,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #DCDCDC",
                background: currentPage === totalPages ? "#f1f5f9" : "#FFFFFF",
                color: currentPage === totalPages ? "#94a3b8" : "#20476E",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
