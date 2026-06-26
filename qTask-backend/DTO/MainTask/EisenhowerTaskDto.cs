namespace QtechOJT_Net9.DTO.MainTask
{
    public record EisenhowerTaskDto(
        int Id,
        int ProjectId,
        string ProjectName,
        string Title,
        string? Description,
        int Progress,
        DateTime? StartDate,
        DateTime TargetDate,
        int SeverityId,
        string SeverityLabel,
        string SeverityColor,
        int SeveritySortOrder,
        int PhaseId,
        string PhaseLabel,
        string PhaseGrouping,
        int StatusId,
        string StatusLabel,
        string StatusColor,
        int StatusIsFinal,
        int? AssigneeId,
        string? AssigneeName,
        int? QaAssigneeId,
        string? QaAssigneeName,
        string Quadrant,
        bool IsUrgent,
        bool IsImportant,
        bool IsOverdue
    );

    public class EisenhowerMoveRequest
    {
        public string Quadrant { get; set; } = string.Empty;
    }

    public class EisenhowerQuickAddRequest
    {
        public string Title { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public int? AssigneeId { get; set; }
        public int? QaAssigneeId { get; set; }
        public string Quadrant { get; set; } = "q4";
    }
}
