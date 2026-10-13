package com.sdlc.platform.requirement.dto;

import com.sdlc.platform.requirement.model.StoryPriority;
import com.sdlc.platform.requirement.model.StoryStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StoryDetailDto(
        UUID id,
        UUID projectId,
        String projectName,
        String projectKey,
        UUID sprintId,
        String sprintName,
        int storyNumber,
        String storyKey,
        String title,
        String description,
        String acceptanceCriteria,
        StoryStatus status,
        StoryPriority priority,
        Integer storyPoints,
        UUID assigneeId,
        String assigneeUsername,
        String assigneeFullName,
        String createdByUsername,
        List<TaskDto> tasks,
        Instant createdAt,
        Instant updatedAt
) {}
