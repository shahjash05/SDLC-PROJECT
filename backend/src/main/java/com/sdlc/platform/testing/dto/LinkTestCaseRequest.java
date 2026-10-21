package com.sdlc.platform.testing.dto;

import java.util.UUID;

public record LinkTestCaseRequest(
        UUID userStoryId,
        UUID requirementId
) {}
