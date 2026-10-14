package com.sdlc.platform.document.dto;

import com.sdlc.platform.document.model.DiagramSyntax;
import com.sdlc.platform.document.model.DocumentStatus;
import com.sdlc.platform.document.model.DocumentType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DocumentDetailDto(
        UUID id,
        UUID projectId,
        String projectKey,
        String projectName,
        String title,
        DocumentType type,
        String content,
        DiagramSyntax diagramSyntax,
        int currentVersion,
        DocumentStatus status,
        String createdByUsername,
        List<DocumentVersionDto> recentVersions,
        Instant createdAt,
        Instant updatedAt
) {}
