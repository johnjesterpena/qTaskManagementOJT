import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

//const HUB_URL = "http://localhost:5261/hubs/kanban"; // match your launchSettings.json
const HUB_URL = "/hubs/kanban";

/**
 * useBoardSync({ activeProjectId, setTasks, setDetailTask, setRenderKey })
 *
 * Manages a single persistent SignalR connection for the entire Kanban board.
 * Joins the project group when activeProjectId is set, leaves when it changes.
 *
 * Event contract (matches what TaskController broadcasts):
 *   TaskAdded           → full task DTO  (append to list)
 *   TaskUpdated         → full task DTO  (patch in list + open modal)
 *   TaskMoved           → full task DTO  (patch in list + bump renderKey)
 *   SubtasksUpdated     → full task DTO  (patch in list + open modal)
 *   TaskProgressUpdated → { id, progress } (partial patch)
 *   TaskDeleted         → { taskId }     (remove from list)
 *
 * All operations are idempotent so the sender's own optimistic update
 * is simply overwritten with the server-authoritative value — no dedup needed.
 */

export function useBoardSync({
  activeProjectId,
  setTasks,
  setDetailTask,
  setRenderKey,
}) {
  // Keep one connection for the app's lifetime, recreated only when the
  // component unmounts (i.e., user logs out).
  const connectionRef = useRef(null);

  // ── Build and start the connection once ──────────────────────────────────
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // Register all handlers before starting so no events are missed
    // during the connection handshake.

    connection.on("TaskAdded", (task) => {
      setTasks((prev) =>
        // Guard: don't duplicate if the sender's own optimistic add is already there
        prev.some((t) => t.id === task.id) ? prev : [task, ...prev]
      );
      setRenderKey((k) => k + 1);
    });

    connection.on("TaskUpdated", (task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      // Patch the open modal too so it reflects the latest edit immediately
      setDetailTask((prev) => (prev?.id === task.id ? task : prev));
    });

    connection.on("TaskMoved", (task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      setDetailTask((prev) => (prev?.id === task.id ? task : prev));
      setRenderKey((k) => k + 1);
    });

    connection.on("SubtasksUpdated", (task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      // Critical: update the open modal's subtask list in real time
      setDetailTask((prev) => (prev?.id === task.id ? task : prev));
    });

    connection.on("TaskProgressUpdated", ({ id, progress }) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, progress } : t))
      );
      setDetailTask((prev) =>
        prev?.id === id ? { ...prev, progress } : prev
      );
    });

    connection.on("TaskDeleted", ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      // Close the modal if the deleted task is currently open
      setDetailTask((prev) => (prev?.id === taskId ? null : prev));
      setRenderKey((k) => k + 1);
    });

    connection.start().catch((err) =>
      console.error("[BoardSync] Connection failed:", err)
    );

    return () => {
      connection.stop().catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Intentionally empty: one connection for the app's lifetime.
  //   Handlers use setters from React (stable references), so stale closure
  //   is not a concern here.

  // ── Join / leave group when activeProjectId changes ──────────────────────
    useEffect(() => {
        const connection = connectionRef.current;
        if (!connection || connection.state !== signalR.HubConnectionState.Connected)
            return;

        if (activeProjectId) {
            connection.invoke("JoinProject", activeProjectId).catch((err) =>
            console.error("[BoardSync] JoinProject failed:", err)
            );
        } else {
            connection.invoke("JoinAllTasks").catch((err) =>
            console.error("[BoardSync] JoinAllTasks failed:", err)
            );
        }

        return () => {
            if (connection.state !== signalR.HubConnectionState.Connected) return;

            if (activeProjectId) {
            connection.invoke("LeaveProject", activeProjectId).catch(() => {});
            } else {
            connection.invoke("LeaveAllTasks").catch(() => {});
            }
        };
    }, [activeProjectId]);
}