package com.sdlc.platform.team.dto;

import java.time.Instant;
import java.util.UUID;

public record TeamSummaryDto(
        UUID id,
        UUID organizationId,
        String name,
        String description,
        UUID leaderId,
        String leaderUsername,
        String leaderFullName,
        long memberCount,
        long projectCount,
        Instant createdAt
) {}
