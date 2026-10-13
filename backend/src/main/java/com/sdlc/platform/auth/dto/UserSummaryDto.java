package com.sdlc.platform.auth.dto;

import com.sdlc.platform.auth.model.User;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Public summary of a user account.
 */
public record UserSummaryDto(
        UUID id,
        String email,
        String username,
        String fullName,
        Set<String> roles
) {
    public static UserSummaryDto fromEntity(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());
        return new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFullName(),
                roleNames
        );
    }
}
