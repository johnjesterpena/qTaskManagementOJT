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
  fetchSubtaskCommentCounts,
  createSubtaskComment,
  deleteSubtaskComment,
  updateSubtaskComment,
  deleteSubtask,
  updateTaskProgress,
  updateSubtask,
} from "../../services/api";
import LinkText from "../ui/LinkText";

function normaliseSubtasks(subtasks) {
  return (subtasks ?? []).map((s) => ({
    ...s,
    isDone: Boolean(s.isDone ?? s.done ?? false),
  }));
}

export default function TaskDetailModal({
  task,
  users = [],
  projectUsers = [],
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
    title: task.title ?? task.name ?? "",
    description: task.description ?? "",
    assigneeId: task.assigneeId ?? "",
    qaAssigneeId: task.qaAssigneeId ?? "",
    severityId: task.severityId ?? "",
    statusId: task.statusId ?? "",
    startDate: task.startDate ? task.startDate.split("T")[0] : "",
    targetDate: task.targetDate ? task.targetDate.split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // -- Close using ESC button -----------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ── Comment counts (subtaskId → number) ──────────────────────────────────
  const [commentCounts, setCommentCounts] = useState({});
  useEffect(() => {
    const ids = localSubtasks.map((s) => s.id).filter((id) => id > 0);
    if (ids.length === 0) return;
    fetchSubtaskCommentCounts(ids)
      .then(setCommentCounts)
      .catch(() => {}); // non-critical, badge simply won't show
  }, [localSubtasks]);

  // ── Optimistic local status for the modal's own status pill ──────────────
  const [localStatus, setLocalStatus] = useState({
    label: task.statusLabel ?? null,
    color: task.statusColor ?? "#94a3b8",
  });

  const doneCount = localSubtasks.filter((s) => s.isDone).length;

  // When there are no subtasks, progress is controlled by a direct toggle (0 or 100).
  // When subtasks exist, it's always derived from them.
  const [localProgress, setLocalProgress] = useState(task.progress ?? 0);

  const progress =
    localSubtasks.length > 0
      ? (calcProgressFromSubtasks(localSubtasks) ?? 0)
      : localProgress;
  const sc =
    SEVERITY_COLORS[task.severity] ??
    SEVERITY_COLORS[task.severityLabel] ??
    SEVERITY_COLORS.Low;

  const isQAPhase = task.phaseGrouping === "qa";
  const missingQA = isQAPhase && !task.qaAssigneeId;

  // Filter by role — prefer project-scoped list, fall back to full users list
  const devUsers =
    projectUsers.length > 0
      ? projectUsers.filter((u) => u.role === "Developer")
      : users.filter((u) => u.role === "Developer");

  const qaUsers =
    projectUsers.length > 0
      ? projectUsers.filter((u) => u.role === "QA")
      : users.filter((u) => u.role === "QA");

  const setField = (k, v) => setEditForm((prev) => ({ ...prev, [k]: v }));

  console.log(editForm);

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
        title: editForm.title,
        description: editForm.description,
        assigneeId: editForm.assigneeId ? Number(editForm.assigneeId) : null,
        qaAssigneeId: editForm.qaAssigneeId
          ? Number(editForm.qaAssigneeId)
          : null,
        severityId: editForm.severityId ? Number(editForm.severityId) : null,
        statusId: editForm.statusId ? Number(editForm.statusId) : null,
        startDate: editForm.startDate || null,
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

  // ── Inline status change (view mode) ─────────────────────────────────────
  const [statusSaving, setStatusSaving] = useState(false);

  const handleStatusChange = async (newStatusId) => {
    const matchedStatus = statuses.find(
      (s) => String(s.id) === String(newStatusId),
    );
    setField("statusId", newStatusId);
    setStatusSaving(true);
    try {
      await onEdit(task.id, {
        title: editForm.title,
        description: editForm.description,
        assigneeId: editForm.assigneeId ? Number(editForm.assigneeId) : null,
        qaAssigneeId: editForm.qaAssigneeId
          ? Number(editForm.qaAssigneeId)
          : null,
        severityId: editForm.severityId ? Number(editForm.severityId) : null,
        statusId: newStatusId ? Number(newStatusId) : null,
        startDate: editForm.startDate || null,
        targetDate: editForm.targetDate || null,
        statusLabel: matchedStatus?.label ?? task.statusLabel,
        statusColor: matchedStatus?.color ?? task.statusColor,
      });
      if (matchedStatus) {
        setLocalStatus({
          label: matchedStatus.label,
          color: matchedStatus.color,
        });
      }
    } finally {
      setStatusSaving(false);
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
      { id: 0, title: newSubtaskTitle.trim(), isDone: false }, // removed uid dependence
      // { title: newSubtaskTitle.trim(), isDone: false },
    ];
    setLocalSubtasks(updated);
    setNewSubtaskTitle("");
    const saved = await onUpdate(task.id, { subtasks: updated });
    if (saved) setLocalSubtasks(normaliseSubtasks(saved));
  };
  // OLD handler
  // const handleDeleteSubtask = async (subtaskId) => {
  //   setCommentPanel(false);
  //   const updated = localSubtasks.filter((s) => s.id !== subtaskId);
  //   setLocalSubtasks(updated);
  //   const saved = await onUpdate(task.id, { subtasks: updated });
  //   if (saved) setLocalSubtasks(normaliseSubtasks(saved));
  // };

  const handleDeleteSubtask = async (subtaskId) => {
    setCommentPanel(false);

    // Optimistic removal
    setLocalSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));

    try {
      await deleteSubtask(subtaskId); // DELETE /api/subtasks/:subtaskId
    } catch (err) {
      // Roll back the optimistic removal if the server rejected it (e.g. 403)
      const saved = await onUpdate(task.id, { subtasks: localSubtasks });
      if (saved) setLocalSubtasks(normaliseSubtasks(saved));
      console.error("Delete failed:", err);
    }
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

  const [confirmUntickId, setConfirmUntickId] = useState(null);
  const [confirmDeleteSubtaskId, setConfirmDeleteSubtaskId] = useState(null);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null);

  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [savingSubtaskEdit, setSavingSubtaskEdit] = useState(false);

  const handleEditSubtask = async (subtaskId) => {
    if (!editingSubtaskTitle.trim()) return;
    setSavingSubtaskEdit(true);
    try {
      await updateSubtask(subtaskId, editingSubtaskTitle.trim());
      setLocalSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtaskId ? { ...s, title: editingSubtaskTitle.trim() } : s,
        ),
      );
      setEditingSubtaskId(null);
      setEditingSubtaskTitle("");
    } catch (err) {
      console.error("Failed to edit subtask:", err.message);
    } finally {
      setSavingSubtaskEdit(false);
    }
  };

  // ── No-subtask progress toggle (0 ↔ 100) ────────────────────────────────
  const [progressSaving, setProgressSaving] = useState(false);
  const handleProgressToggle = async () => {
    if (progressSaving) return;
    const newProgress = localProgress === 100 ? 0 : 100;
    setLocalProgress(newProgress); // optimistic
    setProgressSaving(true);
    try {
      await updateTaskProgress(task.id, newProgress);
      onUpdate(task.id, { progress: newProgress }); // propagate to parent
    } catch {
      setLocalProgress(localProgress); // revert on failure
    } finally {
      setProgressSaving(false);
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
      setCommentCounts((prev) => ({
        ...prev,
        [activeSubtaskId]: (prev[activeSubtaskId] ?? 0) + 1,
      }));
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
      setCommentCounts((prev) => ({
        ...prev,
        [activeSubtaskId]: Math.max(0, (prev[activeSubtaskId] ?? 1) - 1),
      }));
    } catch (err) {
      console.error("Failed to delete comment:", err.message);
    }
  };

  // ── Current logged-in user (for ownership check) ─────────────────────────
  const currentUser = JSON.parse(localStorage.getItem("qtask_user") ?? "null");

  // ── Comment edit state ────────────────────────────────────────────────────
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    setSavingCommentEdit(true);
    try {
      await updateSubtaskComment(commentId, editingCommentText.trim());
      // Patch local state — no refetch needed
      setSubtaskComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, comment: editingCommentText.trim() } : c,
        ),
      );
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (err) {
      console.error("Failed to edit comment:", err.message);
    } finally {
      setSavingCommentEdit(false);
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
                  <li key={subtask.id}>
                    {confirmUntickId === subtask.id ? (
                      /* ── Untick confirmation strip ── */
                      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                        <AlertTriangle
                          size={14}
                          className="text-amber-400 shrink-0"
                        />
                        <span className="flex-1 text-sm text-amber-800">
                          Mark <strong>{subtask.title}</strong> as incomplete?
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmUntickId(null)}
                          className="text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmUntickId(null);
                            handleToggleSubtask(subtask.id);
                          }}
                          className="px-3 py-1 text-sm font-semibold bg-amber-400 text-white rounded-lg hover:bg-amber-500 transition shrink-0 cursor-pointer"
                        >
                          Yes, undo
                        </button>
                      </div>
                    ) : confirmDeleteSubtaskId === subtask.id ? (
                      /* ── Delete confirmation strip ── */
                      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                        <AlertTriangle
                          size={14}
                          className="text-red-400 shrink-0"
                        />
                        <span className="flex-1 text-sm text-red-800">
                          Delete <strong>{subtask.title}</strong>? This cannot
                          be undone.
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSubtaskId(null)}
                          className="text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteSubtaskId(null);
                            handleDeleteSubtask(subtask.id);
                          }}
                          className="px-3 py-1 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition shrink-0 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      /* ── Normal subtask row ── */
                      <div className="flex items-center gap-3 group">
                        <button
                          type="button"
                          onClick={() => {
                            if (subtask.isDone) {
                              setConfirmUntickId(subtask.id);
                            } else {
                              handleToggleSubtask(subtask.id);
                            }
                          }}
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
                        {/* Title — inline edit mode or plain text */}
                        {editingSubtaskId === subtask.id ? (
                          <div className="flex flex-1 gap-1.5 min-w-0">
                            <input
                              autoFocus
                              value={editingSubtaskTitle}
                              onChange={(e) =>
                                setEditingSubtaskTitle(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleEditSubtask(subtask.id);
                                if (e.key === "Escape") {
                                  setEditingSubtaskId(null);
                                  setEditingSubtaskTitle("");
                                }
                              }}
                              className="flex-1 min-w-0 border border-blue-300 rounded-md px-2 py-0.5 text-sm focus:outline-none focus:border-blue-500"
                              disabled={savingSubtaskEdit}
                            />
                            <button
                              type="button"
                              onClick={() => handleEditSubtask(subtask.id)}
                              disabled={
                                savingSubtaskEdit || !editingSubtaskTitle.trim()
                              }
                              className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-40 cursor-pointer shrink-0"
                            >
                              {savingSubtaskEdit ? "…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubtaskId(null);
                                setEditingSubtaskTitle("");
                              }}
                              className="text-xs px-2 py-0.5 text-gray-500 hover:text-gray-700 cursor-pointer shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`flex-1 text-sm transition-colors ${
                              subtask.isDone
                                ? "line-through text-gray-400"
                                : "text-gray-700"
                            }`}
                          >
                            <LinkText text={subtask.title} />
                          </span>
                        )}
                        {/* Action buttons — hidden while in edit mode */}
                        {editingSubtaskId !== subtask.id && (
                          <>
                            {/* Edit — only for creator */}
                            {subtask.creatorId === currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubtaskId(subtask.id);
                                  setEditingSubtaskTitle(subtask.title);
                                }}
                                className="text-blue-400 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-sm leading-none shrink-0 cursor-pointer"
                                title="Edit subtask"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {/* Comments */}
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
                              {(commentCounts[subtask.id] ?? 0) > 0 && (
                                <span className="text-[10px] font-semibold leading-none">
                                  {commentCounts[subtask.id]}
                                </span>
                              )}
                            </button>
                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDeleteSubtaskId(subtask.id)
                              }
                              className="text-gray-500 hover:text-red-400 transition-colors text-sm leading-none shrink-0 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
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
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  <LinkText text={task.description} />
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
                      Dev Assignee
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

                  {/* Creator */}
                  {task.creatorName && (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Created by
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-[10px]">
                          {task.creatorName.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-700">
                          {task.creatorName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Severity — read-only */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Severity
                    </p>
                    <p className="text-sm text-gray-700">
                      {task.severityLabel ?? task.severity ?? "—"}
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

                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Start date
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatShortDate(task.startDate) ?? "—"}
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

                  {/* Status — inline editable dropdown (no edit mode needed) */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Status
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: localStatus.color ?? "#94a3b8",
                          border: "1px solid rgba(0,0,0,0.1)",
                          transition: "background 0.2s ease",
                          opacity: statusSaving ? 0.5 : 1,
                          display: "inline-block",
                        }}
                      />
                      <select
                        value={editForm.statusId}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={statusSaving}
                        className="flex-1 text-xs font-semibold border border-transparent hover:border-gray-200 focus:border-blue-400 rounded-lg px-2 py-1 bg-transparent focus:bg-white focus:outline-none transition cursor-pointer disabled:opacity-50"
                        style={{ color: "#374151" }} // Default the color to black for readability
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
                    Editing task details
                  </p>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setField("title", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      placeholder="Task title"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setField("description", e.target.value)}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                      placeholder="Task description (optional)"
                    />
                  </div>

                  {/* Dev assignee */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Dev Assignee
                    </label>
                    <select
                      value={editForm.assigneeId}
                      onChange={(e) => setField("assigneeId", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">Unassigned</option>
                      {devUsers.map((u) => (
                        <option key={u.userId} value={u.userId ?? u.userId}>
                          {u.name}
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
                        <option key={u.userId} value={u.userId ?? u.userId}>
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

                  {/* Start date + Target date — side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Start date
                      </label>
                      <input
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) => setField("startDate", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>

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
                {!editMode && localSubtasks.length === 0 && (
                  <button
                    type="button"
                    onClick={handleProgressToggle}
                    disabled={progressSaving}
                    className="flex items-center gap-2 mt-1 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                        localProgress === 100
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-300 group-hover:border-blue-400"
                      }`}
                    >
                      {localProgress === 100 && (
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
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors select-none">
                      {localProgress === 100 ? "Completed" : "Mark as complete"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* ── 4. Attachments ── */}
            <div className="border-b border-gray-100">
              <FileUpload taskId={task.id} isPM={isPM} />
            </div>

            {/* ── 5. Footer: delete ── */}
            {isPM && (
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
                      Delete <strong>{task.title}</strong>? This cannot be
                      undone.
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
            )}
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

                  <div
                    className={`flex-1 min-w-0 relative ${
                      (c.userId === currentUser?.id ||
                        currentUser?.role === "Admin") &&
                      editingCommentId !== c.id
                        ? "pr-16"
                        : ""
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {c.commenterName ?? c.commenterUsername ?? "Unknown"}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(c.commentDate).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* ── Inline edit mode ── */}
                    {editingCommentId === c.id ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          autoFocus
                          value={editingCommentText}
                          onChange={(e) =>
                            setEditingCommentText(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey)
                              handleEditComment(c.id);

                            if (e.key === "Escape") {
                              setEditingCommentId(null);
                              setEditingCommentText("");
                            }
                          }}
                          className="w-full border border-blue-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                          disabled={savingCommentEdit}
                        />

                        <div className="flex gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleEditComment(c.id)}
                            disabled={
                              savingCommentEdit || !editingCommentText.trim()
                            }
                            className="text-xs px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-40 cursor-pointer"
                          >
                            {savingCommentEdit ? "…" : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText("");
                            }}
                            className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 wrap-break-words whitespace-pre-wrap mt-0.5">
                        <LinkText text={c.comment} />
                      </p>
                    )}

                    {/* ── Action buttons — only shown for comment owner OR Admin── */}
                    {(c.userId === currentUser?.id ||
                      currentUser?.role === "Admin") &&
                      editingCommentId !== c.id &&
                      (confirmDeleteCommentId === c.id ? (
                        <div className="flex items-center gap-2 mt-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                          <span className="flex-1 text-xs text-red-700">
                            Delete this comment?
                          </span>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCommentId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteCommentId(null);
                              handleDeleteComment(c.id);
                            }}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        /* ── Normal edit / delete buttons ── */
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(c.id);
                              setEditingCommentText(c.comment ?? "");
                            }}
                            className="text-blue-400 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeleteCommentId(c.id)
                            } /* ← was handleDeleteComment directly */
                            className="text-red-500 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
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
