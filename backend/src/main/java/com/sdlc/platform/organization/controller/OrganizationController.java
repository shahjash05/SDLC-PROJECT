package com.sdlc.platform.organization.controller;

import com.sdlc.platform.common.ApiResponse;
import com.sdlc.platform.organization.dto.*;
import com.sdlc.platform.organization.service.OrganizationService;
import com.sdlc.platform.project.dto.CreateProjectRequest;
import com.sdlc.platform.project.dto.ProjectDetailDto;
import com.sdlc.platform.project.dto.ProjectSummaryDto;
import com.sdlc.platform.project.service.ProjectService;
import com.sdlc.platform.security.UserPrincipal;
import com.sdlc.platform.team.dto.CreateTeamRequest;
import com.sdlc.platform.team.dto.TeamDetailDto;
import com.sdlc.platform.team.dto.TeamSummaryDto;
import com.sdlc.platform.team.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final TeamService teamService;
    private final ProjectService projectService;

    public OrganizationController(
            OrganizationService organizationService,
            TeamService teamService,
            ProjectService projectService
    ) {
        this.organizationService = organizationService;
        this.teamService = teamService;
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrganizationDetailDto>> createOrganization(
            @Valid @RequestBody CreateOrganizationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        OrganizationDetailDto org = organizationService.createOrganization(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Organization created successfully", org));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrganizationSummaryDto>>> getUserOrganizations(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<OrganizationSummaryDto> orgs = organizationService.getUserOrganizations(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(orgs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrganizationDetailDto>> getOrganizationById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        OrganizationDetailDto org = organizationService.getOrganizationById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(org));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OrganizationDetailDto>> updateOrganization(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrganizationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        OrganizationDetailDto org = organizationService.updateOrganization(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Organization updated successfully", org));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOrganization(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        organizationService.deleteOrganization(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Organization deleted successfully", null));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<OrgMemberDto>> addMember(
            @PathVariable UUID id,
            @Valid @RequestBody AddOrgMemberRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        OrgMemberDto member = organizationService.addMember(id, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Member added successfully", member));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        organizationService.removeMember(id, userId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Member removed successfully", null));
    }

    // --- Organization Teams Sub-resource ---

    @PostMapping("/{orgId}/teams")
    public ResponseEntity<ApiResponse<TeamDetailDto>> createTeam(
            @PathVariable UUID orgId,
            @Valid @RequestBody CreateTeamRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TeamDetailDto team = teamService.createTeam(orgId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Team created successfully", team));
    }

    @GetMapping("/{orgId}/teams")
    public ResponseEntity<ApiResponse<List<TeamSummaryDto>>> getTeamsForOrganization(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<TeamSummaryDto> teams = teamService.getTeamsForOrganization(orgId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(teams));
    }

    // --- Organization Projects Sub-resource ---

    @PostMapping("/{orgId}/projects")
    public ResponseEntity<ApiResponse<ProjectDetailDto>> createProject(
            @PathVariable UUID orgId,
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ProjectDetailDto project = projectService.createProject(orgId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Project created successfully", project));
    }

    @GetMapping("/{orgId}/projects")
    public ResponseEntity<ApiResponse<List<ProjectSummaryDto>>> getProjectsForOrganization(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<ProjectSummaryDto> projects = projectService.getProjectsForOrganization(orgId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(projects));
    }
}
