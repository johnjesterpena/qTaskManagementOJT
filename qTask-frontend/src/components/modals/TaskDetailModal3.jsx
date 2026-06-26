import { useState, useEffect, useRef } from "react";
import {
  uid,
  SEVERITY_COLORS,
  calcProgressFromSubtasks,
  formatShortDate,
} from "../../utils/kanbanUtils";
import {
  Trash2,
  AlertTriangle,
  Pencil,
  Repeat,
  MessageCircleMore,
} from "lucide-react";
import FileUpload from "../ui/FileUpload";
import {
  fetchSubtaskComments,
  createSubtaskComment,
  deleteSubtaskComment,
} from "../../services/api";

function normaliseSubtasks(subtasks) {
  return (subtasks ?? []).map((s) => ({
    ...s,
    isDone: Boolean(s.isDone ?? s.done ?? false),
  }));
}

export default function TaskDetailModal({
  task,
  users = [],
  severities = [],
  statuses = [],
  onUpdate,
  onEdit,
  onDelete,
  onClose,
  isPM,
}) {
  const [localSubtasks, setLocalSubtasks] = useState(() =>
    normaliseSubtasks(task.subtasks),
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [subtaskMode, setSubtaskMode] = useState(false);
  const [subtaskComments, setSubtaskComments] = useState([]);
  const [activeSubtaskId, setActiveSubtaskId] = useState(null);
  const [commentPanel, setCommentPanel] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [editForm, setEditForm] = useState({
    assigneeId: task.assigneeId ?? "",
    qaAssigneeId: task.qaAssigneeId ?? "",
    severityId: task.severityId ?? "",
    statusId: task.statusId ?? "",
    targetDate: task.targetDate ? task.targetDate.split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Optimistic local status for the modal's own status pill ──────────────
  const [localStatus, setLocalStatus] = useState({
    label: task.statusLabel ?? null,
    color: task.statusColor ?? "#94a3b8",
  });

  const doneCount = localSubtasks.filter((s) => s.isDone).length;
  const progress =
    calcProgressFromSubtasks(localSubtasks) ?? task.progress ?? 0;
  const sc =
    SEVERITY_COLORS[task.severity] ??
    SEVERITY_COLORS[task.severityLabel] ??
    SEVERITY_COLORS.Low;

  const isQAPhase = task.phaseGrouping === "qa";
  const missingQA = isQAPhase && !task.qaAssigneeId;
  const qaUsers = users.filter((u) => u.role === "QA");

  const setField = (k, v) => setEditForm((prev) => ({ ...prev, [k]: v }));

  // ── Edit save ─────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    setSaving(true);

    // Resolve the selected status from the statuses list so we have
    // the label + color ready for an optimistic update.
    const matchedStatus = statuses.find(
      (s) => String(s.id) === String(editForm.statusId),
    );

    try {
      await onEdit(task.id, {
        title: task.title,
        description: task.description,
        assigneeId: editForm.assigneeId ? Number(editForm.assigneeId) : null,
        qaAssigneeId: editForm.qaAssigneeId
          ? Number(editForm.qaAssigneeId)
          : null,
        severityId: editForm.severityId ? Number(editForm.severityId) : null,
        statusId: editForm.statusId ? Number(editForm.statusId) : null,
        targetDate: editForm.targetDate || null,
        // Pass resolved display fields so the parent can update task objects
        // in its own state — TaskCard's useEffect will pick these up instantly.
        statusLabel: matchedStatus?.label ?? task.statusLabel,
        statusColor: matchedStatus?.color ?? task.statusColor,
      });

      // Optimistically update the status pill inside this modal too.
      if (matchedStatus) {
        setLocalStatus({
          label: matchedStatus.label,
          color: matchedStatus.color,
        });
      }

      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Subtask handlers ──────────────────────────────────────────────────────
  const handleToggleSubtask = async (subtaskId) => {
    const updated = localSubtasks.map((s) =>
      s.id === subtaskId ? { ...s, isDone: !s.isDone } : s,
    );
    setLocalSubtasks(updated);
    const saved = await onUpdate(task.id, { subtasks: updated });
    if (saved) setLocalSubtasks(normaliseSubtasks(saved));
  };

  const handleAddSubtask = async (e) => {
    console.log(localSubtasks);
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const updated = [
      ...localSubtasks,
      { id: uid(), title: newSubtaskTitle.trim(), isDone: false },
      // { title: newSubtaskTitle.trim(), isDone: false },
    ];
    setLocalSubtasks(updated);
    setNewSubtaskTitle("");
    const saved = await onUpdate(task.id, { subtasks: updated });
    if (saved) setLocalSubtasks(normaliseSubtasks(saved));
  };

  const handleDeleteSubtask = async (subtaskId) => {
    setCommentPanel(false);
    const updated = localSubtasks.filter((s) => s.id !== subtaskId);
    setLocalSubtasks(updated);
    const saved = await onUpdate(task.id, { subtasks: updated });
    if (saved) setLocalSubtasks(normaliseSubtasks(saved));
  };

  const handleDeleteTask = async () => {
    setDeleting(true);
    try {
      await onDelete(task.id);
    } catch {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  // const handleBackdropClick = (e) => {
  //   if (e.target === e.currentTarget) onClose();
  // };

  // ── Subtask comment handlers ─────────────────────────────────────────────
  const openCommentPanel = async (subtask) => {
    // If clicking the same subtask that's already open, just close
    if (commentPanel && activeSubtaskId === subtask.id) {
      setCommentPanel(false);
      setActiveSubtaskId(null);
      setSubtaskComments([]);
      return;
    }
    setActiveSubtaskId(subtask.id);
    setCommentPanel(true);
    setSubtaskComments([]);
    setLoadingComments(true);
    try {
      const comments = await fetchSubtaskComments(subtask.id);
      setSubtaskComments(comments);
    } catch (err) {
      console.error("Failed to load subtask comments:", err.message);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !activeSubtaskId) return;
    setPostingComment(true);
    try {
      const created = await createSubtaskComment(
        activeSubtaskId,
        newComment.trim(),
      );
      setSubtaskComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment:", err.message);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!activeSubtaskId) return;
    try {
      await deleteSubtaskComment(commentId);
      setSubtaskComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err.message);
    }
  };

  // ── Shared header used in both views ─────────────────────────────────────
  const renderHeader = () => (
    <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-800 leading-snug">
          {task.title ?? task.name}
        </h2>
        {(task.severity || task.severityLabel) && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: task.severityColor,
              background: task.severityColor + 20,
            }}
          >
            {task.severity ?? task.severityLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0">
        {/* Edit button — only visible in detail view */}
        {!subtaskMode &&
          isPM &&
          (!editMode ? (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-2.5 py-1.5 rounded-lg transition"
            >
              <Pencil size={12} />
              Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-lg transition"
            >
              Cancel
            </button>
          ))}

        {/* Toggle between detail view and subtask view */}
        <button
          type="button"
          onClick={() => {
            setSubtaskMode((m) => !m);
            setEditMode(false);
            setCommentPanel(false);
          }}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition"
          style={
            subtaskMode
              ? {
                  color: "#2563eb",
                  borderColor: "#93c5fd",
                  background: "#eff6ff",
                }
              : {
                  color: "#6b7280",
                  borderColor: "#e5e7eb",
                  background: "transparent",
                }
          }
        >
          <Repeat size={12} />
          {subtaskMode ? "Details" : "Subtasks"}
        </button>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto"
      // onClick={handleBackdropClick}
    >
      {/* LEFT: main Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mb-16">
        {renderHeader()}

        {/* ══════════════════════════════════════════════════════════════════
            SUBTASK VIEW — shown when subtaskMode is true
        ══════════════════════════════════════════════════════════════════ */}
        {subtaskMode ? (
          <div className="p-6 space-y-4">
            {/* Progress summary */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Progress
                </p>
                <span className="text-xs font-semibold text-blue-600">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: progress === 100 ? "#10b981" : "#3b82f6",
                  }}
                />
              </div>
              {localSubtasks.length > 0 && (
                <p className="text-xs text-gray-400">
                  {doneCount} of {localSubtasks.length} subtask
                  {localSubtasks.length !== 1 ? "s" : ""} completed
                </p>
              )}
            </div>

            {/* Subtask list */}
            {localSubtasks.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No subtasks yet. Add one below to start tracking progress.
              </p>
            ) : (
              <ul className="space-y-2">
                {localSubtasks.map((subtask) => (
                  <li
                    key={subtask.id}
                    className="flex items-center gap-3 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(subtask.id)}
                      className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                        subtask.isDone
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {subtask.isDone && (
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm transition-colors ${
                        subtask.isDone
                          ? "line-through text-gray-400"
                          : "text-gray-700"
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => openCommentPanel(subtask)}
                      className={`transition-colors text-sm leading-none shrink-0 cursor-pointer ${
                        activeSubtaskId === subtask.id && commentPanel
                          ? "text-green-500"
                          : "text-gray-500 hover:text-green-400"
                      }`}
                      title="Comments"
                    >
                      <MessageCircleMore size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors text-sm leading-none shrink-0 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add subtask form */}
            <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
              <input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a subtask…"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                Add
              </button>
            </form>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════════
            DETAIL VIEW — shown when subtaskMode is false
        ══════════════════════════════════════════════════════════════════ */
          <>
            {/* ── 2. Details ── */}
            <div className="p-6 space-y-4 border-b border-gray-100">
              {task.description && !editMode && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {task.description}
                </p>
              )}

              {missingQA && !editMode && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg px-3 py-2">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>
                    This task is in a QA phase but has no QA assignee. Edit to
                    assign one.
                  </span>
                </div>
              )}

              {!editMode ? (
                /* VIEW mode */
                <div className="grid grid-cols-2 gap-3">
                  {/* Dev assignee */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Assignee
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-[10px]">
                        {(task.assigneeName ?? task.assignee)
                          ?.charAt(0)
                          ?.toUpperCase() ?? "?"}
                      </span>
                      <span className="text-sm text-gray-700">
                        {task.assigneeName ?? task.assignee ?? "Unassigned"}
                      </span>
                    </div>
                  </div>

                  {/* QA assignee */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      QA Assignee
                    </p>
                    <div className="flex items-center gap-2">
                      {task.qaAssigneeName ? (
                        <>
                          <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-[10px]">
                            {task.qaAssigneeName.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-700">
                            {task.qaAssigneeName}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-amber-500 flex items-center gap-1">
                          <AlertTriangle size={13} />
                          Not assigned
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Severity
                    </p>
                    <p className="text-sm text-gray-700">
                      {task.severityLabel ?? task.severity ?? "—"}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Target date
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatShortDate(task.targetDate) ?? "—"}
                    </p>
                  </div>

                  {/* Phase — read-only */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Phase (column)
                    </p>
                    <span className="inline-block text-sm font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {task.phaseLabel ?? "—"}
                    </span>
                  </div>

                  {/* Status — uses localStatus for instant feedback */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Status
                    </p>
                    {localStatus.label ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          color: localStatus.color,
                          background: `${localStatus.color}18`,
                          border: `1px solid ${localStatus.color}30`,
                          transition:
                            "color 0.2s ease, background 0.2s ease, border-color 0.2s ease",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: localStatus.color,
                            flexShrink: 0,
                            display: "inline-block",
                          }}
                        />
                        {localStatus.label}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                  {task.mandays != null && (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Mandays
                      </p>
                      <p className="text-sm text-gray-700">
                        {task.mandays} day{task.mandays !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}

                  {task.actualEndDate && (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Actual end date
                      </p>
                      <p className="text-sm text-gray-700">
                        {formatShortDate(task.actualEndDate)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* EDIT mode */
                <div className="space-y-3">
                  <p className="text-xs text-blue-600 font-medium">
                    Editing assignee, QA assignee, severity, status and target
                    date
                  </p>

                  {/* Dev assignee */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Assignee
                    </label>
                    <select
                      value={editForm.assigneeId}
                      onChange={(e) => setField("assigneeId", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* QA assignee */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      QA Assignee
                    </label>
                    <select
                      value={editForm.qaAssigneeId}
                      onChange={(e) => setField("qaAssigneeId", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">Unassigned</option>
                      {qaUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Severity
                    </label>
                    <select
                      value={editForm.severityId}
                      onChange={(e) => setField("severityId", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">None</option>
                      {severities.map((sv) => (
                        <option key={sv.id} value={sv.id}>
                          {sv.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status — with color preview dot */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status (workflow)
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background:
                            statuses.find(
                              (s) => String(s.id) === String(editForm.statusId),
                            )?.color ?? "#94a3b8",
                          display: "inline-block",
                          border: "1px solid rgba(0,0,0,0.1)",
                          transition: "background 0.2s ease",
                        }}
                      />
                      <select
                        value={editForm.statusId}
                        onChange={(e) => setField("statusId", e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                      >
                        <option value="">— None —</option>
                        {statuses.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Target date */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Target date
                    </label>
                    <input
                      type="date"
                      value={editForm.targetDate}
                      onChange={(e) => setField("targetDate", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      disabled={saving}
                      className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── 3. Progress bar ── */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Progress
                  </p>
                  <span className="text-xs font-semibold text-blue-600">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      background: progress === 100 ? "#10b981" : "#3b82f6",
                    }}
                  />
                </div>
                {localSubtasks.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {doneCount} of {localSubtasks.length} subtask
                    {localSubtasks.length !== 1 ? "s" : ""} completed
                  </p>
                )}
              </div>
            </div>

            {/* ── 4. Attachments ── */}
            <div className="border-b border-gray-100">
              <FileUpload taskId={task.id} />
            </div>

            {/* ── 5. Footer: delete ── */}
            <div className="px-6 py-4">
              {!confirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                  Delete this task
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg
                    className="w-4 h-4 text-red-400 shrink-0"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 3.5v3m0 2h.01" />
                  </svg>
                  <span className="flex-1 text-sm text-red-700">
                    Delete <strong>{task.title}</strong>? This cannot be undone.
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                    className="text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    disabled={deleting}
                    className="px-3 py-1.5 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {commentPanel && (
        <div
          className="ml-4 w-80 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "520px" }}
        >
          {/* Header */}
          <header className="flex justify-between items-center px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex gap-2 items-center min-w-0">
              <MessageCircleMore
                size={15}
                className="text-green-500 shrink-0"
              />
              <h1 className="text-sm font-semibold text-gray-800 truncate">
                {localSubtasks.find((s) => s.id === activeSubtaskId)?.title ??
                  "Comments"}
              </h1>
            </div>
            <button
              onClick={() => {
                setCommentPanel(false);
                setActiveSubtaskId(null);
                setSubtaskComments([]);
              }}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0 ml-2"
            >
              ✕
            </button>
          </header>

          {/* Scrollable comment list */}
          <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {loadingComments ? (
              <div className="flex items-center justify-center h-full py-8">
                <div
                  className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "#3b82f6",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            ) : subtaskComments.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-6">
                No comments yet. Be the first to comment.
              </p>
            ) : (
              subtaskComments.map((c) => (
                <div key={c.id} className="flex gap-2 items-start">
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {(c.commenterName ?? c.commenterUsername ?? "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 relative">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {c.commenterName ?? c.commenterUsername ?? "Unknown"}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(c.comment_date).toLocaleDateString("en-PH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 wrap-break-words whitespace-pre-wrap mt-0.5">
                      {c.comment}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      // onClick={() => {
                      //   // Optimistically remove comment from UI
                      //   setSubtaskComments((prev) =>
                      //     prev.filter((comment) => comment.id !== c.id),
                      //   );
                      //   deleteSubtaskComment(c.id).catch((err) => {
                      //     console.error(
                      //       "Failed to delete comment:",
                      //       err.message,
                      //     );
                      //     // Revert UI if deletion fails
                      //     setSubtaskComments((prev) => [...prev, c]);
                      //   });
                      // }}
                      className="absolute text-red-500 top-1/2 right-0 transform -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </main>

          {/* Input */}
          <div className="flex gap-2 px-4 py-3 border-t border-gray-100 shrink-0">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handlePostComment()
              }
              placeholder="Write a comment…"
              className="flex-1 border border-gray-200 rounded-lg h-8 px-3 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400"
              disabled={postingComment}
            />
            <button
              onClick={handlePostComment}
              disabled={!newComment.trim() || postingComment}
              className="bg-blue-500 hover:bg-blue-600 rounded-lg px-3 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {postingComment ? "…" : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
