package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.ReadinessStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ReleaseReadinessDto(
        UUID projectId,
        String projectKey,
        String projectName,
        ReadinessStatus status,
        boolean isReady,
        String summary,
        List<String> blockers,
        List<String> warnings,
        TestExecutionStatsDto testStats,
        DefectStatsDto defectStats,
        RequirementCoverageStatsDto requirementStats,
        List<ReadinessCriterionDto> criteria,
        Instant evaluatedAt
) {}
