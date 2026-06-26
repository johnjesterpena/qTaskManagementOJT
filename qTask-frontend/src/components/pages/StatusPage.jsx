import { useState, useEffect, useCallback } from "react";
import {
  CheckSquare,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Star,
  Flag,
  TriangleAlert,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  fetchStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from "../../services/api";

// ── Preset badge colors ───────────────────────────────────────
const PRESET_COLORS = [
  { value: "#6b7280", label: "Gray" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f97316", label: "Orange" },
  { value: "#ef4444", label: "Red" },
  { value: "#a855f7", label: "Purple" },
  { value: "#eab308", label: "Yellow" },
  { value: "#14b8a6", label: "Teal" },
];
const DEFAULT_COLOR = "#6b7280";

function colorLabel(hex) {
  return PRESET_COLORS.find((c) => c.value === hex)?.label ?? "Custom";
}

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({ label, value, accent, sub, icon: Icon }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #20476E, #1C61A1)",
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
      {sub && <span className="text-xs text-white mt-0.5">{sub}</span>}
    </div>
  );
}

// ── Section Card ─────────────────────────────────────────────
function SectionCard({ title, children }) {
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
        style={{ background: "linear-gradient(90deg, #20476E, #1C61A1)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Add / Edit Modal ─────────────────────────────────────────
function StatusModal({ mode, initial, onConfirm, onClose }) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isDefault, setIsDefault] = useState(
    initial?.isDefault === 1 || initial?.isDefault === true,
  );
  const [isFinal, setIsFinal] = useState(
    initial?.isFinal === 1 || initial?.isFinal === true,
  );
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
      await onConfirm({
        label: trimmed,
        color,
        sortOrder: Number(sortOrder),
        isDefault: isDefault ? 1 : 0,
        isFinal: isFinal ? 1 : 0,
      });
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[360px] p-6 space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            {mode === "add" ? "Add Status" : "Edit Status"}
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
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
            placeholder="e.g. In Progress"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Badge Color
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
          <div className="flex items-center gap-2 mt-1">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {label || "Preview"}
            </span>
            <span className="text-xs text-gray-400">{colorLabel(color)}</span>
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

        {/* Flags */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Flags
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsDefault((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isDefault
                  ? "bg-blue-50 text-blue-700 border-blue-300"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              <Star size={12} fill={isDefault ? "currentColor" : "none"} />
              Default
            </button>
            <button
              type="button"
              onClick={() => setIsFinal((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isFinal
                  ? "bg-green-50 text-green-700 border-green-300"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              <Flag size={12} fill={isFinal ? "currentColor" : "none"} />
              Final
            </button>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-medium text-blue-600">Default</span> — where
            new tasks land automatically.{" "}
            <span className="font-medium text-green-600">Final</span> — triggers
            the Done confirmation and sets the actual end date.
          </p>
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

// ── Confirm Delete Modal ──────────────────────────────────────
function DeleteModal({ status, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setErr("");
    try {
      await onConfirm(status.id);
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
              Delete Status
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700">
                "{status.label}"
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

// ── Main Page ─────────────────────────────────────────────────
export default function StatusPage() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setLoadErr("");
      const data = await fetchStatuses();
      setStatuses(data);
      setTimeout(() => setFadeIn(true), 50);
    } catch (e) {
      setLoadErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const handleAdd = async (payload) => {
    const created = await createStatus(payload);
    setStatuses((prev) =>
      [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder),
    );
    setAddModal(false);
  };

  const handleEdit = async (payload) => {
    const updated = await updateStatus(editTarget.id, payload);
    setStatuses((prev) =>
      prev
        .map((s) => (s.id === editTarget.id ? updated : s))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    );
    setEditTarget(null);
  };

  const handleDelete = async (id) => {
    await deleteStatus(id);
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    setDeleteTarget(null);
  };

  // ── KPIs ─────────────────────────────────────────────────
  const totalStatuses = statuses.length;
  const defaultStatuses = statuses.filter(
    (s) => s.isDefault === 1 || s.isDefault === true,
  ).length;
  const finalStatuses = statuses.filter(
    (s) => s.isFinal === 1 || s.isFinal === true,
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
            Loading statuses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Configuration
            </p>
            <h1 className="text-2xl font-black text-slate-800 leading-none">
              Task Statuses
            </h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Manage statuses used across tasks in your projects
            </p>
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #1e3a5f, #1e40af)",
              border: "1px solid #1e40af40",
            }}
          >
            <Plus size={15} />
            Add Status
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiCard
            label="Total Statuses"
            value={totalStatuses}
            accent="#3b82f6"
            sub="configured statuses"
            icon={Layers}
          />
          <KpiCard
            label="Default Status"
            value={defaultStatuses}
            accent="#10b981"
            sub="auto-assigned status"
            icon={Star}
          />
          <KpiCard
            label="Final Statuses"
            value={finalStatuses}
            accent="#8b5cf6"
            sub="triggers done state"
            icon={TrendingUp}
          />
        </div>

        {/* Table */}
        <SectionCard title="Status Configuration">
          {loadErr ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                <TriangleAlert size={15} />
                {loadErr}
                <button
                  onClick={loadStatuses}
                  className="ml-auto text-xs underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : statuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                <CheckSquare
                  size={28}
                  className="text-slate-300"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm text-slate-400">
                No statuses yet — add one to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {["Status", "Color", "Sort Order", "Flags", "Actions"].map(
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
                  {statuses.map((st, i) => (
                    <tr
                      key={st.id}
                      className="transition-colors hover:bg-slate-50"
                      style={{
                        borderBottom:
                          i < statuses.length - 1
                            ? "1px solid #f8fafc"
                            : "none",
                      }}
                    >
                      {/* Status badge */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: st.color ?? DEFAULT_COLOR,
                            }}
                          />
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider text-white"
                            style={{
                              backgroundColor: st.color ?? DEFAULT_COLOR,
                            }}
                          >
                            {st.label}
                          </span>
                        </div>
                      </td>

                      {/* Color */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full border border-slate-200"
                            style={{
                              backgroundColor: st.color || DEFAULT_COLOR,
                            }}
                          />
                          <span className="text-xs text-slate-500 font-mono">
                            {st.color || DEFAULT_COLOR}
                          </span>
                        </div>
                      </td>

                      {/* Sort order */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md">
                          {st.sortOrder ?? 0}
                        </span>
                      </td>

                      {/* Flags */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(st.isDefault === 1 || st.isDefault === true) && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{
                                background: "#eff6ff",
                                color: "#1d4ed8",
                              }}
                            >
                              <Star size={9} fill="currentColor" />
                              Default
                            </span>
                          )}
                          {(st.isFinal === 1 || st.isFinal === true) && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{
                                background: "#f0fdf4",
                                color: "#15803d",
                              }}
                            >
                              <Flag size={9} fill="currentColor" />
                              Final
                            </span>
                          )}
                          {!st.isDefault && !st.isFinal && (
                            <span className="text-[10px] text-slate-300">
                              —
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditTarget(st)}
                            title="Edit"
                            className="p-1.5 rounded-lg transition-colors text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(st)}
                            title="Delete"
                            className="p-1.5 rounded-lg transition-colors text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Modals */}
      {addModal && (
        <StatusModal
          mode="add"
          onConfirm={handleAdd}
          onClose={() => setAddModal(false)}
        />
      )}
      {editTarget && (
        <StatusModal
          mode="edit"
          initial={editTarget}
          onConfirm={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          status={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
