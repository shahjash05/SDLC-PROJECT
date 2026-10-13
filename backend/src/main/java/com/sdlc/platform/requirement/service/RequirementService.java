package com.sdlc.platform.requirement.service;

import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.common.DuplicateResourceException;
import com.sdlc.platform.common.ResourceNotFoundException;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.service.OrganizationService;
import com.sdlc.platform.project.model.Project;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.requirement.dto.*;
import com.sdlc.platform.requirement.model.*;
import com.sdlc.platform.requirement.repository.TaskItemRepository;
import com.sdlc.platform.requirement.repository.UserStoryRepository;
import com.sdlc.platform.security.UserPrincipal;
import com.sdlc.platform.sprint.model.Sprint;
import com.sdlc.platform.sprint.repository.SprintRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RequirementService {

    private final UserStoryRepository userStoryRepository;
    private final TaskItemRepository taskItemRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final OrganizationMemberRepository organizationMemberRepository;

    public RequirementService(
            UserStoryRepository userStoryRepository,
            TaskItemRepository taskItemRepository,
            ProjectRepository projectRepository,
            SprintRepository sprintRepository,
            UserRepository userRepository,
            OrganizationService organizationService,
            OrganizationMemberRepository organizationMemberRepository
    ) {
        this.userStoryRepository = userStoryRepository;
        this.taskItemRepository = taskItemRepository;
        this.projectRepository = projectRepository;
        this.sprintRepository = sprintRepository;
        this.userRepository = userRepository;
        this.organizationService = organizationService;
        this.organizationMemberRepository = organizationMemberRepository;
    }

    public StoryDetailDto createStory(UUID projectId, CreateStoryRequest request, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        Sprint sprint = null;
        if (request.sprintId() != null) {
            sprint = sprintRepository.findById(request.sprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", request.sprintId()));
            if (!sprint.getProject().getId().equals(projectId)) {
                throw new DuplicateResourceException("Assigned sprint must belong to the same project.");
            }
        }

        User assignee = null;
        if (request.assigneeId() != null) {
            assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            if (!organizationMemberRepository.existsByOrganizationIdAndUserId(project.getOrganization().getId(), assignee.getId())) {
                throw new DuplicateResourceException("Assignee must be a member of the project's organization.");
            }
        }

        int nextStoryNumber = userStoryRepository.findMaxStoryNumberByProjectId(projectId) + 1;
        User creator = userRepository.findById(currentUser.getId()).orElse(null);

        UserStory story = new UserStory(
                project,
                nextStoryNumber,
                request.title().trim(),
                request.description(),
                request.acceptanceCriteria(),
                request.priority(),
                request.storyPoints(),
                assignee,
                creator
        );
        story.setSprint(sprint);
        if (sprint != null) {
            story.setStatus(StoryStatus.TODO);
        }

        UserStory saved = userStoryRepository.save(story);
        return toDetailDto(saved);
    }

    @Transactional(readOnly = true)
    public List<StorySummaryDto> getStoriesForProject(
            UUID projectId,
            UUID sprintId,
            Boolean backlogOnly,
            StoryStatus status,
            UserPrincipal currentUser
    ) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        List<UserStory> stories;
        if (Boolean.TRUE.equals(backlogOnly)) {
            stories = userStoryRepository.findByProjectIdAndSprintIsNullOrderByStoryNumberAsc(projectId);
        } else if (sprintId != null) {
            stories = userStoryRepository.findBySprintIdOrderByStoryNumberAsc(sprintId);
        } else if (status != null) {
            stories = userStoryRepository.findByProjectIdAndStatusOrderByStoryNumberAsc(projectId, status);
        } else {
            stories = userStoryRepository.findByProjectIdOrderByStoryNumberAsc(projectId);
        }

        return stories.stream().map(this::toSummaryDto).toList();
    }

    @Transactional(readOnly = true)
    public StoryDetailDto getStoryById(UUID storyId, UserPrincipal currentUser) {
        UserStory story = userStoryRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("UserStory", "id", storyId));

        organizationService.checkMembershipOrAdmin(story.getProject().getOrganization().getId(), currentUser);
        return toDetailDto(story);
    }

    public StoryDetailDto updateStory(UUID storyId, UpdateStoryRequest request, UserPrincipal currentUser) {
        UserStory story = userStoryRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("UserStory", "id", storyId));

        organizationService.checkMembershipOrAdmin(story.getProject().getOrganization().getId(), currentUser);

        story.setTitle(request.title().trim());
        story.setDescription(request.description());
        story.setAcceptanceCriteria(request.acceptanceCriteria());
        if (request.status() != null) {
            story.setStatus(request.status());
        }
        if (request.priority() != null) {
            story.setPriority(request.priority());
        }
        story.setStoryPoints(request.storyPoints());

        if (request.sprintId() != null) {
            Sprint sprint = sprintRepository.findById(request.sprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", request.sprintId()));
            if (!sprint.getProject().getId().equals(story.getProject().getId())) {
                throw new DuplicateResourceException("Assigned sprint must belong to the same project.");
            }
            story.setSprint(sprint);
        } else {
            story.setSprint(null);
        }

        if (request.assigneeId() != null) {
            User assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            if (!organizationMemberRepository.existsByOrganizationIdAndUserId(story.getProject().getOrganization().getId(), assignee.getId())) {
                throw new DuplicateResourceException("Assignee must be a member of the project's organization.");
            }
            story.setAssignee(assignee);
        } else {
            story.setAssignee(null);
        }

        UserStory updated = userStoryRepository.save(story);
        return toDetailDto(updated);
    }

    public StorySummaryDto updateStoryStatus(UUID storyId, UpdateStoryStatusRequest request, UserPrincipal currentUser) {
        UserStory story = userStoryRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("UserStory", "id", storyId));

        organizationService.checkMembershipOrAdmin(story.getProject().getOrganization().getId(), currentUser);

        story.setStatus(request.status());
        UserStory updated = userStoryRepository.save(story);
        return toSummaryDto(updated);
    }

    public void deleteStory(UUID storyId, UserPrincipal currentUser) {
        UserStory story = userStoryRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("UserStory", "id", storyId));

        checkStoryDeletePermission(story, currentUser);

        taskItemRepository.deleteAllByStoryId(storyId);
        userStoryRepository.delete(story);
    }

    // --- Task Sub-items ---

    public TaskDto createTask(UUID storyId, CreateTaskRequest request, UserPrincipal currentUser) {
        UserStory story = userStoryRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("UserStory", "id", storyId));

        organizationService.checkMembershipOrAdmin(story.getProject().getOrganization().getId(), currentUser);

        User assignee = null;
        if (request.assigneeId() != null) {
            assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            if (!organizationMemberRepository.existsByOrganizationIdAndUserId(story.getProject().getOrganization().getId(), assignee.getId())) {
                throw new DuplicateResourceException("Assignee must be a member of the organization.");
            }
        }

        TaskItem task = new TaskItem(story, request.title().trim(), request.description(), request.estimatedHours(), assignee);
        TaskItem saved = taskItemRepository.save(task);

        return toTaskDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getTasksForStory(UUID storyId, UserPrincipal currentUser) {
        UserStory story = userStoryRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("UserStory", "id", storyId));

        organizationService.checkMembershipOrAdmin(story.getProject().getOrganization().getId(), currentUser);

        return taskItemRepository.findByStoryIdOrderByCreatedAtAsc(storyId).stream()
                .map(this::toTaskDto)
                .toList();
    }

    public TaskDto updateTask(UUID taskId, UpdateTaskRequest request, UserPrincipal currentUser) {
        TaskItem task = taskItemRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("TaskItem", "id", taskId));

        organizationService.checkMembershipOrAdmin(task.getStory().getProject().getOrganization().getId(), currentUser);

        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        if (request.status() != null) {
            task.setStatus(request.status());
        }
        task.setEstimatedHours(request.estimatedHours());
        task.setActualHours(request.actualHours());

        if (request.assigneeId() != null) {
            User assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            if (!organizationMemberRepository.existsByOrganizationIdAndUserId(task.getStory().getProject().getOrganization().getId(), assignee.getId())) {
                throw new DuplicateResourceException("Assignee must be a member of the organization.");
            }
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }

        TaskItem updated = taskItemRepository.save(task);
        return toTaskDto(updated);
    }

    public void deleteTask(UUID taskId, UserPrincipal currentUser) {
        TaskItem task = taskItemRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("TaskItem", "id", taskId));

        organizationService.checkMembershipOrAdmin(task.getStory().getProject().getOrganization().getId(), currentUser);
        taskItemRepository.delete(task);
    }

    private void checkStoryDeletePermission(UserStory story, UserPrincipal currentUser) {
        if (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return;
        }

        OrgMemberRole orgRole = organizationMemberRepository
                .findByOrganizationIdAndUserId(story.getProject().getOrganization().getId(), currentUser.getId())
                .map(com.sdlc.platform.organization.model.OrganizationMember::getRole)
                .orElse(null);

        if (orgRole == OrgMemberRole.OWNER || orgRole == OrgMemberRole.ADMIN) {
            return;
        }

        if (story.getCreatedBy() != null && story.getCreatedBy().getId().equals(currentUser.getId())) {
            return;
        }

        if (story.getProject().getTeam() != null && story.getProject().getTeam().getLeader() != null
                && story.getProject().getTeam().getLeader().getId().equals(currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You do not have permission to delete this user story.");
    }

    private StorySummaryDto toSummaryDto(UserStory story) {
        long taskCount = taskItemRepository.countByStoryId(story.getId());
        long completedTaskCount = taskItemRepository.countByStoryIdAndStatus(story.getId(), TaskStatus.DONE);
        String storyKey = story.getProject().getProjectKey() + "-" + story.getStoryNumber();

        return new StorySummaryDto(
                story.getId(),
                story.getProject().getId(),
                story.getProject().getProjectKey(),
                story.getSprint() != null ? story.getSprint().getId() : null,
                story.getSprint() != null ? story.getSprint().getName() : null,
                story.getStoryNumber(),
                storyKey,
                story.getTitle(),
                story.getStatus(),
                story.getPriority(),
                story.getStoryPoints(),
                story.getAssignee() != null ? story.getAssignee().getId() : null,
                story.getAssignee() != null ? story.getAssignee().getUsername() : null,
                story.getAssignee() != null ? story.getAssignee().getFullName() : null,
                taskCount,
                completedTaskCount,
                story.getCreatedAt()
        );
    }

    private StoryDetailDto toDetailDto(UserStory story) {
        List<TaskDto> tasks = taskItemRepository.findByStoryIdOrderByCreatedAtAsc(story.getId()).stream()
                .map(this::toTaskDto)
                .toList();

        String storyKey = story.getProject().getProjectKey() + "-" + story.getStoryNumber();

        return new StoryDetailDto(
                story.getId(),
                story.getProject().getId(),
                story.getProject().getName(),
                story.getProject().getProjectKey(),
                story.getSprint() != null ? story.getSprint().getId() : null,
                story.getSprint() != null ? story.getSprint().getName() : null,
                story.getStoryNumber(),
                storyKey,
                story.getTitle(),
                story.getDescription(),
                story.getAcceptanceCriteria(),
                story.getStatus(),
                story.getPriority(),
                story.getStoryPoints(),
                story.getAssignee() != null ? story.getAssignee().getId() : null,
                story.getAssignee() != null ? story.getAssignee().getUsername() : null,
                story.getAssignee() != null ? story.getAssignee().getFullName() : null,
                story.getCreatedBy() != null ? story.getCreatedBy().getUsername() : null,
                tasks,
                story.getCreatedAt(),
                story.getUpdatedAt()
        );
    }

    private TaskDto toTaskDto(TaskItem task) {
        return new TaskDto(
                task.getId(),
                task.getStory().getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getEstimatedHours(),
                task.getActualHours(),
                task.getAssignee() != null ? task.getAssignee().getId() : null,
                task.getAssignee() != null ? task.getAssignee().getUsername() : null,
                task.getCreatedAt()
        );
    }
}
