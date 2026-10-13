package com.sdlc.platform.team;

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
import com.sdlc.platform.security.JwtTokenProvider;
import com.sdlc.platform.team.dto.AddTeamMemberRequest;
import com.sdlc.platform.team.dto.CreateTeamRequest;
import com.sdlc.platform.team.dto.UpdateTeamRequest;
import com.sdlc.platform.team.model.Team;
import com.sdlc.platform.team.model.TeamMemberRole;
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
class TeamControllerTest {

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
    private JwtTokenProvider jwtTokenProvider;

    private User orgOwner;
    private User teamDev;
    private User outsider;
    private Organization organization;
    private String ownerToken;
    private String devToken;
    private String outsiderToken;

    @BeforeEach
    void setUp() {
        Role devRole = roleRepository.findByName(RoleName.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_DEVELOPER, "Dev")));

        orgOwner = userRepository.save(new User("orgowner@teamtest.com", "orgowner", "hash", "Org Owner"));
        orgOwner.addRole(devRole);
        ownerToken = "Bearer " + jwtTokenProvider.generateToken(orgOwner);

        teamDev = userRepository.save(new User("teamdev@teamtest.com", "teamdev", "hash", "Team Developer"));
        teamDev.addRole(devRole);
        devToken = "Bearer " + jwtTokenProvider.generateToken(teamDev);

        outsider = userRepository.save(new User("outsider@teamtest.com", "outsider", "hash", "Outsider User"));
        outsider.addRole(devRole);
        outsiderToken = "Bearer " + jwtTokenProvider.generateToken(outsider);

        organization = organizationRepository.save(new Organization("Alpha Corp", "alpha-corp", "Alpha Corp", orgOwner));
        organizationMemberRepository.save(new OrganizationMember(organization, orgOwner, OrgMemberRole.OWNER));
        organizationMemberRepository.save(new OrganizationMember(organization, teamDev, OrgMemberRole.MEMBER));
    }

    @Test
    void createTeam_inOrganization_success() throws Exception {
        CreateTeamRequest request = new CreateTeamRequest(
                "Backend Engineers",
                "Core backend services and API team",
                orgOwner.getId()
        );

        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/teams")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Backend Engineers"))
                .andExpect(jsonPath("$.data.leaderUsername").value("orgowner"))
                .andExpect(jsonPath("$.data.members", hasSize(1)));
    }

    @Test
    void createTeam_duplicateNameInSameOrg_rejected() throws Exception {
        CreateTeamRequest request = new CreateTeamRequest("Frontend Team", "UI devs", orgOwner.getId());

        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/teams")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate attempt
        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/teams")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    void createTeam_outsiderForbidden() throws Exception {
        CreateTeamRequest request = new CreateTeamRequest("Hacker Team", "Desc", outsider.getId());

        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/teams")
                        .header("Authorization", outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void addMemberToTeam_requiresOrgMembership() throws Exception {
        CreateTeamRequest createTeam = new CreateTeamRequest("DevOps", "Infra", orgOwner.getId());
        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/teams")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createTeam)))
                .andExpect(status().isCreated());

        Team team = teamRepository.findByOrganizationIdAndName(organization.getId(), "DevOps").orElseThrow();

        // Adding teamDev (who is in org) should succeed
        AddTeamMemberRequest validAdd = new AddTeamMemberRequest("teamdev", TeamMemberRole.MEMBER);
        mockMvc.perform(post("/api/v1/teams/" + team.getId() + "/members")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validAdd)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.username").value("teamdev"));

        // Adding outsider (who is NOT in org) should fail
        AddTeamMemberRequest invalidAdd = new AddTeamMemberRequest("outsider", TeamMemberRole.MEMBER);
        mockMvc.perform(post("/api/v1/teams/" + team.getId() + "/members")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidAdd)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("User must be added to the organization")));
    }

    @Test
    void updateAndDeleteTeam_authorized() throws Exception {
        CreateTeamRequest createTeam = new CreateTeamRequest("QA Squad", "Quality assurance", orgOwner.getId());
        mockMvc.perform(post("/api/v1/organizations/" + organization.getId() + "/teams")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createTeam)))
                .andExpect(status().isCreated());

        Team team = teamRepository.findByOrganizationIdAndName(organization.getId(), "QA Squad").orElseThrow();

        // Update
        UpdateTeamRequest update = new UpdateTeamRequest("QA & Test Automation", "Expanded scope", orgOwner.getId());
        mockMvc.perform(put("/api/v1/teams/" + team.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("QA & Test Automation"));

        // Delete
        mockMvc.perform(delete("/api/v1/teams/" + team.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());

        // Confirm 404
        mockMvc.perform(get("/api/v1/teams/" + team.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isNotFound());
    }
}
