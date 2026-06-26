using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using QtechOJT_Net9.Database;
using QtechOJT_Net9.DTO.MainTask;
using QtechOJT_Net9.DTO.SubTask;
using QtechOJT_Net9.Hubs;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace QtechOJT_Net9.Controllers
{
    [Route("api/subtasks")]
    [ApiController]
    public class SubTaskController(KanbanDbContext context, IHubContext<KanbanHub> hub) : ControllerBase
    {
        private readonly KanbanDbContext _context = context;
        private readonly IHubContext<KanbanHub> _hub = hub;

        // -- PATCH /api/subtasks/:id ----------------------
        [HttpPatch("{id:int}")]
        public async Task<IActionResult> EditSubTask(int id, [FromBody] EditSubTaskDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { message = "Title is required" });

            int? userId = null;
            if (Request.Headers.TryGetValue("x-user-id", out var userIdHeader)
                && int.TryParse(userIdHeader, out var parsedId))
                userId = parsedId;

            if (userId is null)
                return BadRequest(new { message = "User not identified — x-user-id header missing" });

            var subtask = await _context.Sub_Tasks.FindAsync(id);
            if (subtask is null)
                return NotFound(new { message = "Subtask not found" });

            if (subtask.CreatorId != userId)
                return StatusCode(403, new { message = "You can only edit your own subtasks" });

            subtask.Title = dto.Title.Trim();
            await _context.SaveChangesAsync();

            var updated = await _context.Main_Tasks
            .AsNoTracking()
            .Where(t => t.Id == subtask.Main_TaskId)
            .Select(m => new GeneralFull_TaskByIdDto(
                m.Id, m.ProjectId,
                m.Title, m.Description, m.Progress,
                m.UpdatedAt, m.CreatedAt, m.ActualEndDate, m.StartDate, m.TargetDate,
                m.Assignee.Id, m.Assignee.Name,
                m.QaAssignee.Id, m.QaAssignee.Name,
                m.Creator.Id, m.Creator.Name,
                m.Status.Id, m.Status.Label, m.Status.Color,
                m.Severity.Id, m.Severity.Label, m.Severity.Color, m.Severity.SortOrder,
                m.Phase.Id, m.Phase.Label, m.Phase.Grouping,
                m.Variance, m.Mandays,
                m.Subtasks.Select(s => new GetSubTaskDto(
                    s.Id, 
                    s.CreatorId,
                    s.Title,
                    s.IsDone, 
                    s.Main_TaskId
                )).ToList()
            ))
            .FirstOrDefaultAsync();

            await _hub.Clients
                .Group(KanbanHub.ProjectGroup(updated!.ProjectId))
                .SendAsync("SubtasksUpdated", updated);
            await _hub.Clients
                .Group(KanbanHub.AllTasksGroup())
                .SendAsync("SubtasksUpdated", updated);

            return Ok(new { id = subtask.Id, title = subtask.Title });
        }

        // -- DELETE /api/subtasks/:subtaskId --------------------
        // Only the subtask's creator may delete it.
        [HttpDelete("{subtaskId:int}")]
        public async Task<IActionResult> DeleteSubTask(int subtaskId)
        {

            int? requestingId = null;
            if (Request.Headers.TryGetValue("x-user-id", out var AssigneeIdHeader))
                if (int.TryParse(AssigneeIdHeader, out var parsedId))
                    requestingId = parsedId;

            if (!Request.Headers.TryGetValue("x-user-id", out var userIdHeader)
                || !int.TryParse(userIdHeader, out var userId))
                return BadRequest(new { message = "User not identified — x-user-id header missing" });

            var subtask = await _context.Sub_Tasks.FindAsync(subtaskId);
            if (subtask is null)
                return NotFound(new { message = "Subtask not found" });

            var requestingUser = await _context.Users.FindAsync(requestingId); // from [FromQuery] or body
                if (requestingUser is null) return Unauthorized();

            Console.WriteLine($"Requesting User Role: {requestingUser.Role}, User ID: {requestingUser.Id}"); // Debug log

            bool isPMandCreatorIsNull = subtask.CreatorId is null && requestingUser.Role == "ProjectManager";
            // ALL conditions MUST be true to deny access
            if ( subtask.CreatorId != requestingUser.Id
                && requestingUser.Role != "Admin"
                && requestingUser.Role != "ProjectManager"
                )
                return StatusCode(403, new { message = "You can only delete subtasks you created or if you are an Admin." });


            _context.Sub_Tasks.Remove(subtask);
            await _context.SaveChangesAsync();

            var updated = await _context.Main_Tasks
            .AsNoTracking()
            .Where(t => t.Id == subtask.Main_TaskId)
            .Select(m => new GeneralFull_TaskByIdDto(
                m.Id, m.ProjectId,
                m.Title, m.Description, m.Progress,
                m.UpdatedAt, m.CreatedAt, m.ActualEndDate, m.StartDate, m.TargetDate,
                m.Assignee.Id, m.Assignee.Name,
                m.QaAssignee.Id, m.QaAssignee.Name,
                m.Creator.Id, m.Creator.Name,
                m.Status.Id, m.Status.Label, m.Status.Color,
                m.Severity.Id, m.Severity.Label, m.Severity.Color, m.Severity.SortOrder,
                m.Phase.Id, m.Phase.Label, m.Phase.Grouping,
                m.Variance, m.Mandays,
                m.Subtasks.Select(s => new GetSubTaskDto(
                    s.Id,
                    s.CreatorId,
                    s.Title,
                    s.IsDone,
                    s.Main_TaskId
                )).ToList()
            ))
            .FirstOrDefaultAsync();

            await _hub.Clients
                .Group(KanbanHub.ProjectGroup(updated!.ProjectId))
                .SendAsync("SubtasksUpdated", updated);

            return Ok(new { message = "Subtask deleted" });
        }


    }
}