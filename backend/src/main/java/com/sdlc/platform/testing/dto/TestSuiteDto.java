package com.sdlc.platform.testing.dto;

import java.time.Instant;
import java.util.UUID;

public record TestSuiteDto(
        UUID id,
        UUID projectId,
        String name,
        String description,
        long testCaseCount,
        String createdByUsername,
        Instant createdAt,
        Instant updatedAt
) {}
