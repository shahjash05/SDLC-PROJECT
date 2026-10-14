package com.sdlc.platform.document.dto;

import com.sdlc.platform.document.model.DiagramSyntax;
import com.sdlc.platform.document.model.DocumentStatus;
import com.sdlc.platform.document.model.DocumentType;
import java.time.Instant;
import java.util.UUID;

public record DocumentSummaryDto(
        UUID id,
        UUID projectId,
        String projectKey,
        String projectName,
        String title,
        DocumentType type,
        DiagramSyntax diagramSyntax,
        int currentVersion,
        DocumentStatus status,
        String createdByUsername,
        Instant createdAt,
        Instant updatedAt
) {}
