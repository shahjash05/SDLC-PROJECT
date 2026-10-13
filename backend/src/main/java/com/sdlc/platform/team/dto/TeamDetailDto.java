package com.sdlc.platform.team.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TeamDetailDto(
        UUID id,
        UUID organizationId,
        String name,
        String description,
        UUID leaderId,
        String leaderUsername,
        String leaderFullName,
        List<TeamMemberDto> members,
        long projectCount,
        Instant createdAt,
        Instant updatedAt
) {}
