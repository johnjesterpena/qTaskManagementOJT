// const BASE_URL = "http://localhost:5000/api";
// Default to a server-relative API path when VITE_API_URL is not provided
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    return { message: text };
  }
}

async function request(method, path, body) {
  const stored = localStorage.getItem("qtask_user");
  const user = stored ? JSON.parse(stored) : null;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(user?.id ? { "x-user-id": String(user.id) } : {}),
      ...(user?.role ? { "x-user-role": user.role } : {}),
    },
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await parseJsonResponse(res);

  if (!res.ok) throw new Error(data?.message ?? `Request failed: ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const loginUser = (username, password) =>
  request("POST", "/login", { username, password });

// ── Phases (Kanban columns) ───────────────────────────────────
// Phases drive the board columns. Each task's phaseId determines
// which column it lives in.
export const fetchPhases = (grouping) =>
  request("GET", grouping ? `/phases?grouping=${grouping}` : "/phases");
export const createPhase = (payload) => request("POST", "/phases", payload);
export const updatePhase = (id, payload) =>
  request("PUT", `/phases/${id}`, payload);
export const deletePhase = (id) => request("DELETE", `/phases/${id}`);

// ── Statuses (task workflow attribute — NOT the Kanban column) ─
// Status is a secondary attribute on a task (e.g. Open, For Verification).
// It is shown in the task detail view but does not control the column.
export const fetchStatuses = () => request("GET", "/statuses");
export const createStatus = (payload) => request("POST", "/statuses", payload);
export const updateStatus = (id, payload) =>
  request("PUT", `/statuses/${id}`, payload);
export const deleteStatus = (id) => request("DELETE", `/statuses/${id}`);

// ── Severities ────────────────────────────────────────────────
export const fetchSeverities = () => request("GET", "/severities");
export const fetchSeverityById = (id) => request("GET", `/severities/${id}`); // ADD THIS
export const createSeverity = (payload) =>
  request("POST", "/severities", payload);
export const updateSeverity = (id, payload) =>
  request("PUT", `/severities/${id}`, payload);
export const deleteSeverity = (id) => request("DELETE", `/severities/${id}`);

// ── Users ─────────────────────────────────────────────────────
export const fetchUsers = () => request("GET", "/users");

// ── GET SPECIFIC Users assigned to project ─────────────────────────────────────────────────────
export const fetchProjectUsers = (id) => request("GET", `/users/project/${id}`);

// ── Projects ──────────────────────────────────────────────────
export const fetchMyProjects = () => request("GET", "/projects/my");
export const fetchProjects = () => request("GET", "/projects");
export const createProject = (payload) => request("POST", "/projects", payload);
export const updateProject = (id, payload) =>
  request("PUT", `/projects/${id}`, payload);
export const deleteProject = (id) => request("DELETE", `/projects/${id}`);

// ── Tasks — updated fetchTasks to accept projectId ─────────────
export const fetchTasks = (projectId, assignedUserId, grouping) => {
  const params = new URLSearchParams();
  if (projectId) params.append("projectId", projectId);
  if (assignedUserId) params.append("assignedUserId", assignedUserId);
  if (grouping) params.append("grouping", grouping);
  const query = params.toString();

  return request("GET", `/tasks${query ? `?${query}` : ""}`);
};

export const fetchScheduleTasks = (projectId) => {
  const params = new URLSearchParams();
  if (projectId) params.append("projectId", projectId);
  const query = params.toString();

  return request("GET", `/schedule/tasks${query ? `?${query}` : ""}`);
};

export const fetchEisenhowerTasks = (projectId, assigneeId) => {
  const params = new URLSearchParams();
  if (projectId) params.append("projectId", projectId);
  if (assigneeId) params.append("assigneeId", assigneeId);
  const query = params.toString();

  return request("GET", `/eisenhower/tasks${query ? `?${query}` : ""}`);
};

export const moveEisenhowerTask = (taskId, quadrant) =>
  request("PATCH", `/eisenhower/tasks/${taskId}/quadrant`, { quadrant });

export const quickAddEisenhowerTask = (payload) =>
  request("POST", "/eisenhower/tasks", payload);

export const fetchMasterMonitoringTasks = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.append(key, value);
  });
  const query = params.toString();

  return request("GET", `/mastermonitoring/tasks${query ? `?${query}` : ""}`);
};

// ── Tasks ─────────────────────────────────────────────────────
export const createTask = (payload) => request("POST", "/tasks", payload);

// ── Subtasks Comments ─────────────────────────────────────────────────────
export const fetchSubtaskComments = (subtaskId) =>
  request("GET", `/subtask-comments/${subtaskId}`);

export const fetchSubtaskCommentCounts = (subtaskIds) =>
  request("GET", `/subtask-comments/counts?subtaskIds=${subtaskIds.join(",")}`);

export const createSubtaskComment = (subtaskId, comment) =>
  request("POST", `/subtask-comments/${subtaskId}`, { comment });

export const deleteSubtaskComment = (subtaskId) =>
  request("DELETE", `/subtask-comments/${subtaskId}`);

export const updateSubtaskComment = (commentId, comment) =>
  request("PATCH", `/subtask-comments/${commentId}`, { comment });

export const updateSubtask = (subtaskId, title) =>
  request("PATCH", `/subtasks/${subtaskId}`, { title });

export const deleteSubtask = (subtaskId) =>
  request("DELETE", `/subtasks/${subtaskId}`);


// ── Activity Logs ─────────────────────────────────────────────
export const fetchActivityLogs = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return request("GET", `/activityLogs${params ? `?${params}` : ""}`);
};

/**
 * Move a task to a different phase column (Kanban drag-and-drop).
 * Calls PATCH /api/tasks/:id/phase
 *
 * @param {number} taskId
 * @param {number} phaseId        — the target phase's DB id
 * @param {string} [actualEndDate] — ISO date string, required when isFinal
 */
export const moveTask = (taskId, phaseId, actualEndDate) =>
  request("PATCH", `/tasks/${taskId}/phase`, {
    phaseId,
    ...(actualEndDate ? { actualEndDate } : {}),
  });

export const updateSubtasks = (taskId, subtasks) =>
  request("PATCH", `/tasks/${taskId}/subtasks`, { subtasks });

// PATCH method to set progress from 0 to 100 when no subtask exists, guard is in backend to ensure progress is equal to 0
export const updateTaskProgress = (taskId, progress) =>
  request("PATCH", `/tasks/${taskId}/progress`, { progress });

/** Update task detail fields (assignee, severity, dates, etc.) */
export const updateTask = (taskId, payload) =>
  request("PUT", `/tasks/${taskId}`, payload);

// ── Subtasks ──────────────────────────────────────────────────
export const fetchAllSubtasks = () => request("GET", "/subtasks");

export const deleteTask = (taskId) => request("DELETE", `/tasks/${taskId}`);

// ── Attachments ───────────────────────────────────────────────
export const fetchAttachments = (taskId) =>
  request("GET", `/attachments/${taskId}`);

export async function uploadAttachment(taskId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/attachments/${taskId}`, {
    method: "POST",
    body: formData,
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message ?? "Upload failed");
  return data;
}

