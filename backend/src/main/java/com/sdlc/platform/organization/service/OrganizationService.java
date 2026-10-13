package com.sdlc.platform.organization.service;

import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.common.DuplicateResourceException;
import com.sdlc.platform.common.ResourceNotFoundException;
import com.sdlc.platform.organization.dto.*;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.model.Organization;
import com.sdlc.platform.organization.model.OrganizationMember;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.repository.OrganizationRepository;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.security.UserPrincipal;
import com.sdlc.platform.team.repository.TeamRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final TeamRepository teamRepository;
    private final com.sdlc.platform.team.repository.TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public OrganizationService(
            OrganizationRepository organizationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            TeamRepository teamRepository,
            com.sdlc.platform.team.repository.TeamMemberRepository teamMemberRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository
    ) {
        this.organizationRepository = organizationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public OrganizationDetailDto createOrganization(CreateOrganizationRequest request, UserPrincipal currentUser) {
        String slug = request.slug().trim().toLowerCase();
        if (organizationRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Organization slug already in use: " + slug);
        }

        User creator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Organization org = new Organization(request.name().trim(), slug, request.description(), creator);
        Organization savedOrg = organizationRepository.save(org);

        OrganizationMember ownerMember = new OrganizationMember(savedOrg, creator, OrgMemberRole.OWNER);
        organizationMemberRepository.save(ownerMember);

        return toDetailDto(savedOrg, OrgMemberRole.OWNER);
    }

    @Transactional(readOnly = true)
    public List<OrganizationSummaryDto> getUserOrganizations(UserPrincipal currentUser) {
        boolean isAdmin = isPlatformAdmin(currentUser);
        List<Organization> orgs = isAdmin
                ? organizationRepository.findAllByOrderByCreatedAtDesc()
                : organizationRepository.findAllByUserId(currentUser.getId());

        return orgs.stream().map(org -> {
            OrgMemberRole role = organizationMemberRepository
                    .findByOrganizationIdAndUserId(org.getId(), currentUser.getId())
                    .map(OrganizationMember::getRole)
                    .orElse(isAdmin ? OrgMemberRole.ADMIN : null);

            long memberCount = organizationMemberRepository.countByOrganizationId(org.getId());
            long teamCount = teamRepository.countByOrganizationId(org.getId());
            long projectCount = projectRepository.countByOrganizationId(org.getId());

            return new OrganizationSummaryDto(
                    org.getId(),
                    org.getName(),
                    org.getSlug(),
                    org.getDescription(),
                    role,
                    memberCount,
                    teamCount,
                    projectCount,
                    org.getCreatedAt()
            );
        }).toList();
    }

    @Transactional(readOnly = true)
    public OrganizationDetailDto getOrganizationById(UUID id, UserPrincipal currentUser) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", id));

        OrgMemberRole userRole = checkMembershipOrAdmin(org.getId(), currentUser);
        return toDetailDto(org, userRole);
    }

    public OrganizationDetailDto updateOrganization(UUID id, UpdateOrganizationRequest request, UserPrincipal currentUser) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", id));

        OrgMemberRole userRole = checkMembershipOrAdmin(org.getId(), currentUser);
        if (!isPlatformAdmin(currentUser) && userRole != OrgMemberRole.OWNER && userRole != OrgMemberRole.ADMIN) {
            throw new AccessDeniedException("Only organization owners or administrators can modify organization settings.");
        }

        org.setName(request.name().trim());
        org.setDescription(request.description());
        Organization updated = organizationRepository.save(org);

        return toDetailDto(updated, userRole);
    }

    public void deleteOrganization(UUID id, UserPrincipal currentUser) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", id));

        OrgMemberRole userRole = checkMembershipOrAdmin(org.getId(), currentUser);
        if (!isPlatformAdmin(currentUser) && userRole != OrgMemberRole.OWNER) {
            throw new AccessDeniedException("Only the organization owner or a platform administrator can delete an organization.");
        }

        projectRepository.deleteAll(projectRepository.findByOrganizationIdOrderByCreatedAtDesc(id));
        List<com.sdlc.platform.team.model.Team> teams = teamRepository.findByOrganizationIdOrderByCreatedAtDesc(id);
        for (com.sdlc.platform.team.model.Team t : teams) {
            teamMemberRepository.deleteAll(teamMemberRepository.findByTeamId(t.getId()));
        }
        teamRepository.deleteAll(teams);
        organizationMemberRepository.deleteAll(organizationMemberRepository.findByOrganizationId(id));

        organizationRepository.delete(org);
        organizationRepository.flush();
    }

    public OrgMemberDto addMember(UUID orgId, AddOrgMemberRequest request, UserPrincipal currentUser) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        OrgMemberRole currentRole = checkMembershipOrAdmin(orgId, currentUser);
        if (!isPlatformAdmin(currentUser) && currentRole != OrgMemberRole.OWNER && currentRole != OrgMemberRole.ADMIN) {
            throw new AccessDeniedException("Only organization owners or administrators can add members.");
        }

        String search = request.usernameOrEmail().trim();
        User targetUser = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(search, search)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username or email: " + search));

        if (organizationMemberRepository.existsByOrganizationIdAndUserId(orgId, targetUser.getId())) {
            throw new DuplicateResourceException("User is already a member of this organization.");
        }

        OrgMemberRole assignedRole = request.role() != null ? request.role() : OrgMemberRole.MEMBER;
        OrganizationMember newMember = new OrganizationMember(org, targetUser, assignedRole);
        OrganizationMember saved = organizationMemberRepository.save(newMember);

        return toOrgMemberDto(saved);
    }

    public void removeMember(UUID orgId, UUID targetUserId, UserPrincipal currentUser) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        OrganizationMember targetMember = organizationMemberRepository
                .findByOrganizationIdAndUserId(orgId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in organization."));

        boolean isSelf = currentUser.getId().equals(targetUserId);
        OrgMemberRole currentRole = checkMembershipOrAdmin(orgId, currentUser);

        if (!isSelf && !isPlatformAdmin(currentUser) && currentRole != OrgMemberRole.OWNER && currentRole != OrgMemberRole.ADMIN) {
            throw new AccessDeniedException("You do not have permission to remove members from this organization.");
        }

        if (targetMember.getRole() == OrgMemberRole.OWNER) {
            long ownerCount = organizationMemberRepository.findByOrganizationId(orgId).stream()
                    .filter(m -> m.getRole() == OrgMemberRole.OWNER)
                    .count();
            if (ownerCount <= 1) {
                throw new DuplicateResourceException("Cannot remove the only owner of an organization.");
            }
        }

        organizationMemberRepository.delete(targetMember);
    }

    @Transactional(readOnly = true)
    public OrgMemberRole checkMembershipOrAdmin(UUID orgId, UserPrincipal currentUser) {
        Optional<OrganizationMember> memberOpt = organizationMemberRepository
                .findByOrganizationIdAndUserId(orgId, currentUser.getId());

        if (memberOpt.isPresent()) {
            return memberOpt.get().getRole();
        }

        if (isPlatformAdmin(currentUser)) {
            return OrgMemberRole.ADMIN;
        }

        throw new AccessDeniedException("You are not a member of this organization.");
    }

    private boolean isPlatformAdmin(UserPrincipal user) {
        return user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private OrganizationDetailDto toDetailDto(Organization org, OrgMemberRole currentUserRole) {
        List<OrgMemberDto> members = organizationMemberRepository.findByOrganizationId(org.getId()).stream()
                .map(this::toOrgMemberDto)
                .toList();

        long teamCount = teamRepository.countByOrganizationId(org.getId());
        long projectCount = projectRepository.countByOrganizationId(org.getId());

        return new OrganizationDetailDto(
                org.getId(),
                org.getName(),
                org.getSlug(),
                org.getDescription(),
                currentUserRole,
                members,
                teamCount,
                projectCount,
                org.getCreatedAt(),
                org.getUpdatedAt()
        );
    }

    private OrgMemberDto toOrgMemberDto(OrganizationMember member) {
        return new OrgMemberDto(
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
