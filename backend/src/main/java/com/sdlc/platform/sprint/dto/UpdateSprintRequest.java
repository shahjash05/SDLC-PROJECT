package com.sdlc.platform.sprint.dto;

import com.sdlc.platform.sprint.model.SprintStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateSprintRequest(
        @NotBlank(message = "Sprint name is required")
        @Size(max = 100, message = "Sprint name cannot exceed 100 characters")
        String name,

        @Size(max = 500, message = "Sprint goal cannot exceed 500 characters")
        String goal,

        LocalDate startDate,

        LocalDate endDate,

        SprintStatus status
) {}
