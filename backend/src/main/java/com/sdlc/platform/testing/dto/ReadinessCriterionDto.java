package com.sdlc.platform.testing.dto;

public record ReadinessCriterionDto(
        String id,
        String name,
        String status, // PASSED, FAILED, WARNING
        boolean isBlocker,
        String summary,
        String actualValue,
        String targetValue
) {}
