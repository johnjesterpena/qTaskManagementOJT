import { useState, useEffect, useCallback } from "react";
import { Filter, X } from "lucide-react";
import { fetchActivityLogs } from "../../services/api";

const DATE_LOCALE = "en-PH";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString(DATE_LOCALE, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const inputStyle = {
  border: "1px solid #DCDCDC",
  borderRadius: 8,
  padding: "7px 12px",
  fontSize: "var(--fs-sm)",
  color: "#20476E",
  background: "#FFFFFF",
};

export default function ActivityLogPage({ currentUser }) {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [fadeIn,     setFadeIn]     = useState(false);
  const [page,       setPage]       = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [filters,    setFilters]    = useState({ taskId: "", from: "", to: "" });
  const [applied,    setApplied]    = useState({});

  const isDevOrQA = currentUser.role === "Developer" || currentUser.role === "QA";

  const load = useCallback(async (activeFilters = {}, pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = isDevOrQA
        ? { ...activeFilters, userId: currentUser.id, page: pageNum, limit: itemsPerPage }
        : { ...activeFilters, page: pageNum, limit: itemsPerPage };
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== "" && v != null),
      );
      const result = await fetchActivityLogs(clean);
      setLogs(result.data);
      setPagination(result);
      setPage(result.page);
      setTimeout(() => setFadeIn(true), 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isDevOrQA, itemsPerPage]);

  useEffect(() => { load({}, 1); }, [load]);

  const handleApply = () => { setApplied(filters); load(filters, 1); };
  const handleClear = () => { setFilters({ taskId: "", from: "", to: "" }); setApplied({}); load({}, 1); };
  const hasFilters = Object.values(applied).some((v) => v !== "");

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #0078D7", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
          <p style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1C61A1" }}>Loading logs</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 pb-10"
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* ── Page header ── */}
      <div>
        <p style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#4f6070", marginBottom: 4 }}>
          Audit Trail
        </p>
        <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 900, color: "#20476E", lineHeight: 1.1 }}>
          Activity Log
        </h1>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DCDCDC", borderRadius: 12, padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <input type="number" placeholder="Task ID" value={filters.taskId}
          onChange={(e) => setFilters((p) => ({ ...p, taskId: e.target.value }))}
          style={{ ...inputStyle, width: 110 }} />
        <input type="date" value={filters.from}
          onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
          style={inputStyle} />
        <input type="date" value={filters.to}
          onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
          style={inputStyle} />
        <button onClick={handleApply}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #1C61A1, #0078D7)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer" }}>
          <Filter size={13} /> Apply
        </button>
        {hasFilters && (
          <button onClick={handleClear}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, padding: "7px 14px", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer" }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Table card ── */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DCDCDC", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {error ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#dc2626", fontSize: "var(--fs-sm)" }}>{error}</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#4f6070", fontSize: "var(--fs-sm)" }}>No activity found</div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="qt-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", color: "#a8ccf0" }}>Task</th>
                    <th style={{ textAlign: "left", color: "#a8ccf0" }}>Action</th>
                    {!isDevOrQA && <th style={{ textAlign: "left", color: "#a8ccf0" }}>User</th>}
                    <th style={{ textAlign: "left", color: "#a8ccf0" }}>Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F0F8FF" }}>
                      <td style={{ color: "#20476E", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {log.taskTitle ?? `Task #${log.taskId}`}
                        <span style={{ marginLeft: 8, fontSize: "var(--fs-xs)", fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: "#e8f4ff", color: "#0078D7", border: "1px solid #0078D730" }}>
                          #{log.taskId}
                        </span>
                      </td>
                      <td style={{ color: "#4f6070", maxWidth: 320 }}>{log.action}</td>
                      {!isDevOrQA && (
                        <td style={{ whiteSpace: "nowrap" }}>
                          {log.userName ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #1C61A1, #0078D7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-xs)", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                                {log.userName.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ color: "#20476E" }}>{log.userName}</span>
                            </div>
                          ) : (
                            <span style={{ color: "#DCDCDC", fontStyle: "italic" }}>System</span>
                          )}
                        </td>
                      )}
                      <td style={{ whiteSpace: "nowrap", color: "#4f6070" }}>{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              background: "#FFFFFF",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              borderTop: "1px solid #DCDCDC",
            }}>
              {/* Items per page selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "#4f6070" }}>
                  Items per page:
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const newLimit = Number(e.target.value);
                    setItemsPerPage(newLimit);
                    setPage(1);
                    load(applied, 1);
                  }}
                  style={{
                    border: "1px solid #DCDCDC",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: "var(--fs-sm)",
                    color: "#20476E",
                    background: "#FFFFFF",
                    cursor: "pointer",
                  }}
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
                Page {page} of {pagination.totalPages} · {pagination.total} logs
              </div>

              {/* Pagination buttons */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => load(applied, page - 1)}
                  disabled={page <= 1}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid #DCDCDC",
                    background: page <= 1 ? "#f1f5f9" : "#FFFFFF",
                    color: page <= 1 ? "#94a3b8" : "#20476E",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                    fontSize: "var(--fs-sm)",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                >
                  ← Previous
                </button>

                {/* Page numbers */}
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isVisible =
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1);

                    if (!isVisible && (pageNum !== 2 && pageNum !== pagination.totalPages - 1))
                      return null;

                    if (pageNum === 2 && page > 3 && pagination.totalPages > 5)
                      return (
                        <span key="dots-start" style={{ color: "#DCDCDC", padding: "0 4px" }}>
                          …
                        </span>
                      );

                    if (pageNum === pagination.totalPages - 1 && page < pagination.totalPages - 2 && pagination.totalPages > 5)
                      return (
                        <span key="dots-end" style={{ color: "#DCDCDC", padding: "0 4px" }}>
                          …
                        </span>
                      );

                    if (!isVisible) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => load(applied, pageNum)}
                        style={{
                          padding: "6px 10px",
                          minWidth: 32,
                          borderRadius: 6,
                          border: pageNum === page ? "1px solid #0078D7" : "1px solid #DCDCDC",
                          background: pageNum === page ? "#0078D7" : "#FFFFFF",
                          color: pageNum === page ? "#FFFFFF" : "#20476E",
                          cursor: "pointer",
                          fontSize: "var(--fs-sm)",
                          fontWeight: pageNum === page ? 700 : 500,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => load(applied, page + 1)}
                  disabled={page >= pagination.totalPages}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid #DCDCDC",
                    background: page >= pagination.totalPages ? "#f1f5f9" : "#FFFFFF",
                    color: page >= pagination.totalPages ? "#94a3b8" : "#20476E",
                    cursor: page >= pagination.totalPages ? "not-allowed" : "pointer",
                    fontSize: "var(--fs-sm)",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
