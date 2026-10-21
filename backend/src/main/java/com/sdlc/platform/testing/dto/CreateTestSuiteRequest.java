package com.sdlc.platform.testing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTestSuiteRequest(
        @NotBlank(message = "Suite name is required")
        @Size(max = 200, message = "Suite name cannot exceed 200 characters")
        String name,

        String description
) {}
