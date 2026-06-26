using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QtechOJT_Net9.Database;
using QtechOJT_Net9.DTO.MainTask;

namespace QtechOJT_Net9.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScheduleController(KanbanDbContext context) : ControllerBase
    {
        private readonly KanbanDbContext _context = context;

        [HttpGet("tasks")]
        public async Task<IActionResult> GetScheduleTasks([FromQuery] int? projectId)
        {
            if (!Request.Headers.TryGetValue("x-user-id", out var userIdStr) ||
                !int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "User not identified" });

            var user = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userId && u.IsActive == 1)
                .Select(u => new { u.Id, u.Role })
                .FirstOrDefaultAsync();

            if (user is null)
                return Unauthorized(new { message = "User not found or inactive" });

            var query = _context.Main_Tasks.AsQueryable();

            if (user.Role == "Developer")
            {
                query = query.Where(t =>
                    t.Phase.Grouping == "dev" &&
                    _context.Project_Users.Any(pu =>
                        pu.ProjectId == t.ProjectId &&
                        pu.UserId == user.Id &&
                        pu.Role == "Developer"));
            }
            else if (user.Role == "QA")
            {
                query = query.Where(t =>
                    t.Phase.Grouping == "qa" &&
                    _context.Project_Users.Any(pu =>
                        pu.ProjectId == t.ProjectId &&
                        pu.UserId == user.Id &&
                        pu.Role == "QA"));
            }
            else if (user.Role == "ProjectManager")
            {
                query = query.Where(t => t.Project.PmId == user.Id);
            }
            else if (user.Role != "Admin")
            {
                return StatusCode(403, new { message = "Access denied" });
            }

            if (projectId.HasValue)
                query = query.Where(t => t.ProjectId == projectId.Value);

            var today = DateTime.Today;

            var tasks = await query
                .AsNoTracking()
                .OrderBy(t => t.TargetDate)
                .Select(t => new ScheduleTaskDto(
                    t.Id,
                    t.ProjectId,
                    t.Project.Title,
                    t.Title,
                    t.StartDate ?? t.CreatedAt,
                    t.TargetDate,
                    t.PhaseId,
                    t.Phase.Label,
                    t.Phase.Grouping,
                    t.StatusId,
                    t.Status.Label,
                    t.Status.Color,
                    t.Status.IsFinal,
                    t.Progress,
                    t.TargetDate.Date < today && t.Status.IsFinal == 0,
                    false,
                    new List<ScheduleTaskAssigneeDto>()
                ))
                .ToListAsync();

            var taskIds = tasks.Select(t => t.Id).ToList();
            var assignees = await _context.Main_Tasks
                .AsNoTracking()
                .Where(t => taskIds.Contains(t.Id))
                .Select(t => new
                {
                    t.Id,
                    DevId = t.AssigneeId,
                    DevName = t.Assignee != null ? t.Assignee.Name : null,
                    QaId = t.QaAssigneeId,
                    QaName = t.QaAssignee != null ? t.QaAssignee.Name : null
                })
                .ToListAsync();

            var assigneeMap = assignees.ToDictionary(
                t => t.Id,
                t =>
                {
                    var list = new List<ScheduleTaskAssigneeDto>();
                    if (t.DevId.HasValue && !string.IsNullOrWhiteSpace(t.DevName))
                        list.Add(new ScheduleTaskAssigneeDto(t.DevId.Value, t.DevName, "Developer"));
                    if (t.QaId.HasValue && !string.IsNullOrWhiteSpace(t.QaName))
                        list.Add(new ScheduleTaskAssigneeDto(t.QaId.Value, t.QaName, "QA"));
                    return list;
                });

            var response = tasks
                .Select(t => t with
                {
                    Assignees = assigneeMap.TryGetValue(t.Id, out var list)
                        ? list
                        : []
                })
                .ToList();

            return Ok(response);
        }
    }
}
