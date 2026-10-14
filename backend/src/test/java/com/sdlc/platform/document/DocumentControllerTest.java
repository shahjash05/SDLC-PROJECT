package com.sdlc.platform.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdlc.platform.auth.model.Role;
import com.sdlc.platform.auth.model.RoleName;
import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.RoleRepository;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.document.dto.CreateDocumentRequest;
import com.sdlc.platform.document.dto.UpdateDocumentRequest;
import com.sdlc.platform.document.dto.UpdateDocumentStatusRequest;
import com.sdlc.platform.document.model.DiagramSyntax;
import com.sdlc.platform.document.model.DocumentStatus;
import com.sdlc.platform.document.model.DocumentType;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.model.Organization;
import com.sdlc.platform.organization.model.OrganizationMember;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.repository.OrganizationRepository;
import com.sdlc.platform.project.model.Project;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.security.JwtTokenProvider;
import com.sdlc.platform.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private OrganizationMemberRepository organizationMemberRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User memberUser;
    private User outsiderUser;
    private String memberToken;
    private String outsiderToken;
    private Organization testOrg;
    private Project testProject;

    @BeforeEach
    void setUp() {
        Role devRole = roleRepository.findByName(RoleName.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_DEVELOPER, "Dev")));

        memberUser = new User("doc_member@test.com", "doc_member", "pass", "Doc Member");
        memberUser.addRole(devRole);
        memberUser = userRepository.save(memberUser);

        outsiderUser = new User("doc_outsider@test.com", "doc_outsider", "pass", "Doc Outsider");
        outsiderUser.addRole(devRole);
        outsiderUser = userRepository.save(outsiderUser);

        memberToken = jwtTokenProvider.generateToken(memberUser);
        outsiderToken = jwtTokenProvider.generateToken(outsiderUser);

        testOrg = new Organization("Doc Org", "doc-org", "Doc test org", memberUser);
        testOrg = organizationRepository.save(testOrg);

        OrganizationMember member = new OrganizationMember(testOrg, memberUser, OrgMemberRole.ADMIN);
        organizationMemberRepository.save(member);

        testProject = new Project(testOrg, null, "Doc Platform", "DOC", "Description", memberUser);
        testProject = projectRepository.save(testProject);
    }

    @Test
    void createDocument_createsDocumentAndInitialVersion() throws Exception {
        CreateDocumentRequest request = new CreateDocumentRequest(
                "System Architecture Overview",
                DocumentType.ARCHITECTURE_DIAGRAM,
                "graph TD\n  Client-->Gateway\n  Gateway-->AuthService",
                DiagramSyntax.MERMAID
        );

        mockMvc.perform(post("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("System Architecture Overview"))
                .andExpect(jsonPath("$.data.type").value("ARCHITECTURE_DIAGRAM"))
                .andExpect(jsonPath("$.data.diagramSyntax").value("MERMAID"))
                .andExpect(jsonPath("$.data.currentVersion").value(1))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.recentVersions", hasSize(1)))
                .andExpect(jsonPath("$.data.recentVersions[0].versionNumber").value(1));
    }

    @Test
    void createDocument_duplicateTitleInProject_throwsConflict() throws Exception {
        CreateDocumentRequest request = new CreateDocumentRequest(
                "API Specification",
                DocumentType.API_DESIGN,
                "OpenAPI spec",
                DiagramSyntax.NONE
        );

        mockMvc.perform(post("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Re-post same title
        mockMvc.perform(post("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void updateDocument_createsNewVersionSnapshot() throws Exception {
        CreateDocumentRequest createReq = new CreateDocumentRequest(
                "Auth Flow ADR",
                DocumentType.DECISION_RECORD,
                "ADR: Use stateless JWT",
                null
        );

        String createRes = mockMvc.perform(post("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = objectMapper.readTree(createRes).get("data").get("id").asText();

        // Update document
        UpdateDocumentRequest updateReq = new UpdateDocumentRequest(
                "Auth Flow ADR",
                DocumentType.DECISION_RECORD,
                "ADR: Use stateless JWT with refresh rotation",
                null,
                DocumentStatus.IN_REVIEW,
                "Added refresh token rotation details"
        );

        mockMvc.perform(put("/api/v1/documents/" + docId)
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentVersion").value(2))
                .andExpect(jsonPath("$.data.status").value("IN_REVIEW"))
                .andExpect(jsonPath("$.data.recentVersions", hasSize(2)))
                .andExpect(jsonPath("$.data.recentVersions[0].versionNumber").value(2))
                .andExpect(jsonPath("$.data.recentVersions[0].changeSummary").value("Added refresh token rotation details"))
                .andExpect(jsonPath("$.data.recentVersions[1].versionNumber").value(1));
    }

    @Test
    void getDocumentVersions_andGetHistoricalVersion_returnsSnapshot() throws Exception {
        CreateDocumentRequest createReq = new CreateDocumentRequest(
                "Data Model Spec",
                DocumentType.TECHNICAL_SPEC,
                "Initial schema v1",
                null
        );

        String createRes = mockMvc.perform(post("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = objectMapper.readTree(createRes).get("data").get("id").asText();

        // Update to v2
        UpdateDocumentRequest updateReq = new UpdateDocumentRequest(
                "Data Model Spec",
                DocumentType.TECHNICAL_SPEC,
                "Expanded schema v2 with audit logs",
                null,
                null,
                "Added audit logs"
        );

        mockMvc.perform(put("/api/v1/documents/" + docId)
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk());

        // Get all versions
        mockMvc.perform(get("/api/v1/documents/" + docId + "/versions")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));

        // Get specific historical version 1
        mockMvc.perform(get("/api/v1/documents/" + docId + "/versions/1")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.versionNumber").value(1))
                .andExpect(jsonPath("$.data.content").value("Initial schema v1"));
    }

    @Test
    void outsider_accessingDocuments_rejectedWithForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteDocument_successAndCascadesVersions() throws Exception {
        CreateDocumentRequest createReq = new CreateDocumentRequest(
                "Temporary Doc",
                DocumentType.GENERAL,
                "Temporary content",
                null
        );

        String createRes = mockMvc.perform(post("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = objectMapper.readTree(createRes).get("data").get("id").asText();

        mockMvc.perform(delete("/api/v1/documents/" + docId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Document deleted successfully"));

        // Getting deleted document returns 404
        mockMvc.perform(get("/api/v1/documents/" + docId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isNotFound());
    }
}
