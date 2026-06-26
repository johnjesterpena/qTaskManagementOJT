import { useState } from "react";

/**
 * DoneModal — SRS §3.3
 * Fires when a card is dropped onto any column where isFinal === true.
 * Forces the user to confirm the Actual End Date before the move commits.
 *
 * Props:
 *   taskName  — string, shown in the confirmation message
 *   onConfirm — fn(actualEndDate: string) called when user confirms
 *   onCancel  — fn() called when user dismisses
 */
export default function DoneModal({ taskName, onConfirm, onCancel }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" style={{ border: "1px solid #DCDCDC" }}>
        <h2 className="font-semibold" style={{ fontSize: "var(--fs-lg)", color: "#20476E" }}>Confirm completion</h2>

        <p className="text-sm text-gray-500">
          You are marking{" "}
          <span className="font-medium text-gray-700">"{taskName}"</span> as Done.
          Confirm the actual end date — this is used to calculate the Variance.
        </p>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Actual end date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ border: "1px solid #DCDCDC" }}
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(date)}
            className="px-4 py-2 text-sm font-semibold rounded-lg transition"
            style={{ background: "linear-gradient(135deg, #059669, #10b981)", color: "#fff" }}
          >
            Mark as done
          </button>
        </div>
      </div>
    </div>
  );
}
