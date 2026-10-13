package com.sdlc.platform.team.dto;

import com.sdlc.platform.team.model.TeamMemberRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddTeamMemberRequest(
        @NotBlank(message = "Username or email is required")
        String usernameOrEmail,

        @NotNull(message = "Role is required")
        TeamMemberRole role
) {}
