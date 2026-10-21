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

    @Test
    void createAndManagePRD_succeedsWithVersionHistory() throws Exception {
        String prdJson = """
            {
                "problemStatement": "Developers lack automated SDLC documentation tracing.",
                "scope": {
                    "inScope": ["PRD authoring", "Requirement linking"],
                    "outOfScope": ["Third-party Jira bi-directional sync"]
                },
                "functionalRequirements": [
                    {"id": "FR-1", "title": "Requirements Editor", "description": "Support PRD sections", "priority": "HIGH"}
                ],
                "nonFunctionalRequirements": [
                    {"category": "Performance", "requirement": "Render within 200ms"}
                ],
                "acceptanceCriteria": ["User can author PRD", "User can link user stories"],
                "linkedStoryIds": []
            }
            """;

        CreateDocumentRequest createReq = new CreateDocumentRequest(
                "Core Platform PRD",
                DocumentType.PRODUCT_REQUIREMENTS,
                prdJson,
                null
        );

        String createRes = mockMvc.perform(post("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.type").value("PRODUCT_REQUIREMENTS"))
                .andExpect(jsonPath("$.data.currentVersion").value(1))
                .andReturn().getResponse().getContentAsString();

        String docId = objectMapper.readTree(createRes).get("data").get("id").asText();

        // Update PRD to v2
        String updatedPrdJson = prdJson.replace("within 200ms", "within 150ms");
        UpdateDocumentRequest updateReq = new UpdateDocumentRequest(
                "Core Platform PRD",
                DocumentType.PRODUCT_REQUIREMENTS,
                updatedPrdJson,
                null,
                DocumentStatus.IN_REVIEW,
                "Refined NFR response latency requirement"
        );

        mockMvc.perform(put("/api/v1/documents/" + docId)
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentVersion").value(2))
                .andExpect(jsonPath("$.data.status").value("IN_REVIEW"));
    }

    @Test
    void createAndManageAPIDesign_withProposedEndpoints() throws Exception {
        String apiDesignJson = """
            {
                "basePath": "/api/v1",
                "version": "1.0.0",
                "lifecycle": "PROPOSED",
                "endpoints": [
                    {
                        "id": "ep-1",
                        "method": "GET",
                        "path": "/documents",
                        "summary": "List documents",
                        "description": "Returns list of project documents",
                        "parameters": [
                            {"name": "type", "in": "query", "type": "string", "required": false, "description": "Filter by type"}
                        ],
                        "responses": [
                            {"statusCode": 200, "description": "OK", "exampleJson": "{\\"success\\": true}"}
                        ],
                        "errorCodes": [
                            {"code": "403", "reason": "Forbidden", "exampleJson": "{\\"message\\": \\"Access denied\\"}"}
                        ]
                    }
                ]
            }
            """;

        CreateDocumentRequest createReq = new CreateDocumentRequest(
                "Document Management REST API Design",
                DocumentType.API_DESIGN,
                apiDesignJson,
                null
        );

        mockMvc.perform(post("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.type").value("API_DESIGN"))
                .andExpect(jsonPath("$.data.title").value("Document Management REST API Design"));
    }

    @Test
    void createAndManageADR_withDecisionStatuses() throws Exception {
        String adrJson = """
            {
                "context": "Need consistent database migration handling.",
                "problemDrivers": ["Automated migrations", "Zero manual schema drift"],
                "optionsConsidered": [
                    {"option": "Flyway", "pros": "Simple SQL migrations", "cons": "Java-centric"},
                    {"option": "Liquibase", "pros": "XML/YAML abstraction", "cons": "More verbose"}
                ],
                "decision": "Adopt Flyway for all schema migrations.",
                "rationale": "Flyway matches our PostgreSQL and Spring Boot stack directly.",
                "consequences": {
                    "positive": ["Deterministic schema changes across environments"],
                    "negative": ["Requires immutable migration scripts"]
                }
            }
            """;

        CreateDocumentRequest createReq = new CreateDocumentRequest(
                "ADR-001 Database Migration Framework",
                DocumentType.DECISION_RECORD,
                adrJson,
                null
        );

        String createRes = mockMvc.perform(post("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.type").value("DECISION_RECORD"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn().getResponse().getContentAsString();

        String docId = objectMapper.readTree(createRes).get("data").get("id").asText();

        // Update status to PROPOSED then ACCEPTED
        UpdateDocumentStatusRequest statusReq1 = new UpdateDocumentStatusRequest(DocumentStatus.PROPOSED);
        mockMvc.perform(patch("/api/v1/documents/" + docId + "/status")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PROPOSED"));

        UpdateDocumentStatusRequest statusReq2 = new UpdateDocumentStatusRequest(DocumentStatus.ACCEPTED);
        mockMvc.perform(patch("/api/v1/documents/" + docId + "/status")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }

    @Test
    void restrictAcceptingOrRejectingAdrsToTeamLeadersAdminsOrOrgOwners() throws Exception {
        // Create an ADR
        String adrContent = """
            {
                "context": "Microservices service-to-service communication framework",
                "problemDrivers": ["Low latency", "Strong typing"],
                "optionsConsidered": [{"option": "gRPC", "pros": "Binary", "cons": "Protobuf overhead"}],
                "decision": "Use gRPC for synchronous internal communication",
                "rationale": "High throughput and code generation",
                "consequences": {"positive": ["Low payload size"], "negative": ["Requires HTTP/2"]}
            }
            """;

        CreateDocumentRequest createReq = new CreateDocumentRequest(
                "ADR-002 Internal RPC Protocol",
                DocumentType.DECISION_RECORD,
                adrContent,
                null
        );

        String createRes = mockMvc.perform(post("/api/v1/projects/" + testProject.getId() + "/documents")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String adrId = objectMapper.readTree(createRes).get("data").get("id").asText();

        // Create a regular developer user (Org Member role MEMBER, application role ROLE_DEVELOPER)
        Role devRole = roleRepository.findByName(RoleName.ROLE_DEVELOPER).orElseThrow();
        User regularDev = new User("dev_user@test.com", "dev_user", "pass", "Dev User");
        regularDev.addRole(devRole);
        regularDev = userRepository.save(regularDev);
        organizationMemberRepository.save(new OrganizationMember(testOrg, regularDev, OrgMemberRole.MEMBER));
        String regularDevToken = jwtTokenProvider.generateToken(regularDev);

        // 1. Regular dev can update ADR to PROPOSED or SUPERSEDED
        mockMvc.perform(patch("/api/v1/documents/" + adrId + "/status")
                        .header("Authorization", "Bearer " + regularDevToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDocumentStatusRequest(DocumentStatus.PROPOSED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PROPOSED"));

        // 2. Regular dev is FORBIDDEN from transitioning ADR to ACCEPTED
        mockMvc.perform(patch("/api/v1/documents/" + adrId + "/status")
                        .header("Authorization", "Bearer " + regularDevToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDocumentStatusRequest(DocumentStatus.ACCEPTED))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Only team leaders, admins, or organization owners/admins can accept or reject Architecture Decision Records.")));

        // 3. Regular dev is FORBIDDEN from transitioning ADR to REJECTED
        mockMvc.perform(patch("/api/v1/documents/" + adrId + "/status")
                        .header("Authorization", "Bearer " + regularDevToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDocumentStatusRequest(DocumentStatus.REJECTED))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Only team leaders, admins, or organization owners/admins can accept or reject Architecture Decision Records.")));

        // 4. Create a team leader user with ROLE_TEAM_LEADER
        Role leaderRole = roleRepository.findByName(RoleName.ROLE_TEAM_LEADER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_TEAM_LEADER, "Team Leader")));
        User teamLeader = new User("leader_user@test.com", "leader_user", "pass", "Team Leader");
        teamLeader.addRole(leaderRole);
        teamLeader = userRepository.save(teamLeader);
        organizationMemberRepository.save(new OrganizationMember(testOrg, teamLeader, OrgMemberRole.MEMBER));
        String leaderToken = jwtTokenProvider.generateToken(teamLeader);

        // Team leader can ACCEPT the ADR
        mockMvc.perform(patch("/api/v1/documents/" + adrId + "/status")
                        .header("Authorization", "Bearer " + leaderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDocumentStatusRequest(DocumentStatus.ACCEPTED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));

        // Team leader can REJECT the ADR
        mockMvc.perform(patch("/api/v1/documents/" + adrId + "/status")
                        .header("Authorization", "Bearer " + leaderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDocumentStatusRequest(DocumentStatus.REJECTED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
    }
}
