package com.sdlc.platform.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdlc.platform.auth.model.Role;
import com.sdlc.platform.auth.model.RoleName;
import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.RoleRepository;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.model.Organization;
import com.sdlc.platform.organization.model.OrganizationMember;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.repository.OrganizationRepository;
import com.sdlc.platform.project.dto.CreateProjectRequest;
import com.sdlc.platform.project.dto.UpdateProjectRequest;
import com.sdlc.platform.project.model.Project;
import com.sdlc.platform.project.model.ProjectStatus;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.security.JwtTokenProvider;
import com.sdlc.platform.team.model.Team;
import com.sdlc.platform.team.repository.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ProjectControllerTest {

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
    private TeamRepository teamRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User orgOwner;
    private User orgMember;
    private User outsider;
    private Organization organization;
    private Team team;
    private String ownerToken;
    private String memberToken;
    private String outsiderToken;

    @BeforeEach
    void setUp() {
        Role devRole = roleRepository.findByName(RoleName.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_DEVELOPER, "Dev")));

        orgOwner = userRepository.save(new User("owner@projtest.com", "projowner", "hash", "Project Owner"));
        orgOwner.addRole(devRole);
        ownerToken = "Bearer " + jwtTokenProvider.generateToken(orgOwner);

        orgMember = userRepository.save(new User("member@projtest.com", "projmember", "hash", "Org Member"));
        orgMember.addRole(devRole);
        memberToken = "Bearer " + jwtTokenProvider.generateToken(orgMember);

        outsider = userRepository.save(new User("outsider@projtest.com", "projoutsider", "hash", "Outsider"));
        outsider.addRole(devRole);
        outsiderToken = "Bearer " + jwtTokenProvider.generateToken(outsider);

        organization = organizationRepository.save(new Organization("Beta Labs", "beta-labs", "Beta Labs", orgOwner));
        organizationMemberRepository.save(new OrganizationMember(organization, orgOwner, OrgMemberRole.OWNER));
        organizationMemberRepository.save(new OrganizationMember(organization, orgMember, OrgMemberRole.MEMBER));

        team = teamRepository.save(new Team(organization, "Core Team", "Core development team", orgOwner));
    }

    @Test
    void createProject_withValidData_success() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "SDLC Management Portal",
                "SDLC",
                "Full-lifecycle software development portal",
                team.getId(),
                ProjectStatus.PLANNING
        );

        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/projects")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("SDLC Management Portal"))
                .andExpect(jsonPath("$.data.projectKey").value("SDLC"))
                .andExpect(jsonPath("$.data.status").value("PLANNING"))
                .andExpect(jsonPath("$.data.teamName").value("Core Team"))
                .andExpect(jsonPath("$.data.organizationName").value("Beta Labs"));
    }

    @Test
    void createProject_duplicateKeyInSameOrg_rejected() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "Project Alpha",
                "ALPHA",
                "Desc",
                null,
                ProjectStatus.PLANNING
        );

        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/projects")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate key
        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/projects")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("already exists in this organization")));
    }

    @Test
    void createProject_outsiderForbidden() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                "Illegal Project",
                "ILL",
                "Desc",
                null,
                ProjectStatus.PLANNING
        );

        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/projects")
                        .header("Authorization", outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void listAndGetProjects_accessibleToOrgMembers() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest("Portal V1", "PV1", "Portal", team.getId(), ProjectStatus.ACTIVE);
        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/projects")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        Project project = projectRepository.findByOrganizationIdAndProjectKey(organization.getId(), "PV1").orElseThrow();

        // Org member can list projects
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].projectKey").value("PV1"));

        // Org member can view project details
        mockMvc.perform(get("/api/v1/projects/" + project.getId())
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.projectKey").value("PV1"));

        // Outsider is forbidden
        mockMvc.perform(get("/api/v1/projects/" + project.getId())
                        .header("Authorization", outsiderToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateAndDeleteProject_success() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest("Beta V2", "BV2", "Initial", null, ProjectStatus.PLANNING);
        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/projects")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        Project project = projectRepository.findByOrganizationIdAndProjectKey(organization.getId(), "BV2").orElseThrow();

        // Update project status to ACTIVE
        UpdateProjectRequest update = new UpdateProjectRequest("Beta V2 Release", "Updated description", ProjectStatus.ACTIVE, team.getId());
        mockMvc.perform(put("/api/v1/projects/" + project.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Beta V2 Release"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.teamName").value("Core Team"));

        // Delete project
        mockMvc.perform(delete("/api/v1/projects/" + project.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());

        // Verify 404
        mockMvc.perform(get("/api/v1/projects/" + project.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isNotFound());
    }
}
