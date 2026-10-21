package com.sdlc.platform.testing.dto;

import java.util.List;
import java.util.UUID;

public record TraceabilityItemDto(
        UUID id,
        String key,
        String title,
        String type,
        String status,
        String priority,
        List<TraceabilityTestCaseDto> testCases,
        boolean hasCoverage
) {}
