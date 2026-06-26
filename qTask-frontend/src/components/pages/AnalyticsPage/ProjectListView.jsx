import ProjectCard from "./ProjectCard";

export default function ProjectListView({ projects, allPhases, onSelect, fadeIn }) {
  const ongoing   = projects.filter((p) => p.status === "ongoing");
  const completed = projects.filter((p) => p.status === "completed");
  const cancelled = projects.filter((p) => p.status === "cancelled");

  return (
    <div
      className="space-y-8 pb-10"
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Page header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Project Intelligence</p>
        <h1 className="text-2xl font-black text-slate-800 leading-none">Analytics</h1>
      </div>

      {/* Ongoing */}
      {ongoing.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ongoing</span>
            <span className="text-[9px] font-bold rounded-full px-2 py-0.5" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
              {ongoing.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ongoing.map((p, i) => (
              <ProjectCard key={p.id} project={p} allPhases={allPhases} onClick={() => onSelect(p.id)} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed</span>
            <span className="text-[9px] font-bold rounded-full px-2 py-0.5" style={{ background: "#ecfdf5", color: "#059669" }}>
              {completed.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completed.map((p, i) => (
              <ProjectCard key={p.id} project={p} allPhases={allPhases} onClick={() => onSelect(p.id)} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cancelled</span>
            <span className="text-[9px] font-bold rounded-full px-2 py-0.5" style={{ background: "#fef2f2", color: "#ef4444" }}>
              {cancelled.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cancelled.map((p, i) => (
              <ProjectCard key={p.id} project={p} allPhases={allPhases} onClick={() => onSelect(p.id)} index={i} />
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="flex items-center justify-center h-48 rounded-xl text-slate-400 text-sm" style={{ border: "2px dashed #e2e8f0" }}>
          No projects found.
        </div>
      )}
    </div>
  );
}