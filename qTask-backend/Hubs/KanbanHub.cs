using Microsoft.AspNetCore.SignalR;

namespace QtechOJT_Net9.Hubs
{
    public class KanbanHub : Hub
    /// <summary>
    /// Groups are scoped by entity so pushes only reach relevant clients:
    ///   project-{id}  → all users viewing that project's board
    ///   subtask-{id}  → users with that subtask's comment panel open
    /// </summary>
    {
        // We declare the connection "Hub" here, for SignalR real-time updates.

        // -- Global groups if user (a dev/qa usually) has no selected project and wants to see all tasks across projects --
        public async Task JoinAllTasks() =>
             await Groups.AddToGroupAsync(Context.ConnectionId, AllTasksGroup());

        public async Task LeaveAllTasks() =>
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, AllTasksGroup());

        // -- Project board groups --
        //    Frontend calls these when a project is selected / deselected
        public async Task JoinProject(int projectId) =>
            await Groups.AddToGroupAsync(Context.ConnectionId, ProjectGroup(projectId)); 
            // ConnectionId is the unique identifier for the client's connection to the hub, set using magic
            //  provided by SignalR. It is used to manage group memberships and send messages to specific clients or groups.
            //  long term solution is to use JWT but I dont think the project scope warrants JWT

        public async Task LeaveProject(int projectId) =>
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, ProjectGroup(projectId));


        // -- Subtask comment groups --
        //    Frontend calls these when a comment panel is opened / closed
        public async Task JoinSubTask(int subTaskId) =>
            await Groups.AddToGroupAsync(Context.ConnectionId, SubTaskGroup(subTaskId));

        public async Task LeaveSubTask(int subTaskId) =>
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, SubTaskGroup(subTaskId));



        // -- Static group name helpers — used by controllers so the string is defined once --
        public static string ProjectGroup(int projectId) => $"project-{projectId}";
        public static string SubTaskGroup(int subTaskId) => $"subtask-{subTaskId}";
        public static string AllTasksGroup() => "all-tasks";

    }
}
