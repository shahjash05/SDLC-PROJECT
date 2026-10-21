package com.sdlc.platform.testing.service;

import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.common.DuplicateResourceException;
import com.sdlc.platform.common.ResourceNotFoundException;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.model.OrganizationMember;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.service.OrganizationService;
import com.sdlc.platform.project.model.Project;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.security.UserPrincipal;
import com.sdlc.platform.testing.dto.*;
import com.sdlc.platform.testing.model.ReadinessStatus;
import com.sdlc.platform.testing.model.TestCase;
import com.sdlc.platform.testing.model.TestCaseStatus;
import com.sdlc.platform.testing.model.TestPriority;
import com.sdlc.platform.testing.model.TestSuite;
import com.sdlc.platform.testing.model.TestExecution;
import com.sdlc.platform.testing.model.TestExecutionStatus;
import com.sdlc.platform.testing.repository.TestCaseRepository;
import com.sdlc.platform.testing.repository.TestExecutionRepository;
import com.sdlc.platform.testing.repository.TestSuiteRepository;
import com.sdlc.platform.testing.model.Defect;
import com.sdlc.platform.document.model.Document;
import com.sdlc.platform.document.model.DocumentType;
import com.sdlc.platform.document.repository.DocumentRepository;
import com.sdlc.platform.requirement.model.UserStory;
import com.sdlc.platform.requirement.repository.UserStoryRepository;
import com.sdlc.platform.testing.model.DefectSeverity;
import com.sdlc.platform.testing.model.DefectStatus;
import com.sdlc.platform.testing.repository.DefectRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class TestingService {

    private final TestSuiteRepository testSuiteRepository;
    private final TestCaseRepository testCaseRepository;
    private final TestExecutionRepository testExecutionRepository;
    private final DefectRepository defectRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final UserStoryRepository userStoryRepository;
    private final DocumentRepository documentRepository;

    public TestingService(
            TestSuiteRepository testSuiteRepository,
            TestCaseRepository testCaseRepository,
            TestExecutionRepository testExecutionRepository,
            DefectRepository defectRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            OrganizationService organizationService,
            OrganizationMemberRepository organizationMemberRepository,
            UserStoryRepository userStoryRepository,
            DocumentRepository documentRepository
    ) {
        this.testSuiteRepository = testSuiteRepository;
        this.testCaseRepository = testCaseRepository;
        this.testExecutionRepository = testExecutionRepository;
        this.defectRepository = defectRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.organizationService = organizationService;
        this.organizationMemberRepository = organizationMemberRepository;
        this.userStoryRepository = userStoryRepository;
        this.documentRepository = documentRepository;
    }

    // =========================================================
    // Test Suite Operations
    // =========================================================

    public TestSuiteDto createTestSuite(UUID projectId, CreateTestSuiteRequest request, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        String suiteName = request.name().trim();
        if (testSuiteRepository.existsByProjectIdAndNameIgnoreCase(projectId, suiteName)) {
            throw new DuplicateResourceException("Test suite with name '" + suiteName + "' already exists in this project.");
        }

        User author = userRepository.findById(currentUser.getId()).orElse(null);
        TestSuite suite = new TestSuite(project, suiteName, request.description(), author);
        TestSuite saved = testSuiteRepository.save(suite);

        return toTestSuiteDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TestSuiteDto> getTestSuitesForProject(UUID projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        return testSuiteRepository.findByProjectIdOrderByCreatedAtAsc(projectId).stream()
                .map(this::toTestSuiteDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public TestSuiteDto getTestSuiteById(UUID suiteId, UserPrincipal currentUser) {
        TestSuite suite = testSuiteRepository.findById(suiteId)
                .orElseThrow(() -> new ResourceNotFoundException("TestSuite", "id", suiteId));

        organizationService.checkMembershipOrAdmin(suite.getProject().getOrganization().getId(), currentUser);
        return toTestSuiteDto(suite);
    }

    public TestSuiteDto updateTestSuite(UUID suiteId, UpdateTestSuiteRequest request, UserPrincipal currentUser) {
        TestSuite suite = testSuiteRepository.findById(suiteId)
                .orElseThrow(() -> new ResourceNotFoundException("TestSuite", "id", suiteId));

        organizationService.checkMembershipOrAdmin(suite.getProject().getOrganization().getId(), currentUser);

        String newName = request.name().trim();
        if (!suite.getName().equalsIgnoreCase(newName)
                && testSuiteRepository.existsByProjectIdAndNameIgnoreCase(suite.getProject().getId(), newName)) {
            throw new DuplicateResourceException("Test suite with name '" + newName + "' already exists in this project.");
        }

        suite.setName(newName);
        suite.setDescription(request.description());
        TestSuite updated = testSuiteRepository.save(suite);

        return toTestSuiteDto(updated);
    }

    public void deleteTestSuite(UUID suiteId, UserPrincipal currentUser) {
        TestSuite suite = testSuiteRepository.findById(suiteId)
                .orElseThrow(() -> new ResourceNotFoundException("TestSuite", "id", suiteId));

        checkDeletePermission(suite.getProject(), suite.getCreatedBy(), currentUser, "test suite");

        // Disassociate any test cases in this suite
        List<TestCase> cases = testCaseRepository.findByProjectIdAndSuiteIdOrderByCaseNumberAsc(suite.getProject().getId(), suiteId);
        for (TestCase tc : cases) {
            tc.setSuite(null);
        }
        testCaseRepository.saveAll(cases);

        testSuiteRepository.delete(suite);
    }

    // =========================================================
    // Test Case Operations
    // =========================================================

    public TestCaseDetailDto createTestCase(UUID projectId, CreateTestCaseRequest request, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        TestSuite suite = null;
        if (request.suiteId() != null) {
            suite = testSuiteRepository.findById(request.suiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("TestSuite", "id", request.suiteId()));
            if (!suite.getProject().getId().equals(projectId)) {
                throw new DuplicateResourceException("Assigned test suite must belong to the same project.");
            }
        }

        UserStory userStory = null;
        if (request.userStoryId() != null) {
            userStory = userStoryRepository.findById(request.userStoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("UserStory", "id", request.userStoryId()));
            if (!userStory.getProject().getId().equals(projectId)) {
                throw new DuplicateResourceException("Linked user story must belong to the same project.");
            }
        }

        Document requirement = null;
        if (request.requirementId() != null) {
            requirement = documentRepository.findById(request.requirementId())
                    .orElseThrow(() -> new ResourceNotFoundException("Document", "id", request.requirementId()));
            if (!requirement.getProject().getId().equals(projectId)) {
                throw new DuplicateResourceException("Linked requirement document must belong to the same project.");
            }
        }

        int nextCaseNumber = testCaseRepository.findMaxCaseNumberByProjectId(projectId) + 1;
        User author = userRepository.findById(currentUser.getId()).orElse(null);

        TestCase testCase = new TestCase(
                project,
                suite,
                nextCaseNumber,
                request.title().trim(),
                request.description(),
                request.preconditions(),
                request.testSteps(),
                request.expectedResult(),
                request.priority(),
                request.status(),
                author
        );
        testCase.setUserStory(userStory);
        testCase.setRequirement(requirement);

        TestCase saved = testCaseRepository.save(testCase);
        return toDetailDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TestCaseSummaryDto> getTestCasesForProject(
            UUID projectId,
            UUID suiteId,
            TestCaseStatus status,
            TestPriority priority,
            UserPrincipal currentUser
    ) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        List<TestCase> cases;
        if (suiteId != null) {
            cases = testCaseRepository.findByProjectIdAndSuiteIdOrderByCaseNumberAsc(projectId, suiteId);
        } else if (status != null) {
            cases = testCaseRepository.findByProjectIdAndStatusOrderByCaseNumberAsc(projectId, status);
        } else if (priority != null) {
            cases = testCaseRepository.findByProjectIdAndPriorityOrderByCaseNumberAsc(projectId, priority);
        } else {
            cases = testCaseRepository.findByProjectIdOrderByCaseNumberAsc(projectId);
        }

        return cases.stream().map(this::toSummaryDto).toList();
    }

    @Transactional(readOnly = true)
    public TestCaseDetailDto getTestCaseById(UUID caseId, UserPrincipal currentUser) {
        TestCase testCase = testCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", "id", caseId));

        organizationService.checkMembershipOrAdmin(testCase.getProject().getOrganization().getId(), currentUser);
        return toDetailDto(testCase);
    }

    public TestCaseDetailDto updateTestCase(UUID caseId, UpdateTestCaseRequest request, UserPrincipal currentUser) {
        TestCase testCase = testCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", "id", caseId));

        organizationService.checkMembershipOrAdmin(testCase.getProject().getOrganization().getId(), currentUser);

        TestSuite suite = null;
        if (request.suiteId() != null) {
            suite = testSuiteRepository.findById(request.suiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("TestSuite", "id", request.suiteId()));
            if (!suite.getProject().getId().equals(testCase.getProject().getId())) {
                throw new DuplicateResourceException("Assigned test suite must belong to the same project.");
            }
        }

        if (request.userStoryId() != null) {
            UserStory userStory = userStoryRepository.findById(request.userStoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("UserStory", "id", request.userStoryId()));
            if (!userStory.getProject().getId().equals(testCase.getProject().getId())) {
                throw new DuplicateResourceException("Linked user story must belong to the same project.");
            }
            testCase.setUserStory(userStory);
        } else {
            testCase.setUserStory(null);
        }

        if (request.requirementId() != null) {
            Document requirement = documentRepository.findById(request.requirementId())
                    .orElseThrow(() -> new ResourceNotFoundException("Document", "id", request.requirementId()));
            if (!requirement.getProject().getId().equals(testCase.getProject().getId())) {
                throw new DuplicateResourceException("Linked requirement document must belong to the same project.");
            }
            testCase.setRequirement(requirement);
        } else {
            testCase.setRequirement(null);
        }

        testCase.setTitle(request.title().trim());
        testCase.setDescription(request.description());
        testCase.setPreconditions(request.preconditions());
        testCase.setTestSteps(request.testSteps());
        testCase.setExpectedResult(request.expectedResult());
        if (request.priority() != null) {
            testCase.setPriority(request.priority());
        }
        if (request.status() != null) {
            testCase.setStatus(request.status());
        }
        testCase.setSuite(suite);

        TestCase updated = testCaseRepository.save(testCase);
        return toDetailDto(updated);
    }

    public TestCaseDetailDto linkTestCase(UUID caseId, LinkTestCaseRequest request, UserPrincipal currentUser) {
        TestCase testCase = testCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", "id", caseId));

        organizationService.checkMembershipOrAdmin(testCase.getProject().getOrganization().getId(), currentUser);

        if (request.userStoryId() != null) {
            UserStory userStory = userStoryRepository.findById(request.userStoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("UserStory", "id", request.userStoryId()));
            if (!userStory.getProject().getId().equals(testCase.getProject().getId())) {
                throw new DuplicateResourceException("Linked user story must belong to the same project.");
            }
            testCase.setUserStory(userStory);
        } else {
            testCase.setUserStory(null);
        }

        if (request.requirementId() != null) {
            Document requirement = documentRepository.findById(request.requirementId())
                    .orElseThrow(() -> new ResourceNotFoundException("Document", "id", request.requirementId()));
            if (!requirement.getProject().getId().equals(testCase.getProject().getId())) {
                throw new DuplicateResourceException("Linked requirement document must belong to the same project.");
            }
            testCase.setRequirement(requirement);
        } else {
            testCase.setRequirement(null);
        }

        TestCase saved = testCaseRepository.save(testCase);
        return toDetailDto(saved);
    }

    public TestCaseSummaryDto updateTestCaseStatus(UUID caseId, UpdateTestCaseStatusRequest request, UserPrincipal currentUser) {
        TestCase testCase = testCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", "id", caseId));

        organizationService.checkMembershipOrAdmin(testCase.getProject().getOrganization().getId(), currentUser);

        testCase.setStatus(request.status());
        TestCase updated = testCaseRepository.save(testCase);
        return toSummaryDto(updated);
    }

    public void deleteTestCase(UUID caseId, UserPrincipal currentUser) {
        TestCase testCase = testCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", "id", caseId));

        checkDeletePermission(testCase.getProject(), testCase.getCreatedBy(), currentUser, "test case");
        testCaseRepository.delete(testCase);
    }

    // =========================================================
    // Test Execution Operations
    // =========================================================

    public TestExecutionDto executeTestCase(UUID caseId, ExecuteTestCaseRequest request, UserPrincipal currentUser) {
        TestCase testCase = testCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", "id", caseId));

        organizationService.checkMembershipOrAdmin(testCase.getProject().getOrganization().getId(), currentUser);

        User executor = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        String actualResult = request.actualResult() != null ? request.actualResult().trim() : "";
        if (actualResult.isEmpty()) {
            throw new IllegalArgumentException("Actual result cannot be empty.");
        }

        TestExecution execution = new TestExecution(
                testCase,
                testCase.getProject(),
                request.status(),
                actualResult,
                request.notes() != null && !request.notes().trim().isEmpty() ? request.notes().trim() : null,
                request.durationMs(),
                executor
        );

        TestExecution savedExecution = testExecutionRepository.save(execution);

        // Update TestCase status to match execution result
        TestCaseStatus newStatus = switch (request.status()) {
            case PASSED -> TestCaseStatus.PASSED;
            case FAILED -> TestCaseStatus.FAILED;
            case BLOCKED -> TestCaseStatus.BLOCKED;
            case SKIPPED -> TestCaseStatus.SKIPPED;
        };
        testCase.setStatus(newStatus);
        testCaseRepository.save(testCase);

        return toTestExecutionDto(savedExecution);
    }

    @Transactional(readOnly = true)
    public List<TestExecutionDto> getExecutionHistoryForTestCase(UUID caseId, UserPrincipal currentUser) {
        TestCase testCase = testCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", "id", caseId));

        organizationService.checkMembershipOrAdmin(testCase.getProject().getOrganization().getId(), currentUser);

        return testExecutionRepository.findByTestCaseIdOrderByExecutedAtDesc(caseId).stream()
                .map(this::toTestExecutionDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectExecutionSummaryDto getProjectExecutionSummary(UUID projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        long total = testExecutionRepository.countByProjectId(projectId);
        long passed = testExecutionRepository.countByProjectIdAndStatus(projectId, TestExecutionStatus.PASSED);
        long failed = testExecutionRepository.countByProjectIdAndStatus(projectId, TestExecutionStatus.FAILED);
        long blocked = testExecutionRepository.countByProjectIdAndStatus(projectId, TestExecutionStatus.BLOCKED);
        long skipped = testExecutionRepository.countByProjectIdAndStatus(projectId, TestExecutionStatus.SKIPPED);

        double passRate = total > 0 ? Math.round(((double) passed / total * 100.0) * 10.0) / 10.0 : 0.0;

        List<TestExecutionDto> recent = testExecutionRepository
                .findByProjectIdOrderByExecutedAtDesc(projectId, PageRequest.of(0, 10))
                .stream()
                .map(this::toTestExecutionDto)
                .toList();

        return new ProjectExecutionSummaryDto(
                projectId,
                total,
                passed,
                failed,
                blocked,
                skipped,
                passRate,
                recent
        );
    }

    @Transactional(readOnly = true)
    public List<TestExecutionDto> getProjectExecutions(UUID projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        return testExecutionRepository.findByProjectIdOrderByExecutedAtDesc(projectId).stream()
                .map(this::toTestExecutionDto)
                .toList();
    }

    // =========================================================
    // Permission & DTO Mapping Helpers
    // =========================================================

    private void checkDeletePermission(Project project, User createdBy, UserPrincipal currentUser, String resourceName) {
        boolean isSystemAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isSystemAdmin) {
            return;
        }

        OrgMemberRole orgRole = organizationMemberRepository
                .findByOrganizationIdAndUserId(project.getOrganization().getId(), currentUser.getId())
                .map(OrganizationMember::getRole)
                .orElse(null);

        if (orgRole == OrgMemberRole.OWNER || orgRole == OrgMemberRole.ADMIN) {
            return;
        }

        if (createdBy != null && createdBy.getId().equals(currentUser.getId())) {
            return;
        }

        if (project.getTeam() != null && project.getTeam().getLeader() != null
                && project.getTeam().getLeader().getId().equals(currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You do not have permission to delete this " + resourceName + ".");
    }

    private TestSuiteDto toTestSuiteDto(TestSuite suite) {
        long count = testCaseRepository.countBySuiteId(suite.getId());
        return new TestSuiteDto(
                suite.getId(),
                suite.getProject().getId(),
                suite.getName(),
                suite.getDescription(),
                count,
                suite.getCreatedBy() != null ? suite.getCreatedBy().getUsername() : null,
                suite.getCreatedAt(),
                suite.getUpdatedAt()
        );
    }

    private TestCaseSummaryDto toSummaryDto(TestCase tc) {
        String caseKey = tc.getProject().getProjectKey() + "-TC-" + tc.getCaseNumber();
        UUID userStoryId = tc.getUserStory() != null ? tc.getUserStory().getId() : null;
        String userStoryKey = tc.getUserStory() != null
                ? tc.getProject().getProjectKey() + "-" + tc.getUserStory().getStoryNumber()
                : null;
        String userStoryTitle = tc.getUserStory() != null ? tc.getUserStory().getTitle() : null;
        UUID requirementId = tc.getRequirement() != null ? tc.getRequirement().getId() : null;
        String requirementTitle = tc.getRequirement() != null ? tc.getRequirement().getTitle() : null;

        return new TestCaseSummaryDto(
                tc.getId(),
                tc.getProject().getId(),
                tc.getProject().getProjectKey(),
                tc.getSuite() != null ? tc.getSuite().getId() : null,
                tc.getSuite() != null ? tc.getSuite().getName() : null,
                tc.getCaseNumber(),
                caseKey,
                tc.getTitle(),
                tc.getPriority(),
                tc.getStatus(),
                tc.getCreatedBy() != null ? tc.getCreatedBy().getUsername() : null,
                tc.getCreatedAt(),
                tc.getUpdatedAt(),
                userStoryId,
                userStoryKey,
                userStoryTitle,
                requirementId,
                requirementTitle
        );
    }

    private TestCaseDetailDto toDetailDto(TestCase tc) {
        String caseKey = tc.getProject().getProjectKey() + "-TC-" + tc.getCaseNumber();
        UUID userStoryId = tc.getUserStory() != null ? tc.getUserStory().getId() : null;
        String userStoryKey = tc.getUserStory() != null
                ? tc.getProject().getProjectKey() + "-" + tc.getUserStory().getStoryNumber()
                : null;
        String userStoryTitle = tc.getUserStory() != null ? tc.getUserStory().getTitle() : null;
        UUID requirementId = tc.getRequirement() != null ? tc.getRequirement().getId() : null;
        String requirementTitle = tc.getRequirement() != null ? tc.getRequirement().getTitle() : null;

        return new TestCaseDetailDto(
                tc.getId(),
                tc.getProject().getId(),
                tc.getProject().getName(),
                tc.getProject().getProjectKey(),
                tc.getSuite() != null ? tc.getSuite().getId() : null,
                tc.getSuite() != null ? tc.getSuite().getName() : null,
                tc.getCaseNumber(),
                caseKey,
                tc.getTitle(),
                tc.getDescription(),
                tc.getPreconditions(),
                tc.getTestSteps(),
                tc.getExpectedResult(),
                tc.getPriority(),
                tc.getStatus(),
                tc.getCreatedBy() != null ? tc.getCreatedBy().getUsername() : null,
                tc.getCreatedAt(),
                tc.getUpdatedAt(),
                userStoryId,
                userStoryKey,
                userStoryTitle,
                requirementId,
                requirementTitle
        );
    }

    private TestExecutionDto toTestExecutionDto(TestExecution te) {
        String caseKey = te.getTestCase().getProject().getProjectKey() + "-TC-" + te.getTestCase().getCaseNumber();
        return new TestExecutionDto(
                te.getId(),
                te.getTestCase().getId(),
                caseKey,
                te.getTestCase().getTitle(),
                te.getProject().getId(),
                te.getStatus(),
                te.getActualResult(),
                te.getNotes(),
                te.getDurationMs(),
                te.getExecutedBy() != null ? te.getExecutedBy().getUsername() : null,
                te.getExecutedAt()
        );
    }

    // =========================================================
    // Defect Tracking & Bug Management Operations (Step 3)
    // =========================================================

    public DefectDetailDto createDefect(UUID projectId, CreateDefectRequest request, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        TestCase testCase = null;
        if (request.testCaseId() != null) {
            testCase = testCaseRepository.findById(request.testCaseId())
                    .orElseThrow(() -> new ResourceNotFoundException("TestCase", "id", request.testCaseId()));
            if (!testCase.getProject().getId().equals(projectId)) {
                throw new DuplicateResourceException("Linked test case must belong to the same project.");
            }
        }

        TestExecution testExecution = null;
        if (request.testExecutionId() != null) {
            testExecution = testExecutionRepository.findById(request.testExecutionId())
                    .orElseThrow(() -> new ResourceNotFoundException("TestExecution", "id", request.testExecutionId()));
            if (!testExecution.getProject().getId().equals(projectId)) {
                throw new DuplicateResourceException("Linked test execution must belong to the same project.");
            }
            if (testCase == null) {
                testCase = testExecution.getTestCase();
            }
        }

        User assignee = null;
        if (request.assigneeId() != null) {
            assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.assigneeId()));
        }

        User reporter = userRepository.findById(currentUser.getId()).orElse(null);
        int nextDefectNumber = defectRepository.findMaxDefectNumberByProjectId(projectId) + 1;

        Defect defect = new Defect(
                project,
                nextDefectNumber,
                request.title().trim(),
                request.description(),
                request.stepsToReproduce(),
                request.expectedResult(),
                request.actualResult(),
                request.severity(),
                request.priority(),
                request.status(),
                testCase,
                testExecution,
                assignee,
                reporter
        );

        Defect saved = defectRepository.save(defect);
        return toDefectDetailDto(saved);
    }

    @Transactional(readOnly = true)
    public List<DefectSummaryDto> getDefectsForProject(
            UUID projectId,
            DefectStatus status,
            DefectSeverity severity,
            TestPriority priority,
            UUID assigneeId,
            UserPrincipal currentUser
    ) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        List<Defect> defects;
        if (status != null) {
            defects = defectRepository.findByProjectIdAndStatusOrderByDefectNumberDesc(projectId, status);
        } else if (severity != null) {
            defects = defectRepository.findByProjectIdAndSeverityOrderByDefectNumberDesc(projectId, severity);
        } else if (priority != null) {
            defects = defectRepository.findByProjectIdAndPriorityOrderByDefectNumberDesc(projectId, priority);
        } else {
            defects = defectRepository.findByProjectIdOrderByDefectNumberDesc(projectId);
        }

        if (assigneeId != null) {
            defects = defects.stream()
                    .filter(d -> d.getAssignee() != null && d.getAssignee().getId().equals(assigneeId))
                    .toList();
        }

        return defects.stream().map(this::toDefectSummaryDto).toList();
    }

    @Transactional(readOnly = true)
    public DefectDetailDto getDefectById(UUID defectId, UserPrincipal currentUser) {
        Defect defect = defectRepository.findById(defectId)
                .orElseThrow(() -> new ResourceNotFoundException("Defect", "id", defectId));

        organizationService.checkMembershipOrAdmin(defect.getProject().getOrganization().getId(), currentUser);
        return toDefectDetailDto(defect);
    }

    @Transactional(readOnly = true)
    public List<DefectSummaryDto> getDefectsForTestCase(UUID testCaseId, UserPrincipal currentUser) {
        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", "id", testCaseId));

        organizationService.checkMembershipOrAdmin(testCase.getProject().getOrganization().getId(), currentUser);
        return defectRepository.findByTestCaseIdOrderByDefectNumberDesc(testCaseId).stream()
                .map(this::toDefectSummaryDto)
                .toList();
    }

    public DefectDetailDto updateDefect(UUID defectId, UpdateDefectRequest request, UserPrincipal currentUser) {
        Defect defect = defectRepository.findById(defectId)
                .orElseThrow(() -> new ResourceNotFoundException("Defect", "id", defectId));

        organizationService.checkMembershipOrAdmin(defect.getProject().getOrganization().getId(), currentUser);

        TestCase testCase = null;
        if (request.testCaseId() != null) {
            testCase = testCaseRepository.findById(request.testCaseId())
                    .orElseThrow(() -> new ResourceNotFoundException("TestCase", "id", request.testCaseId()));
            if (!testCase.getProject().getId().equals(defect.getProject().getId())) {
                throw new DuplicateResourceException("Linked test case must belong to the same project.");
            }
        }

        TestExecution testExecution = null;
        if (request.testExecutionId() != null) {
            testExecution = testExecutionRepository.findById(request.testExecutionId())
                    .orElseThrow(() -> new ResourceNotFoundException("TestExecution", "id", request.testExecutionId()));
            if (!testExecution.getProject().getId().equals(defect.getProject().getId())) {
                throw new DuplicateResourceException("Linked test execution must belong to the same project.");
            }
        }

        User assignee = null;
        if (request.assigneeId() != null) {
            assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.assigneeId()));
        }

        defect.setTitle(request.title().trim());
        defect.setDescription(request.description());
        defect.setStepsToReproduce(request.stepsToReproduce());
        defect.setExpectedResult(request.expectedResult());
        defect.setActualResult(request.actualResult());
        if (request.severity() != null) defect.setSeverity(request.severity());
        if (request.priority() != null) defect.setPriority(request.priority());
        if (request.status() != null && request.status() != defect.getStatus()) {
            handleStatusTransition(defect, request.status());
        }
        defect.setTestCase(testCase);
        defect.setTestExecution(testExecution);
        defect.setAssignee(assignee);

        Defect updated = defectRepository.save(defect);
        return toDefectDetailDto(updated);
    }

    public DefectDetailDto assignDefect(UUID defectId, AssignDefectRequest request, UserPrincipal currentUser) {
        Defect defect = defectRepository.findById(defectId)
                .orElseThrow(() -> new ResourceNotFoundException("Defect", "id", defectId));

        organizationService.checkMembershipOrAdmin(defect.getProject().getOrganization().getId(), currentUser);

        User assignee = null;
        if (request.assigneeId() != null) {
            assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.assigneeId()));
        }

        defect.setAssignee(assignee);
        Defect updated = defectRepository.save(defect);
        return toDefectDetailDto(updated);
    }

    public DefectDetailDto updateDefectStatus(UUID defectId, UpdateDefectStatusRequest request, UserPrincipal currentUser) {
        Defect defect = defectRepository.findById(defectId)
                .orElseThrow(() -> new ResourceNotFoundException("Defect", "id", defectId));

        organizationService.checkMembershipOrAdmin(defect.getProject().getOrganization().getId(), currentUser);

        if (request.status() != defect.getStatus()) {
            handleStatusTransition(defect, request.status());
        }

        Defect updated = defectRepository.save(defect);
        return toDefectDetailDto(updated);
    }

    public void deleteDefect(UUID defectId, UserPrincipal currentUser) {
        Defect defect = defectRepository.findById(defectId)
                .orElseThrow(() -> new ResourceNotFoundException("Defect", "id", defectId));

        checkDeletePermission(defect.getProject(), defect.getReporter(), currentUser, "defect");
        defectRepository.delete(defect);
    }

    @Transactional(readOnly = true)
    public ProjectDefectSummaryDto getProjectDefectSummary(UUID projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        long total = defectRepository.countByProjectId(projectId);
        long open = defectRepository.countByProjectIdAndStatus(projectId, DefectStatus.OPEN);
        long inProgress = defectRepository.countByProjectIdAndStatus(projectId, DefectStatus.IN_PROGRESS);
        long inReview = defectRepository.countByProjectIdAndStatus(projectId, DefectStatus.IN_REVIEW);
        long resolved = defectRepository.countByProjectIdAndStatus(projectId, DefectStatus.RESOLVED);
        long closed = defectRepository.countByProjectIdAndStatus(projectId, DefectStatus.CLOSED);
        long reopened = defectRepository.countByProjectIdAndStatus(projectId, DefectStatus.REOPENED);
        long critical = defectRepository.countByProjectIdAndSeverity(projectId, DefectSeverity.CRITICAL);
        long high = defectRepository.countByProjectIdAndSeverity(projectId, DefectSeverity.HIGH);

        List<DefectSummaryDto> recent = defectRepository.findByProjectIdOrderByDefectNumberDesc(projectId).stream()
                .limit(10)
                .map(this::toDefectSummaryDto)
                .toList();

        return new ProjectDefectSummaryDto(total, open, inProgress, inReview, resolved, closed, reopened, critical, high, recent);
    }

    private void handleStatusTransition(Defect defect, DefectStatus newStatus) {
        defect.setStatus(newStatus);
        if (newStatus == DefectStatus.RESOLVED) {
            defect.setResolvedAt(Instant.now());
        } else if (newStatus == DefectStatus.CLOSED) {
            defect.setClosedAt(Instant.now());
        } else if (newStatus == DefectStatus.REOPENED || newStatus == DefectStatus.OPEN || newStatus == DefectStatus.IN_PROGRESS) {
            defect.setClosedAt(null);
        }
    }

    private DefectSummaryDto toDefectSummaryDto(Defect d) {
        String defectKey = d.getProject().getProjectKey() + "-BUG-" + d.getDefectNumber();
        String testCaseKey = d.getTestCase() != null
                ? d.getTestCase().getProject().getProjectKey() + "-TC-" + d.getTestCase().getCaseNumber()
                : null;
        return new DefectSummaryDto(
                d.getId(),
                d.getProject().getId(),
                d.getProject().getProjectKey(),
                d.getDefectNumber(),
                defectKey,
                d.getTitle(),
                d.getSeverity(),
                d.getPriority(),
                d.getStatus(),
                d.getAssignee() != null ? d.getAssignee().getId() : null,
                d.getAssignee() != null ? d.getAssignee().getUsername() : null,
                d.getAssignee() != null ? d.getAssignee().getFullName() : null,
                d.getReporter() != null ? d.getReporter().getUsername() : null,
                d.getTestCase() != null ? d.getTestCase().getId() : null,
                testCaseKey,
                d.getTestCase() != null ? d.getTestCase().getTitle() : null,
                d.getTestExecution() != null ? d.getTestExecution().getId() : null,
                d.getCreatedAt(),
                d.getUpdatedAt(),
                d.getResolvedAt(),
                d.getClosedAt()
        );
    }

    private DefectDetailDto toDefectDetailDto(Defect d) {
        String defectKey = d.getProject().getProjectKey() + "-BUG-" + d.getDefectNumber();
        String testCaseKey = d.getTestCase() != null
                ? d.getTestCase().getProject().getProjectKey() + "-TC-" + d.getTestCase().getCaseNumber()
                : null;
        return new DefectDetailDto(
                d.getId(),
                d.getProject().getId(),
                d.getProject().getName(),
                d.getProject().getProjectKey(),
                d.getDefectNumber(),
                defectKey,
                d.getTitle(),
                d.getDescription(),
                d.getStepsToReproduce(),
                d.getExpectedResult(),
                d.getActualResult(),
                d.getSeverity(),
                d.getPriority(),
                d.getStatus(),
                d.getAssignee() != null ? d.getAssignee().getId() : null,
                d.getAssignee() != null ? d.getAssignee().getUsername() : null,
                d.getAssignee() != null ? d.getAssignee().getFullName() : null,
                d.getReporter() != null ? d.getReporter().getId() : null,
                d.getReporter() != null ? d.getReporter().getUsername() : null,
                d.getReporter() != null ? d.getReporter().getFullName() : null,
                d.getTestCase() != null ? d.getTestCase().getId() : null,
                testCaseKey,
                d.getTestCase() != null ? d.getTestCase().getTitle() : null,
                d.getTestExecution() != null ? d.getTestExecution().getId() : null,
                d.getTestExecution() != null ? d.getTestExecution().getStatus() : null,
                d.getCreatedAt(),
                d.getUpdatedAt(),
                d.getResolvedAt(),
                d.getClosedAt()
        );
    }

    // =========================================================
    // Traceability Matrix Operations
    // =========================================================

    @Transactional(readOnly = true)
    public ProjectTraceabilityMatrixDto getProjectTraceabilityMatrix(UUID projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        List<UserStory> stories = userStoryRepository.findByProjectIdOrderByStoryNumberAsc(projectId);
        List<Document> prdDocs = documentRepository.findByProjectIdAndTypeOrderByUpdatedAtDesc(projectId, DocumentType.PRODUCT_REQUIREMENTS);
        List<TestCase> testCases = testCaseRepository.findByProjectIdOrderByCaseNumberAsc(projectId);
        List<TestExecution> executions = testExecutionRepository.findByProjectIdOrderByExecutedAtDesc(projectId);
        List<Defect> defects = defectRepository.findByProjectIdOrderByDefectNumberDesc(projectId);

        // Group latest execution per test case
        Map<UUID, TestExecution> latestExecutionByCaseId = new HashMap<>();
        for (TestExecution exec : executions) {
            latestExecutionByCaseId.putIfAbsent(exec.getTestCase().getId(), exec);
        }

        // Group defects per test case
        Map<UUID, List<DefectSummaryDto>> defectsByCaseId = new HashMap<>();
        for (Defect defect : defects) {
            if (defect.getTestCase() != null) {
                defectsByCaseId.computeIfAbsent(defect.getTestCase().getId(), k -> new ArrayList<>())
                        .add(toDefectSummaryDto(defect));
            }
        }

        // Group test cases by user story and by PRD requirement
        Map<UUID, List<TestCase>> casesByStoryId = new HashMap<>();
        Map<UUID, List<TestCase>> casesByReqId = new HashMap<>();
        List<TestCase> unlinkedCases = new ArrayList<>();

        for (TestCase tc : testCases) {
            boolean linked = false;
            if (tc.getUserStory() != null) {
                casesByStoryId.computeIfAbsent(tc.getUserStory().getId(), k -> new ArrayList<>()).add(tc);
                linked = true;
            }
            if (tc.getRequirement() != null) {
                casesByReqId.computeIfAbsent(tc.getRequirement().getId(), k -> new ArrayList<>()).add(tc);
                linked = true;
            }
            if (!linked) {
                unlinkedCases.add(tc);
            }
        }

        List<TraceabilityItemDto> items = new ArrayList<>();

        // 1. Process User Stories
        for (UserStory story : stories) {
            List<TestCase> linkedCases = casesByStoryId.getOrDefault(story.getId(), Collections.emptyList());
            List<TraceabilityTestCaseDto> tcDtos = linkedCases.stream()
                    .map(tc -> toTraceabilityTestCaseDto(tc, latestExecutionByCaseId.get(tc.getId()), defectsByCaseId.getOrDefault(tc.getId(), Collections.emptyList())))
                    .toList();

            String storyKey = project.getProjectKey() + "-" + story.getStoryNumber();
            items.add(new TraceabilityItemDto(
                    story.getId(),
                    storyKey,
                    story.getTitle(),
                    "USER_STORY",
                    story.getStatus().name(),
                    story.getPriority().name(),
                    tcDtos,
                    !tcDtos.isEmpty()
            ));
        }

        // 2. Process PRD Requirement Documents
        for (Document doc : prdDocs) {
            List<TestCase> linkedCases = casesByReqId.getOrDefault(doc.getId(), Collections.emptyList());
            List<TraceabilityTestCaseDto> tcDtos = linkedCases.stream()
                    .map(tc -> toTraceabilityTestCaseDto(tc, latestExecutionByCaseId.get(tc.getId()), defectsByCaseId.getOrDefault(tc.getId(), Collections.emptyList())))
                    .toList();

            String prdKey = "PRD-v" + doc.getCurrentVersion();
            items.add(new TraceabilityItemDto(
                    doc.getId(),
                    prdKey,
                    doc.getTitle(),
                    "PRODUCT_REQUIREMENTS",
                    doc.getStatus().name(),
                    "MEDIUM",
                    tcDtos,
                    !tcDtos.isEmpty()
            ));
        }

        // 3. Process Unlinked Test Cases
        List<UnlinkedTestCaseDto> unlinkedDtos = unlinkedCases.stream().map(tc -> {
            TestExecution latest = latestExecutionByCaseId.get(tc.getId());
            String caseKey = project.getProjectKey() + "-TC-" + tc.getCaseNumber();
            return new UnlinkedTestCaseDto(
                    tc.getId(),
                    tc.getCaseNumber(),
                    caseKey,
                    tc.getTitle(),
                    tc.getPriority(),
                    tc.getStatus(),
                    latest != null ? latest.getStatus() : null,
                    latest != null ? latest.getExecutedAt() : null,
                    defectsByCaseId.getOrDefault(tc.getId(), Collections.emptyList())
            );
        }).toList();

        // 4. Calculate summary metrics
        long totalRequirements = items.size();
        long coveredRequirements = items.stream().filter(TraceabilityItemDto::hasCoverage).count();
        long uncoveredRequirements = totalRequirements - coveredRequirements;
        double coveragePercentage = totalRequirements > 0
                ? Math.round(((double) coveredRequirements / totalRequirements * 100.0) * 10.0) / 10.0
                : 0.0;

        long totalTestCases = testCases.size();
        long executedTestCases = testCases.stream().filter(tc -> latestExecutionByCaseId.containsKey(tc.getId())).count();
        long neverExecutedTestCases = totalTestCases - executedTestCases;
        double executionPercentage = totalTestCases > 0
                ? Math.round(((double) executedTestCases / totalTestCases * 100.0) * 10.0) / 10.0
                : 0.0;

        long totalDefects = defects.size();
        long openDefects = defects.stream()
                .filter(d -> d.getStatus() != DefectStatus.RESOLVED && d.getStatus() != DefectStatus.CLOSED)
                .count();

        TraceabilitySummaryDto summary = new TraceabilitySummaryDto(
                totalRequirements,
                coveredRequirements,
                uncoveredRequirements,
                coveragePercentage,
                totalTestCases,
                executedTestCases,
                neverExecutedTestCases,
                executionPercentage,
                totalDefects,
                openDefects
        );

        return new ProjectTraceabilityMatrixDto(
                projectId,
                project.getProjectKey(),
                project.getName(),
                summary,
                items,
                unlinkedDtos
        );
    }

    @Transactional(readOnly = true)
    public ReleaseReadinessDto getReleaseReadiness(UUID projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        organizationService.checkMembershipOrAdmin(project.getOrganization().getId(), currentUser);

        // 1. Retrieve all testing artifacts
        List<TestCase> testCases = testCaseRepository.findByProjectIdOrderByCaseNumberAsc(projectId);
        List<Defect> defects = defectRepository.findByProjectIdOrderByDefectNumberDesc(projectId);
        List<UserStory> userStories = userStoryRepository.findByProjectIdOrderByStoryNumberAsc(projectId);
        List<Document> prds = documentRepository.findByProjectIdAndTypeOrderByUpdatedAtDesc(projectId, DocumentType.PRODUCT_REQUIREMENTS);
        List<TestExecution> executions = testExecutionRepository.findByProjectIdOrderByExecutedAtDesc(projectId);

        // Fetch latest executions per test case
        Map<UUID, TestExecution> latestExecutionByCaseId = new HashMap<>();
        for (TestExecution exec : executions) {
            latestExecutionByCaseId.putIfAbsent(exec.getTestCase().getId(), exec);
        }

        // 2. Compute Test Execution Stats
        long totalTests = testCases.size();
        long passedTests = 0;
        long failedTests = 0;
        long blockedTests = 0;
        long skippedTests = 0;
        long neverExecutedTests = 0;

        for (TestCase tc : testCases) {
            TestExecution exec = latestExecutionByCaseId.get(tc.getId());
            if (exec == null) {
                neverExecutedTests++;
            } else {
                switch (exec.getStatus()) {
                    case PASSED -> passedTests++;
                    case FAILED -> failedTests++;
                    case BLOCKED -> blockedTests++;
                    case SKIPPED -> skippedTests++;
                }
            }
        }

        long executedTests = totalTests - neverExecutedTests;
        long totalExecutions = testExecutionRepository.countByProjectId(projectId);
        double passRate = executedTests > 0
                ? Math.round(((double) passedTests / executedTests * 100.0) * 10.0) / 10.0
                : 0.0;

        TestExecutionStatsDto testStats = new TestExecutionStatsDto(
                totalTests,
                executedTests,
                neverExecutedTests,
                passedTests,
                failedTests,
                blockedTests,
                skippedTests,
                totalExecutions,
                passRate
        );

        // 3. Compute Defect Stats
        long totalDefects = defects.size();
        long unresolvedCritical = 0;
        long unresolvedHigh = 0;
        long unresolvedMedium = 0;
        long unresolvedLow = 0;

        for (Defect d : defects) {
            if (d.getStatus() != DefectStatus.RESOLVED && d.getStatus() != DefectStatus.CLOSED) {
                switch (d.getSeverity()) {
                    case CRITICAL -> unresolvedCritical++;
                    case HIGH -> unresolvedHigh++;
                    case MEDIUM -> unresolvedMedium++;
                    case LOW -> unresolvedLow++;
                }
            }
        }

        long unresolvedTotal = unresolvedCritical + unresolvedHigh + unresolvedMedium + unresolvedLow;
        long resolvedTotal = totalDefects - unresolvedTotal;

        DefectStatsDto defectStats = new DefectStatsDto(
                totalDefects,
                unresolvedTotal,
                unresolvedCritical,
                unresolvedHigh,
                unresolvedMedium,
                unresolvedLow,
                resolvedTotal
        );

        // 4. Compute Requirement Coverage Stats
        Set<UUID> coveredStoryIds = new HashSet<>();
        Set<UUID> coveredPrdIds = new HashSet<>();
        for (TestCase tc : testCases) {
            if (tc.getUserStory() != null) {
                coveredStoryIds.add(tc.getUserStory().getId());
            }
            if (tc.getRequirement() != null) {
                coveredPrdIds.add(tc.getRequirement().getId());
            }
        }

        long totalStories = userStories.size();
        long coveredStories = userStories.stream().filter(s -> coveredStoryIds.contains(s.getId())).count();
        long totalPrds = prds.size();
        long coveredPrds = prds.stream().filter(p -> coveredPrdIds.contains(p.getId())).count();

        long totalRequirements = totalStories + totalPrds;
        long coveredRequirements = coveredStories + coveredPrds;
        long uncoveredRequirements = totalRequirements - coveredRequirements;
        double coveragePercentage = totalRequirements > 0
                ? Math.round(((double) coveredRequirements / totalRequirements * 100.0) * 10.0) / 10.0
                : 100.0;

        RequirementCoverageStatsDto requirementStats = new RequirementCoverageStatsDto(
                totalRequirements,
                coveredRequirements,
                uncoveredRequirements,
                coveragePercentage
        );

        // 5. Evaluate Quality Gates / Criteria Checklist
        List<ReadinessCriterionDto> criteria = new ArrayList<>();
        List<String> blockers = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        // Criterion 1: Zero Critical Defects (Blocker)
        if (unresolvedCritical == 0) {
            criteria.add(new ReadinessCriterionDto(
                    "CRITICAL_DEFECTS",
                    "Zero Unresolved Critical Defects",
                    "PASSED",
                    true,
                    "No unresolved critical severity defects exist in this project.",
                    "0 critical defects",
                    "0"
            ));
        } else {
            String msg = String.format("%d unresolved critical defect(s) must be resolved before release", unresolvedCritical);
            blockers.add(msg);
            criteria.add(new ReadinessCriterionDto(
                    "CRITICAL_DEFECTS",
                    "Zero Unresolved Critical Defects",
                    "FAILED",
                    true,
                    msg,
                    unresolvedCritical + " critical defects",
                    "0"
            ));
        }

        // Criterion 2: Zero Failing Tests (Blocker)
        if (failedTests == 0) {
            criteria.add(new ReadinessCriterionDto(
                    "TEST_FAILURES",
                    "Zero Failing Tests",
                    "PASSED",
                    true,
                    "All executed test cases passed with zero failures.",
                    "0 failures",
                    "0"
            ));
        } else {
            String msg = String.format("%d test case(s) are currently in FAILED state", failedTests);
            blockers.add(msg);
            criteria.add(new ReadinessCriterionDto(
                    "TEST_FAILURES",
                    "Zero Failing Tests",
                    "FAILED",
                    true,
                    msg,
                    failedTests + " failing tests",
                    "0"
            ));
        }

        // Criterion 3: Zero Blocked Tests (Blocker)
        if (blockedTests == 0) {
            criteria.add(new ReadinessCriterionDto(
                    "BLOCKED_TESTS",
                    "Zero Blocked Tests",
                    "PASSED",
                    true,
                    "No test cases are blocked by external dependencies or blockers.",
                    "0 blocked",
                    "0"
            ));
        } else {
            String msg = String.format("%d test case(s) are currently BLOCKED", blockedTests);
            blockers.add(msg);
            criteria.add(new ReadinessCriterionDto(
                    "BLOCKED_TESTS",
                    "Zero Blocked Tests",
                    "FAILED",
                    true,
                    msg,
                    blockedTests + " blocked tests",
                    "0"
            ));
        }

        // Criterion 4: Test Suite Verification (Blocker)
        if (totalTests == 0) {
            String msg = "No test cases have been authored for this project";
            blockers.add(msg);
            criteria.add(new ReadinessCriterionDto(
                    "TEST_EXECUTION",
                    "Test Suite Verification",
                    "FAILED",
                    true,
                    msg,
                    "0 total tests",
                    "> 0 executed tests"
            ));
        } else if (executedTests == 0) {
            String msg = "Test cases exist but none have been executed yet";
            blockers.add(msg);
            criteria.add(new ReadinessCriterionDto(
                    "TEST_EXECUTION",
                    "Test Suite Verification",
                    "FAILED",
                    true,
                    msg,
                    "0 executed tests",
                    "> 0 executed tests"
            ));
        } else {
            criteria.add(new ReadinessCriterionDto(
                    "TEST_EXECUTION",
                    "Test Suite Verification",
                    "PASSED",
                    true,
                    String.format("%d of %d test cases have recorded executions.", executedTests, totalTests),
                    executedTests + "/" + totalTests + " executed",
                    "> 0 executed tests"
            ));
        }

        // Criterion 5: Zero High-Severity Defects (Warning)
        if (unresolvedHigh == 0) {
            criteria.add(new ReadinessCriterionDto(
                    "HIGH_DEFECTS",
                    "Zero High-Severity Defects",
                    "PASSED",
                    false,
                    "No unresolved high severity defects exist in this project.",
                    "0 high defects",
                    "0"
            ));
        } else {
            String msg = String.format("%d unresolved high-severity defect(s) should be triaged or resolved", unresolvedHigh);
            warnings.add(msg);
            criteria.add(new ReadinessCriterionDto(
                    "HIGH_DEFECTS",
                    "Zero High-Severity Defects",
                    "WARNING",
                    false,
                    msg,
                    unresolvedHigh + " high defects",
                    "0"
            ));
        }

        // Criterion 6: Requirement Coverage (Warning)
        if (totalRequirements == 0 || uncoveredRequirements == 0) {
            criteria.add(new ReadinessCriterionDto(
                    "REQUIREMENT_COVERAGE",
                    "Requirement Coverage",
                    "PASSED",
                    false,
                    totalRequirements == 0
                            ? "No formal requirements or PRDs recorded for this project."
                            : String.format("100%% requirement coverage across all %d requirement(s).", totalRequirements),
                    coveragePercentage + "%",
                    "100.0%"
            ));
        } else {
            String msg = String.format("%d requirement(s) or story/stories have no linked test coverage", uncoveredRequirements);
            warnings.add(msg);
            criteria.add(new ReadinessCriterionDto(
                    "REQUIREMENT_COVERAGE",
                    "Requirement Coverage",
                    "WARNING",
                    false,
                    msg,
                    coveragePercentage + "% (" + coveredRequirements + "/" + totalRequirements + ")",
                    "100.0%"
            ));
        }

        // Criterion 7: All Test Cases Executed (Warning)
        if (totalTests > 0 && neverExecutedTests == 0) {
            criteria.add(new ReadinessCriterionDto(
                    "UNEXECUTED_TESTS",
                    "All Test Cases Executed",
                    "PASSED",
                    false,
                    "100% of defined test cases have been verified in test runs.",
                    "0 unexecuted",
                    "0 unexecuted"
            ));
        } else if (totalTests > 0) {
            String msg = String.format("%d test case(s) have never been executed", neverExecutedTests);
            warnings.add(msg);
            criteria.add(new ReadinessCriterionDto(
                    "UNEXECUTED_TESTS",
                    "All Test Cases Executed",
                    "WARNING",
                    false,
                    msg,
                    neverExecutedTests + " unexecuted",
                    "0 unexecuted"
            ));
        }

        // Criterion 8: Test Pass Rate Target (Warning)
        if (executedTests > 0 && passRate >= 100.0) {
            criteria.add(new ReadinessCriterionDto(
                    "PASS_RATE",
                    "100% Test Pass Rate",
                    "PASSED",
                    false,
                    "100% of executed test cases are currently passing.",
                    "100.0%",
                    "100.0%"
            ));
        } else if (executedTests > 0 && passRate >= 90.0) {
            String msg = String.format("Test pass rate is %.1f%% (target is 100.0%%)", passRate);
            warnings.add(msg);
            criteria.add(new ReadinessCriterionDto(
                    "PASS_RATE",
                    "100% Test Pass Rate",
                    "WARNING",
                    false,
                    msg,
                    passRate + "%",
                    "100.0%"
            ));
        } else if (executedTests > 0) {
            String msg = String.format("Test pass rate is below threshold at %.1f%%", passRate);
            warnings.add(msg);
            criteria.add(new ReadinessCriterionDto(
                    "PASS_RATE",
                    "100% Test Pass Rate",
                    "WARNING",
                    false,
                    msg,
                    passRate + "%",
                    "100.0%"
            ));
        }

        // 6. Overall Readiness Status
        ReadinessStatus status;
        boolean isReady;
        String summaryText;

        if (!blockers.isEmpty()) {
            status = ReadinessStatus.BLOCKED;
            isReady = false;
            summaryText = String.format("Release is BLOCKED by %d critical issue(s). Resolve all blockers before release.", blockers.size());
        } else if (!warnings.isEmpty()) {
            status = ReadinessStatus.NEEDS_ATTENTION;
            isReady = false;
            summaryText = String.format("Release has %d warning(s). Review recommendations and sign off prior to deployment.", warnings.size());
        } else {
            status = ReadinessStatus.READY;
            isReady = true;
            summaryText = "All release readiness criteria passed. The project meets all quality gates for production release.";
        }

        return new ReleaseReadinessDto(
                projectId,
                project.getProjectKey(),
                project.getName(),
                status,
                isReady,
                summaryText,
                blockers,
                warnings,
                testStats,
                defectStats,
                requirementStats,
                criteria,
                Instant.now()
        );
    }

    private TraceabilityTestCaseDto toTraceabilityTestCaseDto(
            TestCase tc,
            TestExecution latestExec,
            List<DefectSummaryDto> defects
    ) {
        String caseKey = tc.getProject().getProjectKey() + "-TC-" + tc.getCaseNumber();
        return new TraceabilityTestCaseDto(
                tc.getId(),
                tc.getCaseNumber(),
                caseKey,
                tc.getTitle(),
                tc.getPriority(),
                tc.getStatus(),
                latestExec != null ? latestExec.getStatus() : null,
                latestExec != null ? latestExec.getExecutedAt() : null,
                latestExec != null ? latestExec.getDurationMs() : null,
                latestExec != null ? latestExec.getNotes() : null,
                defects
        );
    }
}

