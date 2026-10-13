package com.sdlc.platform.project.service;

import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.common.DuplicateResourceException;
import com.sdlc.platform.common.ResourceNotFoundException;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.model.Organization;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.repository.OrganizationRepository;
import com.sdlc.platform.organization.service.OrganizationService;
import com.sdlc.platform.project.dto.CreateProjectRequest;
import com.sdlc.platform.project.dto.ProjectDetailDto;
import com.sdlc.platform.project.dto.ProjectSummaryDto;
import com.sdlc.platform.project.dto.UpdateProjectRequest;
import com.sdlc.platform.project.model.Project;
import com.sdlc.platform.project.model.ProjectStatus;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.security.UserPrincipal;
import com.sdlc.platform.team.model.Team;
import com.sdlc.platform.team.repository.TeamRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;

    public ProjectService(
            ProjectRepository projectRepository,
            OrganizationRepository organizationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            TeamRepository teamRepository,
            UserRepository userRepository,
            OrganizationService organizationService
    ) {
        this.projectRepository = projectRepository;
        this.organizationRepository = organizationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.organizationService = organizationService;
    }

    public ProjectDetailDto createProject(UUID orgId, CreateProjectRequest request, UserPrincipal currentUser) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        OrgMemberRole orgRole = organizationService.checkMembershipOrAdmin(orgId, currentUser);
        boolean isPrivilegedSystemRole = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_TEAM_LEADER")
                        || a.getAuthority().equals("ROLE_FACULTY"));

        if (!isPrivilegedSystemRole && orgRole != OrgMemberRole.OWNER && orgRole != OrgMemberRole.ADMIN) {
            throw new AccessDeniedException("You do not have permission to create projects in this organization.");
        }

        String projectKey = request.projectKey().trim().toUpperCase();
        if (projectRepository.existsByOrganizationIdAndProjectKey(orgId, projectKey)) {
            throw new DuplicateResourceException("Project key '" + projectKey + "' already exists in this organization.");
        }

        Team team = null;
        if (request.teamId() != null) {
            team = teamRepository.findById(request.teamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", "id", request.teamId()));
            if (!team.getOrganization().getId().equals(orgId)) {
                throw new DuplicateResourceException("Assigned team must belong to the same organization.");
            }
        }

        User creator = userRepository.findById(currentUser.getId()).orElse(null);
        Project project = new Project(org, team, request.name().trim(), projectKey, request.description(), creator);
        if (request.status() != null) {
            project.setStatus(request.status());
        }

        Project saved = projectRepository.save(project);
        return toDetailDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectSummaryDto> getProjectsForOrganization(UUID orgId, UserPrincipal currentUser) {
        organizationService.checkMembershipOrAdmin(orgId, currentUser);

        return projectRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .map(this::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectSummaryDto> getAllAccessibleProjects(UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        List<Project> projects = isAdmin
                ? projectRepository.findAll()
                : projectRepository.findAllAccessibleToUser(currentUser.getId());

        return projects.stream()
                .map(this::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectDetailDto getProjectById(UUID projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);
        return toDetailDto(project);
    }

    public ProjectDetailDto updateProject(UUID projectId, UpdateProjectRequest request, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        checkProjectManagePermission(project, currentUser);

        project.setName(request.name().trim());
        project.setDescription(request.description());

        if (request.status() != null) {
            project.setStatus(request.status());
        }

        if (request.teamId() != null) {
            Team team = teamRepository.findById(request.teamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", "id", request.teamId()));
            if (!team.getOrganization().getId().equals(project.getOrganization().getId())) {
                throw new DuplicateResourceException("Assigned team must belong to the same organization.");
            }
            project.setTeam(team);
        } else {
            project.setTeam(null);
        }

        Project updated = projectRepository.save(project);
        return toDetailDto(updated);
    }

    public void deleteProject(UUID projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        checkProjectManagePermission(project, currentUser);
        projectRepository.delete(project);
    }

    private void checkProjectManagePermission(Project project, UserPrincipal currentUser) {
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

        if (project.getCreatedBy() != null && project.getCreatedBy().getId().equals(currentUser.getId())) {
            return;
        }

        if (project.getTeam() != null && project.getTeam().getLeader() != null
                && project.getTeam().getLeader().getId().equals(currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You do not have permission to manage this project.");
    }

    private ProjectSummaryDto toSummaryDto(Project project) {
        return new ProjectSummaryDto(
                project.getId(),
                project.getOrganization().getId(),
                project.getOrganization().getName(),
                project.getTeam() != null ? project.getTeam().getId() : null,
                project.getTeam() != null ? project.getTeam().getName() : null,
                project.getName(),
                project.getProjectKey(),
                project.getDescription(),
                project.getStatus(),
                project.getCreatedBy() != null ? project.getCreatedBy().getUsername() : null,
                project.getCreatedAt()
        );
    }

    private ProjectDetailDto toDetailDto(Project project) {
        return new ProjectDetailDto(
                project.getId(),
                project.getOrganization().getId(),
                project.getOrganization().getName(),
                project.getTeam() != null ? project.getTeam().getId() : null,
                project.getTeam() != null ? project.getTeam().getName() : null,
                project.getName(),
                project.getProjectKey(),
                project.getDescription(),
                project.getStatus(),
                project.getCreatedBy() != null ? project.getCreatedBy().getUsername() : null,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
