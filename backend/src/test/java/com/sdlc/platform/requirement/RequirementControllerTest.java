package com.sdlc.platform.requirement;

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
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.requirement.dto.CreateStoryRequest;
import com.sdlc.platform.requirement.dto.CreateTaskRequest;
import com.sdlc.platform.requirement.dto.UpdateStoryStatusRequest;
import com.sdlc.platform.requirement.dto.UpdateTaskRequest;
import com.sdlc.platform.requirement.model.StoryPriority;
import com.sdlc.platform.requirement.model.StoryStatus;
import com.sdlc.platform.requirement.model.TaskStatus;
import com.sdlc.platform.requirement.model.UserStory;
import com.sdlc.platform.requirement.repository.TaskItemRepository;
import com.sdlc.platform.requirement.repository.UserStoryRepository;
import com.sdlc.platform.security.JwtTokenProvider;
import com.sdlc.platform.sprint.model.Sprint;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RequirementControllerTest {

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
    private TaskItemRepository taskItemRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User orgOwner;
    private User orgDev;
    private User outsider;
    private Organization organization;
    private Project project;
    private Sprint sprint;
    private String ownerToken;
    private String devToken;
    private String outsiderToken;

    @BeforeEach
    void setUp() {
        Role devRole = roleRepository.findByName(RoleName.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_DEVELOPER, "Dev")));

        orgOwner = userRepository.save(new User("owner@reqtest.com", "reqowner", "hash", "Req Owner"));
        orgOwner.addRole(devRole);
        ownerToken = "Bearer " + jwtTokenProvider.generateToken(orgOwner);

        orgDev = userRepository.save(new User("dev@reqtest.com", "reqdev", "hash", "Req Dev"));
        orgDev.addRole(devRole);
        devToken = "Bearer " + jwtTokenProvider.generateToken(orgDev);

        outsider = userRepository.save(new User("outsider@reqtest.com", "reqoutsider", "hash", "Req Outsider"));
        outsider.addRole(devRole);
        outsiderToken = "Bearer " + jwtTokenProvider.generateToken(outsider);

        organization = organizationRepository.save(new Organization("Fintech Lab", "fintech-lab", "Fintech Lab", orgOwner));
        organizationMemberRepository.save(new OrganizationMember(organization, orgOwner, OrgMemberRole.OWNER));
        organizationMemberRepository.save(new OrganizationMember(organization, orgDev, OrgMemberRole.MEMBER));

        project = projectRepository.save(new Project(organization, null, "Crypto Wallet", "WALLET", "Decentralized wallet", orgOwner));
        sprint = sprintRepository.save(new Sprint(project, "Sprint 1", "Core keys", LocalDate.now(), LocalDate.now().plusDays(14), orgOwner));
    }

    @Test
    void createStory_withAcceptanceCriteriaAndPoints_success() throws Exception {
        CreateStoryRequest request = new CreateStoryRequest(
                "As a user I want to generate a new seed phrase so that my keys are safe",
                "User should be guided through 12-word seed phrase backup",
                "Given I click generate, when words display, then I must confirm word #3 and #7",
                StoryPriority.HIGH,
                5,
                sprint.getId(),
                orgDev.getId()
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/stories")
                        .header("Authorization", devToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.storyNumber").value(1))
                .andExpect(jsonPath("$.data.storyKey").value("WALLET-1"))
                .andExpect(jsonPath("$.data.priority").value("HIGH"))
                .andExpect(jsonPath("$.data.storyPoints").value(5))
                .andExpect(jsonPath("$.data.assigneeUsername").value("reqdev"))
                .andExpect(jsonPath("$.data.sprintName").value("Sprint 1"))
                .andExpect(jsonPath("$.data.status").value("TODO"));
    }

    @Test
    void createStory_withAssigneeOutsideOrg_rejected() throws Exception {
        CreateStoryRequest request = new CreateStoryRequest(
                "Story with outside assignee",
                "Desc",
                "AC",
                StoryPriority.LOW,
                1,
                null,
                outsider.getId() // not in organization
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/stories")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Assignee must be a member of the project's organization")));
    }

    @Test
    void createStory_outsiderForbidden() throws Exception {
        CreateStoryRequest request = new CreateStoryRequest("Outsider story", "Desc", "AC", StoryPriority.LOW, 1, null, null);

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/stories")
                        .header("Authorization", outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void listStories_backlogAndSprintFilters() throws Exception {
        // Story 1 in backlog
        UserStory s1 = new UserStory(project, 1, "Backlog Story", "Desc", "AC", StoryPriority.MEDIUM, 3, null, orgOwner);
        userStoryRepository.save(s1);

        // Story 2 in sprint
        UserStory s2 = new UserStory(project, 2, "Sprint Story", "Desc", "AC", StoryPriority.HIGH, 8, orgDev, orgOwner);
        s2.setSprint(sprint);
        s2.setStatus(StoryStatus.TODO);
        userStoryRepository.save(s2);

        // Query backlog only
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/stories?backlogOnly=true")
                        .header("Authorization", devToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].storyKey").value("WALLET-1"));

        // Query sprint only
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/stories?sprintId=" + sprint.getId())
                        .header("Authorization", devToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].storyKey").value("WALLET-2"));
    }

    @Test
    void updateStoryStatus_quickTransition_success() throws Exception {
        UserStory story = new UserStory(project, 1, "Story To Move", "Desc", "AC", StoryPriority.MEDIUM, 2, orgDev, orgOwner);
        story.setSprint(sprint);
        story.setStatus(StoryStatus.TODO);
        story = userStoryRepository.save(story);

        UpdateStoryStatusRequest statusReq = new UpdateStoryStatusRequest(StoryStatus.IN_PROGRESS);

        mockMvc.perform(patch("/api/v1/stories/" + story.getId() + "/status")
                        .header("Authorization", devToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
    }

    @Test
    void taskItemCrud_underStory_success() throws Exception {
        UserStory story = new UserStory(project, 1, "Parent Story", "Desc", "AC", StoryPriority.MEDIUM, 3, orgDev, orgOwner);
        story = userStoryRepository.save(story);

        // Create Task
        CreateTaskRequest createTask = new CreateTaskRequest(
                "Write BIP-39 mnemonic generator",
                "Use secure PRNG",
                new BigDecimal("4.5"),
                orgDev.getId()
        );

        mockMvc.perform(post("/api/v1/stories/" + story.getId() + "/tasks")
                        .header("Authorization", devToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createTask)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Write BIP-39 mnemonic generator"))
                .andExpect(jsonPath("$.data.status").value("TODO"))
                .andExpect(jsonPath("$.data.estimatedHours").value(4.5));

        // Get tasks
        mockMvc.perform(get("/api/v1/stories/" + story.getId() + "/tasks")
                        .header("Authorization", devToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));

        UUID taskId = taskItemRepository.findByStoryIdOrderByCreatedAtAsc(story.getId()).get(0).getId();

        // Update task status
        UpdateTaskRequest updateTask = new UpdateTaskRequest(
                "Write BIP-39 mnemonic generator",
                "Done and unit tested",
                TaskStatus.DONE,
                new BigDecimal("4.5"),
                new BigDecimal("3.5"),
                orgDev.getId()
        );

        mockMvc.perform(put("/api/v1/tasks/" + taskId)
                        .header("Authorization", devToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateTask)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DONE"))
                .andExpect(jsonPath("$.data.actualHours").value(3.5));

        // Delete task
        mockMvc.perform(delete("/api/v1/tasks/" + taskId)
                        .header("Authorization", devToken))
                .andExpect(status().isOk());

        // Now empty
        mockMvc.perform(get("/api/v1/stories/" + story.getId() + "/tasks")
                        .header("Authorization", devToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }
}
