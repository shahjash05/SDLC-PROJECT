package com.sdlc.platform.auth.dto;

/**
 * Authentication response containing JWT bearer token and user summary.
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserSummaryDto user
) {
    public static AuthResponse of(String accessToken, long expiresIn, UserSummaryDto user) {
        return new AuthResponse(accessToken, "Bearer", expiresIn, user);
    }
}
