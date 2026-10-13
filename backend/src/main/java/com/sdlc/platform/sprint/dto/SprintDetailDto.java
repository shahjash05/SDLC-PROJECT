package com.sdlc.platform.sprint.dto;

import com.sdlc.platform.sprint.model.SprintStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SprintDetailDto(
        UUID id,
        UUID projectId,
        String projectName,
        String projectKey,
        String name,
        String goal,
        LocalDate startDate,
        LocalDate endDate,
        SprintStatus status,
        long storyCount,
        long completedStoryCount,
        int totalStoryPoints,
        int completedStoryPoints,
        String createdByUsername,
        Instant createdAt,
        Instant updatedAt
) {}
