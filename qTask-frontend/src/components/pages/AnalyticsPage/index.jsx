import { useState, useEffect } from "react";
import { fetchProjects, fetchTasks, fetchPhases, fetchSeverities, fetchStatuses } from "../../../services/api";
import ProjectListView from "./ProjectListView";
import AnalyticsDetailView from "./AnalyticsDetailView";

export default function AnalyticsPage({ selectedId, onSelect, onBack, onManageSeverities }) {
  const [projects,   setProjects]   = useState([]);
  const [allPhases,  setAllPhases]  = useState([]);
  const [severities, setSeverities] = useState([]);
  const [statuses,   setStatuses]   = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [fadeIn,     setFadeIn]     = useState(false);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchPhases(), fetchSeverities(), fetchStatuses()])
      .then(([proj, phases, sevs, stats]) => {
        setProjects(proj);
        setAllPhases(phases);
        setSeverities(sevs);
        setStatuses(stats);
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => setFadeIn(true), 50);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setFadeIn(false);
    fetchTasks(selectedId, null, null).then((data) => {
      setTasks(data);
      setTimeout(() => setFadeIn(true), 50);
    });
  }, [selectedId]);

  useEffect(() => {
    const handleSeverityUpdate = () => {
      fetchSeverities().then(setSeverities);
      if (selectedId) {
        fetchTasks(selectedId, null, null).then(setTasks);
      }
    };

    window.addEventListener("severities-updated", handleSeverityUpdate);
    return () => window.removeEventListener("severities-updated", handleSeverityUpdate);
  }, [selectedId]);

  const handleSelect = (id) => {
    setFadeIn(false);
    onSelect(id);
  };

  const handleBack = () => {
    setFadeIn(false);
    setTasks([]);
    onBack();
    setTimeout(() => setFadeIn(true), 50);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Loading analytics</p>
        </div>
      </div>
    );
  }

  if (!selectedId) {
    return (
      <ProjectListView
        projects={projects}
        allPhases={allPhases}
        onSelect={handleSelect}
        fadeIn={fadeIn}
      />
    );
  }

  const project = projects.find((p) => p.id === selectedId);

  return (
    <AnalyticsDetailView
      project={project}
      tasks={tasks}
      allPhases={allPhases}
      severities={severities}
      statuses={statuses}
      onBack={handleBack}
      onManageSeverities={onManageSeverities}
      fadeIn={fadeIn}
    />
  );
}