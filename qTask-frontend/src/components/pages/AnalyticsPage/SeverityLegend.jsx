import { getSeverityColor } from "./constants";

export default function SeverityLegend({ severities, sevBreakdown }) {
  const usedSeverities = severities.filter(s =>
    sevBreakdown.some(sev => sev.full === s.label)
  );

  return (
    <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
      {usedSeverities.map((severity) => (
        <div key={severity.id} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: getSeverityColor(severity) }}
          />
          <span className="text-[9px] text-slate-500 font-medium">
            {severity.label.replace(/^\d+ - /, "")}
          </span>
          <span className="text-[9px] text-slate-400">
            ({sevBreakdown.find(s => s.full === severity.label)?.active || 0})
          </span>
          {sevBreakdown.find(s => s.full === severity.label)?.cancelled > 0 && (
            <span className="text-[9px] text-slate-400">
              [{sevBreakdown.find(s => s.full === severity.label)?.cancelled} cancelled]
            </span>
          )}
        </div>
      ))}
    </div>
  );
}