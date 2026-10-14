package com.sdlc.platform.document.dto;

import com.sdlc.platform.document.model.DiagramSyntax;
import com.sdlc.platform.document.model.DocumentStatus;
import com.sdlc.platform.document.model.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateDocumentRequest(
        @NotBlank(message = "Document title is required")
        @Size(max = 200, message = "Title cannot exceed 200 characters")
        String title,

        DocumentType type,

        String content,

        DiagramSyntax diagramSyntax,

        DocumentStatus status,

        @Size(max = 500, message = "Change summary cannot exceed 500 characters")
        String changeSummary
) {}
