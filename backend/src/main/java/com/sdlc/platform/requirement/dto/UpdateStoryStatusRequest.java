package com.sdlc.platform.requirement.dto;

import com.sdlc.platform.requirement.model.StoryStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStoryStatusRequest(
        @NotNull(message = "Story status is required")
        StoryStatus status
) {}
