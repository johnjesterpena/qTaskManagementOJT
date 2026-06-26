import {
  LayoutDashboard,
  KanbanSquare,
  CalendarDays,
  Grid2X2,
  TableProperties,
  ListTodo,
  Users,
  ActivitySquare,
  BarChart2,
  FlaskConical,
  Settings2,
  FolderKanban,
  CheckSquare
} from "lucide-react";

/**
 * Navigation config per role.
 * Each item:
 * key              — unique identifier, used as the active page key
 * label            — display text
 * icon             — lucide-react component
 * underDevelopment — grays out the item and shows "Under Development" badge
 */

const NAV_ITEMS = {
  Admin: [
    { key: "dashboard",       label: "Dashboard",       icon: LayoutDashboard }, 
    { key: "kanban",          label: "Kanban Board",    icon: KanbanSquare    },
    { key: "schedule",        label: "Schedule",        icon: CalendarDays    },
    { key: "matrix",          label: "Eisenhower",      icon: Grid2X2         },
    { key: "monitoring",      label: "Monitoring",      icon: TableProperties },
    { key: "users",           label: "User Management", icon: Users           },
    { key: "projects",        label: "Projects",        icon: FolderKanban    },
    { key: "analytics",       label: "Analytics",       icon: BarChart2       },
    { key: "all-subtasks",    label: "All Subtasks",    icon: CheckSquare     },
    { key: "logs",            label: "Activity Logs",   icon: ActivitySquare  },
    { key: "settings",        label: "Settings",        icon: Settings2       },
  ],

  ProjectManager: [
    { key: "dashboard",       label: "Dashboard",       icon: LayoutDashboard },
    { key: "overview",        label: "Overview",        icon: LayoutDashboard },
    { key: "schedule",        label: "Schedule",        icon: CalendarDays    },
    { key: "matrix",          label: "Eisenhower",      icon: Grid2X2         },
    { key: "monitoring",      label: "Monitoring",      icon: TableProperties },
    { key: "analytics",       label: "Analytics",       icon: BarChart2       },
    { key: "tasks",           label: "All Tasks",       icon: ListTodo        },
    { key: "all-subtasks",    label: "All Subtasks",    icon: CheckSquare     },
    { key: "logs",            label: "Activity Log",    icon: ActivitySquare  },
  ],

  Developer: [
    { key: "my-tasks",        label: "My Tasks",        icon: KanbanSquare    },
    { key: "schedule",        label: "Schedule",        icon: CalendarDays    },
    { key: "matrix",          label: "Eisenhower",      icon: Grid2X2         },
    { key: "monitoring",      label: "Monitoring",      icon: TableProperties },
    { key: "all-subtasks",    label: "All Subtasks",    icon: CheckSquare     },
    { key: "all-tasks",       label: "All Tasks",       icon: ListTodo        },
    { key: "logs",            label: "Activity Log",    icon: ActivitySquare  },
  ],

  QA: [
    { key: "all-subtasks",    label: "All Subtasks",    icon: CheckSquare     },
    { key: "qa-board",        label: "QA Board",        icon: FlaskConical    },
    { key: "schedule",        label: "Schedule",        icon: CalendarDays    },
    { key: "matrix",          label: "Eisenhower",      icon: Grid2X2         },
    { key: "monitoring",      label: "Monitoring",      icon: TableProperties },
    { key: "all-tasks",       label: "All Tasks",       icon: ListTodo        },
    { key: "logs",            label: "Activity Log",    icon: ActivitySquare  },
  ],
};

/**
 * Returns the nav items for a given role.
 * Falls back to an empty array if the role is unrecognized.
 */
export function getNavItems(role) {
  return NAV_ITEMS[role] ?? [];
}

/**
 * Returns the default page key for a given role
 * (the first item in the nav list).
 */
export function getDefaultPage(role) {
  return NAV_ITEMS[role]?.[0]?.key ?? null;
}
