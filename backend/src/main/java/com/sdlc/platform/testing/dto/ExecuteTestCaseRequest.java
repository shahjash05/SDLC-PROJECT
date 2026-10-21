package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.TestExecutionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ExecuteTestCaseRequest(
        @NotNull(message = "Execution status is required (PASSED, FAILED, BLOCKED, SKIPPED)")
        TestExecutionStatus status,

        @NotBlank(message = "Actual result is required")
        String actualResult,

        String notes,

        Integer durationMs
) {
}