export const deleteAttachment = (taskId, attachmentId) =>
  request("DELETE", `/attachments/${taskId}/${attachmentId}`);

export const attachmentDownloadUrl = (taskId, attachmentId) =>
  `${BASE_URL}/attachments/${taskId}/${attachmentId}/download`;

// ── User Management (Admin only) ──────────────────────────────
export const fetchAllUsers = () => request("GET", "/users?all=true");
export const createUser = (payload) => request("POST", "/users", payload);
export const updateUser = (id, payload) =>
  request("PUT", `/users/${id}`, payload);
export const resetUserPassword = (id, password) =>
  request("PATCH", `/users/${id}/password`, { newPassword: password });
export const toggleUserStatus = (id, isActive) =>
  request("PATCH", `/users/${id}/status`, { isActive });
export const deleteUser = (id) => request("DELETE", `/users/${id}`);

// ── Cache Helpers for Severity Colors (Optional Performance Boost) ──
let severityCache = new Map();

export const getSeverityColorWithCache = async (severityId) => {
  if (severityCache.has(severityId)) {
    return severityCache.get(severityId);
  }

  try {
    const severity = await fetchSeverityById(severityId);
    const color = severity?.color || null;
    severityCache.set(severityId, color);
    return color;
  } catch (error) {
    console.error("Failed to fetch severity color:", error);
    return null;
  }
};

export const clearSeverityCache = () => {
  severityCache.clear();
};

// Optional: Update cache when severities are modified
export const updateSeverityCache = (severityId, color) => {
  severityCache.set(severityId, color);
};
