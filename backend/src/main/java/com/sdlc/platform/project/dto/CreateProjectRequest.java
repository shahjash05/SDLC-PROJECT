package com.sdlc.platform.project.dto;

import com.sdlc.platform.project.model.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateProjectRequest(
        @NotBlank(message = "Project name is required")
        @Size(min = 2, max = 150, message = "Project name must be between 2 and 150 characters")
        String name,

        @NotBlank(message = "Project key is required")
        @Size(min = 2, max = 10, message = "Project key must be between 2 and 10 characters")
        @Pattern(regexp = "^[A-Z0-9]+$", message = "Project key must be uppercase alphanumeric (e.g. SDLC, PROJ1)")
        String projectKey,

        @Size(max = 1000, message = "Description must not exceed 1000 characters")
        String description,

        UUID teamId,

        ProjectStatus status
) {}
