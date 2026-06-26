import { useState } from "react";
import { Layers, AlertOctagon, CheckSquare } from "lucide-react";
import PhasesPage from "./PhasesPage";
import SeverityPage from "./SeverityPage";
import StatusPage from "./StatusPage";

// Placeholder for Statuses
const StatusesPlaceholder = () => (
  <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
    Status Management coming soon.
  </div>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("phases");

  const tabs = [
    { id: "phases", label: "Workflow Phases", icon: Layers, component: <PhasesPage /> },
    { id: "severities", label: "Task Severities", icon: AlertOctagon, component: <SeverityPage /> },
    { id: "statuses", label: "Status", icon: CheckSquare, component: <StatusPage /> },
  ];

  return (
    <div className="space-y-6 pb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Configuration</p>
        <h1 className="text-2xl font-black text-slate-800 leading-none">System Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {tabs.find((t) => t.id === activeTab)?.component}
      </div>
    </div>
  );
}