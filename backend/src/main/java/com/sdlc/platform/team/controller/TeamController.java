package com.sdlc.platform.team.controller;

import com.sdlc.platform.common.ApiResponse;
import com.sdlc.platform.security.UserPrincipal;
import com.sdlc.platform.team.dto.AddTeamMemberRequest;
import com.sdlc.platform.team.dto.TeamDetailDto;
import com.sdlc.platform.team.dto.TeamMemberDto;
import com.sdlc.platform.team.dto.UpdateTeamRequest;
import com.sdlc.platform.team.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamDetailDto>> getTeamById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TeamDetailDto team = teamService.getTeamById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(team));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamDetailDto>> updateTeam(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTeamRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TeamDetailDto team = teamService.updateTeam(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Team updated successfully", team));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        teamService.deleteTeam(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Team deleted successfully", null));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<TeamMemberDto>> addMember(
            @PathVariable UUID id,
            @Valid @RequestBody AddTeamMemberRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TeamMemberDto member = teamService.addTeamMember(id, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Team member added successfully", member));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        teamService.removeTeamMember(id, userId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Team member removed successfully", null));
    }
}
