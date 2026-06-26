import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Repeat2,
} from "lucide-react";
import { fetchScheduleTasks } from "../../services/api";

const VIEWS = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "agenda", label: "Agenda" },
];

const T = {
  brand: "#0078D7",
  brandDark: "#1C61A1",
  brandDeep: "#20476E",
  border: "#DCDCDC",
  muted: "#4f6070",
  danger: "#dc2626",
  dangerBg: "#fee2e2",
};

function toDate(value) {
  return value ? new Date(value) : null;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function isSameDay(a, b) {
  return a && b && startOfDay(a).getTime() === startOfDay(b).getTime();
}

function startOfWeek(date) {
  const next = startOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
}

function monthDays(anchor) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function formatMonthYear(date) {
  return date.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}

function formatDate(date) {
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name) {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function eventTouchesDay(event, day) {
  const start = startOfDay(toDate(event.start));
  const end = startOfDay(toDate(event.end));
  const target = startOfDay(day);
  return start <= target && end >= target;
}

function EventBar({ event, showProjectPrefix, dense = false }) {
  const bg = event.isOverdue ? T.danger : event.statusColor || T.brand;
  const assignees = event.assignees ?? [];
  const title = `${showProjectPrefix ? `[${event.projectName}] ` : ""}${event.title}`;

  return (
    <div
      title={title}
      style={{
        minHeight: dense ? 24 : 30,
        borderRadius: 6,
        background: event.isOverdue ? T.dangerBg : `${bg}18`,
        border: `1px solid ${event.isOverdue ? "#fecaca" : `${bg}55`}`,
        color: event.isOverdue ? T.danger : T.brandDeep,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: dense ? "3px 5px" : "5px 8px",
        overflow: "hidden",
        fontSize: "var(--fs-xs)",
        fontWeight: 800,
        cursor: "default",
      }}
    >
      <span
        style={{
          width: 5,
          alignSelf: "stretch",
          borderRadius: 999,
          background: bg,
          flexShrink: 0,
        }}
      />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {showProjectPrefix && (
          <span style={{ color: event.isOverdue ? T.danger : T.brandDark }}>
            [{event.projectName}]{" "}
          </span>
        )}
        {event.title}
      </span>
      {event.isRecurring && <Repeat2 size={12} style={{ flexShrink: 0 }} />}
      {event.isOverdue && <AlertTriangle size={12} style={{ flexShrink: 0 }} />}
      {assignees.length > 0 && (
        <div style={{ display: "flex", marginLeft: "auto", flexShrink: 0 }}>
          {assignees.slice(0, 2).map((user, index) => (
            <span
              key={`${event.id}-${user.role}-${user.id}`}
              title={`${user.name} (${user.role})`}
              style={{
                width: dense ? 18 : 22,
                height: dense ? 18 : 22,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: user.role === "QA" ? "#7c3aed" : T.brand,
                color: "#fff",
                fontSize: dense ? 8 : 9,
                fontWeight: 900,
                border: "1px solid #fff",
                marginLeft: index === 0 ? 0 : -5,
              }}
            >
              {initials(user.name)}
            </span>
          ))}
          {assignees.length > 2 && (
            <span style={{ fontSize: 9, color: T.muted, marginLeft: 3 }}>
              +{assignees.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MonthView({ anchorDate, events, showProjectPrefix }) {
  const days = monthDays(anchorDate);
  const today = startOfDay(new Date());

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", background: T.brandDeep, color: "#fff" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} style={{ padding: "9px 10px", fontSize: "var(--fs-xs)", fontWeight: 900, textTransform: "uppercase" }}>
            {day}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {days.map((day) => {
          const dayEvents = events.filter((event) => eventTouchesDay(event, day));
          const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
          return (
            <div
              key={day.toISOString()}
              style={{
                minHeight: 118,
                padding: 8,
                borderTop: `1px solid ${T.border}`,
                borderRight: `1px solid ${T.border}`,
                background: isCurrentMonth ? "#fff" : "#f8fafc",
                opacity: isCurrentMonth ? 1 : 0.56,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: isSameDay(day, today) ? T.brand : "transparent",
                  color: isSameDay(day, today) ? "#fff" : T.brandDeep,
                  fontWeight: 900,
                  fontSize: "var(--fs-xs)",
                  marginBottom: 6,
                }}
              >
                {day.getDate()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {dayEvents.slice(0, 3).map((event) => (
                  <EventBar key={event.id} event={event} showProjectPrefix={showProjectPrefix} dense />
                ))}
                {dayEvents.length > 3 && (
                  <span style={{ fontSize: "var(--fs-xs)", color: T.muted, fontWeight: 700 }}>
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ anchorDate, events, showProjectPrefix }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(anchorDate), index));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(150px, 1fr))", gap: 10, overflowX: "auto" }}>
      {days.map((day) => {
        const dayEvents = events.filter((event) => eventTouchesDay(event, day));
        return (
          <div key={day.toISOString()} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, minHeight: 520, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", background: "#F0F8FF", borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontSize: "var(--fs-xs)", color: T.muted, fontWeight: 900, textTransform: "uppercase" }}>
                {day.toLocaleDateString("en-PH", { weekday: "short" })}
              </p>
              <p style={{ fontSize: "var(--fs-lg)", color: T.brandDeep, fontWeight: 900 }}>{day.getDate()}</p>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {dayEvents.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "var(--fs-xs)", padding: 8 }}>No activities</p>
              ) : (
                dayEvents.map((event) => (
                  <EventBar key={event.id} event={event} showProjectPrefix={showProjectPrefix} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ anchorDate, events, showProjectPrefix }) {
  const dayEvents = events.filter((event) => eventTouchesDay(event, anchorDate));

  return (
    <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "96px minmax(0, 1fr)" }}>
        {Array.from({ length: 12 }, (_, index) => index + 8).map((hour) => (
          <div key={hour} style={{ display: "contents" }}>
            <div style={{ padding: "14px 12px", borderTop: `1px solid ${T.border}`, color: T.muted, fontSize: "var(--fs-xs)", fontWeight: 800 }}>
              {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, minHeight: 56, padding: "6px 10px" }}>
              {hour === 8 && (
                <div style={{ display: "grid", gap: 6 }}>
                  {dayEvents.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "var(--fs-sm)" }}>No scheduled activities for this day</p>
                  ) : (
                    dayEvents.map((event) => (
                      <EventBar key={event.id} event={event} showProjectPrefix={showProjectPrefix} />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YearView({ anchorDate, events, showProjectPrefix }) {
  const months = Array.from({ length: 12 }, (_, month) => new Date(anchorDate.getFullYear(), month, 1));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
      {months.map((month) => {
        const monthEvents = events.filter((event) => {
          const end = toDate(event.end);
          return end && end.getFullYear() === month.getFullYear() && end.getMonth() === month.getMonth();
        });
        return (
          <div key={month.toISOString()} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", background: "#F0F8FF", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.brandDeep, fontWeight: 900 }}>{month.toLocaleDateString("en-PH", { month: "long" })}</span>
              <span style={{ color: T.muted, fontSize: "var(--fs-xs)", fontWeight: 800 }}>{monthEvents.length}</span>
            </div>
            <div style={{ padding: 10, display: "grid", gap: 5, minHeight: 112 }}>
              {monthEvents.slice(0, 4).map((event) => (
                <EventBar key={event.id} event={event} showProjectPrefix={showProjectPrefix} dense />
              ))}
              {monthEvents.length === 0 && (
                <p style={{ color: "#94a3b8", fontSize: "var(--fs-xs)" }}>No activities</p>
              )}
              {monthEvents.length > 4 && (
                <span style={{ color: T.muted, fontSize: "var(--fs-xs)", fontWeight: 800 }}>
                  +{monthEvents.length - 4} more
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgendaView({ events, showProjectPrefix }) {
  const grouped = events.reduce((acc, event) => {
    const key = startOfDay(toDate(event.end)).toISOString();
    acc[key] = acc[key] ?? [];
    acc[key].push(event);
    return acc;
  }, {});

  const keys = Object.keys(grouped).sort();

  return (
    <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      {keys.length === 0 ? (
        <p style={{ padding: 28, color: T.muted }}>No activities match the selected project.</p>
      ) : (
        keys.map((key) => (
          <div key={key} style={{ display: "grid", gridTemplateColumns: "170px minmax(0, 1fr)", borderTop: `1px solid ${T.border}` }}>
            <div style={{ padding: 14, background: "#F0F8FF" }}>
              <p style={{ color: T.brandDeep, fontWeight: 900 }}>{formatDate(new Date(key))}</p>
              <p style={{ color: T.muted, fontSize: "var(--fs-xs)", fontWeight: 700 }}>
                {new Date(key).toLocaleDateString("en-PH", { weekday: "long" })}
              </p>
            </div>
            <div style={{ padding: 12, display: "grid", gap: 8 }}>
              {grouped[key].map((event) => (
                <EventBar key={event.id} event={event} showProjectPrefix={showProjectPrefix} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function SchedulePage({ projects }) {
  const [view, setView] = useState("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [projectId, setProjectId] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const selectedProjectId = projectId ? Number(projectId) : null;
  const showProjectPrefix = selectedProjectId === null;

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchScheduleTasks(selectedProjectId);
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.end) - new Date(b.end)),
    [events],
  );

  const navigateDate = (direction) => {
    setAnchorDate((current) => {
      if (view === "day") return addDays(current, direction);
      if (view === "week") return addDays(current, direction * 7);
      if (view === "year") return new Date(current.getFullYear() + direction, current.getMonth(), 1);
      return addMonths(current, direction);
    });
  };

  const rangeLabel = useMemo(() => {
    if (view === "day") return formatDate(anchorDate);
    if (view === "week") {
      const start = startOfWeek(anchorDate);
      const end = addDays(start, 6);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    if (view === "year") return String(anchorDate.getFullYear());
    if (view === "agenda") return "Agenda";
    return formatMonthYear(anchorDate);
  }, [anchorDate, view]);

  const content = () => {
    if (loading) {
      return (
        <div style={{ display: "grid", placeItems: "center", minHeight: 360, color: T.muted }}>
          Loading schedule...
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: 24, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, color: T.danger }}>
          {error}
        </div>
      );
    }

    if (view === "day") return <DayView anchorDate={anchorDate} events={sortedEvents} showProjectPrefix={showProjectPrefix} />;
    if (view === "week") return <WeekView anchorDate={anchorDate} events={sortedEvents} showProjectPrefix={showProjectPrefix} />;
    if (view === "year") return <YearView anchorDate={anchorDate} events={sortedEvents} showProjectPrefix={showProjectPrefix} />;
    if (view === "agenda") return <AgendaView events={sortedEvents} showProjectPrefix={showProjectPrefix} />;
    return <MonthView anchorDate={anchorDate} events={sortedEvents} showProjectPrefix={showProjectPrefix} />;
  };

  return (
    <div className="space-y-5 pb-10" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p style={{ fontSize: "var(--fs-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 4 }}>
            Calendar and permissions module
          </p>
          <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 900, color: T.brandDeep, lineHeight: 1.1 }}>
            Schedule of Activities
          </h1>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)", fontWeight: 800, color: T.brandDeep }}>
            Select Project:
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", color: T.brandDeep, background: "#fff", minWidth: 190 }}
            >
              <option value="">ALL</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button aria-label="Previous" onClick={() => navigateDate(-1)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`, display: "grid", placeItems: "center", color: T.brandDeep, background: "#fff" }}>
            <ChevronLeft size={18} />
          </button>
          <button aria-label="Next" onClick={() => navigateDate(1)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`, display: "grid", placeItems: "center", color: T.brandDeep, background: "#fff" }}>
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setAnchorDate(new Date())} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 12px", color: T.brandDeep, background: "#F0F8FF", fontWeight: 800 }}>
            Today
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.brandDeep, fontWeight: 900 }}>
            {view === "agenda" ? <List size={18} /> : <CalendarDays size={18} />}
            <span>{rangeLabel}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {VIEWS.map((item) => {
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                style={{
                  border: `1px solid ${active ? T.brand : T.border}`,
                  borderRadius: 8,
                  padding: "7px 12px",
                  background: active ? T.brand : "#fff",
                  color: active ? "#fff" : T.brandDeep,
                  fontWeight: 900,
                  fontSize: "var(--fs-sm)",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {content()}
    </div>
  );
}
