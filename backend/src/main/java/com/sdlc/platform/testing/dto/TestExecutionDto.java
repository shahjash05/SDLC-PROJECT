package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.TestExecutionStatus;
import java.time.Instant;
import java.util.UUID;

public record TestExecutionDto(
        UUID id,
        UUID testCaseId,
        String testCaseKey,
        String testCaseTitle,
        UUID projectId,
        TestExecutionStatus status,
        String actualResult,
        String notes,
        Integer durationMs,
        String executedByUsername,
        Instant executedAt
) {
}
