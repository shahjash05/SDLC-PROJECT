package com.sdlc.platform.document.dto;

import com.sdlc.platform.document.model.DocumentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDocumentStatusRequest(
        @NotNull(message = "Document status is required")
        DocumentStatus status
) {}
