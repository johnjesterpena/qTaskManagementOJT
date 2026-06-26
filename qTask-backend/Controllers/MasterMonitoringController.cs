using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QtechOJT_Net9.Database;
using QtechOJT_Net9.DTO.MainTask;
using QtechOJT_Net9.Models;

namespace QtechOJT_Net9.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MasterMonitoringController(KanbanDbContext context) : ControllerBase
    {
        private readonly KanbanDbContext _context = context;

        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            return Request.Headers.TryGetValue("x-user-id", out var userIdStr) &&
                   int.TryParse(userIdStr, out userId);
        }

        private async Task<IQueryable<Main_Task>?> AuthorizedTaskQuery(int userId)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userId && u.IsActive == 1)
                .Select(u => new { u.Id, u.Role })
                .FirstOrDefaultAsync();

            if (user is null) return null;

            var query = _context.Main_Tasks.AsQueryable();

            if (user.Role == "ProjectManager")
            {
                query = query.Where(t => t.Project.PmId == user.Id);
            }
            else if (user.Role == "Developer")
            {
                query = query.Where(t =>
                    t.AssigneeId == user.Id &&
                    _context.Project_Users.Any(pu =>
                        pu.ProjectId == t.ProjectId &&
                        pu.UserId == user.Id &&
                        pu.Role == "Developer"));
            }
            else if (user.Role == "QA")
            {
                query = query.Where(t =>
                    t.QaAssigneeId == user.Id &&
                    _context.Project_Users.Any(pu =>
                        pu.ProjectId == t.ProjectId &&
                        pu.UserId == user.Id &&
                        pu.Role == "QA"));
            }
            else if (user.Role != "Admin")
            {
                return null;
            }

            return query;
        }

        [HttpGet("tasks")]
        public async Task<IActionResult> GetTasks(
            [FromQuery] int? projectId,
            [FromQuery] int? assigneeId,
            [FromQuery] int? statusId,
            [FromQuery] int? phaseId,
            [FromQuery] int? severityId,
            [FromQuery] DateTime? targetDateFrom,
            [FromQuery] DateTime? targetDateTo,
            [FromQuery] bool? pastDue)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized(new { message = "User not identified" });

            var query = await AuthorizedTaskQuery(userId);
            if (query is null)
                return StatusCode(403, new { message = "Access denied" });

            if (projectId.HasValue)
                query = query.Where(t => t.ProjectId == projectId.Value);

            if (assigneeId.HasValue)
                query = query.Where(t => t.AssigneeId == assigneeId.Value || t.QaAssigneeId == assigneeId.Value);

            if (statusId.HasValue)
                query = query.Where(t => t.StatusId == statusId.Value);

            if (phaseId.HasValue)
                query = query.Where(t => t.PhaseId == phaseId.Value);

            if (severityId.HasValue)
                query = query.Where(t => t.SeverityId == severityId.Value);

            if (targetDateFrom.HasValue)
                query = query.Where(t => t.TargetDate.Date >= targetDateFrom.Value.Date);

            if (targetDateTo.HasValue)
                query = query.Where(t => t.TargetDate.Date <= targetDateTo.Value.Date);

            var today = DateTime.Today;
            if (pastDue == true)
                query = query.Where(t => t.TargetDate.Date < today && t.Status.IsFinal == 0);

            var tasks = await query
                .AsNoTracking()
                .OrderBy(t => t.TargetDate)
                .Select(t => new MasterMonitoringTaskDto(
                    t.Id,
                    t.ProjectId,
                    t.Project.Title,
                    t.Title,
                    t.PhaseId,
                    t.Phase.Label,
                    t.Phase.Grouping,
                    t.SeverityId ?? 0,
                    t.Severity != null ? t.Severity.Label : "Unspecified",
                    t.Severity != null ? t.Severity.Color : "#6b7280",
                    t.Severity != null ? t.Severity.SortOrder : 99,
                    t.StatusId,
                    t.Status.Label,
                    t.Status.Color,
                    t.Status.IsFinal,
                    t.AssigneeId,
                    t.Assignee != null ? t.Assignee.Name : null,
                    t.QaAssigneeId,
                    t.QaAssignee != null ? t.QaAssignee.Name : null,
                    t.StartDate,
                    t.TargetDate,
                    t.Progress,
                    t.Subtasks.Count,
                    t.Subtasks.Count(s => s.IsDone == 1),
                    t.TargetDate.Date < today && t.Status.IsFinal == 0
                ))
                .ToListAsync();

            return Ok(tasks);
        }
    }
}
