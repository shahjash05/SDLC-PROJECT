package com.sdlc.platform.organization.dto;

import com.sdlc.platform.organization.model.OrgMemberRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddOrgMemberRequest(
        @NotBlank(message = "Username or email is required")
        String usernameOrEmail,

        @NotNull(message = "Role is required")
        OrgMemberRole role
) {}
