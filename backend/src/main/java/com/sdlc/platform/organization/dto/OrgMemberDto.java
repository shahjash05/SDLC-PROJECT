package com.sdlc.platform.organization.dto;

import com.sdlc.platform.organization.model.OrgMemberRole;

import java.time.Instant;
import java.util.UUID;

public record OrgMemberDto(
        UUID id,
        UUID userId,
        String username,
        String fullName,
        String email,
        OrgMemberRole role,
        Instant joinedAt
) {}
