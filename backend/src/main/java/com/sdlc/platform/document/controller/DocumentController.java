package com.sdlc.platform.document.controller;

import com.sdlc.platform.common.ApiResponse;
import com.sdlc.platform.document.dto.*;
import com.sdlc.platform.document.model.DocumentType;
import com.sdlc.platform.document.service.DocumentService;
import com.sdlc.platform.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/projects/{projectId}/documents")
    public ResponseEntity<ApiResponse<DocumentDetailDto>> createDocument(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateDocumentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DocumentDetailDto doc = documentService.createDocument(projectId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Document created successfully", doc));
    }

    @GetMapping("/projects/{projectId}/documents")
    public ResponseEntity<ApiResponse<List<DocumentSummaryDto>>> getDocumentsForProject(
            @PathVariable UUID projectId,
            @RequestParam(required = false) DocumentType type,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<DocumentSummaryDto> docs = documentService.getDocumentsForProject(projectId, type, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(docs));
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<DocumentDetailDto>> getDocumentById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DocumentDetailDto doc = documentService.getDocumentById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(doc));
    }

    @PutMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<DocumentDetailDto>> updateDocument(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDocumentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DocumentDetailDto doc = documentService.updateDocument(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Document updated successfully", doc));
    }

    @PatchMapping("/documents/{id}/status")
    public ResponseEntity<ApiResponse<DocumentSummaryDto>> updateDocumentStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDocumentStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DocumentSummaryDto doc = documentService.updateDocumentStatus(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully", doc));
    }

    @GetMapping("/documents/{id}/versions")
    public ResponseEntity<ApiResponse<List<DocumentVersionDto>>> getDocumentVersions(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<DocumentVersionDto> versions = documentService.getDocumentVersions(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(versions));
    }

    @GetMapping("/documents/{id}/versions/{versionNumber}")
    public ResponseEntity<ApiResponse<DocumentVersionDto>> getDocumentVersion(
            @PathVariable UUID id,
            @PathVariable int versionNumber,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DocumentVersionDto version = documentService.getDocumentVersion(id, versionNumber, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(version));
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        documentService.deleteDocument(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Document deleted successfully", null));
    }
}
