package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.TestCaseStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTestCaseStatusRequest(
        @NotNull(message = "Test case status is required")
        TestCaseStatus status
) {}
