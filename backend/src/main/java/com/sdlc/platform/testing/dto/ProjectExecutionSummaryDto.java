package com.sdlc.platform.testing.dto;

import java.util.List;
import java.util.UUID;

public record ProjectExecutionSummaryDto(
        UUID projectId,
        long totalExecutions,
        long passedExecutions,
        long failedExecutions,
        long blockedExecutions,
        long skippedExecutions,
        double passRate,
        List<TestExecutionDto> recentExecutions
) {
}
