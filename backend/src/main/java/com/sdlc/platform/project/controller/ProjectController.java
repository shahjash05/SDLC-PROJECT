package com.sdlc.platform.project.controller;

import com.sdlc.platform.common.ApiResponse;
import com.sdlc.platform.project.dto.ProjectDetailDto;
import com.sdlc.platform.project.dto.ProjectSummaryDto;
import com.sdlc.platform.project.dto.UpdateProjectRequest;
import com.sdlc.platform.project.service.ProjectService;
import com.sdlc.platform.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectSummaryDto>>> getAllAccessibleProjects(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<ProjectSummaryDto> projects = projectService.getAllAccessibleProjects(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(projects));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDetailDto>> getProjectById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ProjectDetailDto project = projectService.getProjectById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(project));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDetailDto>> updateProject(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ProjectDetailDto project = projectService.updateProject(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Project updated successfully", project));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        projectService.deleteProject(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Project deleted successfully", null));
    }
}
