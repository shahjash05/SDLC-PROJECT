package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.DefectSeverity;
import com.sdlc.platform.testing.model.DefectStatus;
import com.sdlc.platform.testing.model.TestPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateDefectRequest(
        @NotBlank(message = "Defect title is required")
        @Size(max = 250, message = "Defect title must not exceed 250 characters")
        String title,

        String description,
        String stepsToReproduce,
        String expectedResult,
        String actualResult,
        DefectSeverity severity,
        TestPriority priority,
        DefectStatus status,
        UUID assigneeId,
        UUID testCaseId,
        UUID testExecutionId
) {}
