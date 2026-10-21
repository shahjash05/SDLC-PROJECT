package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.TestCaseStatus;
import com.sdlc.platform.testing.model.TestPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateTestCaseRequest(
        @NotBlank(message = "Test case title is required")
        @Size(max = 250, message = "Title cannot exceed 250 characters")
        String title,

        String description,
        String preconditions,
        String testSteps,
        String expectedResult,
        TestPriority priority,
        TestCaseStatus status,
        UUID suiteId,
        UUID userStoryId,
        UUID requirementId
) {
    public CreateTestCaseRequest(
            String title,
            String description,
            String preconditions,
            String testSteps,
            String expectedResult,
            TestPriority priority,
            TestCaseStatus status,
            UUID suiteId
    ) {
        this(title, description, preconditions, testSteps, expectedResult, priority, status, suiteId, null, null);
    }
}
