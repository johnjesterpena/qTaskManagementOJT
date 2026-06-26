import { useState, useEffect } from "react";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { fetchProjectUsers } from "../../services/api";

export default function KanbanHeader({
  title,
  subtitle,
  isPM,
  activeProject,
  onBack,
  onAddTask,
  users = [],
  severities = [],
  statuses = [],
  filters = {},
  onFilterChange,
  onClearFilters,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [projectUsers, setProjectUsers] = useState([]);

  useEffect(() => {
    if (!activeProject?.id) {
      setProjectUsers([]);
      return;
    }
    fetchProjectUsers(activeProject.id)
      .then((data) =>
        setProjectUsers(data.map((pu) => ({ id: pu.userId, name: pu.name }))),
      )
      .catch(() => setProjectUsers([]));
  }, [activeProject?.id]);

  const hasActiveFilters =
    filters.userId || filters.severityId || filters.statusId;
  const filterCount = [
    filters.userId,
    filters.severityId,
    filters.statusId,
  ].filter(Boolean).length;

  const selectClass = {
    border: "1px solid #DCDCDC",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 500,
    color: "#20476E",
    background: "#FFFFFF",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div className="shrink-0 px-6 py-4 border-b space-y-3" style={{ borderColor: "#DCDCDC" }}>
      {/* ── Row 1: title + action buttons ── */}
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          {isPM && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
              style={{
                background: "#F0F8FF",
                color: "#1C61A1",
                border: "1px solid #DCDCDC",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#daeeff")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#F0F8FF")
              }
            >
              <ArrowLeft size={12} />
              Back
            </button>
          )}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: "#4f6070" }}
            >
              {subtitle}
            </p>
            <h1
              className="text-2xl font-black leading-none"
              style={{ color: "#20476E" }}
            >
              {title}
            </h1>
            {isPM && activeProject && (
              <p
                className="text-[11px] font-medium mt-1"
                style={{ color: "#4f6070" }}
              >
                {activeProject.clientName || ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPM && (
            <>
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
                style={{
                  background:
                    showFilters || hasActiveFilters ? "#e8f4ff" : "#F0F8FF",
                  color:
                    showFilters || hasActiveFilters ? "#1C61A1" : "#20476E",
                  border: `1px solid ${showFilters || hasActiveFilters ? "#a8d4f5" : "#DCDCDC"}`,
                }}
              >
                <SlidersHorizontal size={12} />
                Filters
                {hasActiveFilters && (
                  <span
                    className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: "#0078D7", color: "#fff" }}
                  >
                    {filterCount}
                  </span>
                )}
              </button>

              <button
                onClick={onAddTask}
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                style={{
                  background: "linear-gradient(135deg, #1C61A1, #0078D7)",
                  color: "#fff",
                }}
              >
                + Add task
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Row 2: filter bar (collapsible) ── */}
      {showFilters && (
        <div
          className="flex flex-wrap gap-3 items-end px-4 py-3 rounded-xl"
          style={{ background: "#F0F8FF", border: "1px solid #DCDCDC" }}
        >
          {/* Dev / User */}
          <div className="space-y-1">
            <label
              className="block text-xs font-black uppercase tracking-widest"
              style={{ color: "#4f6070" }}
            >
              Dev
            </label>
            <select
              value={filters.userId ?? ""}
              onChange={(e) =>
                onFilterChange(
                  "userId",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              style={selectClass}
            >
              <option value="">All users</option>
              {projectUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-1">
            <label
              className="block text-xs font-black uppercase tracking-widest"
              style={{ color: "#4f6070" }}
            >
              Severity
            </label>
            <select
              value={filters.severityId ?? ""}
              onChange={(e) =>
                onFilterChange(
                  "severityId",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              style={selectClass}
            >
              <option value="">All severities</option>
              {severities.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label
              className="block text-xs font-black uppercase tracking-widest"
              style={{ color: "#4f6070" }}
            >
              Status
            </label>
            <select
              value={filters.statusId ?? ""}
              onChange={(e) =>
                onFilterChange(
                  "statusId",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              style={selectClass}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fecaca",
              }}
            >
              <X size={11} />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
