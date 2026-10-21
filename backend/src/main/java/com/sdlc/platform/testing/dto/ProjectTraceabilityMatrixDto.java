package com.sdlc.platform.testing.dto;

import java.util.List;
import java.util.UUID;

public record ProjectTraceabilityMatrixDto(
        UUID projectId,
        String projectKey,
        String projectName,
        TraceabilitySummaryDto summary,
        List<TraceabilityItemDto> items,
        List<UnlinkedTestCaseDto> unlinkedTestCases
) {}
