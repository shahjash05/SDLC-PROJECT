package com.sdlc.platform.testing.dto;

public record RequirementCoverageStatsDto(
        long totalRequirements,
        long coveredRequirements,
        long uncoveredRequirements,
        double coveragePercentage
) {}
