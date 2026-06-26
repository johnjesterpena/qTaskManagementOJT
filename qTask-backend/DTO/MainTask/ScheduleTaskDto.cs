namespace QtechOJT_Net9.DTO.MainTask
{
    public record ScheduleTaskAssigneeDto(
        int Id,
        string Name,
        string Role
    );

    public record ScheduleTaskDto(
        int Id,
        int ProjectId,
        string ProjectName,
        string Title,
        DateTime Start,
        DateTime End,
        int PhaseId,
        string PhaseLabel,
        string PhaseGrouping,
        int StatusId,
        string StatusLabel,
        string StatusColor,
        int StatusIsFinal,
        int Progress,
        bool IsOverdue,
        bool IsRecurring,
        List<ScheduleTaskAssigneeDto> Assignees
    );
}
