import { useState, useEffect, useRef } from "react";
import { Pencil, Check, X, Trash2 } from "lucide-react";

const FIXED_GROUPS = [
  { key: "dev", label: "Development", icon: "⚙️" },
  { key: "qa", label: "Quality Assurance", icon: "🧪" },
  { key: "pm", label: "Project Management", icon: "📋" },
];

const BASE_URL = import.meta.env.VITE_API_URL;

export default function PhasesPage() {
  const [phases, setPhases] = useState([]);
  const [statuses, setStatuses] = useState([]); // ← fetched once, passed down
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState(null);
  const [newPhaseLabel, setNewPhaseLabel] = useState("");
  const [errMessage, setErrMessage] = useState("");
  const [popUpError, setPopUpError] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Fetch both in parallel — statuses are stable reference data
    Promise.all([
      fetch(`${BASE_URL}/phases`).then((r) => r.json()),
      fetch(`${BASE_URL}/statuses`).then((r) => r.json()),
    ])
      .then(([phaseData, statusData]) => {
        setPhases(phaseData);
        setStatuses(statusData);
      })
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => {
        setLoading(false);
        setTimeout(() => setFadeIn(true), 50);
      });
  }, []);

  const fetchPhases = async () => {
    try {
      const response = await fetch(`${BASE_URL}/phases`);
      if (!response.ok) throw new Error("Failed to fetch phases");
      const data = await response.json();
      setPhases(data);
    } catch (error) {
      console.error("Error fetching phases:", error);
    }
  };

  const handleAddPhase = async (group) => {
    const label = newPhaseLabel.trim();
    if (!label) return;
    try {
      const response = await fetch(`${BASE_URL}/phases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, grouping: group, sortOrder: 0 }),
      });
      if (!response.ok) throw new Error("Failed to add phase");
      const created = await response.json();
      setPhases((prev) => [...prev, created]);
      setNewPhaseLabel("");
      setAddingTo(null);
    } catch (error) {
      console.error("Error adding phase:", error);
    }
  };

  const handleDeletePhase = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/phases/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete phase");
      setPhases((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting phase:", error);
      setErrMessage(
        "Failed to delete phase. It may be in use by existing tasks.",
      );
      setPopUpError(true);
    }
  };

  const handleUpdatePhase = async (id, payload) => {
    try {
      const response = await fetch(`${BASE_URL}/phases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update phase");
      const updated = await response.json();
      setPhases((prev) => prev.map((p) => (p.id === id ? updated : p)));
      window.dispatchEvent(new Event("phases-updated"));
    } catch (error) {
      console.error("Error updating phase:", error);
      setErrMessage("Failed to update phase. Please try again.");
      setPopUpError(true);
    }
  };

  const groupedPhases = FIXED_GROUPS.reduce((acc, group) => {
    acc[group.key] = phases.filter((p) => p.grouping === group.key);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">
            Loading phases
          </p>
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
      {/* Page Header */}
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-1">
          Workflow Configuration
        </p>
        <h1 className="text-2xl font-black text-slate-800 leading-none">
          Phases
        </h1>
      </div>

      {/* Groups */}
      {FIXED_GROUPS.map(({ key, label, icon }) => (
        <div
          key={key}
          className="rounded-xl overflow-hidden bg-white"
          style={{
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Section Header */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ background: "linear-gradient(90deg, #20476E ,#1C61A1)" }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-white">
                {label}
              </span>
              <span
                className="text-[10px] font-bold rounded-full px-2 py-0.5 ml-1"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {groupedPhases[key].length}
              </span>
            </div>
            <button
              onClick={() => {
                setAddingTo(key);
                setNewPhaseLabel("");
              }}
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.14)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
            >
              + Add Phase
            </button>
          </div>

          {/* Cards area */}
          <div className="p-5">
            {groupedPhases[key].length === 0 && addingTo !== key ? (
              <div
                className="flex items-center justify-center h-24 w-full rounded-xl text-slate-400 text-sm"
                style={{ border: "2px dashed #e2e8f0" }}
              >
                No phases yet — add one to get started
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {groupedPhases[key].map((phase) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    statuses={statuses} // ← passed down
                    onDelete={handleDeletePhase}
                    onUpdate={handleUpdatePhase}
                  />
                ))}

                {/* Inline Add Card */}
                {addingTo === key && (
                  <div
                    className="w-44 rounded-xl p-4 flex flex-col gap-3"
                    style={{
                      minHeight: 120,
                      border: "2px dashed #cbd5e1",
                      background: "#f8fafc",
                    }}
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder="Phase name..."
                      value={newPhaseLabel}
                      onChange={(e) => setNewPhaseLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddPhase(key);
                        if (e.key === "Escape") setAddingTo(null);
                      }}
                      className="w-full text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      style={{
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: "#1e293b",
                      }}
                    />
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleAddPhase(key)}
                        className="flex-1 text-[10px] font-bold uppercase tracking-widest rounded-lg py-1.5 transition-all"
                        style={{
                          background: "linear-gradient(90deg,#1e40af,#3b82f6)",
                          color: "#fff",
                        }}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingTo(null)}
                        className="flex-1 text-[10px] font-bold uppercase tracking-widest rounded-lg py-1.5 transition-all"
                        style={{ background: "#f1f5f9", color: "#64748b" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Error Modal */}
      {popUpError && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 w-80"
            style={{
              background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
              border: "1px solid #ef444430",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">
              Error
            </p>
            <p className="text-white font-semibold text-sm mb-4">
              {errMessage}
            </p>
            <button
              onClick={() => setPopUpError(false)}
              className="w-full text-[10px] font-bold uppercase tracking-widest rounded-lg py-2 transition-all"
              style={{
                background: "linear-gradient(90deg,#b91c1c,#ef4444)",
                color: "#fff",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PhaseCard ─────────────────────────────────────────────────
function PhaseCard({ phase, statuses, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(phase.label);
  const [isDefault, setIsDefault] = useState(phase.isDefault === 1);
  const [isFinal, setIsFinal] = useState(phase.isFinal === 1);
  const [selectedStatusId, setSelectedStatusId] = useState(
    phase.defaultStatusId ?? null,
  ); // ← new
  const [saving, setSaving] = useState(false);
  const [sortOrderValue, setSortOrderValue] = useState(phase.sortOrder || 0);
  const inputRef = useRef(null);

  // Keep local state in sync if the parent pushes a fresh phase object
  useEffect(() => {
    if (!editing) {
      setLabel(phase.label);
      setIsDefault(phase.isDefault === 1);
      setIsFinal(phase.isFinal === 1);
      setSortOrderValue(phase.sortOrder || 0);
      setSelectedStatusId(phase.defaultStatusId ?? null); // ← new
    }
  }, [phase, editing]);

  const openEdit = () => {
    setLabel(phase.label);
    setIsDefault(phase.isDefault === 1);
    setIsFinal(phase.isFinal === 1);
    setSelectedStatusId(phase.defaultStatusId ?? null); // ← new
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setLabel(phase.label);
    setIsDefault(phase.isDefault === 1);
    setIsFinal(phase.isFinal === 1);
    setSelectedStatusId(phase.defaultStatusId ?? null); // ← new
    setEditing(false);
  };

  const saveEdit = async (key) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setSaving(true);
    await onUpdate(phase.id, {
      label: trimmed,
      isDefault: isDefault ? 1 : 0,
      isFinal: isFinal ? 1 : 0,
      grouping: key,
      sortOrder: sortOrderValue,
      defaultStatusId: selectedStatusId, // ← new (null = cleared)
    });
    setSaving(false);
    setEditing(false);
  };

  // Resolve the currently-selected status object for view-mode badge
  const resolvedStatus =
    statuses.find((s) => s.id === phase.defaultStatusId) ?? null; // ← new

  // ── View mode ────────────────────────────────────────────
  if (!editing) {
    return (
      <div
        className="relative w-44 rounded-xl p-4 flex flex-col bg-white group"
        style={{
          minHeight: 120,
          border: "1px solid #e2e8f0",
          borderTop: "3px solid #1e40af",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.boxShadow = "0 4px 12px rgba(30,64,175,0.10)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)")
        }
      >
        {/* Sort Order Number */}
        <div
          className="absolute bottom-2.5 right-2.5 w-5 h-5 flex text-sm font-medium text-gray-400 items-center justify-center rounded-full transition-all"
          title="Sort Order"
        >
          {phase.sortOrder}
        </div>

        {/* Edit button */}
        <button
          onClick={openEdit}
          className="absolute top-2.5 right-8 w-5 h-5 flex items-center justify-center rounded-full transition-all"
          style={{ background: "#f1f5f9", color: "#94a3b8" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#eff6ff";
            e.currentTarget.style.color = "#1d4ed8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#94a3b8";
          }}
          title="Edit phase"
        >
          <Pencil size={10} />
        </button>

        {/* Delete button */}
        <button
          onClick={() => onDelete(phase.id)}
          className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full transition-all text-[10px]"
          style={{ background: "#f1f5f9", color: "#94a3b8" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#94a3b8";
          }}
          title="Delete phase"
        >
          <Trash2 size={12} />
        </button>

        {/* Label */}
        <span className="text-sm font-semibold text-slate-700 leading-snug pr-10 mt-1">
          {phase.label}
        </span>

        {/* Badges */}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {phase.isDefault === 1 && (
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: "#eff6ff", color: "#1d4ed8" }}
            >
              Default
            </span>
          )}
          {phase.isFinal === 1 && (
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: "#ecfdf5", color: "#059669" }}
            >
              Final
            </span>
          )}
          {/* ── Default Status badge ── */}
          {resolvedStatus && (
            <span
              className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#475569",
              }}
              title={`Default status: ${resolvedStatus.label}`}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: resolvedStatus.color }}
              />
              {resolvedStatus.label}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Edit mode ────────────────────────────────────────────
  return (
    <div
      className="relative w-44 rounded-xl p-4 flex flex-col bg-white"
      style={{
        minHeight: 120,
        border: "2px solid #3b82f6",
        borderTop: "3px solid #1e40af",
        boxShadow: "0 0 0 3px #bfdbfe",
      }}
    >
      {/* Save button */}
      <button
        onClick={() => saveEdit(phase.grouping)}
        disabled={saving || !label.trim()}
        className="absolute top-2.5 right-8 w-5 h-5 flex items-center justify-center rounded-full transition-all"
        style={{
          background: saving || !label.trim() ? "#f1f5f9" : "#dcfce7",
          color: saving || !label.trim() ? "#94a3b8" : "#16a34a",
        }}
        title="Save"
      >
        <Check size={10} />
      </button>

      {/* Cancel button */}
      <button
        onClick={cancelEdit}
        disabled={saving}
        className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full transition-all text-[10px]"
        style={{ background: "#fee2e2", color: "#ef4444" }}
        title="Cancel"
      >
        <X size={10} />
      </button>

      {/* Name input */}
      <input
        ref={inputRef}
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") saveEdit(phase.grouping);
          if (e.key === "Escape") cancelEdit();
        }}
        className="w-full text-sm font-semibold rounded-lg px-2 py-1 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
        style={{
          border: "1px solid #bfdbfe",
          background: "#eff6ff",
          color: "#1e293b",
        }}
        placeholder="Phase name"
      />

      {/* Flag toggles */}
      <div className="mt-3 flex flex-col gap-2">
        <ToggleRow
          label="Default"
          active={isDefault}
          activeColor="#1d4ed8"
          activeBg="#eff6ff"
          onToggle={() => setIsDefault((v) => !v)}
        />
        <ToggleRow
          label="Final"
          active={isFinal}
          activeColor="#059669"
          activeBg="#ecfdf5"
          onToggle={() => setIsFinal((v) => !v)}
        />
      </div>

      {/* Default Status dropdown */}
      <div className="mt-2 flex flex-col gap-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
          Default Status
        </span>
        <select
          value={selectedStatusId ?? ""}
          onChange={(e) =>
            setSelectedStatusId(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
          style={{
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
            color: "#1e293b",
          }}
        >
          <option value="">— None —</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Order input */}
      <div className="mt-2">
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Sort Order"
          value={sortOrderValue}
          onChange={(e) => setSortOrderValue(Number(e.target.value))}
        />
      </div>

      {saving && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-white/70">
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}

// ── ToggleRow — compact pill-style toggle for edit mode ───────
function ToggleRow({ label, active, activeColor, activeBg, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full rounded-lg px-2 py-1 transition-all"
      style={{
        background: active ? activeBg : "#f8fafc",
        border: `1px solid ${active ? activeColor + "30" : "#e2e8f0"}`,
      }}
    >
      {/* Toggle track */}
      <span
        className="relative flex-shrink-0 w-7 h-4 rounded-full transition-colors duration-200"
        style={{ background: active ? activeColor : "#cbd5e1" }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: active ? "translateX(12px)" : "translateX(0)" }}
        />
      </span>
      <span
        className="text-[9px] font-bold uppercase tracking-widest"
        style={{ color: active ? activeColor : "#94a3b8" }}
      >
        {label}
      </span>
    </button>
  );
}
