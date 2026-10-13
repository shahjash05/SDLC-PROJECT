package com.sdlc.platform.requirement.dto;

import com.sdlc.platform.requirement.model.StoryPriority;
import com.sdlc.platform.requirement.model.StoryStatus;
import java.time.Instant;
import java.util.UUID;

public record StorySummaryDto(
        UUID id,
        UUID projectId,
        String projectKey,
        UUID sprintId,
        String sprintName,
        int storyNumber,
        String storyKey,
        String title,
        StoryStatus status,
        StoryPriority priority,
        Integer storyPoints,
        UUID assigneeId,
        String assigneeUsername,
        String assigneeFullName,
        long taskCount,
        long completedTaskCount,
        Instant createdAt
) {}
