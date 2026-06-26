import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  LogOut,
  ChevronDown,
  Folders,
  Layout,
} from "lucide-react";
import { getNavItems } from "../../config/navigation";
import SidebarNavItem from "./SidebarNavItem";

// ── QTECH Theme tokens ────────────────────────────────────────
const T = {
  brand: "#0078D7",
  brandDark: "#1C61A1",
  brandDeep: "#20476E",
  border: "#DCDCDC",
};

export default function Sidebar({
  currentUser,
  activePage,
  onNavigate,
  onLogout,
  projects = [],
  activeProjectId,
  activeProjectUntickedCount,
  onProjectSelect,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const location = useLocation();
  const currentPage = location.pathname.replace(/^\//, "") || activePage;
  const navItems = getNavItems(currentUser.role);

  const isDevOrQA =
    currentUser.role === "Developer" || currentUser.role === "QA";

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <aside
      className={`relative flex flex-col shrink-0 transition-all duration-200 ease-in-out ${
        collapsed ? "w-16" : "w-60"
      }`}
      style={{
        background: `linear-gradient(180deg, ${T.brandDeep} 0%, ${T.brandDark} 100%)`,
        borderRight: `1px solid ${T.brand}22`,
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Collapse toggle ─────────────────────────────── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 z-10 rounded-full p-0.5 shadow-md transition-colors"
        style={{
          background: T.brandDark,
          border: `1px solid ${T.brand}50`,
          color: "#a8ccf0",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#a8ccf0")}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* ── Logo ────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2.5 px-4 py-5 ${collapsed ? "justify-center" : ""}`}
      >
        <FolderKanban
          size={22}
          className="shrink-0"
          style={{ color: "#7ec8f5" }}
        />
        {!collapsed && (
          <span
            className="text-base font-black truncate tracking-tight"
            style={{ color: "#fff" }}
          >
            qTask
          </span>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          PROJECT FILTER — Dev / QA only
      ════════════════════════════════════════════════════ */}
      {isDevOrQA && (
        <div className="px-2 pb-2">
          {/* Section header */}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setProjectsOpen((o) => !o)}
              className="w-full flex items-center justify-between px-2 pb-1.5 group"
            >
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#6b9fc0" }}
              >
                Projects
              </span>
              <ChevronDown
                size={11}
                style={{
                  color: "#6b9fc0",
                  transform: projectsOpen ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 0.15s ease",
                }}
              />
            </button>
          )}

          {/* Collapsed icon */}
          {collapsed && (
            <div className="flex justify-center py-1">
              <button
                type="button"
                title={activeProject ? activeProject.title : "All Projects"}
                onClick={() => {
                  setCollapsed(false);
                  setProjectsOpen(true);
                }}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: activeProjectId
                    ? `${T.brand}28`
                    : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <Folders
                  size={15}
                  style={{ color: activeProjectId ? "#7ec8f5" : "#7a9db8" }}
                />
              </button>
            </div>
          )}

          {/* Expanded project list */}
          {!collapsed && projectsOpen && (
            <div className="space-y-0.5 mt-0.5">
              {/* All Projects */}
              <button
                type="button"
                onClick={() => onProjectSelect?.(null)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-xs font-medium"
                style={{
                  background:
                    activeProjectId === null ? `${T.brand}22` : "transparent",
                  color: activeProjectId === null ? "#90c4ef" : "#5a7a8f",
                  borderLeft:
                    activeProjectId === null
                      ? `2px solid ${T.brand}`
                      : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (activeProjectId !== null) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.color = "#a0c4de";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeProjectId !== null) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#5a7a8f";
                  }
                }}
              >
                <Layout size={13} className="shrink-0" />
                <span className="truncate">All Projects</span>
                {activeProjectId === null && (
                  <span
                    className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${T.brand}28`, color: "#90c4ef" }}
                  >
                    Active
                  </span>
                )}
              </button>

              {/* Individual project rows */}
              {projects.length === 0 ? (
                <p
                  className="px-3 py-2 text-[10px] italic"
                  style={{ color: "#334a5a" }}
                >
                  No projects assigned
                </p>
              ) : (
                projects.map((p) => {
                  const isActive = activeProjectId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onProjectSelect?.(p.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-xs"
                      style={{
                        background: isActive ? `${T.brand}22` : "transparent",
                        color: isActive ? "#90c4ef" : "#5a7a8f",
                        fontWeight: isActive ? 600 : 400,
                        borderLeft: isActive
                          ? `2px solid ${T.brand}`
                          : "2px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.07)";
                          e.currentTarget.style.color = "#a0c4de";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#5a7a8f";
                        }
                      }}
                    >
                      <span
                        className="shrink-0 w-1.5 h-1.5 rounded-full"
                        style={{ background: isActive ? T.brand : "#2d5a78" }}
                      />
                      <span className="truncate flex-1">{p.title}</span>
                      <span
                        className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: p.untickedSubtaskCount > 0
                            ? "rgba(248, 113, 113, 0.15)"
                            : "rgba(148, 163, 184, 0.12)",
                          color: p.untickedSubtaskCount > 0 ? "#dc2626" : "#94a3b8",
                        }}
                      >
                        {p.untickedSubtaskCount ?? 0}
                      </span>
                      {isActive && (
                        <span
                          className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{
                            background: `${T.brand}28`,
                            color: "#90c4ef",
                          }}
                        >
                          Active
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Divider */}
          {!collapsed && (
            <div
              className="mt-2 mb-1 mx-2 h-px"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
          )}
        </div>
      )}

      {/* ── Navigation label ─────────────────────────────── */}
      {!collapsed && (
        <p
          className="px-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "#6b9fc0" }}
        >
          Navigation
        </p>
      )}

      {/* ── Nav items ────────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.key}
            item={item}
            isActive={currentPage === item.key}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* ── User info + sign out ─────────────────────────── */}
      <div
        className={`px-3 py-4 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
        style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
      >
        <div
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white"
          style={{
            background: `linear-gradient(135deg, ${T.brand}, ${T.brandDark})`,
            boxShadow: `0 0 0 2px ${T.brand}40`,
          }}
        >
          {currentUser.name.charAt(0)}
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "#f1f5f9" }}
            >
              {currentUser.name}
            </p>
            <p
              className="text-[10px] font-bold uppercase tracking-wider truncate"
              style={{ color: "#7a9db8" }}
            >
              {currentUser.role}
            </p>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors rounded px-1.5 py-0.5 -ml-1.5"
              style={{ color: "#f87171", background: "rgba(239,68,68,0.10)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.20)";
                e.currentTarget.style.color = "#fca5a5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.10)";
                e.currentTarget.style.color = "#f87171";
              }}
            >
              <LogOut size={10} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
