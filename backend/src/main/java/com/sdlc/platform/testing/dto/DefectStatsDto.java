package com.sdlc.platform.testing.dto;

public record DefectStatsDto(
        long totalDefects,
        long unresolvedTotal,
        long unresolvedCritical,
        long unresolvedHigh,
        long unresolvedMedium,
        long unresolvedLow,
        long resolvedTotal
) {}
