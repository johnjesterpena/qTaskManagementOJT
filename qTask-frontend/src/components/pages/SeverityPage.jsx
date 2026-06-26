import { useState, useEffect, useCallback } from "react";
import {
  TriangleAlert,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  GripVertical,
  AlertTriangle,
  TrendingUp,
  Layers,
} from "lucide-react";
import { clsx } from "clsx";
import {
  fetchSeverities,
  createSeverity,
  updateSeverity,
  deleteSeverity,
} from "../../services/api";

// ── Preset colors for the severity dot ───────────────────────
const PRESET_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#6b7280", label: "Gray" },
];

const DEFAULT_COLOR = "#6b7280";

// ── Color mapping for severity levels ───────────────────────
const SEVERITY_COLORS = {
  High: { bg: "#fef2f2", color: "#ef4444", border: "#ef444430" },
  Medium: { bg: "#fefce8", color: "#eab308", border: "#eab30830" },
  Low: { bg: "#f0fdf4", color: "#22c55e", border: "#22c55e30" },
  Critical: { bg: "#fef2f2", color: "#dc2626", border: "#dc262630" },
  Minor: { bg: "#eff6ff", color: "#3b82f6", border: "#3b82f630" },
};

// ── KPI Card component ─────────────────────────────────────
function KpiCard({ label, value, accent, sub, icon: Icon }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #20476E ,#1C61A1)",
        border: `1px solid ${accent}40`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />
      {Icon && (
        <div className="absolute top-3 right-4 opacity-10">
          <Icon size={32} color={accent} />
        </div>
      )}
      <span className="text-sm font-bold uppercase tracking-widest text-white">
        {label}
      </span>
      <span className="text-3xl font-black text-white leading-none">
        {value}
      </span>
      {sub && <span className="text-xs text-gray-200 mt-0.5">{sub}</span>}
    </div>
  );
}

