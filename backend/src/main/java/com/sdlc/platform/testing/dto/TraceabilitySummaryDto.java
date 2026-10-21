package com.sdlc.platform.testing.dto;

public record TraceabilitySummaryDto(
        long totalRequirements,
        long coveredRequirements,
        long uncoveredRequirements,
        double coveragePercentage,
        long totalTestCases,
        long executedTestCases,
        long neverExecutedTestCases,
        double executionPercentage,
        long totalDefects,
        long openDefects
) {}
