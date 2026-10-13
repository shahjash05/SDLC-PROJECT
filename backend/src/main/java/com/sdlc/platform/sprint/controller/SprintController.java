package com.sdlc.platform.sprint.controller;

import com.sdlc.platform.common.ApiResponse;
import com.sdlc.platform.security.UserPrincipal;
import com.sdlc.platform.sprint.dto.CreateSprintRequest;
import com.sdlc.platform.sprint.dto.SprintDetailDto;
import com.sdlc.platform.sprint.dto.SprintSummaryDto;
import com.sdlc.platform.sprint.dto.UpdateSprintRequest;
import com.sdlc.platform.sprint.service.SprintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class SprintController {

    private final SprintService sprintService;

    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    @PostMapping("/projects/{projectId}/sprints")
    public ResponseEntity<ApiResponse<SprintDetailDto>> createSprint(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateSprintRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        SprintDetailDto sprint = sprintService.createSprint(projectId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Sprint created successfully", sprint));
    }

    @GetMapping("/projects/{projectId}/sprints")
    public ResponseEntity<ApiResponse<List<SprintSummaryDto>>> getSprintsForProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<SprintSummaryDto> sprints = sprintService.getSprintsForProject(projectId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(sprints));
    }

    @GetMapping("/sprints/{id}")
    public ResponseEntity<ApiResponse<SprintDetailDto>> getSprintById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        SprintDetailDto sprint = sprintService.getSprintById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(sprint));
    }

    @PutMapping("/sprints/{id}")
    public ResponseEntity<ApiResponse<SprintDetailDto>> updateSprint(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSprintRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        SprintDetailDto sprint = sprintService.updateSprint(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Sprint updated successfully", sprint));
    }

    @DeleteMapping("/sprints/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSprint(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        sprintService.deleteSprint(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Sprint deleted successfully", null));
    }
}
