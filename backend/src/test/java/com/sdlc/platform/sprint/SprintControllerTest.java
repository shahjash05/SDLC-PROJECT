package com.sdlc.platform.sprint;

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
import com.sdlc.platform.project.model.Project;
import com.sdlc.platform.project.model.ProjectStatus;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.requirement.model.StoryPriority;
import com.sdlc.platform.requirement.model.UserStory;
import com.sdlc.platform.requirement.repository.UserStoryRepository;
import com.sdlc.platform.security.JwtTokenProvider;
import com.sdlc.platform.sprint.dto.CreateSprintRequest;
import com.sdlc.platform.sprint.dto.UpdateSprintRequest;
import com.sdlc.platform.sprint.model.Sprint;
import com.sdlc.platform.sprint.model.SprintStatus;
import com.sdlc.platform.sprint.repository.SprintRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SprintControllerTest {

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
    private SprintRepository sprintRepository;

    @Autowired
    private UserStoryRepository userStoryRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User orgOwner;
    private User orgMember;
    private User outsider;
    private Organization organization;
    private Project project;
    private String ownerToken;
    private String memberToken;
    private String outsiderToken;

    @BeforeEach
    void setUp() {
        Role devRole = roleRepository.findByName(RoleName.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_DEVELOPER, "Dev")));

        orgOwner = userRepository.save(new User("owner@sprinttest.com", "sprintowner", "hash", "Sprint Owner"));
        orgOwner.addRole(devRole);
        ownerToken = "Bearer " + jwtTokenProvider.generateToken(orgOwner);

        orgMember = userRepository.save(new User("member@sprinttest.com", "sprintmember", "hash", "Sprint Member"));
        orgMember.addRole(devRole);
        memberToken = "Bearer " + jwtTokenProvider.generateToken(orgMember);

        outsider = userRepository.save(new User("outsider@sprinttest.com", "sprintoutsider", "hash", "Outsider"));
        outsider.addRole(devRole);
        outsiderToken = "Bearer " + jwtTokenProvider.generateToken(outsider);

        organization = organizationRepository.save(new Organization("Sprint Corp", "sprint-corp", "Sprint Corp", orgOwner));
        organizationMemberRepository.save(new OrganizationMember(organization, orgOwner, OrgMemberRole.OWNER));
        organizationMemberRepository.save(new OrganizationMember(organization, orgMember, OrgMemberRole.MEMBER));

        project = projectRepository.save(new Project(organization, null, "Mobile Banking App", "BANK", "Mobile banking", orgOwner));
    }

    @Test
    void createSprint_success() throws Exception {
        CreateSprintRequest request = new CreateSprintRequest(
                "Sprint 1 - Foundation",
                "Complete authentication and initial customer dashboard",
                LocalDate.now(),
                LocalDate.now().plusDays(14)
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/sprints")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Sprint 1 - Foundation"))
                .andExpect(jsonPath("$.data.goal").value("Complete authentication and initial customer dashboard"))
                .andExpect(jsonPath("$.data.status").value("PLANNED"))
                .andExpect(jsonPath("$.data.projectName").value("Mobile Banking App"));
    }

    @Test
    void createSprint_duplicateNameInProject_conflict() throws Exception {
        CreateSprintRequest request = new CreateSprintRequest("Sprint Alpha", "Goal", LocalDate.now(), LocalDate.now().plusDays(7));
        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/sprints")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate
        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/sprints")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("already exists in this project")));
    }

    @Test
    void createSprint_outsiderForbidden() throws Exception {
        CreateSprintRequest request = new CreateSprintRequest("Sprint 1", "Goal", LocalDate.now(), LocalDate.now().plusDays(7));
        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/sprints")
                        .header("Authorization", outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getSprintsForProject_accessibleToOrgMember() throws Exception {
        sprintRepository.save(new Sprint(project, "Sprint 1", "Goal 1", LocalDate.now(), LocalDate.now().plusDays(14), orgOwner));

        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/sprints")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name").value("Sprint 1"));

        // Outsider cannot access
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/sprints")
                        .header("Authorization", outsiderToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateSprint_datesAndStatus_success() throws Exception {
        Sprint sprint = sprintRepository.save(new Sprint(project, "Sprint Initial", "Goal", LocalDate.now(), LocalDate.now().plusDays(7), orgOwner));

        UpdateSprintRequest update = new UpdateSprintRequest(
                "Sprint Active 1",
                "Updated goal",
                LocalDate.now(),
                LocalDate.now().plusDays(14),
                SprintStatus.ACTIVE
        );

        mockMvc.perform(put("/api/v1/sprints/" + sprint.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Sprint Active 1"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    void deleteSprint_movesStoriesBackToBacklog() throws Exception {
        Sprint sprint = sprintRepository.save(new Sprint(project, "Sprint To Delete", "Goal", LocalDate.now(), LocalDate.now().plusDays(7), orgOwner));

        UserStory story = new UserStory(project, 1, "Story In Sprint", "Desc", "AC", StoryPriority.HIGH, 5, orgOwner, orgOwner);
        story.setSprint(sprint);
        story = userStoryRepository.save(story);

        // Delete sprint
        mockMvc.perform(delete("/api/v1/sprints/" + sprint.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());

        // Verify sprint is gone (404)
        mockMvc.perform(get("/api/v1/sprints/" + sprint.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isNotFound());

        // Story is still present, sprint association reset to null
        UserStory updatedStory = userStoryRepository.findById(story.getId()).orElseThrow();
        assertNull(updatedStory.getSprint(), "Story sprint should be null after sprint deletion");
    }
}
