package com.sdlc.platform.organization.dto;

import com.sdlc.platform.organization.model.OrgMemberRole;

import java.time.Instant;
import java.util.UUID;

public record OrganizationSummaryDto(
        UUID id,
        String name,
        String slug,
        String description,
        OrgMemberRole currentUserRole,
        long memberCount,
        long teamCount,
        long projectCount,
        Instant createdAt
) {}
