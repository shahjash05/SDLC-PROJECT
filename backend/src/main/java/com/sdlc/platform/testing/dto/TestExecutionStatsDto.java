package com.sdlc.platform.testing.dto;

public record TestExecutionStatsDto(
        long totalTests,
        long executedTests,
        long neverExecutedTests,
        long passedTests,
        long failedTests,
        long blockedTests,
        long skippedTests,
        long totalExecutions,
        double passRate
) {}
