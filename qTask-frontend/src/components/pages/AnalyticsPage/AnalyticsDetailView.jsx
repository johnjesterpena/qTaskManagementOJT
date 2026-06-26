import { useState, useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { ArrowLeft, Settings } from "lucide-react";
import {
  isCancelled,
  computeRiskLevel,
  computeScheduleHealth,
  computeQuality,
  computeProgress,
  computeVelocity,
  fmt,
} from "./helpers";
import {
  PHASE_ICONS,
  RISK,
  SCHEDULE,
  QUALITY,
  CHART_COLORS,
  getSeverityColor,
} from "./constants";
import HealthRow from "./HealthRow";
import KpiCard from "./KpiCard";
import SectionCard from "./SectionCard";
import SeverityLegend from "./SeverityLegend";

export default function AnalyticsDetailView({
  project,
  tasks,
  allPhases,
  severities,
  statuses,
  onBack,
  onManageSeverities,
  fadeIn,
}) {
  const [showCancelledInCharts, setShowCancelledInCharts] = useState(false);

  // If project is cancelled, show a message instead of analytics
  if (project?.status === "cancelled") {
    return (
      <div
        className="space-y-6 pb-10"
        style={{
          fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
            style={{
              background: "#F0F8FF",
              color: "#1C61A1",
              border: "1px solid #DCDCDC",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#daeeff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F0F8FF")}
          >
            <ArrowLeft size={12} />
            Back
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              Project Intelligence
            </p>
            <h1 className="text-2xl font-black text-slate-800 leading-none">
              {project?.title}
            </h1>
          </div>
        </div>

        <div
          className="rounded-xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, #fef2f2 0%, #fff 100%)",
            border: "1px solid #fecaca",
          }}
        >
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Project Cancelled
          </h2>
          <p className="text-slate-600">
            This project has been cancelled. No analytics are available.
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
          >
            Return to Project List
          </button>
        </div>
      </div>
    );
  }

  const analytics = useMemo(() => {
    if (!allPhases.length) return null;

    const activeTasks = tasks.filter((t) => !isCancelled(t));
    const cancelledTasks = tasks.filter((t) => isCancelled(t));

    const risk = computeRiskLevel(tasks);
    const schedule = computeScheduleHealth(tasks, allPhases);
    const quality = computeQuality(tasks, allPhases);
    const progress = computeProgress(tasks);
    const velocity = computeVelocity(tasks);
    const blockers = activeTasks.filter(
      (t) => t.statusLabel === "Blocked",
    ).length;
    const clarQ = activeTasks.filter(
      (t) => t.statusLabel === "Clarification Needed",
    ).length;

    const phaseProgress = allPhases
      .map((ph) => {
        const count = activeTasks.filter((t) => t.phaseId === ph.id).length;
        return {
          id: ph.id,
          label: ph.label,
          pct: activeTasks.length
            ? Math.round((count / activeTasks.length) * 100)
            : 0,
          count,
          icon: PHASE_ICONS[ph.grouping] ?? "📋",
          isFinal: ph.isFinal,
        };
      })
      .filter((ph) => ph.count > 0)
      .sort((a, b) => b.pct - a.pct);

    const currentPhase =
      phaseProgress.find((p) => !p.isFinal) ?? phaseProgress[0];

    const sevBreakdown = severities
      .map((s) => ({
        id: s.id,
        name: s.label.replace(/^\d+ - /, ""),
        full: s.label,
        color: getSeverityColor(s),
        sortOrder: s.sortOrder,
        value: tasks.filter((t) => t.severityId === s.id).length,
        cancelled: tasks.filter((t) => t.severityId === s.id && isCancelled(t))
          .length,
        active: tasks.filter((t) => t.severityId === s.id && !isCancelled(t))
          .length,
      }))
      .filter((s) => s.value > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const statusBreakdown = statuses
      .map((s) => ({
        name: s.label,
        value: tasks.filter((t) => t.statusId === s.id).length,
        cancelled: tasks.filter((t) => t.statusId === s.id && isCancelled(t))
          .length,
      }))
      .filter((s) => s.value > 0);

    return {
      risk,
      schedule,
      quality,
      progress,
      velocity,
      blockers,
      clarQ,
      phaseProgress,
      currentPhase,
      sevBreakdown,
      statusBreakdown,
      total: tasks.length,
      activeTotal: activeTasks.length,
      cancelledTotal: cancelledTasks.length,
    };
  }, [tasks, allPhases, severities, statuses]);

  const barOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: false },
        background: "transparent",
        fontFamily: "inherit",
        stacked: showCancelledInCharts,
      },
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: "52%",
          distributed: !showCancelledInCharts,
          dataLabels: { position: "top" },
        },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: "10px", fontWeight: 700, colors: ["#fff"] },
        formatter: (val) => (val > 0 ? val : ""),
      },
      xaxis: {
        categories: analytics?.sevBreakdown.map((s) => s.name) ?? [],
        labels: {
          style: { fontSize: "9px", colors: "#94a3b8", fontWeight: 600 },
          rotate: -30,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { fontSize: "9px", colors: "#94a3b8" } },
        tickAmount: 3,
        min: 0,
      },
      colors: showCancelledInCharts
        ? ["#3b82f6", "#94a3b8"]
        : (analytics?.sevBreakdown.map((s) => s.color) ?? CHART_COLORS),
      tooltip: {
        theme: "dark",
        y: {
          formatter: (val, { seriesIndex, dataPointIndex }) => {
            if (showCancelledInCharts) {
              const type = seriesIndex === 0 ? "Active" : "Cancelled";
              return `${type}: ${val}`;
            }
            return val;
          },
        },
      },
      grid: {
        borderColor: "#f1f5f9",
        strokeDashArray: 3,
        padding: { left: 0, right: 0 },
      },
      legend: showCancelledInCharts
        ? {
            show: true,
            position: "top",
            fontSize: "10px",
            labels: { colors: "#64748b" },
          }
        : { show: false },
    }),
    [analytics, showCancelledInCharts],
  );

  const barSeries = useMemo(() => {
    if (showCancelledInCharts) {
      return [
        {
          name: "Active Tasks",
          data: analytics?.sevBreakdown.map((s) => s.active) ?? [],
        },
        {
          name: "Cancelled Tasks",
          data: analytics?.sevBreakdown.map((s) => s.cancelled) ?? [],
        },
      ];
    }
    return [
      {
        name: "Tasks",
        data: analytics?.sevBreakdown.map((s) => s.value) ?? [],
      },
    ];
  }, [analytics, showCancelledInCharts]);

  const donutOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        background: "transparent",
        fontFamily: "inherit",
      },
      labels: analytics?.statusBreakdown.map((s) => s.name) ?? [],
      colors: CHART_COLORS,
      legend: {
        position: "bottom",
        fontSize: "10px",
        labels: { colors: "#64748b" },
        itemMargin: { horizontal: 6 },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: "10px", fontWeight: 700 },
        dropShadow: { enabled: false },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total",
                fontSize: "11px",
                color: "#64748b",
                fontWeight: 600,
                formatter: (w) =>
                  w.globals.seriesTotals.reduce((a, b) => a + b, 0),
              },
            },
          },
        },
      },
      tooltip: { theme: "dark" },
      stroke: { width: 2, colors: ["#fff"] },
    }),
    [analytics],
  );

  const donutSeries = useMemo(
    () => analytics?.statusBreakdown.map((s) => s.value) ?? [],
    [analytics],
  );

  const qualityCfg = QUALITY(analytics?.quality ?? 0);
  const riskCfg = RISK[analytics?.risk ?? "Low Risk"];
  const scheduleCfg = SCHEDULE[analytics?.schedule ?? "On Track"];
  const cancelledTasksList = tasks.filter(isCancelled);

  return (
    <div
      className="space-y-6 pb-10"
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Page header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
          style={{
            background: "#F0F8FF",
            color: "#1C61A1",
            border: "1px solid #DCDCDC",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#daeeff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#F0F8FF")}
        >
          <ArrowLeft size={12} />
          Back
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
            Project Intelligence
          </p>
          <h1 className="text-2xl font-black text-slate-800 leading-none">
            {project?.title}
          </h1>
        </div>
      </div>

      {/* Project info + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div
          className="lg:col-span-2 rounded-xl p-5"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
            border: "1px solid #1e40af30",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-4">
            Project Details
          </p>
          <div className="space-y-0 divide-y divide-white/5">
            {[
              { label: "Client", value: project?.clientName },
              { label: "Date Started", value: fmt(project?.createdAt) },
              { label: "Target End Date", value: fmt(project?.targetEndDate) },
              { label: "Project Manager", value: project?.pmName },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 py-2">
                <span className="w-28 shrink-0 text-[9px] font-bold uppercase tracking-widest text-blue-300/60 pt-0.5">
                  {label}
                </span>
                <span className="text-sm text-white/80 font-medium leading-snug">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="lg:col-span-3 rounded-xl p-5 bg-white"
          style={{
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            Project Health Snapshot
          </p>
          {analytics ? (
            <div className="grid grid-cols-1 gap-2">
              <HealthRow
                label="Schedule"
                color={scheduleCfg.color}
                bg={scheduleCfg.bg}
              >
                {analytics.schedule}
              </HealthRow>
              <HealthRow
                label="Risk Level"
                color={riskCfg.color}
                bg={riskCfg.bg}
              >
                {analytics.risk}
              </HealthRow>
              <HealthRow
                label="Quality"
                color={qualityCfg.color}
                bg={qualityCfg.bg}
              >
                {qualityCfg.label} ({analytics.quality}%)
              </HealthRow>
              <HealthRow label="Current Phase" color="#3b82f6" bg="#eff6ff">
                {analytics.currentPhase?.label ?? "—"}
              </HealthRow>
              <div className="mt-2 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Overall Progress
                  </span>
                  <span className="text-sm font-black text-slate-700">
                    {analytics.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${analytics.progress}%`,
                      background: "linear-gradient(90deg, #1e40af, #3b82f6)",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">
              No tasks found for this project.
            </p>
          )}
        </div>
      </div>

      {/* KPI row */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <KpiCard
            label="Total Tasks"
            value={analytics.total}
            accent="#3b82f6"
            sub="across all phases"
          />
          <KpiCard
            label="Active Tasks"
            value={analytics.activeTotal}
            accent="#10b981"
            sub="excluding cancelled"
          />
          <KpiCard
            label="Cancelled"
            value={analytics.cancelledTotal}
            accent="#8b5cf6"
            sub="archived tasks"
          />
          <KpiCard
            label="Velocity"
            value={analytics.velocity}
            accent="#10b981"
            sub="active dev (7d)"
          />
          <KpiCard
            label="Critical Blockers"
            value={analytics.blockers}
            accent="#ef4444"
            sub="blocked tasks"
          />
          <KpiCard
            label="Clarification Queue"
            value={analytics.clarQ}
            accent="#f59e0b"
            sub="awaiting input"
          />
        </div>
      )}

      {/* Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Phase Distribution">
            <div className="p-5 space-y-4">
              {analytics.phaseProgress.length ? (
                analytics.phaseProgress.map((ph, i) => (
                  <div key={ph.id} style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                        <span>{ph.icon}</span>
                        <span className="truncate max-w-[160px]">
                          {ph.label}
                        </span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-400">
                          {ph.count} tasks
                        </span>
                        <span className="text-xs font-black text-slate-700 w-8 text-right">
                          {ph.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${ph.pct}%`,
                          background: ph.isFinal
                            ? "linear-gradient(90deg, #059669, #10b981)"
                            : "linear-gradient(90deg, #1e40af, #3b82f6)",
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">
                  No phase data yet.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Tasks by Severity"
            toolbar={
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[10px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={showCancelledInCharts}
                    onChange={(e) => setShowCancelledInCharts(e.target.checked)}
                    className="w-3 h-3 rounded border-slate-400"
                  />
                  Show cancelled
                </label>
                <button
                  onClick={onManageSeverities}
                  className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                  <Settings size={12} />
                  Manage
                </button>
              </div>
            }
          >
            <div className="p-4">
              {analytics.sevBreakdown.length ? (
                <>
                  <ReactApexChart
                    type="bar"
                    height={200}
                    options={barOptions}
                    series={barSeries}
                  />
                  <SeverityLegend
                    severities={severities}
                    sevBreakdown={analytics.sevBreakdown}
                  />
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">
                  No data
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Status Distribution">
            <div className="p-4">
              {analytics.statusBreakdown.length ? (
                <ReactApexChart
                  type="donut"
                  height={230}
                  options={donutOptions}
                  series={donutSeries}
                />
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">
                  No data
                </p>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Cancelled Tasks Section */}
      {analytics && analytics.cancelledTotal > 0 && (
        <SectionCard title="Cancelled Tasks">
          <div className="p-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800">
                <span>Show {analytics.cancelledTotal} cancelled task(s)</span>
                <span className="transform group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="mt-3 space-y-2">
                {cancelledTasksList.map((task) => (
                  <div
                    key={task.id}
                    className="text-xs p-2 bg-slate-50 rounded flex justify-between items-center"
                  >
                    <span className="text-slate-600">{task.title}</span>
                    <span className="text-slate-400">
                      {task.statusLabel} • {fmt(task.updatedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
