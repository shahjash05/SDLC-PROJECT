package com.sdlc.platform.organization;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdlc.platform.auth.model.Role;
import com.sdlc.platform.auth.model.RoleName;
import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.RoleRepository;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.organization.dto.AddOrgMemberRequest;
import com.sdlc.platform.organization.dto.CreateOrganizationRequest;
import com.sdlc.platform.organization.dto.UpdateOrganizationRequest;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.model.Organization;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.repository.OrganizationRepository;
import com.sdlc.platform.security.JwtTokenProvider;
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
class OrganizationControllerTest {

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
    private JwtTokenProvider jwtTokenProvider;

    private User ownerUser;
    private User otherUser;
    private User adminUser;
    private String ownerToken;
    private String otherToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        Role devRole = roleRepository.findByName(RoleName.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_DEVELOPER, "Dev")));
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_ADMIN, "Admin")));

        ownerUser = new User("owner@orgtest.com", "orgowner", "hash123", "Org Owner");
        ownerUser.addRole(devRole);
        ownerUser = userRepository.save(ownerUser);
        ownerToken = "Bearer " + jwtTokenProvider.generateToken(ownerUser);

        otherUser = new User("other@orgtest.com", "otheruser", "hash123", "Other User");
        otherUser.addRole(devRole);
        otherUser = userRepository.save(otherUser);
        otherToken = "Bearer " + jwtTokenProvider.generateToken(otherUser);

        adminUser = new User("admin@orgtest.com", "adminuser", "hash123", "Admin User");
        adminUser.addRole(adminRole);
        adminUser = userRepository.save(adminUser);
        adminToken = "Bearer " + jwtTokenProvider.generateToken(adminUser);
    }

    @Test
    void createOrganization_withValidData_createsOrgAndAssignsOwner() throws Exception {
        CreateOrganizationRequest request = new CreateOrganizationRequest(
                "Acme Corporation",
                "acme-corp",
                "Acme Corp software engineering division"
        );

        mockMvc.perform(post("/api/v1/organizations")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Acme Corporation"))
                .andExpect(jsonPath("$.data.slug").value("acme-corp"))
                .andExpect(jsonPath("$.data.currentUserRole").value("OWNER"))
                .andExpect(jsonPath("$.data.members", hasSize(1)))
                .andExpect(jsonPath("$.data.members[0].username").value("orgowner"))
                .andExpect(jsonPath("$.data.members[0].role").value("OWNER"));
    }

    @Test
    void createOrganization_withDuplicateSlug_returns409Conflict() throws Exception {
        CreateOrganizationRequest request1 = new CreateOrganizationRequest("Acme 1", "acme-slug", "Desc");
        mockMvc.perform(post("/api/v1/organizations")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        CreateOrganizationRequest request2 = new CreateOrganizationRequest("Acme 2", "acme-slug", "Desc");
        mockMvc.perform(post("/api/v1/organizations")
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("already in use")));
    }

    @Test
    void createOrganization_withInvalidSlug_returns400BadRequest() throws Exception {
        CreateOrganizationRequest invalid = new CreateOrganizationRequest("Acme", "Acme Invalid Slug!", "Desc");

        mockMvc.perform(post("/api/v1/organizations")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void getOrganizationById_nonMemberForbidden() throws Exception {
        CreateOrganizationRequest request = new CreateOrganizationRequest("Secret Org", "secret-org", "Private");
        mockMvc.perform(post("/api/v1/organizations")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        Organization org = organizationRepository.findBySlug("secret-org").orElseThrow();

        // Other user attempts to view private org
        mockMvc.perform(get("/api/v1/organizations/" + org.getId())
                        .header("Authorization", otherToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        // Global admin can view
        mockMvc.perform(get("/api/v1/organizations/" + org.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value("secret-org"));
    }

    @Test
    void addAndRemoveMember_success() throws Exception {
        CreateOrganizationRequest request = new CreateOrganizationRequest("Collab Org", "collab-org", "Collab");
        mockMvc.perform(post("/api/v1/organizations")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        Organization org = organizationRepository.findBySlug("collab-org").orElseThrow();

        // Add otherUser as MEMBER
        AddOrgMemberRequest addRequest = new AddOrgMemberRequest("otheruser", OrgMemberRole.MEMBER);
        mockMvc.perform(post("/api/v1/organizations/" + org.getId() + "/members")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.username").value("otheruser"))
                .andExpect(jsonPath("$.data.role").value("MEMBER"));

        // Now otherUser can view org
        mockMvc.perform(get("/api/v1/organizations/" + org.getId())
                        .header("Authorization", otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentUserRole").value("MEMBER"));

        // Remove otherUser
        mockMvc.perform(delete("/api/v1/organizations/" + org.getId() + "/members/" + otherUser.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());

        // otherUser is forbidden again
        mockMvc.perform(get("/api/v1/organizations/" + org.getId())
                        .header("Authorization", otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateAndDeleteOrganization_authorizationChecks() throws Exception {
        CreateOrganizationRequest create = new CreateOrganizationRequest("Updatable Org", "updatable-org", "Initial");
        mockMvc.perform(post("/api/v1/organizations")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated());

        Organization org = organizationRepository.findBySlug("updatable-org").orElseThrow();

        // Other user cannot update
        UpdateOrganizationRequest update = new UpdateOrganizationRequest("Hacked Org", "Hacked");
        mockMvc.perform(put("/api/v1/organizations/" + org.getId())
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());

        // Owner can update
        UpdateOrganizationRequest validUpdate = new UpdateOrganizationRequest("Renamed Org", "Updated desc");
        mockMvc.perform(put("/api/v1/organizations/" + org.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Renamed Org"));

        // Non-owner cannot delete
        mockMvc.perform(delete("/api/v1/organizations/" + org.getId())
                        .header("Authorization", otherToken))
                .andExpect(status().isForbidden());

        // Owner can delete
        mockMvc.perform(delete("/api/v1/organizations/" + org.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());

        // Now 404
        mockMvc.perform(get("/api/v1/organizations/" + org.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isNotFound());
    }
}
