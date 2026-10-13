package com.sdlc.platform.team.service;

import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.common.DuplicateResourceException;
import com.sdlc.platform.common.ResourceNotFoundException;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.model.Organization;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.repository.OrganizationRepository;
import com.sdlc.platform.organization.service.OrganizationService;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.security.UserPrincipal;
import com.sdlc.platform.team.dto.*;
import com.sdlc.platform.team.model.Team;
import com.sdlc.platform.team.model.TeamMember;
import com.sdlc.platform.team.model.TeamMemberRole;
import com.sdlc.platform.team.repository.TeamMemberRepository;
import com.sdlc.platform.team.repository.TeamRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;

    public TeamService(
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            OrganizationRepository organizationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            OrganizationService organizationService
    ) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.organizationRepository = organizationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.organizationService = organizationService;
    }

    public TeamDetailDto createTeam(UUID orgId, CreateTeamRequest request, UserPrincipal currentUser) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        OrgMemberRole orgRole = organizationService.checkMembershipOrAdmin(orgId, currentUser);
        boolean isPrivilegedSystemRole = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_TEAM_LEADER")
                        || a.getAuthority().equals("ROLE_FACULTY"));

        if (!isPrivilegedSystemRole && orgRole != OrgMemberRole.OWNER && orgRole != OrgMemberRole.ADMIN) {
            throw new AccessDeniedException("You do not have permission to create teams in this organization.");
        }

        String teamName = request.name().trim();
        if (teamRepository.existsByOrganizationIdAndName(orgId, teamName)) {
            throw new DuplicateResourceException("Team with name '" + teamName + "' already exists in this organization.");
        }

        User leader = null;
        if (request.leaderId() != null) {
            leader = userRepository.findById(request.leaderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Leader user not found"));
            if (!organizationMemberRepository.existsByOrganizationIdAndUserId(orgId, leader.getId())) {
                throw new DuplicateResourceException("Team leader must already be a member of the organization.");
            }
        } else {
            leader = userRepository.findById(currentUser.getId()).orElse(null);
        }

        Team team = new Team(org, teamName, request.description(), leader);
        Team savedTeam = teamRepository.save(team);

        if (leader != null) {
            TeamMember leaderMember = new TeamMember(savedTeam, leader, TeamMemberRole.LEADER);
            teamMemberRepository.save(leaderMember);
        }

        return toDetailDto(savedTeam);
    }

    @Transactional(readOnly = true)
    public List<TeamSummaryDto> getTeamsForOrganization(UUID orgId, UserPrincipal currentUser) {
        organizationService.checkMembershipOrAdmin(orgId, currentUser);

        return teamRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .map(this::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeamDetailDto getTeamById(UUID teamId, UserPrincipal currentUser) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        organizationService.checkMembershipOrAdmin(team.getOrganization().getId(), currentUser);
        return toDetailDto(team);
    }

    public TeamDetailDto updateTeam(UUID teamId, UpdateTeamRequest request, UserPrincipal currentUser) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        checkTeamAdminPermission(team, currentUser);

        String newName = request.name().trim();
        if (!team.getName().equalsIgnoreCase(newName) && teamRepository.existsByOrganizationIdAndName(team.getOrganization().getId(), newName)) {
            throw new DuplicateResourceException("Team with name '" + newName + "' already exists in this organization.");
        }

        team.setName(newName);
        team.setDescription(request.description());

        if (request.leaderId() != null) {
            User newLeader = userRepository.findById(request.leaderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Leader user not found"));
            if (!organizationMemberRepository.existsByOrganizationIdAndUserId(team.getOrganization().getId(), newLeader.getId())) {
                throw new DuplicateResourceException("Team leader must be a member of the organization.");
            }
            team.setLeader(newLeader);

            // Ensure new leader is in the team as LEADER
            teamMemberRepository.findByTeamIdAndUserId(teamId, newLeader.getId())
                    .ifPresentOrElse(
                            m -> m.setRole(TeamMemberRole.LEADER),
                            () -> teamMemberRepository.save(new TeamMember(team, newLeader, TeamMemberRole.LEADER))
                    );
        }

        Team updated = teamRepository.save(team);
        return toDetailDto(updated);
    }

    public void deleteTeam(UUID teamId, UserPrincipal currentUser) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        checkTeamAdminPermission(team, currentUser);

        // Disassociate any projects referencing this team
        projectRepository.findByTeamIdOrderByCreatedAtDesc(teamId)
                .forEach(p -> {
                    p.setTeam(null);
                    projectRepository.save(p);
                });

        teamMemberRepository.deleteAll(teamMemberRepository.findByTeamId(teamId));
        teamRepository.delete(team);
        teamRepository.flush();
    }

    public TeamMemberDto addTeamMember(UUID teamId, AddTeamMemberRequest request, UserPrincipal currentUser) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        checkTeamAdminPermission(team, currentUser);

        String search = request.usernameOrEmail().trim();
        User targetUser = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(search, search)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + search));

        // Must be in parent organization first
        if (!organizationMemberRepository.existsByOrganizationIdAndUserId(team.getOrganization().getId(), targetUser.getId())) {
            throw new DuplicateResourceException("User must be added to the organization before joining a team.");
        }

        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, targetUser.getId())) {
            throw new DuplicateResourceException("User is already a member of this team.");
        }

        TeamMemberRole role = request.role() != null ? request.role() : TeamMemberRole.MEMBER;
        TeamMember newMember = new TeamMember(team, targetUser, role);
        TeamMember saved = teamMemberRepository.save(newMember);

        return toTeamMemberDto(saved);
    }

    public void removeTeamMember(UUID teamId, UUID targetUserId, UserPrincipal currentUser) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        TeamMember targetMember = teamMemberRepository.findByTeamIdAndUserId(teamId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in team."));

        boolean isSelf = currentUser.getId().equals(targetUserId);
        if (!isSelf) {
            checkTeamAdminPermission(team, currentUser);
        }

        teamMemberRepository.delete(targetMember);
    }

    private void checkTeamAdminPermission(Team team, UserPrincipal currentUser) {
        if (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return;
        }

        OrgMemberRole orgRole = organizationMemberRepository
                .findByOrganizationIdAndUserId(team.getOrganization().getId(), currentUser.getId())
                .map(com.sdlc.platform.organization.model.OrganizationMember::getRole)
                .orElse(null);

        if (orgRole == OrgMemberRole.OWNER || orgRole == OrgMemberRole.ADMIN) {
            return;
        }

        if (team.getLeader() != null && team.getLeader().getId().equals(currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You do not have permission to manage this team.");
    }

    private TeamSummaryDto toSummaryDto(Team team) {
        long memberCount = teamMemberRepository.countByTeamId(team.getId());
        long projectCount = projectRepository.countByTeamId(team.getId());

        return new TeamSummaryDto(
                team.getId(),
                team.getOrganization().getId(),
                team.getName(),
                team.getDescription(),
                team.getLeader() != null ? team.getLeader().getId() : null,
                team.getLeader() != null ? team.getLeader().getUsername() : null,
                team.getLeader() != null ? team.getLeader().getFullName() : null,
                memberCount,
                projectCount,
                team.getCreatedAt()
        );
    }

    private TeamDetailDto toDetailDto(Team team) {
        List<TeamMemberDto> members = teamMemberRepository.findByTeamId(team.getId()).stream()
                .map(this::toTeamMemberDto)
                .toList();

        long projectCount = projectRepository.countByTeamId(team.getId());

        return new TeamDetailDto(
                team.getId(),
                team.getOrganization().getId(),
                team.getName(),
                team.getDescription(),
                team.getLeader() != null ? team.getLeader().getId() : null,
                team.getLeader() != null ? team.getLeader().getUsername() : null,
                team.getLeader() != null ? team.getLeader().getFullName() : null,
                members,
                projectCount,
                team.getCreatedAt(),
                team.getUpdatedAt()
        );
    }

    private TeamMemberDto toTeamMemberDto(TeamMember member) {
        return new TeamMemberDto(
                member.getId(),
                member.getUser().getId(),
                member.getUser().getUsername(),
                member.getUser().getFullName(),
                member.getUser().getEmail(),
                member.getRole(),
                member.getCreatedAt()
        );
    }
}
