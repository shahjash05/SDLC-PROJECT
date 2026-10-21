package com.sdlc.platform.testing.dto;

import com.sdlc.platform.testing.model.DefectStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDefectStatusRequest(
        @NotNull(message = "Defect status is required")
        DefectStatus status
) {}
