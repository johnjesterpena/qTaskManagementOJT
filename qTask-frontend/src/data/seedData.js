export const SEED_COLUMNS = [
  { key: "pending", title: "To Do", isFinal: false, isDefault: true },
  { key: "inProgress", title: "In Progress", isFinal: false, isDefault: false },
  { key: "forReview", title: "For Review", isFinal: false, isDefault: false },
  { key: "done", title: "Client Review", isFinal: true, isDefault: false },
];

export const SEED_TASKS = {
  pending: [
    {
      id: "1",
      name: "Design login page",
      description:
        "Create the UI mockup and implement the HTML/CSS for the login screen.",
      severity: "High",
      assignee: "Ana",
      targetDate: "2025-04-10",
      progress: 0,
      actualEndDate: null,
      subtasks: [
        { id: "s1-1", title: "Create Figma mockup", done: false },
        { id: "s1-2", title: "Write HTML structure", done: false },
        { id: "s1-3", title: "Apply CSS styling", done: false },
      ],
    },
    {
      id: "2",
      name: "Write API docs",
      description: "Document all Express routes using a Postman collection.",
      severity: "Low",
      assignee: "Ben",
      targetDate: "2025-04-20",
      progress: 0,
      actualEndDate: null,
      subtasks: [],
    },
  ],
  inProgress: [
    {
      id: "3",
      name: "Build dashboard UI",
      description:
        "Implement the analytics dashboard with summary cards and charts using ApexCharts.",
      severity: "High",
      assignee: "Carlo",
      targetDate: "2025-04-15",
      progress: 50,
      actualEndDate: null,
      subtasks: [
        { id: "s3-1", title: "Summary stat cards", done: true },
        { id: "s3-2", title: "Bar chart - tasks by status", done: false },
        { id: "s3-3", title: "Developer efficiency table", done: false },
        { id: "s3-4", title: "Global project filter", done: false },
      ],
    },
  ],
  forReview: [
    {
      id: "4",
      name: "Auth endpoints",
      description:
        "Build Express JWT authentication with bcrypt password hashing.",
      severity: "Critical",
      assignee: "Dana",
      targetDate: "2025-04-12",
      progress: 100,
      actualEndDate: null,
      subtasks: [
        { id: "s4-1", title: "POST /login route", done: true },
        { id: "s4-2", title: "JWT middleware", done: true },
        { id: "s4-3", title: "POST /logout route", done: true },
      ],
    },
  ],
  done: [
    {
      id: "5",
      name: "Project repo setup",
      description:
        "Initialise the GitHub repository, set up branch protection rules and README.",
      severity: "Medium",
      assignee: "Carlo",
      targetDate: "2025-04-01",
      progress: 100,
      actualEndDate: "2025-04-01",
      subtasks: [
        { id: "s5-1", title: "Create GitHub repo", done: true },
        { id: "s5-2", title: "Add branch protection", done: true },
        { id: "s5-3", title: "Write README", done: true },
      ],
    },
  ],
};
