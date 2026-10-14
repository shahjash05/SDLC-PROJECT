package com.sdlc.platform.document.service;

import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.common.DuplicateResourceException;
import com.sdlc.platform.common.ResourceNotFoundException;
import com.sdlc.platform.document.dto.*;
import com.sdlc.platform.document.model.DiagramSyntax;
import com.sdlc.platform.document.model.Document;
import com.sdlc.platform.document.model.DocumentType;
import com.sdlc.platform.document.model.DocumentVersion;
import com.sdlc.platform.document.repository.DocumentRepository;
import com.sdlc.platform.document.repository.DocumentVersionRepository;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.service.OrganizationService;
import com.sdlc.platform.project.model.Project;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.security.UserPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final OrganizationMemberRepository organizationMemberRepository;

    public DocumentService(
            DocumentRepository documentRepository,
            DocumentVersionRepository documentVersionRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            OrganizationService organizationService,
            OrganizationMemberRepository organizationMemberRepository
    ) {
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.organizationService = organizationService;
        this.organizationMemberRepository = organizationMemberRepository;
    }

    public DocumentDetailDto createDocument(UUID projectId, CreateDocumentRequest request, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        String title = request.title().trim();
        if (documentRepository.existsByProjectIdAndTitle(projectId, title)) {
            throw new DuplicateResourceException("Document with title '" + title + "' already exists in this project.");
        }

        User author = userRepository.findById(currentUser.getId()).orElse(null);
        DocumentType type = request.type() != null ? request.type() : DocumentType.TECHNICAL_SPEC;
        DiagramSyntax syntax = request.diagramSyntax();
        if (syntax == null && type == DocumentType.ARCHITECTURE_DIAGRAM) {
            syntax = DiagramSyntax.MERMAID;
        }

        Document document = new Document(project, title, type, request.content(), syntax, author);
        Document savedDoc = documentRepository.save(document);

        // Snapshot initial version (v1)
        DocumentVersion v1 = new DocumentVersion(
                savedDoc,
                1,
                title,
                request.content(),
                syntax,
                "Initial creation",
                author
        );
        documentVersionRepository.save(v1);

        return toDetailDto(savedDoc);
    }

    @Transactional(readOnly = true)
    public List<DocumentSummaryDto> getDocumentsForProject(UUID projectId, DocumentType type, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        List<Document> docs;
        if (type != null) {
            docs = documentRepository.findByProjectIdAndTypeOrderByUpdatedAtDesc(projectId, type);
        } else {
            docs = documentRepository.findByProjectIdOrderByUpdatedAtDesc(projectId);
        }

        return docs.stream().map(this::toSummaryDto).toList();
    }

    @Transactional(readOnly = true)
    public DocumentDetailDto getDocumentById(UUID documentId, UserPrincipal currentUser) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        organizationService.checkMembershipOrAdmin(document.getProject().getOrganization().getId(), currentUser);
        return toDetailDto(document);
    }

    public DocumentDetailDto updateDocument(UUID documentId, UpdateDocumentRequest request, UserPrincipal currentUser) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        organizationService.checkMembershipOrAdmin(document.getProject().getOrganization().getId(), currentUser);

        String newTitle = request.title().trim();
        if (!document.getTitle().equalsIgnoreCase(newTitle)
                && documentRepository.existsByProjectIdAndTitle(document.getProject().getId(), newTitle)) {
            throw new DuplicateResourceException("Document with title '" + newTitle + "' already exists in this project.");
        }

        User author = userRepository.findById(currentUser.getId()).orElse(null);

        // Increment version number on content or title change
        int newVersionNumber = document.getCurrentVersion() + 1;
        document.setCurrentVersion(newVersionNumber);
        document.setTitle(newTitle);
        document.setContent(request.content());
        if (request.type() != null) {
            document.setType(request.type());
        }
        if (request.diagramSyntax() != null) {
            document.setDiagramSyntax(request.diagramSyntax());
        }
        if (request.status() != null) {
            document.setStatus(request.status());
        }

        Document updated = documentRepository.save(document);

        // Snapshot new version
        String summary = request.changeSummary() != null && !request.changeSummary().isBlank()
                ? request.changeSummary().trim()
                : "Revision " + newVersionNumber;

        DocumentVersion version = new DocumentVersion(
                updated,
                newVersionNumber,
                newTitle,
                request.content(),
                updated.getDiagramSyntax(),
                summary,
                author
        );
        documentVersionRepository.save(version);

        return toDetailDto(updated);
    }

    public DocumentSummaryDto updateDocumentStatus(UUID documentId, UpdateDocumentStatusRequest request, UserPrincipal currentUser) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        organizationService.checkMembershipOrAdmin(document.getProject().getOrganization().getId(), currentUser);

        document.setStatus(request.status());
        Document updated = documentRepository.save(document);
        return toSummaryDto(updated);
    }

    @Transactional(readOnly = true)
    public List<DocumentVersionDto> getDocumentVersions(UUID documentId, UserPrincipal currentUser) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        organizationService.checkMembershipOrAdmin(document.getProject().getOrganization().getId(), currentUser);

        return documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId).stream()
                .map(this::toVersionDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentVersionDto getDocumentVersion(UUID documentId, int versionNumber, UserPrincipal currentUser) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        organizationService.checkMembershipOrAdmin(document.getProject().getOrganization().getId(), currentUser);

        DocumentVersion version = documentVersionRepository.findByDocumentIdAndVersionNumber(documentId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("DocumentVersion", "versionNumber", versionNumber));

        return toVersionDto(version);
    }

    public void deleteDocument(UUID documentId, UserPrincipal currentUser) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        checkDocumentDeletePermission(document, currentUser);

        documentVersionRepository.deleteAllByDocumentId(documentId);
        documentRepository.delete(document);
    }

    private void checkDocumentDeletePermission(Document document, UserPrincipal currentUser) {
        if (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return;
        }

        OrgMemberRole orgRole = organizationMemberRepository
                .findByOrganizationIdAndUserId(document.getProject().getOrganization().getId(), currentUser.getId())
                .map(com.sdlc.platform.organization.model.OrganizationMember::getRole)
                .orElse(null);

        if (orgRole == OrgMemberRole.OWNER || orgRole == OrgMemberRole.ADMIN) {
            return;
        }

        if (document.getCreatedBy() != null && document.getCreatedBy().getId().equals(currentUser.getId())) {
            return;
        }

        if (document.getProject().getTeam() != null && document.getProject().getTeam().getLeader() != null
                && document.getProject().getTeam().getLeader().getId().equals(currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You do not have permission to delete this document.");
    }

    private DocumentSummaryDto toSummaryDto(Document document) {
        return new DocumentSummaryDto(
                document.getId(),
                document.getProject().getId(),
                document.getProject().getProjectKey(),
                document.getProject().getName(),
                document.getTitle(),
                document.getType(),
                document.getDiagramSyntax(),
                document.getCurrentVersion(),
                document.getStatus(),
                document.getCreatedBy() != null ? document.getCreatedBy().getUsername() : null,
                document.getCreatedAt(),
                document.getUpdatedAt()
        );
    }

    private DocumentDetailDto toDetailDto(Document document) {
        List<DocumentVersionDto> versions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(document.getId()).stream()
                .map(this::toVersionDto)
                .toList();

        return new DocumentDetailDto(
                document.getId(),
                document.getProject().getId(),
                document.getProject().getProjectKey(),
                document.getProject().getName(),
                document.getTitle(),
                document.getType(),
                document.getContent(),
                document.getDiagramSyntax(),
                document.getCurrentVersion(),
                document.getStatus(),
                document.getCreatedBy() != null ? document.getCreatedBy().getUsername() : null,
                versions,
                document.getCreatedAt(),
                document.getUpdatedAt()
        );
    }

    private DocumentVersionDto toVersionDto(DocumentVersion v) {
        return new DocumentVersionDto(
                v.getId(),
                v.getDocument().getId(),
                v.getVersionNumber(),
                v.getTitle(),
                v.getContent(),
                v.getDiagramSyntax(),
                v.getChangeSummary(),
                v.getCreatedBy() != null ? v.getCreatedBy().getUsername() : null,
                v.getCreatedAt()
        );
    }
}
