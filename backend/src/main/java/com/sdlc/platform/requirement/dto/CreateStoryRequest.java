package com.sdlc.platform.requirement.dto;

import com.sdlc.platform.requirement.model.StoryPriority;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateStoryRequest(
        @NotBlank(message = "Story title is required")
        @Size(max = 200, message = "Story title cannot exceed 200 characters")
        String title,

        String description,

        String acceptanceCriteria,

        StoryPriority priority,

        @Min(value = 0, message = "Story points must be non-negative")
        @Max(value = 100, message = "Story points cannot exceed 100")
        Integer storyPoints,

        UUID sprintId,

        UUID assigneeId
) {}
