package com.sdlc.platform.project.dto;

import com.sdlc.platform.project.model.ProjectStatus;

import java.time.Instant;
import java.util.UUID;

public record ProjectSummaryDto(
        UUID id,
        UUID organizationId,
        String organizationName,
        UUID teamId,
        String teamName,
        String name,
        String projectKey,
        String description,
        ProjectStatus status,
        String createdByUsername,
        Instant createdAt
) {}
