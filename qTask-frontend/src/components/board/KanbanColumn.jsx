import TaskCard from "./TaskCard";

export default function KanbanColumn({
  col,
  tasks,
  colRef,
  onCardClick,
  onMoveToPhase,
  allPhases,
  isDragging,
}) {
  return (
    <div
      className="shrink-0 w-60 rounded-xl overflow-hidden flex flex-col h-full min-h-0"
      style={{
        background: "#F0F8FF",
        border: `1px solid #DCDCDC`,
        borderTop: `3px solid ${col.color || "#0078D7"}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "#FFFFFF", borderBottom: "1px solid #DCDCDC" }}
      >
        <span
          className="text-xs font-semibold truncate pr-2"
          style={{ color: "#20476E" }}
        >
          {col.label}
        </span>
        <span
          className="shrink-0 text-xs rounded-full px-2 py-0.5 font-medium"
          style={{
            background: "#F0F8FF",
            color: "#1C61A1",
            border: "1px solid #DCDCDC",
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={colRef}
        data-col={col.id}
        className="
    flex-1
    px-2 pb-3 pt-2
    space-y-2
    overflow-y-auto
    overflow-x-hidden
    kanban-column-scroll
  "
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onCardClick={onCardClick}
            onMoveToPhase={onMoveToPhase}
            allPhases={allPhases}
          />
        ))}
      </div>
    </div>
  );
}