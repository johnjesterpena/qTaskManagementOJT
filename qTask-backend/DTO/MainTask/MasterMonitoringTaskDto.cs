namespace QtechOJT_Net9.DTO.MainTask
{
    public record MasterMonitoringTaskDto(
        int Id,
        int ProjectId,
        string ProjectName,
        string Title,
        int PhaseId,
        string PhaseLabel,
        string PhaseGrouping,
        int SeverityId,
        string SeverityLabel,
        string SeverityColor,
        int SeveritySortOrder,
        int StatusId,
        string StatusLabel,
        string StatusColor,
        int StatusIsFinal,
        int? AssigneeId,
        string? AssigneeName,
        int? QaAssigneeId,
        string? QaAssigneeName,
        DateTime? StartDate,
        DateTime TargetDate,
        int Progress,
        int SubtaskTotal,
        int SubtaskDone,
        bool IsOverdue
    );
}
