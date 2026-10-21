package com.sdlc.platform.testing.dto;

import java.util.List;

public record ProjectDefectSummaryDto(
        long totalDefects,
        long openDefects,
        long inProgressDefects,
        long inReviewDefects,
        long resolvedDefects,
        long closedDefects,
        long reopenedDefects,
        long criticalDefects,
        long highDefects,
        List<DefectSummaryDto> recentDefects
) {}
