package com.sdlc.platform.organization.dto;

import com.sdlc.platform.organization.model.OrgMemberRole;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrganizationDetailDto(
        UUID id,
        String name,
        String slug,
        String description,
        OrgMemberRole currentUserRole,
        List<OrgMemberDto> members,
        long teamCount,
        long projectCount,
        Instant createdAt,
        Instant updatedAt
) {}
