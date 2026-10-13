package com.sdlc.platform.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateOrganizationRequest(
        @NotBlank(message = "Organization name is required")
        @Size(min = 2, max = 100, message = "Organization name must be between 2 and 100 characters")
        String name,

        @NotBlank(message = "Organization slug is required")
        @Size(min = 2, max = 100, message = "Slug must be between 2 and 100 characters")
        @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase letters, numbers, and hyphens")
        String slug,

        @Size(max = 500, message = "Description must not exceed 500 characters")
        String description
) {}
