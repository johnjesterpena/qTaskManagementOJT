import { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { fetchSubtaskComments } from "../../services/api";

//const HUB_URL = "http://localhost:5261/hubs/kanban"; // adjust port to match your launchSettings.json
const HUB_URL = "/hubs/kanban";

/**
 * useSubtaskComments(subtaskId)
 *
 * Manages comment state + a SignalR connection scoped to one subtask.
 *
 * Returns:
 *   comments        – current comment list
 *   setComments     – manual setter (for optimistic adds from the local user)
 *   loading         – true while the initial fetch is in flight
 *
 * Lifecycle:
 *   - Opens the hub connection and joins the subtask group on mount
 *   - Re-fetches + rejoins whenever subtaskId changes
 *   - Leaves the group and stops the connection on unmount
 */
export function useSubtaskComments(subtaskId, commentCounts, setCommentCounts) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Keep a stable ref to the connection so the effect cleanup can reach it
  const connectionRef = useRef(null);

  useEffect(() => {
    if (!subtaskId) return;

    let cancelled = false; // guard against setting state after unmount

    // ── 1. Build the connection ───────────────────────────────────────────
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()          // retries on transient drops
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // ── 2. Register event handlers BEFORE starting ────────────────────────
    //    "ReceiveComment"  → another user posted a comment
    connection.on("ReceiveComment", (newComment) => {
      if (!cancelled)
        // setComments((prev) => {
        //   // Guard against the server echoing back our own optimistic add
        //   if (prev.some((c) => c.id === newComment.id)) return prev;
        //   return [...prev, newComment];
        // });
        setComments((prev) => [...prev, newComment]);
        setCommentCounts((prev) => ({        // ← add this
            ...prev,
            [newComment.subtaskId]: (prev[newComment.subtaskId] ?? 0) + 1,
        }));
    });

    //    "UpdateComment"  → another user edited a comment
    connection.on("UpdateComment", ({ id, comment }) => {
      if (!cancelled)
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, comment } : c))
        );
    });

    //    "DeleteComment"  → another user deleted a comment
    connection.on("DeleteComment", (deletedId) => {
      if (!cancelled)
        setComments((prev) => prev.filter((c) => c.id !== deletedId));
        const exists = prev.some((c) => c.id === deletedId);
        if (exists) {
            setCommentCounts((p) => ({
            ...p,
            [subtaskId]: Math.max(0, (p[subtaskId] ?? 1) - 1),
            }));
        }
        return prev.filter((c) => c.id !== deletedId);
    });


    // ── 3. Start connection, join group, fetch initial comments ───────────
    const init = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinSubTask", subtaskId);

        if (!cancelled) {
          setLoading(true);
          const initial = await fetchSubtaskComments(subtaskId);
          if (!cancelled) setComments(initial);
        }
      } catch (err) {
        console.error("[SignalR] init failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    // ── 4. Cleanup: leave group and stop connection ───────────────────────
    return () => {
      cancelled = true;
      if (
        connection.state === signalR.HubConnectionState.Connected ||
        connection.state === signalR.HubConnectionState.Connecting
      ) {
        // Best-effort leave; don't await (cleanup must be synchronous)
        connection.invoke("LeaveSubTask", subtaskId).catch(() => {});
        connection.stop().catch(() => {});
      }
    };
  }, [subtaskId]);

  return { comments, setComments, loading };
}