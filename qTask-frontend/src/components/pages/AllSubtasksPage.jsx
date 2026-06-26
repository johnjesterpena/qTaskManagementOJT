import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronUp, ChevronDown, ChevronsUpDown, X, Search } from "lucide-react";

// ── Severity colour map ───────────────────────────────────────
const SEVERITY_COLORS = {
  "1 - Critical": { bg: "#fef2f2", color: "#dc2626" },
  "2 - High":     { bg: "#fff7ed", color: "#ea580c" },
  "3 - Medium":   { bg: "#fefce8", color: "#ca8a04" },
  "4 - Low":      { bg: "#f0fdf4", color: "#16a34a" },
};

const COLUMNS = [
  { key: "title",         label: "Subtask Title",  sortable: true  },
  { key: "parentTask",    label: "Parent Task",    sortable: true  },
  { key: "statusLabel",   label: "Status",         sortable: false },
  { key: "assigneeName",  label: "Assignee",       sortable: false },
  { key: "isDone",        label: "Completed",      sortable: true  },
];

function compareValues(a, b, key, direction) {
  let valA = a[key], valB = b[key];
  if (valA == null && valB == null) return 0;
  if (valA == null) return 1;
  if (valB == null) return -1;
  if (key === "isDone") {
    valA = valA ? 1 : 0;
    valB = valB ? 1 : 0;
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

export default function AllSubtasksPage({ tasks, currentUser, onCardClick }) {
  const [sortConfig, setSortConfig] = useState({ key: "title", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ status: "", assignee: "", completed: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Extract all subtasks from tasks
  const allSubtasks = useMemo(() => {
    const subtasks = [];
    tasks.forEach((task) => {
      if (task.subtasks && Array.isArray(task.subtasks)) {
        task.subtasks.forEach((subtask) => {
          subtasks.push({
            ...subtask,
            parentTaskId: task.id,
            parentTask: task.title,
            taskId: task.id,
            statusLabel: task.statusLabel,
            // Use subtask's own assignee if available, otherwise inherit from parent task
            assigneeName: subtask.assigneeName || task.assigneeName || "Unassigned",
            assigneeId: subtask.assigneeId || task.assigneeId,
          });
        });
      }
    });
    return subtasks;
  }, [tasks]);

  const filterOptions = useMemo(() => ({
    statuses:  [...new Set(allSubtasks.map((s) => s.statusLabel).filter(Boolean))],
    assignees: [...new Set(allSubtasks.map((s) => s.assigneeName).filter(Boolean))],
  }), [allSubtasks]);

  // Calculate filtered results (before pagination)
  const filteredSubtasks = useMemo(() => {
    let result = allSubtasks;

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.parentTask.toLowerCase().includes(q) ||
        (s.assigneeName && s.assigneeName.toLowerCase().includes(q))
      );
    }

    // Apply filters
    if (filters.status)    result = result.filter((s) => s.statusLabel === filters.status);
    if (filters.assignee)  result = result.filter((s) => s.assigneeName === filters.assignee);
    if (filters.completed !== "") {
      const isCompleted = filters.completed === "true";
      result = result.filter((s) => s.isDone === isCompleted);
    }

    // Apply sorting
    return [...result].sort((a, b) => compareValues(a, b, sortConfig.key, sortConfig.direction));
  }, [allSubtasks, searchQuery, filters, sortConfig]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredSubtasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleSubtasks = filteredSubtasks.slice(startIndex, endIndex);

  const handleSort   = (col) => { if (!col.sortable) return; setSortConfig((p) => p.key === col.key ? { ...p, direction: p.direction === "asc" ? "desc" : "asc" } : { key: col.key, direction: "asc" }); };
  const handleFilter = (key, val) => { setFilters((p) => ({ ...p, [key]: val })); setCurrentPage(1); };
  const handleSearch = (val) => { setSearchQuery(val); setCurrentPage(1); };
  const clearFilters = () => {
    setFilters({ status: "", assignee: "", completed: "" });
    setSearchQuery("");
    setCurrentPage(1);
  };
  const hasActiveFilters = Object.values(filters).some((v) => v !== "") || searchQuery.trim() !== "";

  return (
    <div className="space-y-5 pb-10" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Page header ── */}
      <div>
        <p style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#4f6070", marginBottom: 4 }}>
          All Subtasks Overview
        </p>
        <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 900, color: "#20476E", lineHeight: 1.1 }}>
          All Subtasks
          <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "#4f6070", marginLeft: 12 }}>
            {filteredSubtasks.length} subtask{filteredSubtasks.length !== 1 ? "s" : ""}
          </span>
        </h1>
      </div>

      {/* ── Search and Filter bar ── */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DCDCDC", borderRadius: 12, padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        {/* Search box */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px", minWidth: 200 }}>
          <label style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4f6070" }}>Search</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={16} style={{ position: "absolute", left: 12, color: "#DCDCDC", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search subtasks, tasks, assignees..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                ...ctrlStyle,
                paddingLeft: 38,
                width: "100%",
                fontSize: "var(--fs-sm)",
              }}
            />
          </div>
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4f6070" }}>Status</label>
          <select style={ctrlStyle} value={filters.status} onChange={(e) => handleFilter("status", e.target.value)}>
            <option value="">All statuses</option>
            {filterOptions.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Assignee filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4f6070" }}>Assignee</label>
          <select style={ctrlStyle} value={filters.assignee} onChange={(e) => handleFilter("assignee", e.target.value)}>
            <option value="">All assignees</option>
            {filterOptions.assignees.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Completed filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4f6070" }}>Completed</label>
          <select style={ctrlStyle} value={filters.completed} onChange={(e) => handleFilter("completed", e.target.value)}>
            <option value="">All</option>
            <option value="true">Completed</option>
            <option value="false">Not Completed</option>
          </select>
        </div>

        {/* Clear filters button */}
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
        {visibleSubtasks.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
            <p style={{ fontSize: "var(--fs-sm)", color: "#4f6070" }}>
              {allSubtasks.length === 0 ? "No subtasks available" : "No subtasks match the current filters"}
            </p>
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
                {visibleSubtasks.map((subtask, i) => (
                  <tr
                    key={`${subtask.parentTaskId}-${subtask.id}`}
                    onClick={() => {
                      // Find the parent task and click on it
                      const parentTask = tasks.find((t) => t.id === subtask.parentTaskId);
                      if (parentTask) {
                        onCardClick(parentTask);
                      }
                    }}
                    style={{
                      background: i % 2 === 0 ? "#FFFFFF" : "#F0F8FF",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#daeeff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#FFFFFF" : "#F0F8FF")}
                  >
                    {/* Subtask Title */}
                    <td style={{ maxWidth: 250 }}>
                      <p style={{
                        fontWeight: 600,
                        color: subtask.isDone ? "#94a3b8" : "#20476E",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textDecoration: subtask.isDone ? "line-through" : "none",
                      }}>
                        {subtask.title}
                      </p>
                    </td>

                    {/* Parent Task */}
                    <td style={{ whiteSpace: "nowrap", maxWidth: 200 }}>
                      <p style={{
                        fontWeight: 500,
                        color: "#1C61A1",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {subtask.parentTask}
                      </p>
                    </td>

                    {/* Status */}
                    <td style={{ whiteSpace: "nowrap", color: "#4f6070" }}>
                      {subtask.statusLabel ?? "—"}
                    </td>

                    {/* Assignee */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {subtask.assigneeName && subtask.assigneeName !== "Unassigned" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #1C61A1, #0078D7)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "var(--fs-xs)",
                            fontWeight: 700,
                            color: "#fff",
                            flexShrink: 0,
                          }}>
                            {subtask.assigneeName.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ color: "#20476E", fontSize: "var(--fs-sm)" }}>
                            {subtask.assigneeName}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "#DCDCDC", fontStyle: "italic", fontSize: "var(--fs-sm)" }}>
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Completed Status */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{
                        fontSize: "var(--fs-xs)",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: subtask.isDone ? "#d1fae5" : "#fee2e2",
                        color: subtask.isDone ? "#059669" : "#dc2626",
                      }}>
                        {subtask.isDone ? "✓ Completed" : "○ Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination Controls ── */}
      {filteredSubtasks.length > 0 && (
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredSubtasks.length)} of {filteredSubtasks.length}
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
                // Show first page, last page, current page, and pages around current
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
