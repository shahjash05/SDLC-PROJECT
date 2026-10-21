package com.sdlc.platform.testing.controller;

import com.sdlc.platform.common.ApiResponse;
import com.sdlc.platform.security.UserPrincipal;
import com.sdlc.platform.testing.dto.*;
import com.sdlc.platform.testing.model.DefectSeverity;
import com.sdlc.platform.testing.model.DefectStatus;
import com.sdlc.platform.testing.model.TestCaseStatus;
import com.sdlc.platform.testing.model.TestPriority;
import com.sdlc.platform.testing.service.TestingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class TestingController {

    private final TestingService testingService;

    public TestingController(TestingService testingService) {
        this.testingService = testingService;
    }

    // =========================================================
    // Test Suite Endpoints
    // =========================================================

    @PostMapping("/projects/{projectId}/test-suites")
    public ResponseEntity<ApiResponse<TestSuiteDto>> createTestSuite(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTestSuiteRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TestSuiteDto suite = testingService.createTestSuite(projectId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Test suite created successfully", suite));
    }

    @GetMapping("/projects/{projectId}/test-suites")
    public ResponseEntity<ApiResponse<List<TestSuiteDto>>> getTestSuitesForProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<TestSuiteDto> suites = testingService.getTestSuitesForProject(projectId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(suites));
    }

    @GetMapping("/test-suites/{id}")
    public ResponseEntity<ApiResponse<TestSuiteDto>> getTestSuiteById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TestSuiteDto suite = testingService.getTestSuiteById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(suite));
    }

    @PutMapping("/test-suites/{id}")
    public ResponseEntity<ApiResponse<TestSuiteDto>> updateTestSuite(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTestSuiteRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TestSuiteDto suite = testingService.updateTestSuite(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Test suite updated successfully", suite));
    }

    @DeleteMapping("/test-suites/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTestSuite(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        testingService.deleteTestSuite(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Test suite deleted successfully", null));
    }

    // =========================================================
    // Test Case Endpoints
    // =========================================================

    @PostMapping("/projects/{projectId}/test-cases")
    public ResponseEntity<ApiResponse<TestCaseDetailDto>> createTestCase(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTestCaseRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TestCaseDetailDto testCase = testingService.createTestCase(projectId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Test case created successfully", testCase));
    }

    @GetMapping("/projects/{projectId}/test-cases")
    public ResponseEntity<ApiResponse<List<TestCaseSummaryDto>>> getTestCasesForProject(
            @PathVariable UUID projectId,
            @RequestParam(required = false) UUID suiteId,
            @RequestParam(required = false) TestCaseStatus status,
            @RequestParam(required = false) TestPriority priority,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<TestCaseSummaryDto> cases = testingService.getTestCasesForProject(projectId, suiteId, status, priority, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(cases));
    }

    @GetMapping("/test-cases/{id}")
    public ResponseEntity<ApiResponse<TestCaseDetailDto>> getTestCaseById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TestCaseDetailDto testCase = testingService.getTestCaseById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(testCase));
    }

    @PutMapping("/test-cases/{id}")
    public ResponseEntity<ApiResponse<TestCaseDetailDto>> updateTestCase(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTestCaseRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TestCaseDetailDto testCase = testingService.updateTestCase(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Test case updated successfully", testCase));
    }

    @PatchMapping("/test-cases/{id}/status")
    public ResponseEntity<ApiResponse<TestCaseSummaryDto>> updateTestCaseStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTestCaseStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TestCaseSummaryDto summary = testingService.updateTestCaseStatus(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Test case status updated successfully", summary));
    }

    @PatchMapping("/test-cases/{id}/link")
    public ResponseEntity<ApiResponse<TestCaseDetailDto>> linkTestCase(
            @PathVariable UUID id,
            @RequestBody LinkTestCaseRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TestCaseDetailDto testCase = testingService.linkTestCase(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Test case requirement links updated successfully", testCase));
    }

    @DeleteMapping("/test-cases/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTestCase(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        testingService.deleteTestCase(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Test case deleted successfully", null));
    }

    // =========================================================
    // Test Execution Endpoints
    // =========================================================

    @PostMapping("/test-cases/{id}/executions")
    public ResponseEntity<ApiResponse<TestExecutionDto>> executeTestCase(
            @PathVariable UUID id,
            @Valid @RequestBody ExecuteTestCaseRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        TestExecutionDto execution = testingService.executeTestCase(id, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Test execution recorded successfully", execution));
    }

    @GetMapping("/test-cases/{id}/executions")
    public ResponseEntity<ApiResponse<List<TestExecutionDto>>> getExecutionHistoryForTestCase(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<TestExecutionDto> history = testingService.getExecutionHistoryForTestCase(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @GetMapping("/projects/{projectId}/test-execution-summary")
    public ResponseEntity<ApiResponse<ProjectExecutionSummaryDto>> getProjectExecutionSummary(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ProjectExecutionSummaryDto summary = testingService.getProjectExecutionSummary(projectId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/projects/{projectId}/test-executions")
    public ResponseEntity<ApiResponse<List<TestExecutionDto>>> getProjectExecutions(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<TestExecutionDto> executions = testingService.getProjectExecutions(projectId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(executions));
    }

    // =========================================================
    // Defect Tracking & Bug Management Endpoints (Step 3)
    // =========================================================

    @PostMapping("/projects/{projectId}/defects")
    public ResponseEntity<ApiResponse<DefectDetailDto>> createDefect(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateDefectRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DefectDetailDto defect = testingService.createDefect(projectId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Defect created successfully", defect));
    }

    @GetMapping("/projects/{projectId}/defects")
    public ResponseEntity<ApiResponse<List<DefectSummaryDto>>> getDefectsForProject(
            @PathVariable UUID projectId,
            @RequestParam(required = false) DefectStatus status,
            @RequestParam(required = false) DefectSeverity severity,
            @RequestParam(required = false) TestPriority priority,
            @RequestParam(required = false) UUID assigneeId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<DefectSummaryDto> defects = testingService.getDefectsForProject(projectId, status, severity, priority, assigneeId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(defects));
    }

    @GetMapping("/projects/{projectId}/defect-summary")
    public ResponseEntity<ApiResponse<ProjectDefectSummaryDto>> getProjectDefectSummary(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ProjectDefectSummaryDto summary = testingService.getProjectDefectSummary(projectId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/defects/{id}")
    public ResponseEntity<ApiResponse<DefectDetailDto>> getDefectById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DefectDetailDto defect = testingService.getDefectById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(defect));
    }

    @GetMapping("/test-cases/{id}/defects")
    public ResponseEntity<ApiResponse<List<DefectSummaryDto>>> getDefectsForTestCase(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<DefectSummaryDto> defects = testingService.getDefectsForTestCase(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(defects));
    }

    @PutMapping("/defects/{id}")
    public ResponseEntity<ApiResponse<DefectDetailDto>> updateDefect(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDefectRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DefectDetailDto defect = testingService.updateDefect(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Defect updated successfully", defect));
    }

    @PatchMapping("/defects/{id}/assign")
    public ResponseEntity<ApiResponse<DefectDetailDto>> assignDefect(
            @PathVariable UUID id,
            @RequestBody AssignDefectRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DefectDetailDto defect = testingService.assignDefect(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Defect assigned successfully", defect));
    }

    @PatchMapping("/defects/{id}/status")
    public ResponseEntity<ApiResponse<DefectDetailDto>> updateDefectStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDefectStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DefectDetailDto defect = testingService.updateDefectStatus(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Defect status updated successfully", defect));
    }

    @DeleteMapping("/defects/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDefect(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        testingService.deleteDefect(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Defect deleted successfully", null));
    }

    // =========================================================
    // Traceability Matrix Endpoints
    // =========================================================

    @GetMapping("/projects/{projectId}/traceability")
    public ResponseEntity<ApiResponse<ProjectTraceabilityMatrixDto>> getProjectTraceabilityMatrix(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ProjectTraceabilityMatrixDto matrix = testingService.getProjectTraceabilityMatrix(projectId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(matrix));
    }
}
