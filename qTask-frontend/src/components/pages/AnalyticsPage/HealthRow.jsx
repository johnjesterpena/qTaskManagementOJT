export default function HealthRow({ label, color, bg, children }) {
  return (
    <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${color}30` }}>
      <div
        className="w-32 shrink-0 px-3 py-2.5 text-white text-[10px] font-bold uppercase tracking-widest"
        style={{ background: "linear-gradient(135deg, #1e3a5f, #1e40af)" }}
      >
        {label}
      </div>
      <div className="flex-1 px-3 py-2.5 flex items-center gap-2 text-xs font-semibold" style={{ background: bg, color }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
        {children}
      </div>
    </div>
  );
}