import { useState, useRef, useEffect } from "react";
import {
  fetchAttachments,
  uploadAttachment,
  deleteAttachment,
  attachmentDownloadUrl,
} from "../../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "pdf",
  "xlsx",
  "xls",
  "csv",
  "doc",
  "docx",
  "txt",
  "zip",
]);
const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function fileExtension(name) {
  return name.split(".").pop().toLowerCase();
}

function extColor(ext) {
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return "bg-blue-100 text-blue-700";
  if (ext === "pdf") return "bg-red-100 text-red-700";
  if (["xlsx", "xls", "csv"].includes(ext))
    return "bg-green-100 text-green-700";
  if (["doc", "docx"].includes(ext)) return "bg-indigo-100 text-indigo-700";
  if (ext === "zip") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-600";
}

/**
 * FileUpload
 * Self-contained attachment section embedded inside TaskDetailModal.
 * Handles fetch, upload (click or drag-and-drop), preview, download, delete.
 * All file validation mirrors the backend SRS §6.1 rules exactly.
 *
 * Props:
 *   taskId — number
 */
export default function FileUpload({ taskId, isPM }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  // Load existing attachments on mount
  useEffect(() => {
    let active = true;
    fetchAttachments(taskId)
      .then((rows) => {
        if (active) setAttachments(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [taskId]);

  // Client-side validation — mirrors backend SRS §6.1
  function validate(file) {
    const ext = fileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext))
      return `Upload failed: File must be under 10MB and be a valid document/image type. ".${ext}" files are not allowed.`;
    if (file.size > MAX_BYTES)
      return `Upload failed: File must be under 10MB. This file is ${formatBytes(file.size)}.`;
    return null;
  }

  async function handleFile(file) {
    if (!file) return;
    setUploadError("");
    setToastMessage("");
    const err = validate(file);
    if (err) {
      setUploadError(err);
      setToastMessage(err);
      setToastOpen(true);
      return;
    }

    setUploading(true);
    try {
      const saved = await uploadAttachment(taskId, file);
      setAttachments((prev) => [saved, ...prev]);
    } catch (e) {
      const errorMessage = e.message ?? "Upload failed. Please try again.";
      setUploadError(errorMessage);
      setToastMessage(errorMessage);
      setToastOpen(true);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  async function handleDelete(attachmentId) {
    setDeletingId(attachmentId);
    try {
      await deleteAttachment(taskId, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (e) {
      const errorMessage = e.message ?? "Delete failed.";
      setUploadError(errorMessage);
      setToastMessage(errorMessage);
      setToastOpen(true);
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!toastOpen) return undefined;
    const timer = window.setTimeout(() => {
      setToastOpen(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [toastOpen]);

  return (
    <div className="relative p-6 space-y-4">
      {toastOpen && toastMessage && (
        <div
          className="absolute left-1/2 top-4 z-20 w-[min(95%,420px)] -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span className="text-sm text-red-700 flex-1">{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastOpen(false)}
              className="text-red-500 hover:text-red-700"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Attachments
          {attachments.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({attachments.length})
            </span>
          )}
        </h3>
        {isPM && (
          <span className="text-xs text-gray-400">
            Max {MAX_MB} MB · PNG, JPG, PDF, XLSX, DOCX, ZIP
          </span>
        )}
      </div>

      {/* Drop zone */}
      {isPM && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-colors select-none ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {/* Upload cloud icon */}
          <svg
            className={`w-7 h-7 ${dragOver ? "text-blue-500" : "text-gray-300"} transition-colors`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>

          {uploading ? (
            <p className="text-sm text-blue-600 font-medium animate-pulse">
              Uploading…
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Drop a file here, or{" "}
                <span className="text-blue-600 font-medium">browse</span>
              </p>
              <p className="text-xs text-gray-400">
                Screenshots, PDFs, Excel files, Word docs
              </p>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.xlsx,.xls,.csv,.doc,.docx,.txt,.zip"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <svg
            className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3m0 2h.01" />
          </svg>
          <p className="text-xs text-red-600 leading-relaxed">{uploadError}</p>
          <button
            type="button"
            onClick={() => setUploadError("")}
            className="ml-auto text-red-400 hover:text-red-600 text-sm leading-none shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Attachment list */}
      {loading ? (
        <p className="text-xs text-gray-400 text-center py-2">
          Loading attachments…
        </p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-gray-400 italic text-center py-1">
          No files attached yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((att) => {
            const ext = fileExtension(att.originalName);
            const color = extColor(ext);
            const isImg = att.mimeType?.startsWith("image/");
            const previewUrl = `${import.meta.env.VITE_API_URL}/uploads/${taskId}/${att.storedName}`;
            const dlUrl = attachmentDownloadUrl(taskId, att.id);
            const isDeleting = deletingId === att.id;

            return (
              <li
                key={att.id}
                className={`flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 transition-opacity ${isDeleting ? "opacity-50" : ""}`}
              >
                {/* Thumbnail or badge */}
                {isImg ? (
                  <img
                    src={previewUrl}
                    alt={att.originalName}
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <span
                    className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-wide ${color}`}
                  >
                    {ext}
                  </span>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-gray-700 truncate"
                    title={att.originalName}
                  >
                    {att.originalName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatBytes(att.sizeBytes)} ·{" "}
                    {new Date(att.uploadedAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Download */}
                <a
                  href={dlUrl}
                  download={att.originalName}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition shrink-0"
                  title="Download"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 2v8m-3-3l3 3 3-3" />
                    <path d="M3 13h10" />
                  </svg>
                </a>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(att.id)}
                  disabled={isDeleting}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition disabled:opacity-40 shrink-0"
                  title="Delete attachment"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 4h12M6 4V2h4v2M5 4l.5 9h5l.5-9" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
