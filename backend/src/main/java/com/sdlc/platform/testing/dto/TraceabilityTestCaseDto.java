package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.TestCaseStatus;
import com.sdlc.platform.testing.model.TestExecutionStatus;
import com.sdlc.platform.testing.model.TestPriority;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TraceabilityTestCaseDto(
        UUID id,
        int caseNumber,
        String caseKey,
        String title,
        TestPriority priority,
        TestCaseStatus status,
        TestExecutionStatus latestExecutionStatus,
        Instant latestExecutionDate,
        Integer latestExecutionDurationMs,
        String latestExecutionNotes,
        List<DefectSummaryDto> defects
) {}
