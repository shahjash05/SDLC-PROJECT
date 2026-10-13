package com.sdlc.platform.team.dto;

import com.sdlc.platform.team.model.TeamMemberRole;

import java.time.Instant;
import java.util.UUID;

public record TeamMemberDto(
        UUID id,
        UUID userId,
        String username,
        String fullName,
        String email,
        TeamMemberRole role,
        Instant joinedAt
) {}
