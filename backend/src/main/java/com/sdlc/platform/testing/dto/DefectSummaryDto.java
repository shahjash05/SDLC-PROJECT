package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.DefectSeverity;
import com.sdlc.platform.testing.model.DefectStatus;
import com.sdlc.platform.testing.model.TestPriority;
import java.time.Instant;
import java.util.UUID;

public record DefectSummaryDto(
        UUID id,
        UUID projectId,
        String projectKey,
        int defectNumber,
        String defectKey,
        String title,
        DefectSeverity severity,
        TestPriority priority,
        DefectStatus status,
        UUID assigneeId,
        String assigneeUsername,
        String assigneeFullName,
        String reporterUsername,
        UUID testCaseId,
        String testCaseKey,
        String testCaseTitle,
        UUID testExecutionId,
        Instant createdAt,
        Instant updatedAt,
        Instant resolvedAt,
        Instant closedAt
) {}
