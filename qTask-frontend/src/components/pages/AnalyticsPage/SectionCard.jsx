export default function SectionCard({ title, toolbar, children, className = "" }) {
  return (
    <div className={`rounded-xl overflow-hidden bg-white ${className}`} style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white flex items-center justify-between" style={{ background: "linear-gradient(90deg, #0f172a, #1e3a5f)" }}>
        <span>{title}</span>
        {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      </div>
      {children}
    </div>
  );
}