// ── Section Card component ─────────────────────────────────
function SectionCard({ title, toolbar, children }) {
  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white"
        style={{ background: "linear-gradient(90deg, #20476E ,#1C61A1)" }}
      >
        {title}
      </div>
      {toolbar && (
        <div
          className="px-5 py-3 flex flex-wrap items-center gap-3"
          style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}
        >
          {toolbar}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Severity Badge component ────────────────────────────────
function SeverityBadge({ label, color }) {
  const severityKey = Object.keys(SEVERITY_COLORS).find(
    (key) => key.toLowerCase() === label?.toLowerCase(),
  );
  const cfg = severityKey
    ? SEVERITY_COLORS[severityKey]
    : { bg: "#f1f5f9", color: "#64748b", border: "#64748b30" };

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color || DEFAULT_COLOR }}
      />
      <span
        className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
        style={{
          background: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.border}`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Action Button component ─────────────────────────────────
const ACTION_COLORS = {
  blue: "text-blue-400 hover:text-blue-600 hover:bg-blue-50",
  red: "text-red-400 hover:text-red-600 hover:bg-red-50",
};

function ActionButton({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx(
        "p-1.5 rounded-lg transition-colors",
        ACTION_COLORS[color],
      )}
    >
      {icon}
    </button>
  );
}

// ── Add / Edit modal ─────────────────────────────────────────
function SeverityModal({ mode, initial, onConfirm, onClose }) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setErr("Label is required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await onConfirm({ label: trimmed, color, sortOrder: Number(sortOrder) });
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[340px] p-6 space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            {mode === "add" ? "Add Severity" : "Edit Severity"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Label */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Label
          </label>
          <input
            autoFocus
            type="text"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. Critical, High, Low"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                title={c.label}
                onClick={() => setColor(c.value)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                style={{
                  backgroundColor: c.value,
                  borderColor: color === c.value ? "#1d4ed8" : "transparent",
                }}
              >
                {color === c.value && (
                  <Check size={12} color="white" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Order */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Sort Order
          </label>
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Error */}
        {err && <p className="text-xs text-red-500">{err}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : mode === "add" ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm delete modal ──────────────────────────────────────
function DeleteModal({ severity, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setErr("");
    try {
      await onConfirm(severity.id);
    } catch (e) {
      setErr(e.message);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[320px] p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={16} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Delete Severity
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700">
                "{severity.label}"
              </span>
              ? This cannot be undone.
            </p>
          </div>
        </div>
        {err && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
            {err}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export default function SeverityPage() {
  const [severities, setSeverities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [fadeIn, setFadeIn] = useState(false);

  // Modal state
  const [addModal, setAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch ────────────────────────────────────────────────
  const loadSeverities = useCallback(async () => {
    try {
      setLoading(true);
      setLoadErr("");
      const data = await fetchSeverities();
      setSeverities(data);
      setTimeout(() => setFadeIn(true), 50);
    } catch (e) {
      setLoadErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeverities();
  }, [loadSeverities]);

  // ── Add ──────────────────────────────────────────────────
  const handleAdd = async (payload) => {
    const created = await createSeverity(payload);
    setSeverities((prev) => [...prev, created]);
    setAddModal(false);
  };

  // ── Edit ─────────────────────────────────────────────────
  const handleEdit = async (payload) => {
    const updated = await updateSeverity(editTarget.id, payload);
    setSeverities((prev) =>
      prev.map((s) => (s.id === editTarget.id ? updated : s)),
    );
    setEditTarget(null);
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    await deleteSeverity(id);
    setSeverities((prev) => prev.filter((s) => s.id !== id));
    setDeleteTarget(null);
  };

  // ── KPIs ─────────────────────────────────────────────────
  const totalSeverities = severities.length;
  const highSeverities = severities.filter(
    (s) =>
      s.label?.toLowerCase().includes("high") ||
      s.label?.toLowerCase().includes("critical"),
  ).length;
  const avgSortOrder =
    severities.length > 0
      ? Math.round(
          severities.reduce((sum, s) => sum + (s.sortOrder || 0), 0) /
            severities.length,
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
            Loading severities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      {/* ── Animated content ── */}
      <div
        className="space-y-6 pb-10"
        style={{
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              Configuration
            </p>
            <h1 className="text-2xl font-black text-slate-800 leading-none">
              Severity Levels
            </h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Manage severity levels used when creating tasks
            </p>
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition hover:opacity-90 border border-[#DCDCDC] bg-[#0078D7]"
          >
            <Plus size={15} />
            Add Severity
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiCard
            label="Total Severities"
            value={totalSeverities}
            accent="#3b82f6"
            sub="configured levels"
            icon={Layers}
          />
          <KpiCard
            label="High Priority"
            value={highSeverities}
            accent="#ef4444"
            sub="critical & high levels"
            icon={AlertTriangle}
          />
          <KpiCard
            label="Avg Sort Order"
            value={avgSortOrder}
            accent="#8b5cf6"
            sub="average priority order"
            icon={TrendingUp}
          />
        </div>

        {/* Table */}
        <SectionCard title="Severity Configuration">
          {loadErr ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                <TriangleAlert size={15} />
                {loadErr}
                <button
                  onClick={loadSeverities}
                  className="ml-auto text-xs underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : severities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                <AlertTriangle
                  size={28}
                  className="text-slate-300"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm text-slate-400">
                No severities yet — add one to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {["Severity", "Color", "Sort Order", "Actions"].map(
                      (col) => (
                        <th
                          key={col}
                          className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {severities.map((sev, i) => (
                    <tr
                      key={sev.id}
                      className="transition-colors hover:bg-slate-50"
                      style={{
                        borderBottom:
                          i < severities.length - 1
                            ? "1px solid #f8fafc"
                            : "none",
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <SeverityBadge label={sev.label} color={sev.color} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full border border-slate-200"
                            style={{
                              backgroundColor: sev.color || DEFAULT_COLOR,
                            }}
                          />
                          <span className="text-xs text-slate-500 font-mono">
                            {sev.color || DEFAULT_COLOR}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md">
                          {sev.sortOrder ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <ActionButton
                            icon={<Pencil size={14} />}
                            label="Edit"
                            onClick={() => setEditTarget(sev)}
                            color="blue"
                          />
                          <ActionButton
                            icon={<Trash2 size={14} />}
                            label="Delete"
                            onClick={() => setDeleteTarget(sev)}
                            color="red"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      {addModal && (
        <SeverityModal
          mode="add"
          onConfirm={handleAdd}
          onClose={() => setAddModal(false)}
        />
      )}

      {editTarget && (
        <SeverityModal
          mode="edit"
          initial={editTarget}
          onConfirm={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          severity={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
