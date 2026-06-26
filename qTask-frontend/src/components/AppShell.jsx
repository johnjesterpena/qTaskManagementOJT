import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import qtechLogo from "../assets/qtech_original_logo.PNG";

import KanbanBoard from "./board/KanbanBoard";
import KanbanHeader from "./board/KanbanHeader";
import KanbanProjectListView from "./board/KanbanProjectListView";
import DoneModal from "./modals/DoneModal";
import AddTaskModal from "./modals/AddTaskModal";
import AddColumnModal from "./modals/AddColumnModal";
import TaskDetailModal from "./modals/TaskDetailModal";
import Sidebar from "./layout/Sidebar";
import ActivityLogPage from "./pages/ActivityLogPage";
import AllTasksPage from "./pages/AllTasksPage";
import AllSubtasksPage from "./pages/AllSubtasksPage";
import UserManagementPage from "./pages/UserManagementPage";
import ProjectsPage from "./pages/ProjectsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import SchedulePage from "./pages/SchedulePage";
import EisenhowerMatrixPage from "./pages/EisenhowerMatrixPage";
import MasterMonitoringPage from "./pages/MasterMonitoringPage";

import { getDefaultPage } from "../config/navigation";

import { useBoardSync } from "./hooks/useBoardSync"; // SignalR hook for real-time updates
import { useSubtaskComments } from "./hooks/useSubtaskComments"; // SignalR hook for real-time updates

import {
  fetchPhases,
  fetchStatuses,
  fetchSeverities,
  fetchTasks,
  fetchUsers,
  fetchProjects,
  fetchMyProjects,
  fetchSubtaskComments,
  createPhase,
  moveTask,
  createTask,
  updateTask,
  deleteTask,
  updateSubtasks,
  fetchProjectUsers,
} from "../services/api";

// ── Helpers ───────────────────────────────────────────────────
function getGrouping(role) {
  if (role === "Developer") return "dev";
  if (role === "QA") return "qa";
  return null;
}

function isPMRole(role) {
  return role === "ProjectManager" || role === "Admin";
}

const SectionLabel = ({ children, collapsed, onToggle }) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-3 mb-3 w-full text-left group"
  >
    <span
      className="text-xs font-black uppercase tracking-widest"
      style={{ letterSpacing: "0.12em", color: "#1C61A1" }}
    >
      {children}
    </span>
    <div className="flex-1 h-px" style={{ background: "#DCDCDC" }} />
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{
        color: "#1C61A1",
        transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
        flexShrink: 0,
      }}
    >
      <path
        d="M2 4L6 8L10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

