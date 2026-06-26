import { useState } from "react";

/**
 * AddColumnModal
 *
 * FIXED: Now calls POST /api/statuses via the onAdd callback instead of
 * passing a local object. The parent (App) is responsible for the API call
 * and passes back the real DB row so the board gets a proper numeric id.
 *
 * Props:
 *   onAdd   — async fn({ label, isFinal, sortOrder }) → resolves with saved status row
 *   onClose — fn()
 */
export default function AddColumnModal({ onAdd, onClose }) {
  const [title,   setTitle]   = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setError("");
    setSaving(true);
    try {
      await onAdd({ label: title.trim(), isFinal, isDefault: false });
      // onAdd closes the modal on success
    } catch (err) {
      setError(err.message ?? "Failed to add column. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Add column</h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Column name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Column name *
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. On Hold"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          {/* isFinal toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFinal}
              onChange={(e) => setIsFinal(e.target.checked)}
              className="rounded"
            />
            This is a completion column (triggers Done modal)
          </label>

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="px-4 py-2 text-sm font-semibold bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Adding…" : "Add column"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
