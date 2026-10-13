package com.sdlc.platform.requirement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank(message = "Task title is required")
        @Size(max = 200, message = "Task title cannot exceed 200 characters")
        String title,

        @Size(max = 1000, message = "Task description cannot exceed 1000 characters")
        String description,

        @DecimalMin(value = "0.0", message = "Estimated hours cannot be negative")
        BigDecimal estimatedHours,

        UUID assigneeId
) {}
