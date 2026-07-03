using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QtechOJT_Net9.Database;
using QtechOJT_Net9.DTO.MainTask;
using QtechOJT_Net9.Models;

namespace QtechOJT_Net9.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EisenhowerController(KanbanDbContext context) : ControllerBase
    {
        private readonly KanbanDbContext _context = context;

        private static bool IsCritical(int severitySortOrder) => severitySortOrder == 1;

        private static bool IsHigh(int severitySortOrder) => severitySortOrder == 2;

        private static bool IsUrgent(DateTime targetDate)
        {
            var now = DateTime.Now;
            return targetDate.Date <= now.Date || targetDate <= now.AddHours(48);
        }

        // Q1 — Critical severity AND urgent (due within 48 h / past due / today)
        // Q2 — High severity (any target date)
        // Q3 — Medium or Low severity (any target date)
        // Q4 — Everything else (Critical but not yet urgent, or unspecified severity)
        private static string GetQuadrant(int severitySortOrder, DateTime targetDate)
        {
            if (IsCritical(severitySortOrder) && IsUrgent(targetDate)) return "q1";
            if (IsHigh(severitySortOrder)) return "q2";
            if (severitySortOrder >= 3 && severitySortOrder < 99) return "q3";
            return "q4";
        }

        private async Task<(int severityId, DateTime targetDate)> ResolveQuadrantFields(string quadrant)
        {
            var normalized = quadrant.Trim().ToLowerInvariant();

            // SortOrder 1 = Critical, 2 = High, 3 = Medium
            var criticalSeverity = await _context.Severities
                .OrderBy(s => s.SortOrder)
                .FirstOrDefaultAsync(s => s.SortOrder == 1)
                ?? await _context.Severities.OrderBy(s => s.SortOrder).FirstAsync();

            var highSeverity = await _context.Severities
                .OrderBy(s => s.SortOrder)
                .FirstOrDefaultAsync(s => s.SortOrder == 2)
                ?? await _context.Severities.OrderBy(s => s.SortOrder).FirstAsync();

            var mediumSeverity = await _context.Severities
                .OrderBy(s => s.SortOrder)
                .FirstOrDefaultAsync(s => s.SortOrder == 3)
                ?? await _context.Severities.OrderByDescending(s => s.SortOrder).FirstAsync();

            var today = DateTime.Today;
            var later = today.AddDays(7);

            // Q1 — Critical + due today (urgent)
            // Q2 — High severity, target 7 days out (not immediately urgent)
            // Q3 — Medium severity, target 7 days out
            // Q4 — Medium severity, further out (low-priority backlog)
            return normalized switch
            {
                "q1" => (criticalSeverity.Id, today),
                "q2" => (highSeverity.Id, later),
                "q3" => (mediumSeverity.Id, later),
                "q4" => (mediumSeverity.Id, later.AddDays(7)),
                _ => throw new ArgumentException("Invalid quadrant")
            };
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

            if (user.Role == "Developer")
            {
                query = query.Where(t =>
                    t.AssigneeId == user.Id &&
                    t.Phase.Grouping == "dev" &&
                    _context.Project_Users.Any(pu =>
                        pu.ProjectId == t.ProjectId &&
                        pu.UserId == user.Id &&
                        pu.Role == "Developer"));
            }
            else if (user.Role == "QA")
            {
                query = query.Where(t =>
                    t.QaAssigneeId == user.Id &&
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
                return null;
            }

            return query;
        }

        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            return Request.Headers.TryGetValue("x-user-id", out var userIdStr) &&
                   int.TryParse(userIdStr, out userId);
        }

        [HttpGet("tasks")]
        public async Task<IActionResult> GetMatrixTasks([FromQuery] int? projectId, [FromQuery] int? assigneeId)
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

            var today = DateTime.Today;

            var rows = await query
                .AsNoTracking()
                .Where(t => t.Status.IsFinal == 0)
                .OrderBy(t => t.TargetDate)
                .Select(t => new
                {
                    t.Id,
                    t.ProjectId,
                    ProjectName = t.Project.Title,
                    t.Title,
                    t.Description,
                    t.Progress,
                    t.StartDate,
                    t.TargetDate,
                    SeverityId = t.SeverityId ?? 0,
                    SeverityLabel = t.Severity != null ? t.Severity.Label : "Unspecified",
                    SeverityColor = t.Severity != null ? t.Severity.Color : "#6b7280",
                    SeveritySortOrder = t.Severity != null ? t.Severity.SortOrder : 99,
                    t.PhaseId,
                    PhaseLabel = t.Phase.Label,
                    PhaseGrouping = t.Phase.Grouping,
                    t.StatusId,
                    StatusLabel = t.Status.Label,
                    StatusColor = t.Status.Color,
                    StatusIsFinal = t.Status.IsFinal,
                    t.AssigneeId,
                    AssigneeName = t.Assignee != null ? t.Assignee.Name : null,
                    t.QaAssigneeId,
                    QaAssigneeName = t.QaAssignee != null ? t.QaAssignee.Name : null
                })
                .ToListAsync();

            var tasks = rows
                .Select(t =>
                {
                    var urgent = IsUrgent(t.TargetDate);
                    var critical = IsCritical(t.SeveritySortOrder);
                    var important = critical || IsHigh(t.SeveritySortOrder); // Critical or High = important

                    return new EisenhowerTaskDto(
                        t.Id,
                        t.ProjectId,
                        t.ProjectName,
                        t.Title,
                        t.Description,
                        t.Progress,
                        t.StartDate,
                        t.TargetDate,
                        t.SeverityId,
                        t.SeverityLabel,
                        t.SeverityColor,
                        t.SeveritySortOrder,
                        t.PhaseId,
                        t.PhaseLabel,
                        t.PhaseGrouping,
                        t.StatusId,
                        t.StatusLabel,
                        t.StatusColor,
                        t.StatusIsFinal,
                        t.AssigneeId,
                        t.AssigneeName,
                        t.QaAssigneeId,
                        t.QaAssigneeName,
                        GetQuadrant(t.SeveritySortOrder, t.TargetDate),
                        urgent,
                        important,
                        t.TargetDate.Date < today
                    );
                })
                .ToList();

            return Ok(tasks);
        }

        [HttpPatch("tasks/{id:int}/quadrant")]
        public async Task<IActionResult> MoveTaskToQuadrant(int id, [FromBody] EisenhowerMoveRequest req)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized(new { message = "User not identified" });

            var query = await AuthorizedTaskQuery(userId);
            if (query is null)
                return StatusCode(403, new { message = "Access denied" });

            var task = await query.FirstOrDefaultAsync(t => t.Id == id);
            if (task is null)
                return NotFound(new { message = "Task not found" });

            var (severityId, targetDate) = await ResolveQuadrantFields(req.Quadrant);
            task.SeverityId = severityId;
            task.TargetDate = targetDate;
            task.UpdatedAt = DateTime.Now;
            task.Mandays = task.StartDate.HasValue
                ? CountMandays(task.StartDate.Value, targetDate)
                : null;

            await _context.SaveChangesAsync();

            return Ok(new { task.Id, task.SeverityId, task.TargetDate });
        }

        [HttpPost("tasks")]
        public async Task<IActionResult> QuickAddTask([FromBody] EisenhowerQuickAddRequest req)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized(new { message = "User not identified" });

            var user = await _context.Users.FindAsync(userId);
            if (user is null) return Unauthorized(new { message = "User not found" });
            if (user.Role != "ProjectManager" && user.Role != "Admin")
                return StatusCode(403, new { message = "Only PMs and Admins can quick-add matrix tasks." });

            if (string.IsNullOrWhiteSpace(req.Title))
                return BadRequest(new { message = "Title is required" });

            var canUseProject = user.Role == "Admin" ||
                await _context.Projects.AnyAsync(p => p.Id == req.ProjectId && p.PmId == user.Id);

            if (!canUseProject)
                return StatusCode(403, new { message = "Project is not available for this user." });

            var (severityId, targetDate) = await ResolveQuadrantFields(req.Quadrant);
            var phase = await _context.Phases
                .Where(p => p.IsDefault == 1)
                .OrderBy(p => p.SortOrder)
                .FirstOrDefaultAsync()
                ?? await _context.Phases.OrderBy(p => p.SortOrder).FirstAsync();

            var status = await _context.Statuses
                .Where(s => s.IsDefault == 1)
                .OrderBy(s => s.SortOrder)
                .FirstOrDefaultAsync()
                ?? await _context.Statuses.OrderBy(s => s.SortOrder).FirstAsync();

            var task = new Main_Task
            {
                ProjectId = req.ProjectId,
                Title = req.Title.Trim(),
                Description = "",
                Progress = 0,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                StartDate = DateTime.Today,
                TargetDate = targetDate,
                SeverityId = severityId,
                PhaseId = phase.Id,
                StatusId = status.Id,
                AssigneeId = req.AssigneeId,
                QaAssigneeId = req.QaAssigneeId,
                CreatorId = userId,
                Mandays = CountMandays(DateTime.Today, targetDate)
            };

            _context.Main_Tasks.Add(task);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMatrixTasks), new { id = task.Id }, new { task.Id });
        }

        private static int CountMandays(DateTime startDate, DateTime targetDate)
        {
            var count = 0;
            for (var d = startDate.Date.AddDays(1); d <= targetDate.Date; d = d.AddDays(1))
                if (d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday)
                    count++;

            return count;
        }
    }
}