// ─────────────────────────────────────────────────────────────
export default function AppShell({ currentUser, logout }) {
  const location = useLocation();
  const navigate = useNavigate();
  // Derive activePage from URL (strip leading slash)
  const activePage =
    location.pathname.replace(/^\//, "") || getDefaultPage(currentUser.role);
  const setActivePage = useCallback((page) => navigate(`/${page}`), [navigate]);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [devPhases, setDevPhases] = useState([]);
  const [qaPhases, setQaPhases] = useState([]);
  const [pmPhases, setPmPhases] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const [recentMoves, setRecentMoves] = useState([]);
  const [projectSubtaskCounts, setProjectSubtaskCounts] = useState({});
  const toastTimeouts = useRef({});
  const [doneModal, setDoneModal] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [analyticsProjectId, setAnalyticsProjectId] = useState(null);

  const [projectUsers, setProjectUsers] = useState([]);

  // ── Kanban filter state ───────────────────────────────────
  const [kanbanFilters, setKanbanFilters] = useState({
    userId: null,
    severityId: null,
    statusId: null,
  });
  
  // ── Tab state for kanban pages ─────────────────────────────
  const [activeKanbanTab, setActiveKanbanTab] = useState("dev");

  const handleFilterChange = useCallback((key, value) => {
    setKanbanFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setKanbanFilters({ userId: null, severityId: null, statusId: null });
  }, []);

  const isPM = isPMRole(currentUser.role);
  const grouping = getGrouping(currentUser.role);
  const allPhases = [...devPhases, ...qaPhases, ...pmPhases];

  // ── Load static data on mount ─────────────────────────────
  useEffect(() => {
    async function loadStatic() {
      try {
        setLoading(true);
        const [
          projectData,
          devPhaseData,
          qaPhaseData,
          pmPhaseData,
          statusData,
          severityData,
          userData,
        ] = await Promise.all([
          isPM ? fetchProjects() : fetchMyProjects(),
          isPM ? fetchPhases("dev") : fetchPhases(grouping),
          isPM ? fetchPhases("qa") : Promise.resolve([]),
          isPM ? fetchPhases("pm") : Promise.resolve([]),
          fetchStatuses(),
          fetchSeverities(),
          fetchUsers(),
        ]);
        setProjects(projectData);
        setProjectSubtaskCounts(
          projectData.reduce((acc, project) => {
            acc[project.id] = Number(project.untickedSubtaskCount ?? 0);
            return acc;
          }, {}),
        );
        setDevPhases(devPhaseData);
        setQaPhases(qaPhaseData);
        setPmPhases(pmPhaseData);
        setStatuses(statusData);
        setSeverities(severityData);
        setUsers(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStatic();
  }, [isPM, grouping]);


  // SignalR hook to sync board state in real-time across users —
  //  listens for global events and updates tasks, phases, severities, and statuses accordingly.
  useBoardSync({
    activeProjectId,
    setTasks,
    setDetailTask,
    setRenderKey,
  });


  // ── Load project users when activeProjectId changes ────────
  // Only fetch when a real project is selected — never with null
  useEffect(() => {
    if (!activeProjectId) {
      setProjectUsers([]);
      return;
    }
    fetchProjectUsers(activeProjectId)
      .then(setProjectUsers)
      .catch((err) =>
        console.error("Failed to load project users:", err.message),
      );
  }, [activeProjectId]);

  // ── Load tasks when activeProjectId changes ───────────────
  // PM:     skip when no project selected (they use the project-list gate) — EXCEPT for all-tasks and all-subtasks pages
  // Dev/QA: always load — null = all their projects, id = specific project
  useEffect(() => {
    const isListPage = ["all-tasks", "all-subtasks"].includes(activePage);
    if (!activeProjectId && isPM && !isListPage) return;
    async function loadTasks() {
      try {
        const isQA = currentUser.role === "QA";
        const isDev = currentUser.role === "Developer";
        // For list pages, load all tasks regardless of role (Admin/PM see all)
        // For Kanban pages, filter by role
        const data = await fetchTasks(
          activeProjectId ?? null,
          isQA || isDev ? currentUser.id : null,
          isQA ? "qa" : isDev ? "dev" : null,
        );
        setTasks(data);

        if (!activeProjectId) {
          setProjectSubtaskCounts(
            data.reduce((acc, task) => {
              const undoneCount = (task.subtasks ?? []).filter((s) => !s.isDone).length;
              if (undoneCount > 0) {
                acc[task.projectId] = (acc[task.projectId] ?? 0) + undoneCount;
              }
              return acc;
            }, {}),
          );
        }
      } catch (err) {
        console.error("Failed to load tasks:", err.message);
      }
    }
    loadTasks();
  }, [activeProjectId, isPM, currentUser, activePage]);

  // ── Fetch subtask comments ───────────────
  // useEffect(() => {
  //   async function loadSubtaskComments() {
  //     try {
  //       const subtaskComments = await fetchSubtaskComments(subtask_id);
  //       setSubtaskComments(subtaskComments);
  //     } catch (err) {
  //       console.error("Failed to load subtask comments:", err.message);
  //     }
  //   }
  //   loadSubtaskComments();
  // }, []);

  // ── Real-time update listeners ────────────────────────────
  useEffect(() => {
    const handleProjectUpdate = () => {
      if (!isPM) return;
      fetchProjects().then((updatedProjects) => {
        setProjects(updatedProjects);
        setProjectSubtaskCounts(
          updatedProjects.reduce((acc, project) => {
            acc[project.id] = Number(project.untickedSubtaskCount ?? 0);
            return acc;
          }, {}),
        );

        if (
          activeProjectId &&
          !updatedProjects.find((p) => p.id === activeProjectId)
        ) {
          handleProjectBack();
        }
      });
    };

    const handlePhaseUpdate = () => {
      if (isPM) {
        Promise.all([
          fetchPhases("dev"),
          fetchPhases("qa"),
          fetchPhases("pm"),
        ]).then(([dev, qa, pm]) => {
          setDevPhases(dev);
          setQaPhases(qa);
          setPmPhases(pm);
        });
      } else {
        fetchPhases(grouping).then(setDevPhases);
      }
      setRenderKey((k) => k + 1);
    };

    const handleSeverityUpdate = () => {
      fetchSeverities().then(setSeverities);
      if (activeProjectId) {
        const isQA = currentUser.role === "QA";
        const isDev = currentUser.role === "Developer";
        fetchTasks(
          isPM ? activeProjectId : null,
          isQA || isDev ? currentUser.id : null,
          isQA ? "qa" : isDev ? "dev" : null,
        ).then(setTasks);
      }
      setRenderKey((k) => k + 1);
    };

    const handleStatusUpdate = () => {
      fetchStatuses().then(setStatuses);
      setRenderKey((k) => k + 1);
    };

    window.addEventListener("projects-updated", handleProjectUpdate);
    window.addEventListener("phases-updated", handlePhaseUpdate);
    window.addEventListener("severities-updated", handleSeverityUpdate);
    window.addEventListener("statuses-updated", handleStatusUpdate);

    return () => {
      window.removeEventListener("projects-updated", handleProjectUpdate);
      window.removeEventListener("phases-updated", handlePhaseUpdate);
      window.removeEventListener("severities-updated", handleSeverityUpdate);
      window.removeEventListener("statuses-updated", handleStatusUpdate);
    };
  }, [isPM, grouping, activeProjectId, currentUser]);

  // ── Derived ───────────────────────────────────────────────
  const tasksByPhase = allPhases.reduce((acc, p) => {
    acc[p.id] = tasks.filter((t) => t.phaseId === p.id);
    return acc;
  }, {});

  const untickedSubtaskCountByProject = tasks.reduce((acc, task) => {
    const undoneCount = (task.subtasks ?? []).filter((s) => !s.isDone).length;
    if (undoneCount > 0) {
      acc[task.projectId] = (acc[task.projectId] ?? 0) + undoneCount;
    }
    return acc;
  }, {});

  const projectsWithUntickedCount = projects.map((project) => {
    const backendCount = project.untickedSubtaskCount;
    const cacheCount = projectSubtaskCounts[project.id] ?? 0;
    const derivedCount = untickedSubtaskCountByProject[project.id] ?? 0;

    return {
      ...project,
      untickedSubtaskCount:
        backendCount ?? cacheCount ??
        (activeProjectId === project.id ? derivedCount : 0),
    };
  });

  // Apply kanban filters on top of tasksByPhase
  const filteredTasksByPhase = allPhases.reduce((acc, p) => {
    acc[p.id] = (tasksByPhase[p.id] ?? []).filter((t) => {
      if (kanbanFilters.userId && t.assigneeId !== kanbanFilters.userId)
        return false;
      if (kanbanFilters.severityId && t.severityId !== kanbanFilters.severityId)
        return false;
      if (kanbanFilters.statusId && t.statusId !== kanbanFilters.statusId)
        return false;
      return true;
    });
    return acc;
  }, {});

  const findTask = useCallback(
    (taskId) => tasks.find((t) => t.id === taskId),
    [tasks],
  );
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const totalTasks = tasks.length;
  const activeProjectUntickedCount = tasks.filter((t) => {
    const phase = allPhases.find((p) => p.id === t.phaseId);
    return !phase?.isFinal;
  }).length;
  const doneTask = doneModal ? findTask(doneModal.taskId) : null;

  // ── Handlers ──────────────────────────────────────────────
  const handleProjectSelect = useCallback((projectId) => {
    setActiveProjectId(projectId);
    setRenderKey((k) => k + 1);
  }, []);

  const handleProjectBack = useCallback(() => {
    setActiveProjectId(null);
    setTasks([]);
  }, []);

  const handleDragEnd = useCallback(
    async (fromPhaseId, toPhaseId, taskId) => {
      if (fromPhaseId === toPhaseId) return;
      const targetPhase = allPhases.find((p) => p.id === toPhaseId);
      if (targetPhase?.isFinal) {
        setDoneModal({ taskId, targetPhaseId: toPhaseId });
      } else {
        try {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    phaseId: toPhaseId,
                    phaseLabel: targetPhase?.label,
                    phaseGrouping: targetPhase?.grouping,
                  }
                : t,
            ),
          );
          setRenderKey((k) => k + 1);
          const updated = await moveTask(taskId, toPhaseId);
          setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
        } catch (err) {
          console.error("Move failed:", err.message);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, phaseId: fromPhaseId } : t,
            ),
          );
          setRenderKey((k) => k + 1);
          alert(`Move failed: ${err.message}`);
        }
      }
    },
    [allPhases],
  );

  // Move with undo — calls the same handler but shows a temporary toast
  const removeToast = useCallback((toastId) => {
    setRecentMoves((prev) => prev.filter((toast) => toast.id !== toastId));
    if (toastTimeouts.current[toastId]) {
      clearTimeout(toastTimeouts.current[toastId]);
      delete toastTimeouts.current[toastId];
    }
  }, []);

  const startToastTimeout = useCallback(
    (toastId) => {
      if (toastTimeouts.current[toastId]) {
        clearTimeout(toastTimeouts.current[toastId]);
      }
      toastTimeouts.current[toastId] = window.setTimeout(() => {
        setRecentMoves((prev) => prev.filter((toast) => toast.id !== toastId));
        delete toastTimeouts.current[toastId];
      }, 5000);
    },
    [],
  );

  const clearToastTimeout = useCallback((toastId) => {
    if (toastTimeouts.current[toastId]) {
      clearTimeout(toastTimeouts.current[toastId]);
      delete toastTimeouts.current[toastId];
    }
  }, []);

  const moveTaskWithUndo = useCallback((fromPhaseId, toPhaseId, taskId) => {
    handleDragEnd(fromPhaseId, toPhaseId, taskId);

    const toastId = `${taskId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newToast = { id: toastId, taskId, fromPhaseId, toPhaseId };

    setRecentMoves((prev) => [...prev, newToast]);
    startToastTimeout(toastId);
  }, [handleDragEnd, startToastTimeout]);

  const undoToast = useCallback(
    (toast) => {
      clearToastTimeout(toast.id);
      const currentTask = findTask(toast.taskId);
      const currentPhaseId = currentTask?.phaseId ?? toast.toPhaseId;
      if (currentPhaseId !== toast.fromPhaseId) {
        handleDragEnd(currentPhaseId, toast.fromPhaseId, toast.taskId);
      }
      removeToast(toast.id);
    },
    [clearToastTimeout, findTask, handleDragEnd, removeToast],
  );

  const dismissToast = useCallback(
    (toastId) => {
      removeToast(toastId);
    },
    [removeToast],
  );

  const handleDoneConfirm = useCallback(
  async (actualEndDate) => {
    if (!doneModal) return;
    const { taskId, targetPhaseId } = doneModal;
    const targetPhase = allPhases.find((p) => p.id === targetPhaseId);

    // Capture original phase BEFORE the optimistic update so we can roll back
    const originalTask = tasks.find((t) => t.id === taskId);
    const originalPhaseId = originalTask?.phaseId;

    try {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                phaseId: targetPhaseId,
                phaseLabel: targetPhase?.label,
                actualEndDate,
                //progress: 100, // removed so we don't set the progress to 100
              }
            : t,
        ),
      );
      setRenderKey((k) => k + 1);
      const updated = await moveTask(taskId, targetPhaseId, actualEndDate);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      } catch (err) {
          console.error("Done confirm failed:", err.message);

          // Roll back — restore the task to its original phase, same as handleDragEnd does
          if (originalPhaseId !== undefined) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId ? { ...t, phaseId: originalPhaseId } : t,
              ),
            );
            setRenderKey((k) => k + 1);
          }

          alert(`Failed to mark done: ${err.message}`);
        } finally {
          setDoneModal(null);
        }
      },
      [doneModal, allPhases, tasks],
    );

  const handleAddTask = useCallback(
    async (formData) => {
      try {
        const newTask = await createTask({
          ...formData,
          projectId: activeProjectId,
        });
        // setTasks((prev) => [newTask, ...prev]); //SignalR and the database becomes the source of truth
        setShowAddTask(false);
        setRenderKey((k) => k + 1);
      } catch (err) {
        console.error("Create task failed:", err.message);
        alert(`Failed to create task: ${err.message}`);
      }
    },
    [activeProjectId],
  );

  const handleAddColumn = useCallback(
    async ({ label, isFinal, isDefault }) => {
      const maxOrder = allPhases.reduce(
        (max, p) => Math.max(max, p.sortOrder ?? 0),
        0,
      );
      const saved = await createPhase({
        label,
        isFinal: isFinal ? 1 : 0,
        isDefault: isDefault ? 1 : 0,
        sortOrder: maxOrder + 1,
      });
      if (saved.grouping === "dev") setDevPhases((prev) => [...prev, saved]);
      else if (saved.grouping === "pm") setPmPhases((prev) => [...prev, saved]);
      else setQaPhases((prev) => [...prev, saved]);
      setShowAddColumn(false);
      setRenderKey((k) => k + 1);
      window.dispatchEvent(new Event("phases-updated"));
    },
    [allPhases],
  );

  // ── Edit task — optimistically patches statusLabel + statusColor ──────────
  // The modal passes statusLabel and statusColor in the payload (resolved from
  // the statuses list) so cards update immediately without waiting for a DB
  // refetch. The DB response (updated) is still applied afterwards to stay
  // consistent, but we preserve the resolved display fields if the DB row
  // doesn't return them.
  const handleEditTask = useCallback(async (taskId, payload) => {
    // Pull out the display fields before sending to the API — they are
    // client-side only and the server doesn't need them.
    const { statusLabel, statusColor, ...apiPayload } = payload;

    // Optimistically apply the resolved display fields immediately so that
    // TaskCard's useEffect picks them up before the API call resolves.
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              ...apiPayload,
              ...(statusLabel !== undefined && { statusLabel }),
              ...(statusColor !== undefined && { statusColor }),
            }
          : t,
      ),
    );
    setDetailTask((prev) =>
      prev?.id === taskId
        ? {
            ...prev,
            ...apiPayload,
            ...(statusLabel !== undefined && { statusLabel }),
            ...(statusColor !== undefined && { statusColor }),
          }
        : prev,
    );

    try {
      const updated = await updateTask(taskId, apiPayload);

      // Merge the DB response but keep the resolved display fields in case
      // the API row doesn't join them back (e.g. statusLabel / statusColor).
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...updated,
                statusLabel:
                  updated.statusLabel ?? statusLabel ?? t.statusLabel,
                statusColor:
                  updated.statusColor ?? statusColor ?? t.statusColor,
              }
            : t,
        ),
      );
      setDetailTask((prev) =>
        prev?.id === taskId
          ? {
              ...updated,
              statusLabel:
                updated.statusLabel ?? statusLabel ?? prev.statusLabel,
              statusColor:
                updated.statusColor ?? statusColor ?? prev.statusColor,
            }
          : prev,
      );
    } catch (err) {
      console.error("Edit task failed:", err.message);
      throw err;
    }
  }, []);

  const handleDeleteTask = useCallback(async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setDetailTask(null);
      setRenderKey((k) => k + 1);
    } catch (err) {
      console.error("Delete task failed:", err.message);
      throw err;
    }
  }, []);

  const handleCardClick = useCallback((task) => setDetailTask(task), []);

  const handleUpdateSubtasks = useCallback(async (taskId, newSubtasks) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    try {
      const updated = await updateSubtasks(taskId, newSubtasks);
      const savedSubtasks = updated.subtasks ?? newSubtasks;
      const newUndoneCount = savedSubtasks.filter((s) => !s.isDone).length;
      const oldUndoneCount = (currentTask?.subtasks ?? []).filter((s) => !s.isDone).length;
      const countDelta = newUndoneCount - oldUndoneCount;
      const projectId = currentTask?.projectId ?? updated.projectId;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subtasks: savedSubtasks } : t,
        ),
      );

      if (projectId != null) {
        setProjectSubtaskCounts((prev) => ({
          ...prev,
          [projectId]: Math.max((prev[projectId] ?? 0) + countDelta, 0),
        }));
      }

      // Return the server-assigned subtasks so the modal can re-sync its local state
      return savedSubtasks;
    } catch (err) {
      console.error("Subtask update failed:", err.message);
      return newSubtasks; // fall back to optimistic list on error
    }
  }, [tasks]);

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "#f5f9fe",
          fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "#0078D7", borderTopColor: "transparent" }}
          />
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#1C61A1" }}
          >
            Loading board…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: "#f8fafc",
          fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        }}
      >
        <div
          className="rounded-2xl p-6 max-w-sm w-full text-center space-y-3"
          style={{
            background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
            border: "1px solid #1e40af30",
          }}
        >
          <p
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: "#f87171" }}
          >
            Connection Failed
          </p>
          <p className="text-sm font-medium" style={{ color: "#cbd5e1" }}>
            {error}
          </p>
          <p className="text-xs" style={{ color: "#64748b" }}>
            Make sure the Express backend is running
            {/* <code
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ background: "#ffffff10", color: "#93c5fd" }}
            >
              localhost:5000
            </code> */}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 text-sm font-semibold rounded-xl"
            style={{
              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
              color: "#fff",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── PM project list gate ───────────────────────────────────
  const isKanbanPage = ["overview", "kanban", "my-tasks", "qa-board"].includes(
    activePage,
  );
  if (isPM && isKanbanPage && !activeProjectId) {
    const pageMeta = {
      overview: { title: "Overview", subtitle: "Select a project" },
      kanban: { title: "Kanban Board", subtitle: "Select a project" },
      "my-tasks": { title: "My Tasks", subtitle: "Select a project" },
      "qa-board": { title: "QA Board", subtitle: "Select a project" },
    };
    const meta = pageMeta[activePage];
    return (
      <div
        className="flex h-screen overflow-hidden"
        style={{
          background: "#f8fafc",
          fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        }}
      >
        <Sidebar
          currentUser={currentUser}
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={logout}
          projects={projectsWithUntickedCount}
          activeProjectId={activeProjectId}
          activeProjectUntickedCount={activeProjectUntickedCount}
          onProjectSelect={handleProjectSelect}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <KanbanProjectListView
            projects={projectsWithUntickedCount}
            onSelect={handleProjectSelect}
            pageTitle={meta.title}
            pageSubtitle={meta.subtitle}
          />
        </main>
      </div>
    );
  }

  // ── Page content ──────────────────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <DashboardPage
              onNavigate={(page, id) => {
                if (page === "analytics" && id) {
                  setAnalyticsProjectId(id);
                  setActivePage("analytics");
                } else if (page === "analytics") {
                  setAnalyticsProjectId(null);
                  setActivePage("analytics");
                } else if (page === "projects") {
                  setActivePage("projects");
                } else if (page === "users") {
                  setActivePage("users");
                }
              }}
              currentUser={currentUser}
            />
          </div>
        );

      case "overview":
      case "kanban":
        return (
          <>
            <KanbanHeader
              title={
                activePage === "kanban"
                  ? "Kanban Board"
                  : (activeProject?.title ?? "Overview")
              }
              subtitle={`${totalTasks} task${totalTasks !== 1 ? "s" : ""} across ${allPhases.length} phases`}
              isPM={isPM}
              activeProject={activeProject}
              onBack={handleProjectBack}
              onAddTask={() => setShowAddTask(true)}
              users={users}
              severities={severities}
              statuses={statuses}
              filters={kanbanFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            
            {isPM ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex items-center gap-2 px-6 py-4 shrink-0 border-b" style={{ borderColor: "#DCDCDC" }}>
                  {["dev", "qa", "pm"].map((tabId) => {
                    const tabLabels = { dev: "Development", qa: "QA", pm: "Project Management" };
                    const tabLabel = tabLabels[tabId];
                    const isActive = activeKanbanTab === tabId;
                    return (
                      <button
                        key={tabId}
                        onClick={() => setActiveKanbanTab(tabId)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                        style={isActive ? { background: "#e0effe", color: "#1C61A1" } : {}}
                      >
                        {tabLabel}
                      </button>
                    );
                  })}
                </div>
                
                {/* Tab Content - Kanban Board */}
                <div className="relative flex-1 overflow-hidden px-6 pb-4">
                  <div className="relative h-full" style={{ backgroundColor: "rgba(255,255,255,0.80)", position: "relative", zIndex: 1 }}>
                    <KanbanBoard
                      columns={
                        activeKanbanTab === "dev"
                          ? devPhases
                          : activeKanbanTab === "qa"
                          ? qaPhases
                          : pmPhases
                      }
                      tasks={filteredTasksByPhase}
                      renderKey={renderKey}
                      onDragEnd={moveTaskWithUndo}
                      onMoveToPhase={moveTaskWithUndo}
                      allPhases={allPhases}
                      onCardClick={handleCardClick}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden px-6 pb-4">
                <KanbanBoard
                  columns={devPhases}
                  tasks={filteredTasksByPhase}
                  renderKey={renderKey}
                  onDragEnd={moveTaskWithUndo}
                  onMoveToPhase={moveTaskWithUndo}
                  allPhases={allPhases}
                  onCardClick={handleCardClick}
                />
              </div>
            )}
          </>
        );

      case "my-tasks":
        return (
          <>
            <KanbanHeader
              title="My Tasks"
              subtitle="Tasks assigned to you"
              isPM={isPM}
              activeProject={activeProject}
              onBack={handleProjectBack}
              onAddTask={() => setShowAddTask(true)}
              users={users}
              severities={severities}
              statuses={statuses}
              filters={kanbanFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            <div className="relative flex-1 overflow-hidden px-6 pb-4">
              <div className="relative h-full" style={{ backgroundColor: "rgba(255,255,255,0.80)", position: "relative", zIndex: 1 }}>
                <KanbanBoard
                  columns={devPhases}
                  tasks={Object.fromEntries(
                    Object.entries(filteredTasksByPhase).map(
                      ([phaseId, phaseTasks]) => [
                        phaseId,
                        phaseTasks.filter((t) => t.assigneeId === currentUser.id),
                      ],
                    ),
                  )}
                  renderKey={renderKey}
                  onDragEnd={moveTaskWithUndo}
                  onMoveToPhase={moveTaskWithUndo}
                  allPhases={allPhases}
                  onCardClick={handleCardClick}
                />
              </div>
            </div>
          </>
        );

      case "qa-board":
        return (
          <>
            <KanbanHeader
              title="QA Board"
              subtitle={`${totalTasks} task${totalTasks !== 1 ? "s" : ""} in QA pipeline`}
              isPM={isPM}
              activeProject={activeProject}
              onBack={handleProjectBack}
              onAddTask={() => setShowAddTask(true)}
              users={users}
              severities={severities}
              statuses={statuses}
              filters={kanbanFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            <div className="relative flex-1 overflow-hidden px-6 pb-4">
              <div className="relative h-full" style={{ backgroundColor: "rgba(255,255,255,0.80)", position: "relative", zIndex: 1 }}>
                <KanbanBoard
                  columns={devPhases}
                  tasks={filteredTasksByPhase}
                  renderKey={renderKey}
                  onDragEnd={moveTaskWithUndo}
                  onMoveToPhase={moveTaskWithUndo}
                  allPhases={allPhases}
                  onCardClick={handleCardClick}
                />
              </div>
            </div>
          </>
        );

      case "tasks":
      case "all-tasks":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <AllTasksPage
              tasks={tasks}
              allPhases={allPhases}
              currentUser={currentUser}
              onCardClick={handleCardClick}
            />
          </div>
        );

      case "schedule":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <SchedulePage projects={projects} currentUser={currentUser} />
          </div>
        );

      case "matrix":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <EisenhowerMatrixPage
              projects={projects}
              users={users}
              currentUser={currentUser}
            />
          </div>
        );

      case "monitoring":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <MasterMonitoringPage
              projects={projects}
              users={users}
              statuses={statuses}
              phases={allPhases}
              severities={severities}
              currentUser={currentUser}
            />
          </div>
        );

      case "all-subtasks":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <AllSubtasksPage
              tasks={tasks}
              currentUser={currentUser}
              onCardClick={handleCardClick}
            />
          </div>
        );

      case "logs":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <ActivityLogPage currentUser={currentUser} />
          </div>
        );

      case "users":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <UserManagementPage currentUser={currentUser} />
          </div>
        );

      case "projects":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <ProjectsPage users={users} />
          </div>
        );

      case "analytics":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <AnalyticsPage
              selectedId={analyticsProjectId}
              onSelect={setAnalyticsProjectId}
              onBack={() => setAnalyticsProjectId(null)}
              onManageSeverities={() => setActivePage("settings")}
            />
          </div>
        );

      case "settings":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <SettingsPage />
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: "#94a3b8" }}
              >
                Under Development
              </p>
              <p className="text-sm" style={{ color: "#cbd5e1" }}>
                Check back later
              </p>
            </div>
          </div>
        );
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: "#f8fafc",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <Sidebar
        currentUser={currentUser}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={logout}
        projects={projectsWithUntickedCount}
        activeProjectId={activeProjectId}
        activeProjectUntickedCount={activeProjectUntickedCount}
        onProjectSelect={handleProjectSelect}
      />

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {isKanbanPage && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 0,
              overflow: "hidden",
            }}
          >
            <img
              src={qtechLogo}
              alt=""
              style={{
                maxWidth: "60%",
                width: "60%",
                height: "auto",
                objectFit: "contain",
                opacity: 0.18,
                filter: "grayscale(0.12) brightness(1.05)",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </div>
        )}

        {renderPage()}
      </main>

      {/* Modals — outside renderPage so they persist across navigation */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          users={users}
          projectUsers={projectUsers}
          severities={severities}
          statuses={statuses}
          onUpdate={(taskId, fields) => {
            if (fields.subtasks !== undefined)
              return handleUpdateSubtasks(taskId, fields.subtasks);
            if (fields.progress !== undefined)
              setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, progress: fields.progress } : t))
              );
          }}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onClose={() => setDetailTask(null)}
          isPM={isPM}
        />
      )}

      {doneModal && doneTask && (
        <DoneModal
          taskName={doneTask.title}
          onConfirm={handleDoneConfirm}
          onCancel={() => setDoneModal(null)}
        />
      )}

      {/* Move undo toast */}
      {recentMoves.length > 0 && (
        <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 60, display: "flex", flexDirection: "column-reverse", gap: 12 }}>
          {recentMoves.map((toast) => (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              tabIndex={0}
              onMouseEnter={() => clearToastTimeout(toast.id)}
              onMouseLeave={() => startToastTimeout(toast.id)}
              onFocus={() => clearToastTimeout(toast.id)}
              onBlur={() => startToastTimeout(toast.id)}
              style={{
                minWidth: 240,
                maxWidth: 320,
                background: "#ffffff",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                boxShadow: "0 16px 48px rgba(15, 23, 42, 0.08)",
                borderRadius: 16,
                overflow: "hidden",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              }}
            >
              <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    Moved "{findTask(toast.taskId)?.title ?? "task"}"
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                    to {allPhases.find((p) => p.id === toast.toPhaseId)?.label}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => undoToast(toast)}
                    className="px-3 py-1 rounded-lg"
                    style={{
                      background: "#1C61A1",
                      color: "#fff",
                      fontWeight: 700,
                      minWidth: 64,
                    }}
                  >
                    Undo
                  </button>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="px-3 py-1 rounded-lg"
                    style={{
                      background: "#f1f5f9",
                      color: "#374151",
                      fontWeight: 600,
                      minWidth: 64,
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddTask && (
        <AddTaskModal
          onAdd={handleAddTask}
          onClose={() => setShowAddTask(false)}
          users={users}
          phases={allPhases}
          severities={severities}
          activeProject={activeProjectId}
          projectUsers={projectUsers}
        />
      )}

      {showAddColumn && (
        <AddColumnModal
          onAdd={handleAddColumn}
          onClose={() => setShowAddColumn(false)}
        />
      )}
    </div>
  );
}
