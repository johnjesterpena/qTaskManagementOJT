import { useState } from "react";
import { ChevronLeft, ChevronRight, FolderKanban, LogOut } from "lucide-react";
import { getNavItems } from "../../config/navigation";
import SidebarNavItem from "./SidebarNavItem";

/**
 * Sidebar
 *
 * Props:
 *   currentUser — { name, role, ... }
 *   activePage  — current page key
 *   onNavigate  — called with page key when a nav item is clicked
 *   onLogout    — called when sign out is clicked
 */
export default function Sidebar({
  currentUser,
  activePage,
  onNavigate,
  onLogout,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = getNavItems(currentUser.role);

  return (
    <aside
      className={`
        relative flex flex-col shrink-0
        transition-all duration-200 ease-in-out
        ${collapsed ? "w-16" : "w-60"}
      `}
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #1e3a5f 100%)",
        borderRight: "1px solid #1e40af20",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Collapse toggle ───────────────────────────────── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 z-10 rounded-full p-0.5 transition-colors shadow-md"
        style={{
          background: "#1e3a5f",
          border: "1px solid #1e40af40",
          color: "#94a3b8",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
      >
        {collapsed
          ? <ChevronRight size={14} />
          : <ChevronLeft  size={14} />
        }
      </button>

      {/* ── Logo ──────────────────────────────────────────── */}
      <div className={`flex items-center gap-2.5 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
        <FolderKanban size={22} className="shrink-0" style={{ color: "#3b82f6" }} />
        {!collapsed && (
          <span
            className="text-base font-black truncate tracking-tight"
            style={{ color: "#fff" }}
          >
            qTask
          </span>
        )}
      </div>

      {/* ── Section label ─────────────────────────────────── */}
      {!collapsed && (
        <p
          className="px-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "#475569" }}
        >
          Navigation
        </p>
      )}

      {/* ── Nav items ─────────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.key}
            item={item}
            isActive={activePage === item.key}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* ── User info + sign out ───────────────────────────── */}
      <div
        className={`
          px-3 py-4
          flex items-center gap-3
          ${collapsed ? "justify-center" : ""}
        `}
        style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
      >
        {/* Avatar */}
        <div
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white"
          style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)", boxShadow: "0 0 0 2px rgba(59,130,246,0.25)" }}
        >
          {currentUser.name.charAt(0)}
        </div>

        {/* Name + role + sign out */}
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#f1f5f9" }}>
              {currentUser.name}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "#94a3b8" }}>
              {currentUser.role}
            </p>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors rounded px-1.5 py-0.5 -ml-1.5"
              style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                e.currentTarget.style.color = "#fca5a5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
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