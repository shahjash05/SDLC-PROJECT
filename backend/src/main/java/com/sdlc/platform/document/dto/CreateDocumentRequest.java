package com.sdlc.platform.document.dto;

import com.sdlc.platform.document.model.DiagramSyntax;
import com.sdlc.platform.document.model.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDocumentRequest(
        @NotBlank(message = "Document title is required")
        @Size(max = 200, message = "Title cannot exceed 200 characters")
        String title,

        DocumentType type,

        String content,

        DiagramSyntax diagramSyntax
) {}
