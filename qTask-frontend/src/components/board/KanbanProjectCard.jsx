export default function KanbanProjectCard({ project, onClick }) {
  const isCompleted = !!project.actualEndDate || project.status === "completed";
  const isCancelled = project.status === "cancelled";
  const statusColor = isCompleted ? "#10b981" : (isCancelled ? "#ef4444" : "#3b82f6");

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl cursor-pointer transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, #0f172a 60%, #1e3a5f)",
        border: "1px solid #1e3a5f",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${statusColor}20`;
        e.currentTarget.style.borderColor = `${statusColor}80`;
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        e.currentTarget.style.borderColor = "#1e3a5f";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Glow effect on hover - matching KpiCard style */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity duration-300"
        style={{ 
          background: statusColor,
          opacity: 0.1
        }}
      />
      
      {/* Card header */}
      <div className="relative px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white leading-snug truncate">{project.title}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{project.clientName || "—"}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: project.untickedSubtaskCount > 0 ? "rgba(248, 113, 113, 0.18)" : "rgba(148, 163, 184, 0.18)", color: project.untickedSubtaskCount > 0 ? "#dc2626" : "#475569", border: project.untickedSubtaskCount > 0 ? "1px solid rgba(220, 38, 38, 0.25)" : "1px solid rgba(148, 163, 184, 0.25)" }}>
            {project.untickedSubtaskCount ?? 0} open
          </span>
          {isCancelled ? (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "#7f1d1d", color: "#fca5a5", border: "1px solid #991b1b" }}>
              Cancelled
            </span>
          ) : isCompleted ? (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "#064e3b", color: "#6ee7b7", border: "1px solid #065f46" }}>
              Completed
            </span>
          ) : (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "#1e3a8a", color: "#93c5fd", border: "1px solid #1e40af" }}>
              Ongoing
            </span>
          )}
        </div>
      </div>
      
      {/* Card body - PM and Target info */}
      <div className="relative px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">PM</p>
          <p className="text-[11px] font-semibold text-slate-300 mt-0.5">{project.pmName || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Target</p>
          <p className="text-[11px] font-semibold text-slate-300 mt-0.5">
            {project.targetEndDate
              ? new Date(project.targetEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "—"}
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl transition-all duration-300"
        style={{ 
          background: `linear-gradient(90deg, ${statusColor}, transparent)`,
          opacity: 0.3
        }}
      />
    </div>
  );
}