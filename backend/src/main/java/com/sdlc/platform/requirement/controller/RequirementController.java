package com.sdlc.platform.requirement.controller;

import com.sdlc.platform.common.ApiResponse;
import com.sdlc.platform.requirement.dto.*;
import com.sdlc.platform.requirement.model.StoryStatus;
import com.sdlc.platform.requirement.service.RequirementService;
import com.sdlc.platform.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class RequirementController {

    private final RequirementService requirementService;

    public RequirementController(RequirementService requirementService) {
        this.requirementService = requirementService;
    }

    // --- User Story Endpoints ---

    @PostMapping("/projects/{projectId}/stories")
    public ResponseEntity<ApiResponse<StoryDetailDto>> createStory(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateStoryRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StoryDetailDto story = requirementService.createStory(projectId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("User story created successfully", story));
    }

    @GetMapping("/projects/{projectId}/stories")
    public ResponseEntity<ApiResponse<List<StorySummaryDto>>> getStoriesForProject(
            @PathVariable UUID projectId,
            @RequestParam(required = false) UUID sprintId,
            @RequestParam(required = false) Boolean backlogOnly,
            @RequestParam(required = false) StoryStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<StorySummaryDto> stories = requirementService.getStoriesForProject(projectId, sprintId, backlogOnly, status, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(stories));
    }

    @GetMapping("/stories/{id}")
    public ResponseEntity<ApiResponse<StoryDetailDto>> getStoryById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StoryDetailDto story = requirementService.getStoryById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(story));
    }

    @PutMapping("/stories/{id}")
    public ResponseEntity<ApiResponse<StoryDetailDto>> updateStory(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStoryRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StoryDetailDto story = requirementService.updateStory(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("User story updated successfully", story));
    }

    @PatchMapping("/stories/{id}/status")
    public ResponseEntity<ApiResponse<StorySummaryDto>> updateStoryStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStoryStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StorySummaryDto story = requirementService.updateStoryStatus(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully", story));
    }

    @DeleteMapping("/stories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStory(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        requirementService.deleteStory(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("User story deleted successfully", null));
    }

    // --- Task Sub-item Endpoints ---

    @PostMapping("/stories/{storyId}/tasks")
    public ResponseEntity<ApiResponse<TaskDto>> createTask(
            @PathVariable UUID storyId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TaskDto task = requirementService.createTask(storyId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Task created successfully", task));
    }

    @GetMapping("/stories/{storyId}/tasks")
    public ResponseEntity<ApiResponse<List<TaskDto>>> getTasksForStory(
            @PathVariable UUID storyId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<TaskDto> tasks = requirementService.getTasksForStory(storyId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<ApiResponse<TaskDto>> updateTask(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TaskDto task = requirementService.updateTask(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Task updated successfully", task));
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        requirementService.deleteTask(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Task deleted successfully", null));
    }
}
