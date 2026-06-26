import { useState, useEffect } from "react";
import { fetchTasks } from "../../../services/api";
import {
  computeProgress,
  computeRiskLevel,
  computeScheduleHealth,
  fmtShort,
} from "./helpers";
import { RISK, SCHEDULE } from "./constants";
import {
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Layers,
} from "lucide-react";

export default function ProjectCard({ project, allPhases, onClick, index }) {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetchTasks(project.id, null, null).then((data) => {
      setTasks(data);
      setLoaded(true);
    });
  }, [project.id]);

  const progress = computeProgress(tasks);
  const risk = computeRiskLevel(tasks);
  const schedule = computeScheduleHealth(tasks, allPhases);
  const riskCfg = RISK[risk];
  const schCfg = SCHEDULE[schedule];

  const isCompleted = !!project.actualEndDate || project.status === "completed";
  const isCancelled = project.status === "cancelled";

  // Status icon based on project state
  const StatusIcon = isCompleted
    ? CheckCircle
    : isCancelled
      ? XCircle
      : AlertCircle;
  const statusColor = isCompleted
    ? "#10b981"
    : isCancelled
      ? "#ef4444"
      : "#3b82f6";

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl cursor-pointer transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, #20476E, #1C61A1)",
        border: isHovered ? `1px solid ${statusColor}80` : "1px solid #1e3a5f",
        boxShadow: isHovered
          ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${statusColor}20`
          : "0 4px 12px rgba(0,0,0,0.2)",
        opacity: loaded ? 1 : 0.6,
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        animationDelay: `${index * 50}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect on hover - matching KpiCard style */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-2xl transition-opacity duration-300"
        style={{
          background: statusColor,
          opacity: isHovered ? 0.3 : 0.1,
        }}
      />

      {/* Icon in background - matching KpiCard */}
      <div className="absolute bottom-3 right-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
        <Layers size={48} />
      </div>

      {/* Card header */}
      <div className="relative px-5 py-4 border-b border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon
                size={14}
                color={statusColor}
                fill={isCompleted || isCancelled ? statusColor : "none"}
                style={{ opacity: 0.8 }}
              />
              <p className="text-lg font-bold text-white leading-snug truncate">
                {project.title}
              </p>
            </div>
            <p className="text-xs text-gray-300 font-medium mt-0.5 flex gap-2">
              {project.clientName || "—"}
            </p>
          </div>

          {/* Status badge - adjusted for dark theme */}
          {isCancelled ? (
            <span
              className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
              style={{
                background: "#7f1d1d",
                color: "#fca5a5",
                border: "1px solid #991b1b",
              }}
            >
              Cancelled
            </span>
          ) : isCompleted ? (
            <span
              className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
              style={{
                background: "#064e3b",
                color: "#6ee7b7",
                border: "1px solid #065f46",
              }}
            >
              Completed
            </span>
          ) : (
            <span
              className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
              style={{
                background: "#1e3a8a",
                color: "#93c5fd",
                border: "1px solid #1e40af",
              }}
            >
              Ongoing
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="relative px-5 py-4 space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Progress
            </span>
            <span className="font-black text-white">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: isCompleted
                  ? "linear-gradient(90deg, #059669, #10b981)"
                  : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                boxShadow:
                  progress > 0
                    ? `0 0 8px ${isCompleted ? "#10b981" : "#3b82f6"}80`
                    : "none",
              }}
            />
          </div>
        </div>

        {/* Health badges - dark theme version */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1.5 transition-all duration-200"
            style={{
              background: `${riskCfg.color}20`,
              color: riskCfg.color,
              border: `1px solid ${riskCfg.color}40`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: riskCfg.color }}
            />
            {risk}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1.5 transition-all duration-200"
            style={{
              background: `${schCfg.color}20`,
              color: schCfg.color,
              border: `1px solid ${schCfg.color}40`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: schCfg.color }}
            />
            {schedule}
          </span>
          <span className="text-[9px] font-bold text-slate-400 ml-auto bg-slate-800/50 px-2 py-1 rounded-full">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* Meta information - dark theme */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-800/50 flex items-center justify-center">
              <User size={12} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                PM
              </p>
              <p className="text-[11px] font-semibold text-slate-300 leading-tight">
                {project.pmName || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-800/50 flex items-center justify-center">
              <Calendar size={12} className="text-slate-400" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white">
                Target
              </p>
              <p className="text-[11px] font-semibold text-slate-300 leading-tight">
                {fmtShort(project.targetEndDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, ${statusColor}, transparent)`,
          opacity: isHovered ? 1 : 0.3,
        }}
      />
    </div>
  );
}
