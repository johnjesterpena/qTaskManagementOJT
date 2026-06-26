import { useState, useEffect, useCallback } from "react";
import {
  FolderPlus,
  Pencil,
  Trash2,
  FolderOpen,
  Users,
  CalendarClock,
  CheckSquare,
} from "lucide-react";
import { clsx } from "clsx";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/api";
import { ProjectFormModal, DeleteConfirmModal } from "../modals/ProjectModal";
const ACTION_COLORS = {
  blue: "text-blue-400 hover:text-blue-600 hover:bg-blue-50",
  red: "text-red-400 hover:text-red-600 hover:bg-red-50",
};

function KpiCard({ label, value, accent, sub, icon: Icon }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #20476E 60%, #1C61A1)",
        border: `1px solid ${accent}40`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />
      {Icon && (
        <div className="absolute top-3 right-4 opacity-10">
          <Icon size={32} color={accent} />
        </div>
      )}
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span className="text-3xl font-black text-white leading-none">
        {value}
      </span>
      {sub && <span className="text-[10px] text-slate-500 mt-0.5">{sub}</span>}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{
        border: "1px solid #dcdcdc",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white"
        style={{ background: "linear-gradient(90deg, #20476E, #1C61A1)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ActionButton({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx(
        "p-1.5 rounded-lg transition-colors",
        ACTION_COLORS[color],
      )}
    >
      {icon}
    </button>
  );
}

export default function ProjectsPage({ users }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editKey, setEditKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProjects();
      setProjects(data);
      setTimeout(() => setFadeIn(true), 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = useCallback(
    async (payload) => {
      const created = await createProject(payload);
      setProjects((prev) => [created, ...prev]);
      window.dispatchEvent(new Event("projects-updated"));

      // await createProject(payload);
      // await load(); // Refresh the list after adding
    },
    [load],
  );

  const handleEdit = useCallback(
    async (payload) => {
      const updated = await updateProject(editTarget.id, payload);
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      setEditKey((k) => k + 1); // added key
      window.dispatchEvent(new Event("projects-updated"));
    },
    [editTarget],
  );

  const handleDelete = useCallback(async () => {
    await deleteProject(deleteTarget.id);
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    window.dispatchEvent(new Event("projects-updated"));
  }, [deleteTarget]);

  const totalTasks = projects.reduce((sum, p) => sum + (p.taskCount ?? 0), 0);
  const withPm = projects.filter((p) => p.pmId).length;
  const withDeadline = projects.filter((p) => p.targetEndDate).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
            Loading projects
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      {/* ── Animated content (transform isolated here) ── */}
      <div
        className="space-y-6 pb-10"
        style={{
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Portfolio
            </p>
            <h1 className="text-2xl font-black text-slate-800 leading-none">
              Projects
            </h1>
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #20476E, #1C61A1)",
              border: "1px solid #1C61A140",
            }}
          >
            <FolderPlus size={15} />
            Add Project
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Total Projects"
            value={projects.length}
            accent="#3b82f6"
            sub="in portfolio"
            icon={FolderOpen}
          />
          <KpiCard
            label="Total Tasks"
            value={totalTasks}
            accent="#10b981"
            sub="across all projects"
            icon={CheckSquare}
          />
          <KpiCard
            label="With Manager"
            value={withPm}
            accent="#8b5cf6"
            sub="projects assigned a PM"
            icon={Users}
          />
          <KpiCard
            label="Have Deadline"
            value={withDeadline}
            accent="#f59e0b"
            sub="target end date set"
            icon={CalendarClock}
          />
        </div>

        {/* Table */}
        <SectionCard title="All Projects">
          {error ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-slate-400">No projects yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {/* Added Status to the headers */}
                    {[
                      "Title",
                      "Status",
                      "Client",
                      "Project Manager",
                      "Target End Date",
                      "Tasks",
                      "Created",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, i) => (
                    <tr
                      key={project.id}
                      className="transition-colors hover:bg-slate-50 odd:bg-[#FFFFF] even:bg-[#F0F8FF]"
                      style={{
                        borderBottom:
                          i < projects.length - 1
                            ? "1px solid #f8fafc"
                            : "none",
                      }}
                    >
                      <td className="px-5 py-3.5 max-w-[160px]">
                        <p className="font-semibold text-slate-800 truncate">
                          {project.title}
                        </p>
                      </td>

                      {/* New Status Data Cell */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                          style={{
                            background:
                              project.status === "completed"
                                ? "#ecfdf5"
                                : project.status === "cancelled"
                                  ? "#fef2f2"
                                  : "#eff6ff",
                            color:
                              project.status === "completed"
                                ? "#059669"
                                : project.status === "cancelled"
                                  ? "#ef4444"
                                  : "#3b82f6",
                            border: `1px solid ${project.status === "completed" ? "#05966930" : project.status === "cancelled" ? "#ef444430" : "#3b82f630"}`,
                          }}
                        >
                          {project.status || "ongoing"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 max-w-[160px]">
                        {project.clientName ? (
                          <p className="text-slate-600 truncate text-xs">
                            {project.clientName}
                          </p>
                        ) : (
                          <span className="text-slate-300 italic text-xs">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {project.pmName ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{
                                background:
                                  "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                              }}
                            >
                              {project.pmName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-slate-600 text-xs">
                              {project.pmName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-xs">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {project.targetEndDate ? (
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                            style={{
                              background: "#fffbeb",
                              color: "#f59e0b",
                              border: "1px solid #f59e0b30",
                            }}
                          >
                            {new Date(project.targetEndDate).toLocaleDateString(
                              "en-PH",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic text-xs">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                          style={{
                            background: "#eff6ff",
                            color: "#3b82f6",
                            border: "1px solid #3b82f630",
                          }}
                        >
                          {project.taskCount ?? 0} task
                          {(project.taskCount ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 text-xs">
                        {new Date(project.createdAt).toLocaleDateString(
                          "en-PH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <ActionButton
                            icon={<Pencil size={14} />}
                            label="Edit"
                            onClick={() => {
                              setEditTarget(project);
                              setEditKey((k) => k + 1);
                            }}
                            color="blue"
                          />
                          <ActionButton
                            icon={<Trash2 size={14} />}
                            label="Delete"
                            onClick={() => setDeleteTarget(project)}
                            color="red"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Modals outside the transformed div ── */}
      {addModal && (
        <ProjectFormModal
          project={null}
          users={users}
          onSave={handleAdd}
          onClose={() => setAddModal(false)}
        />
      )}
      {editTarget && (
        <ProjectFormModal
          key={editKey}
          project={editTarget}
          users={users}
          onSave={handleEdit}
          onClose={() => {
            setEditTarget(null);
            setEditKey((k) => k + 1);
          }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
