package com.sdlc.platform.requirement.dto;

import com.sdlc.platform.requirement.model.TaskStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TaskDto(
        UUID id,
        UUID storyId,
        String title,
        String description,
        TaskStatus status,
        BigDecimal estimatedHours,
        BigDecimal actualHours,
        UUID assigneeId,
        String assigneeUsername,
        Instant createdAt
) {}
