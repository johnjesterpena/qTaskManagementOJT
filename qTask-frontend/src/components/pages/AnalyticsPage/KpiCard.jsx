export default function KpiCard({ label, value, accent, sub }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #20476E, #1C61A1)",
        border: `1px solid ${accent}40`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />
      <span className="text-sm font-bold uppercase tracking-widest text-white ">
        {label}
      </span>
      <span className="text-3xl font-black text-white leading-none">
        {value}
      </span>
      {sub && <span className="text-xs text-white mt-0.5">{sub}</span>}
    </div>
  );
}
