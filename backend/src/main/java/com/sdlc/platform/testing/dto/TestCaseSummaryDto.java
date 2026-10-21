package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.TestCaseStatus;
import com.sdlc.platform.testing.model.TestPriority;

import java.time.Instant;
import java.util.UUID;

public record TestCaseSummaryDto(
        UUID id,
        UUID projectId,
        String projectKey,
        UUID suiteId,
        String suiteName,
        int caseNumber,
        String caseKey,
        String title,
        TestPriority priority,
        TestCaseStatus status,
        String createdByUsername,
        Instant createdAt,
        Instant updatedAt,
        UUID userStoryId,
        String userStoryKey,
        String userStoryTitle,
        UUID requirementId,
        String requirementTitle
) {
    public TestCaseSummaryDto(
            UUID id,
            UUID projectId,
            String projectKey,
            UUID suiteId,
            String suiteName,
            int caseNumber,
            String caseKey,
            String title,
            TestPriority priority,
            TestCaseStatus status,
            String createdByUsername,
            Instant createdAt,
            Instant updatedAt
    ) {
        this(id, projectId, projectKey, suiteId, suiteName, caseNumber, caseKey, title, priority, status, createdByUsername, createdAt, updatedAt, null, null, null, null, null);
    }
}
