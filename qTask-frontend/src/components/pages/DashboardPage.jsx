import { useState, useEffect, useCallback } from "react";
import {
  Users,
  FolderKanban,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowRight,
  Clock,
  Plus,
  UserPlus,
  PieChart,
} from "lucide-react";
import {
  fetchProjects,
  fetchTasks,
  fetchAllUsers,
  fetchActivityLogs,
} from "../../services/api";

function KpiCard({ label, value, accent, sub, icon: Icon }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, #20476E 60%, #1C61A1)`, border: `1px solid ${accent}40` }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-2xl" style={{ background: accent }} />
      {Icon && <div className="absolute top-3 right-4 opacity-10"><Icon size={32} color={accent} /></div>}
      <span className="font-bold uppercase tracking-widest text-slate-300" style={{ fontSize: "var(--fs-xs)" }}>{label}</span>
      <span className="font-black text-white leading-none" style={{ fontSize: "var(--fs-2xl)" }}>{value}</span>
      {sub && <span className="text-slate-400 mt-0.5" style={{ fontSize: "var(--fs-xs)" }}>{sub}</span>}
    </div>
  );
}

// Section Card Component
function SectionCard({ title, icon, children, action, className = "" }) {
  return (
    <div className={`rounded-xl overflow-hidden bg-white flex flex-col ${className}`}
      style={{ border: "1px solid #DCDCDC", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div
        className="px-5 py-3 font-black uppercase tracking-widest text-white flex items-center justify-between shrink-0"
        style={{ background: "linear-gradient(90deg, #20476E, #1C61A1)", fontSize: "var(--fs-xs)" }}
      >
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span>{title}</span>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-[9px] font-bold text-blue-300 hover:text-white transition flex items-center gap-1"
          >
            {action.label}
            <ArrowRight size={10} />
          </button>
        )}
      </div>
      <div className="p-5 flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ activity }) {
  const getActivityIcon = (action) => {
    if (action?.toLowerCase().includes("created")) return "📝";
    if (action?.toLowerCase().includes("updated")) return "✏️";
    if (action?.toLowerCase().includes("deleted")) return "🗑️";
    if (action?.toLowerCase().includes("phase")) return "🔄";
    if (action?.toLowerCase().includes("assignee")) return "👤";
    return "📌";
  };

  const formatTimeAgo = (date) => {
    if (!date) return "recently";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors -mx-2 px-2 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0 text-sm">
        {getActivityIcon(activity.action)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">
          {activity.userName ? (
            <>
              <span className="font-semibold text-slate-800">
                {activity.userName}
              </span>
              <span className="text-slate-500">
                {" "}
                {activity.action?.toLowerCase() || "acted"}
              </span>
              {activity.taskTitle && (
                <span className="font-medium text-blue-600">
                  {" "}
                  "{activity.taskTitle}"
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-500">
              {activity.action || "Activity recorded"}
            </span>
          )}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock size={8} />
            {formatTimeAgo(activity.createdAt)}
          </p>
          {activity.userRole && (
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
              {activity.userRole}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// At-Risk Project Card
function AtRiskProjectCard({ project, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
    >
      <div className="flex-1">
        <p className="font-semibold text-slate-800 text-sm">{project.title}</p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-xs text-slate-500">
            Target:{" "}
            {project.targetEndDate
              ? new Date(project.targetEndDate).toLocaleDateString()
              : "Not set"}
          </p>
          {project.overdueCount > 0 && (
            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
              {project.overdueCount} overdue tasks
            </span>
          )}
        </div>
      </div>
      <AlertTriangle size={16} className="text-red-500 shrink-0" />
    </div>
  );
}

// Main Dashboard Component
export default function DashboardPage({ onNavigate, currentUser }) {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    openTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalUsers: 0,
    activeUsers: 0,
  });
  const [atRiskProjects, setAtRiskProjects] = useState([]);
  const [recentActivity, setRecentActivity] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [projects, users, activityLogs] = await Promise.all([
        fetchProjects(),
        fetchAllUsers(),
        fetchActivityLogs({ limit: 20 }), // Increased limit for taller layout
      ]);

      const activeProjects = projects.filter(
        (p) => !p.actualEndDate && p.status !== "completed",
      );
      const completedProjects = projects.filter(
        (p) => p.actualEndDate || p.status === "completed",
      );

      const allTasksPromises = projects.map((project) =>
        fetchTasks(project.id, null, null).catch(() => []),
      );
      const allTasksArrays = await Promise.all(allTasksPromises);
      const allTasks = allTasksArrays.flat();

      const completedPhases = [8];
      const openTasks = allTasks.filter(
        (t) => !completedPhases.includes(t.phaseId),
      );
      const completedTasks = allTasks.filter((t) =>
        completedPhases.includes(t.phaseId),
      );
      const overdueTasks = allTasks.filter(
        (t) =>
          t.targetDate &&
          new Date(t.targetDate) < new Date() &&
          !completedPhases.includes(t.phaseId),
      );

      const atRisk = projects
        .filter((p) => {
          const projectTasks = allTasks.filter((t) => t.projectId === p.id);
          const overdue = projectTasks.filter(
            (t) =>
              t.targetDate &&
              new Date(t.targetDate) < new Date() &&
              t.progress < 100,
          ).length;
          return overdue > 0 && !p.actualEndDate && p.status !== "completed";
        })
        .map((p) => {
          const projectTasks = allTasks.filter((t) => t.projectId === p.id);
          const overdue = projectTasks.filter(
            (t) =>
              t.targetDate &&
              new Date(t.targetDate) < new Date() &&
              t.progress < 100,
          ).length;
          return { ...p, overdueCount: overdue };
        })
        .slice(0, 8); // Allow more projects in the taller column

      setStats({
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        totalTasks: allTasks.length,
        openTasks: openTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.isActive).length,
      });

      setAtRiskProjects(atRisk);
      setRecentActivity(activityLogs);
      setLastUpdated(new Date());
      setFadeIn(true);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  if (loading && !fadeIn) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
            Loading dashboard
          </p>
        </div>
      </div>
    );
  }

  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <div
      className="space-y-6 pb-10 h-full flex flex-col"
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
      <p style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#4f6070", marginBottom: 4 }}>
            Overview
          </p>
          <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 900, color: "#20476E", lineHeight: 1.1 }}>
            Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        {/* Actions moved to the top for immediate access */}
        <div className="flex items-center gap-2">
          {currentUser?.role !== "ProjectManager" && (
            <>
              <button
                onClick={() => onNavigate?.("projects", "create")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Plus size={14} />
                New Project
              </button>
              <button
                onClick={() => onNavigate?.("users", "create")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition hidden sm:flex"
              >
                <UserPlus size={14} />
                Add Member
              </button>
            </>
          )}
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={{ background: "#F0F8FF", color: "#1C61A1", border: "1px solid #DCDCDC" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#daeeff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F0F8FF";
            }}
          >
            <Activity size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Row - Consolidated key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Projects"
          value={stats.activeProjects}
          accent="#3b82f6"
          sub={`${stats.completedProjects} total completed`}
          icon={FolderKanban}
        />
        {/* Promoted Task Completion Rate to primary KPI */}
        <KpiCard
          label="Task Completion"
          value={`${completionRate}%`}
          accent="#10b981"
          sub="overall progress"
          icon={TrendingUp}
        />
        <KpiCard
          label="Open Tasks"
          value={stats.openTasks}
          accent="#f59e0b"
          sub={`${stats.completedTasks} done`}
          icon={CheckCircle}
        />
        <KpiCard
          label="Overdue Tasks"
          value={stats.overdueTasks}
          accent="#ef4444"
          sub="need attention"
          icon={AlertTriangle}
        />
      </div>

      {/* Main Content Grid - Taller, more optimized columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        {/* At-Risk Projects */}
        <SectionCard
          title="At-Risk Projects"
          icon="⚠️"
          className="h-full"
          action={
            atRiskProjects.length > 0
              ? {
                  label: "View All Analytics",
                  onClick: () => onNavigate?.("analytics"),
                }
              : null
          }
        >
          {atRiskProjects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <CheckCircle size={40} className="text-green-500 mb-3" />
              <p className="text-slate-800 font-semibold">
                All projects are on track
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Great job managing deadlines!
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {atRiskProjects.map((project) => (
                <AtRiskProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => onNavigate?.("analytics", project.id)}
                />
              ))}
            </div>
          )}
        </SectionCard>
        {/* Recent Activity - Takes up more vertical space now */}
        <SectionCard title="Recent Activity" icon="📋" className="h-full">
          {(recentActivity.data?.length ?? 0) === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Activity size={40} className="text-slate-300 mb-3" />
              <p className="text-slate-800 font-semibold">No recent activity</p>
              <p className="text-sm text-slate-500 mt-1">
                Actions taken by the team will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 -mx-2 px-2 pr-3">
              {recentActivity.data?.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
