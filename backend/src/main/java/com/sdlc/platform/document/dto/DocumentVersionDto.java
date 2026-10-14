package com.sdlc.platform.document.dto;

import com.sdlc.platform.document.model.DiagramSyntax;
import java.time.Instant;
import java.util.UUID;

public record DocumentVersionDto(
        UUID id,
        UUID documentId,
        int versionNumber,
        String title,
        String content,
        DiagramSyntax diagramSyntax,
        String changeSummary,
        String createdByUsername,
        Instant createdAt
) {}
