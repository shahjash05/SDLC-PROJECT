package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.TestCaseStatus;
import com.sdlc.platform.testing.model.TestPriority;

import java.time.Instant;
import java.util.UUID;

public record TestCaseDetailDto(
        UUID id,
        UUID projectId,
        String projectName,
        String projectKey,
        UUID suiteId,
        String suiteName,
        int caseNumber,
        String caseKey,
        String title,
        String description,
        String preconditions,
        String testSteps,
        String expectedResult,
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
    public TestCaseDetailDto(
            UUID id,
            UUID projectId,
            String projectName,
            String projectKey,
            UUID suiteId,
            String suiteName,
            int caseNumber,
            String caseKey,
            String title,
            String description,
            String preconditions,
            String testSteps,
            String expectedResult,
            TestPriority priority,
            TestCaseStatus status,
            String createdByUsername,
            Instant createdAt,
            Instant updatedAt
    ) {
        this(id, projectId, projectName, projectKey, suiteId, suiteName, caseNumber, caseKey, title, description, preconditions, testSteps, expectedResult, priority, status, createdByUsername, createdAt, updatedAt, null, null, null, null, null);
    }
}
