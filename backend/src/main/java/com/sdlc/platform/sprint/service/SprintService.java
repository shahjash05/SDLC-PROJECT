package com.sdlc.platform.sprint.service;

import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.common.DuplicateResourceException;
import com.sdlc.platform.common.ResourceNotFoundException;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.service.OrganizationService;
import com.sdlc.platform.project.model.Project;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.requirement.model.StoryStatus;
import com.sdlc.platform.requirement.model.UserStory;
import com.sdlc.platform.requirement.repository.UserStoryRepository;
import com.sdlc.platform.security.UserPrincipal;
import com.sdlc.platform.sprint.dto.CreateSprintRequest;
import com.sdlc.platform.sprint.dto.SprintDetailDto;
import com.sdlc.platform.sprint.dto.SprintSummaryDto;
import com.sdlc.platform.sprint.dto.UpdateSprintRequest;
import com.sdlc.platform.sprint.model.Sprint;
import com.sdlc.platform.sprint.model.SprintStatus;
import com.sdlc.platform.sprint.repository.SprintRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final UserStoryRepository userStoryRepository;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final OrganizationMemberRepository organizationMemberRepository;

    public SprintService(
            SprintRepository sprintRepository,
            ProjectRepository projectRepository,
            UserStoryRepository userStoryRepository,
            UserRepository userRepository,
            OrganizationService organizationService,
            OrganizationMemberRepository organizationMemberRepository
    ) {
        this.sprintRepository = sprintRepository;
        this.projectRepository = projectRepository;
        this.userStoryRepository = userStoryRepository;
        this.userRepository = userRepository;
        this.organizationService = organizationService;
        this.organizationMemberRepository = organizationMemberRepository;
    }

    public SprintDetailDto createSprint(UUID projectId, CreateSprintRequest request, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        checkSprintManagePermission(project, currentUser);

        String sprintName = request.name().trim();
        if (sprintRepository.existsByProjectIdAndName(projectId, sprintName)) {
            throw new DuplicateResourceException("Sprint with name '" + sprintName + "' already exists in this project.");
        }

        if (request.startDate() != null && request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new DuplicateResourceException("Sprint end date cannot be earlier than start date.");
        }

        User creator = userRepository.findById(currentUser.getId()).orElse(null);
        Sprint sprint = new Sprint(project, sprintName, request.goal(), request.startDate(), request.endDate(), creator);
        Sprint saved = sprintRepository.save(sprint);

        return toDetailDto(saved);
    }

    @Transactional(readOnly = true)
    public List<SprintSummaryDto> getSprintsForProject(UUID projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        return sprintRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public SprintDetailDto getSprintById(UUID sprintId, UserPrincipal currentUser) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));

        organizationService.checkMembershipOrAdmin(sprint.getProject().getOrganization().getId(), currentUser);
        return toDetailDto(sprint);
    }

    public SprintDetailDto updateSprint(UUID sprintId, UpdateSprintRequest request, UserPrincipal currentUser) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));

        checkSprintManagePermission(sprint.getProject(), currentUser);

        String newName = request.name().trim();
        if (!sprint.getName().equalsIgnoreCase(newName) && sprintRepository.existsByProjectIdAndName(sprint.getProject().getId(), newName)) {
            throw new DuplicateResourceException("Sprint with name '" + newName + "' already exists in this project.");
        }

        if (request.startDate() != null && request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new DuplicateResourceException("Sprint end date cannot be earlier than start date.");
        }

        sprint.setName(newName);
        sprint.setGoal(request.goal());
        sprint.setStartDate(request.startDate());
        sprint.setEndDate(request.endDate());

        if (request.status() != null) {
            sprint.setStatus(request.status());
        }

        Sprint updated = sprintRepository.save(sprint);
        return toDetailDto(updated);
    }

    public void deleteSprint(UUID sprintId, UserPrincipal currentUser) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));

        checkSprintManagePermission(sprint.getProject(), currentUser);

        // Move stories back to backlog
        List<UserStory> stories = userStoryRepository.findBySprintIdOrderByStoryNumberAsc(sprintId);
        for (UserStory story : stories) {
            story.setSprint(null);
            userStoryRepository.save(story);
        }

        sprintRepository.delete(sprint);
    }

    public void checkSprintManagePermission(Project project, UserPrincipal currentUser) {
        if (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return;
        }

        OrgMemberRole orgRole = organizationMemberRepository
                .findByOrganizationIdAndUserId(project.getOrganization().getId(), currentUser.getId())
                .map(com.sdlc.platform.organization.model.OrganizationMember::getRole)
                .orElse(null);

        if (orgRole == OrgMemberRole.OWNER || orgRole == OrgMemberRole.ADMIN) {
            return;
        }

        boolean isPrivilegedSystemRole = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TEAM_LEADER")
                        || a.getAuthority().equals("ROLE_FACULTY"));

        if (isPrivilegedSystemRole && orgRole != null) {
            return;
        }

        if (project.getCreatedBy() != null && project.getCreatedBy().getId().equals(currentUser.getId())) {
            return;
        }

        if (project.getTeam() != null && project.getTeam().getLeader() != null
                && project.getTeam().getLeader().getId().equals(currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You do not have permission to manage sprints in this project.");
    }

    private SprintSummaryDto toSummaryDto(Sprint sprint) {
        List<UserStory> stories = userStoryRepository.findBySprintIdOrderByStoryNumberAsc(sprint.getId());
        long storyCount = stories.size();
        long completedStoryCount = stories.stream().filter(s -> s.getStatus() == StoryStatus.DONE).count();
        int totalStoryPoints = stories.stream()
                .mapToInt(s -> s.getStoryPoints() != null ? s.getStoryPoints() : 0)
                .sum();

        return new SprintSummaryDto(
                sprint.getId(),
                sprint.getProject().getId(),
                sprint.getName(),
                sprint.getGoal(),
                sprint.getStartDate(),
                sprint.getEndDate(),
                sprint.getStatus(),
                storyCount,
                completedStoryCount,
                totalStoryPoints,
                sprint.getCreatedAt()
        );
    }

    private SprintDetailDto toDetailDto(Sprint sprint) {
        List<UserStory> stories = userStoryRepository.findBySprintIdOrderByStoryNumberAsc(sprint.getId());
        long storyCount = stories.size();
        long completedStoryCount = stories.stream().filter(s -> s.getStatus() == StoryStatus.DONE).count();
        int totalStoryPoints = stories.stream()
                .mapToInt(s -> s.getStoryPoints() != null ? s.getStoryPoints() : 0)
                .sum();
        int completedStoryPoints = stories.stream()
                .filter(s -> s.getStatus() == StoryStatus.DONE)
                .mapToInt(s -> s.getStoryPoints() != null ? s.getStoryPoints() : 0)
                .sum();

        return new SprintDetailDto(
                sprint.getId(),
                sprint.getProject().getId(),
                sprint.getProject().getName(),
                sprint.getProject().getProjectKey(),
                sprint.getName(),
                sprint.getGoal(),
                sprint.getStartDate(),
                sprint.getEndDate(),
                sprint.getStatus(),
                storyCount,
                completedStoryCount,
                totalStoryPoints,
                completedStoryPoints,
                sprint.getCreatedBy() != null ? sprint.getCreatedBy().getUsername() : null,
                sprint.getCreatedAt(),
                sprint.getUpdatedAt()
        );
    }
}
