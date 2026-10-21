package com.sdlc.platform.testing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdlc.platform.auth.model.Role;
import com.sdlc.platform.auth.model.RoleName;
import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.RoleRepository;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.organization.model.OrgMemberRole;
import com.sdlc.platform.organization.model.Organization;
import com.sdlc.platform.organization.model.OrganizationMember;
import com.sdlc.platform.organization.repository.OrganizationMemberRepository;
import com.sdlc.platform.organization.repository.OrganizationRepository;
import com.sdlc.platform.project.model.Project;
import com.sdlc.platform.project.model.ProjectStatus;
import com.sdlc.platform.project.repository.ProjectRepository;
import com.sdlc.platform.security.JwtTokenProvider;
import com.sdlc.platform.document.model.Document;
import com.sdlc.platform.document.model.DocumentType;
import com.sdlc.platform.document.repository.DocumentRepository;
import com.sdlc.platform.requirement.model.StoryPriority;
import com.sdlc.platform.requirement.model.UserStory;
import com.sdlc.platform.requirement.repository.UserStoryRepository;
import com.sdlc.platform.testing.dto.*;
import com.sdlc.platform.testing.model.Defect;
import com.sdlc.platform.testing.model.DefectSeverity;
import com.sdlc.platform.testing.model.DefectStatus;
import com.sdlc.platform.testing.model.TestCase;
import com.sdlc.platform.testing.model.TestCaseStatus;
import com.sdlc.platform.testing.model.TestExecution;
import com.sdlc.platform.testing.model.TestExecutionStatus;
import com.sdlc.platform.testing.model.TestPriority;
import com.sdlc.platform.testing.model.TestSuite;
import com.sdlc.platform.testing.repository.DefectRepository;
import com.sdlc.platform.testing.repository.TestCaseRepository;
import com.sdlc.platform.testing.repository.TestExecutionRepository;
import com.sdlc.platform.testing.repository.TestSuiteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TestingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private OrganizationMemberRepository organizationMemberRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TestSuiteRepository testSuiteRepository;

    @Autowired
    private TestCaseRepository testCaseRepository;

    @Autowired
    private TestExecutionRepository testExecutionRepository;

    @Autowired
    private DefectRepository defectRepository;

    @Autowired
    private UserStoryRepository userStoryRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User orgOwner;
    private User orgMember;
    private User outsider;
    private Organization organization;
    private Project project;
    private String ownerToken;
    private String memberToken;
    private String outsiderToken;

    @BeforeEach
    void setUp() {
        Role devRole = roleRepository.findByName(RoleName.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_DEVELOPER, "Dev")));

        orgOwner = userRepository.save(new User("owner@testmgmt.com", "testowner", "hash", "Test Owner"));
        orgOwner.addRole(devRole);
        ownerToken = "Bearer " + jwtTokenProvider.generateToken(orgOwner);

        orgMember = userRepository.save(new User("member@testmgmt.com", "testmember", "hash", "Test Member"));
        orgMember.addRole(devRole);
        memberToken = "Bearer " + jwtTokenProvider.generateToken(orgMember);

        outsider = userRepository.save(new User("outsider@testmgmt.com", "outsider", "hash", "Outsider"));
        outsider.addRole(devRole);
        outsiderToken = "Bearer " + jwtTokenProvider.generateToken(outsider);

        organization = organizationRepository.save(new Organization("QA Corp", "qa-corp", "QA Description", orgOwner));
        organizationMemberRepository.save(new OrganizationMember(organization, orgOwner, OrgMemberRole.OWNER));
        organizationMemberRepository.save(new OrganizationMember(organization, orgMember, OrgMemberRole.MEMBER));

        project = projectRepository.save(new Project(
                organization,
                null,
                "Quality Platform",
                "QP",
                "Quality Assurance Platform",
                orgOwner
        ));
    }

    // =========================================================
    // Test Suite Tests
    // =========================================================

    @Test
    void createTestSuite_success() throws Exception {
        CreateTestSuiteRequest req = new CreateTestSuiteRequest("Authentication & Authorization Suite", "Covers login, signup and JWT tests");

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/test-suites")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Authentication & Authorization Suite"))
                .andExpect(jsonPath("$.data.description").value("Covers login, signup and JWT tests"))
                .andExpect(jsonPath("$.data.createdByUsername").value("testmember"));
    }

    @Test
    void getTestSuitesForProject_success() throws Exception {
        testSuiteRepository.save(new TestSuite(project, "Regression Suite", "Daily regression", orgOwner));
        testSuiteRepository.save(new TestSuite(project, "Smoke Suite", "Deployment verification", orgOwner));

        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/test-suites")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].name").value("Regression Suite"))
                .andExpect(jsonPath("$.data[1].name").value("Smoke Suite"));
    }

    @Test
    void updateTestSuite_success() throws Exception {
        TestSuite suite = testSuiteRepository.save(new TestSuite(project, "Initial Suite", "Old description", orgOwner));
        UpdateTestSuiteRequest req = new UpdateTestSuiteRequest("Renamed Suite", "Updated description");

        mockMvc.perform(put("/api/v1/test-suites/" + suite.getId())
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Renamed Suite"))
                .andExpect(jsonPath("$.data.description").value("Updated description"));
    }

    @Test
    void deleteTestSuite_success() throws Exception {
        TestSuite suite = testSuiteRepository.save(new TestSuite(project, "Obsolete Suite", "Will be deleted", orgOwner));

        mockMvc.perform(delete("/api/v1/test-suites/" + suite.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertFalse(testSuiteRepository.existsById(suite.getId()));
    }

    // =========================================================
    // Test Case Tests
    // =========================================================

    @Test
    void createTestCase_success() throws Exception {
        TestSuite suite = testSuiteRepository.save(new TestSuite(project, "Core Suite", "Core checks", orgOwner));

        CreateTestCaseRequest req = new CreateTestCaseRequest(
                "Verify User Login with Valid Credentials",
                "Ensure authenticated users receive valid JWT",
                "User account is pre-registered and active in system",
                "1. Send POST /api/v1/auth/login with valid email and password\n2. Inspect response HTTP status\n3. Extract token",
                "HTTP 200 OK with success=true and bearer token present",
                TestPriority.HIGH,
                TestCaseStatus.DRAFT,
                suite.getId()
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/test-cases")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Verify User Login with Valid Credentials"))
                .andExpect(jsonPath("$.data.caseNumber").value(1))
                .andExpect(jsonPath("$.data.caseKey").value("QP-TC-1"))
                .andExpect(jsonPath("$.data.preconditions").value("User account is pre-registered and active in system"))
                .andExpect(jsonPath("$.data.testSteps").value(containsString("POST /api/v1/auth/login")))
                .andExpect(jsonPath("$.data.expectedResult").value(containsString("HTTP 200 OK")))
                .andExpect(jsonPath("$.data.priority").value("HIGH"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.suiteName").value("Core Suite"))
                .andExpect(jsonPath("$.data.createdByUsername").value("testmember"));
    }

    @Test
    void getTestCasesForProject_withFilters() throws Exception {
        TestSuite suiteA = testSuiteRepository.save(new TestSuite(project, "Suite A", "Suite A desc", orgOwner));
        TestSuite suiteB = testSuiteRepository.save(new TestSuite(project, "Suite B", "Suite B desc", orgOwner));

        TestCase tc1 = new TestCase(project, suiteA, 1, "TC 1", "Desc", "Pre", "Steps", "Exp", TestPriority.HIGH, TestCaseStatus.PASSED, orgOwner);
        TestCase tc2 = new TestCase(project, suiteA, 2, "TC 2", "Desc", "Pre", "Steps", "Exp", TestPriority.LOW, TestCaseStatus.FAILED, orgOwner);
        TestCase tc3 = new TestCase(project, suiteB, 3, "TC 3", "Desc", "Pre", "Steps", "Exp", TestPriority.CRITICAL, TestCaseStatus.DRAFT, orgOwner);
        testCaseRepository.save(tc1);
        testCaseRepository.save(tc2);
        testCaseRepository.save(tc3);

        // 1. All cases
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/test-cases")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(3)));

        // 2. Filter by Suite A
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/test-cases?suiteId=" + suiteA.getId())
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].caseKey").value("QP-TC-1"))
                .andExpect(jsonPath("$.data[1].caseKey").value("QP-TC-2"));

        // 3. Filter by Status FAILED
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/test-cases?status=FAILED")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].caseKey").value("QP-TC-2"));

        // 4. Filter by Priority CRITICAL
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/test-cases?priority=CRITICAL")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].caseKey").value("QP-TC-3"));
    }

    @Test
    void updateTestCase_success() throws Exception {
        TestCase tc = testCaseRepository.save(new TestCase(
                project, null, 1, "Original Title", "Orig Desc", "Orig Pre", "Orig Steps", "Orig Exp",
                TestPriority.LOW, TestCaseStatus.DRAFT, orgMember
        ));

        TestSuite suite = testSuiteRepository.save(new TestSuite(project, "API Suite", "API tests", orgOwner));

        UpdateTestCaseRequest req = new UpdateTestCaseRequest(
                "Updated Test Case Title",
                "New description",
                "New preconditions",
                "Updated step-by-step instructions",
                "New expected result",
                TestPriority.CRITICAL,
                TestCaseStatus.ACTIVE,
                suite.getId()
        );

        mockMvc.perform(put("/api/v1/test-cases/" + tc.getId())
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Updated Test Case Title"))
                .andExpect(jsonPath("$.data.priority").value("CRITICAL"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.suiteName").value("API Suite"));
    }

    @Test
    void updateTestCaseStatus_success() throws Exception {
        TestCase tc = testCaseRepository.save(new TestCase(
                project, null, 1, "Smoke Test", "Desc", "Pre", "Steps", "Exp",
                TestPriority.HIGH, TestCaseStatus.DRAFT, orgMember
        ));

        mockMvc.perform(patch("/api/v1/test-cases/" + tc.getId() + "/status")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateTestCaseStatusRequest(TestCaseStatus.PASSED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PASSED"));
    }

    @Test
    void deleteTestCase_success() throws Exception {
        TestCase tc = testCaseRepository.save(new TestCase(
                project, null, 1, "Obsolete Test", "Desc", "Pre", "Steps", "Exp",
                TestPriority.LOW, TestCaseStatus.DEPRECATED, orgOwner
        ));

        mockMvc.perform(delete("/api/v1/test-cases/" + tc.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertFalse(testCaseRepository.existsById(tc.getId()));
    }

    @Test
    void outsiderAccess_forbidden() throws Exception {
        CreateTestCaseRequest req = new CreateTestCaseRequest(
                "Hacker Test", "Desc", "Pre", "Steps", "Exp", TestPriority.LOW, TestCaseStatus.DRAFT, null
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/test-cases")
                        .header("Authorization", outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void executeTestCase_success() throws Exception {
        TestCase tc = testCaseRepository.save(new TestCase(
                project, null, 1, "Login Verification", "Preconditions", "Enter credentials",
                "1. Enter email\n2. Enter password\n3. Click Submit", "Logged in with JWT",
                TestPriority.HIGH, TestCaseStatus.ACTIVE, orgOwner
        ));

        ExecuteTestCaseRequest req = new ExecuteTestCaseRequest(
                TestExecutionStatus.PASSED,
                "Returned 200 OK with valid JWT token in auth header",
                "Tested against Chrome 120",
                145
        );

        mockMvc.perform(post("/api/v1/test-cases/" + tc.getId() + "/executions")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PASSED"))
                .andExpect(jsonPath("$.data.actualResult").value("Returned 200 OK with valid JWT token in auth header"))
                .andExpect(jsonPath("$.data.executedByUsername").value("testmember"))
                .andExpect(jsonPath("$.data.testCaseKey").value("QP-TC-1"));

        // Verify test case status was updated
        TestCase updatedTc = testCaseRepository.findById(tc.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(TestCaseStatus.PASSED, updatedTc.getStatus());
    }

    @Test
    void rerunTestCase_preservesExecutionHistory() throws Exception {
        TestCase tc = testCaseRepository.save(new TestCase(
                project, null, 2, "Payment Flow", "Stripe configured", "Card details",
                "1. Checkout\n2. Submit", "Payment processed",
                TestPriority.CRITICAL, TestCaseStatus.ACTIVE, orgOwner
        ));

        // 1st Run: FAILED
        ExecuteTestCaseRequest run1 = new ExecuteTestCaseRequest(
                TestExecutionStatus.FAILED,
                "500 Internal Server Error - Stripe timeout",
                "Network glitch observed",
                320
        );
        mockMvc.perform(post("/api/v1/test-cases/" + tc.getId() + "/executions")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(run1)))
                .andExpect(status().isCreated());

        // 2nd Run (Rerun): PASSED
        ExecuteTestCaseRequest run2 = new ExecuteTestCaseRequest(
                TestExecutionStatus.PASSED,
                "Payment successfully charged 200 OK",
                "Retried after network stabilized",
                180
        );
        mockMvc.perform(post("/api/v1/test-cases/" + tc.getId() + "/executions")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(run2)))
                .andExpect(status().isCreated());

        // Query execution history: both records must be preserved
        mockMvc.perform(get("/api/v1/test-cases/" + tc.getId() + "/executions")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].status").value("PASSED"))
                .andExpect(jsonPath("$.data[0].executedByUsername").value("testowner"))
                .andExpect(jsonPath("$.data[1].status").value("FAILED"))
                .andExpect(jsonPath("$.data[1].executedByUsername").value("testmember"));

        // Test case latest status should be PASSED
        TestCase updatedTc = testCaseRepository.findById(tc.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(TestCaseStatus.PASSED, updatedTc.getStatus());
    }

    @Test
    void getProjectExecutionSummary_success() throws Exception {
        TestCase tc1 = testCaseRepository.save(new TestCase(
                project, null, 3, "TC 1", "Desc", "Pre", "Steps", "Exp",
                TestPriority.MEDIUM, TestCaseStatus.ACTIVE, orgOwner
        ));
        TestCase tc2 = testCaseRepository.save(new TestCase(
                project, null, 4, "TC 2", "Desc", "Pre", "Steps", "Exp",
                TestPriority.MEDIUM, TestCaseStatus.ACTIVE, orgOwner
        ));

        // Execute TC 1: PASSED
        mockMvc.perform(post("/api/v1/test-cases/" + tc1.getId() + "/executions")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ExecuteTestCaseRequest(
                                TestExecutionStatus.PASSED, "All steps ok", null, 100
                        ))))
                .andExpect(status().isCreated());

        // Execute TC 2: FAILED
        mockMvc.perform(post("/api/v1/test-cases/" + tc2.getId() + "/executions")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ExecuteTestCaseRequest(
                                TestExecutionStatus.FAILED, "Assertion error at step 2", null, 250
                        ))))
                .andExpect(status().isCreated());

        // Execute TC 2 rerun: PASSED
        mockMvc.perform(post("/api/v1/test-cases/" + tc2.getId() + "/executions")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ExecuteTestCaseRequest(
                                TestExecutionStatus.PASSED, "Fixed and passed", null, 90
                        ))))
                .andExpect(status().isCreated());

        // Get summary
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/test-execution-summary")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalExecutions").value(3))
                .andExpect(jsonPath("$.data.passedExecutions").value(2))
                .andExpect(jsonPath("$.data.failedExecutions").value(1))
                .andExpect(jsonPath("$.data.passRate").value(66.7))
                .andExpect(jsonPath("$.data.recentExecutions", hasSize(3)));
    }

    @Test
    void executeTestCase_validationError_whenActualResultEmpty() throws Exception {
        TestCase tc = testCaseRepository.save(new TestCase(
                project, null, 5, "TC Empty", "Desc", "Pre", "Steps", "Exp",
                TestPriority.LOW, TestCaseStatus.ACTIVE, orgOwner
        ));

        ExecuteTestCaseRequest req = new ExecuteTestCaseRequest(
                TestExecutionStatus.PASSED,
                "   ",
                null,
                null
        );

        mockMvc.perform(post("/api/v1/test-cases/" + tc.getId() + "/executions")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void executeTestCase_outsiderForbidden() throws Exception {
        TestCase tc = testCaseRepository.save(new TestCase(
                project, null, 6, "TC Secure", "Desc", "Pre", "Steps", "Exp",
                TestPriority.LOW, TestCaseStatus.ACTIVE, orgOwner
        ));

        ExecuteTestCaseRequest req = new ExecuteTestCaseRequest(
                TestExecutionStatus.PASSED,
                "Executed by hacker",
                null,
                null
        );

        mockMvc.perform(post("/api/v1/test-cases/" + tc.getId() + "/executions")
                        .header("Authorization", outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    // =========================================================
    // Defect Tracking & Bug Management Tests (Step 3)
    // =========================================================

    @Test
    void createDefect_success_linkedToTestCaseAndExecution() throws Exception {
        TestCase tc = testCaseRepository.save(new TestCase(
                project, null, 1, "Login Verification", "Desc", "Pre", "Step 1", "200 OK",
                TestPriority.HIGH, TestCaseStatus.FAILED, orgOwner
        ));

        TestExecution te = testExecutionRepository.save(new TestExecution(
                tc, project, TestExecutionStatus.FAILED, "500 Internal Error", "Null pointer in auth filter", 120, orgMember
        ));

        CreateDefectRequest req = new CreateDefectRequest(
                "Login throws HTTP 500 when payload is empty",
                "Full description of issue",
                "1. POST /auth/login with {}\n2. Observe 500",
                "Returns 400 Bad Request with error body",
                "Returns 500 Internal Server Error",
                DefectSeverity.HIGH,
                TestPriority.CRITICAL,
                DefectStatus.OPEN,
                orgMember.getId(),
                tc.getId(),
                te.getId()
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/defects")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.defectNumber").value(1))
                .andExpect(jsonPath("$.data.defectKey").value("QP-BUG-1"))
                .andExpect(jsonPath("$.data.title").value("Login throws HTTP 500 when payload is empty"))
                .andExpect(jsonPath("$.data.severity").value("HIGH"))
                .andExpect(jsonPath("$.data.priority").value("CRITICAL"))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.assigneeUsername").value("testmember"))
                .andExpect(jsonPath("$.data.reporterUsername").value("testmember"))
                .andExpect(jsonPath("$.data.testCaseId").value(tc.getId().toString()))
                .andExpect(jsonPath("$.data.testCaseKey").value("QP-TC-1"))
                .andExpect(jsonPath("$.data.testExecutionId").value(te.getId().toString()))
                .andExpect(jsonPath("$.data.testExecutionStatus").value("FAILED"));
    }

    @Test
    void createDefect_validationError() throws Exception {
        CreateDefectRequest req = new CreateDefectRequest(
                "   ",
                "Desc",
                null,
                null,
                null,
                DefectSeverity.MEDIUM,
                TestPriority.MEDIUM,
                DefectStatus.OPEN,
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/defects")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getDefectsForProject_filtersAndOrder() throws Exception {
        Defect d1 = defectRepository.save(new Defect(
                project, 1, "First Bug", "Desc 1", "Steps", "Exp", "Act",
                DefectSeverity.LOW, TestPriority.LOW, DefectStatus.OPEN,
                null, null, orgMember, orgOwner
        ));

        Defect d2 = defectRepository.save(new Defect(
                project, 2, "Critical Crash", "Desc 2", "Steps", "Exp", "Act",
                DefectSeverity.CRITICAL, TestPriority.HIGH, DefectStatus.IN_PROGRESS,
                null, null, orgOwner, orgMember
        ));

        // Get all defects for project - sorted descending
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/defects")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].defectKey").value("QP-BUG-2"))
                .andExpect(jsonPath("$.data[1].defectKey").value("QP-BUG-1"));

        // Filter by status=IN_PROGRESS
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/defects?status=IN_PROGRESS")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title").value("Critical Crash"));

        // Filter by severity=CRITICAL
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/defects?severity=CRITICAL")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].defectKey").value("QP-BUG-2"));
    }

    @Test
    void getDefectById_and_updateDefect() throws Exception {
        Defect d = defectRepository.save(new Defect(
                project, 1, "UI Overflow on Mobile", "Desc", "Steps", "Exp", "Act",
                DefectSeverity.MEDIUM, TestPriority.MEDIUM, DefectStatus.OPEN,
                null, null, null, orgOwner
        ));

        mockMvc.perform(get("/api/v1/defects/" + d.getId())
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.defectKey").value("QP-BUG-1"))
                .andExpect(jsonPath("$.data.title").value("UI Overflow on Mobile"));

        UpdateDefectRequest updateReq = new UpdateDefectRequest(
                "UI Overflow on Mobile Safari and Chrome",
                "Updated description",
                "Steps on iOS",
                "Clean margins",
                "Horizontal scrollbar appears",
                DefectSeverity.HIGH,
                TestPriority.HIGH,
                DefectStatus.RESOLVED,
                orgMember.getId(),
                null,
                null
        );

        mockMvc.perform(put("/api/v1/defects/" + d.getId())
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("UI Overflow on Mobile Safari and Chrome"))
                .andExpect(jsonPath("$.data.severity").value("HIGH"))
                .andExpect(jsonPath("$.data.status").value("RESOLVED"))
                .andExpect(jsonPath("$.data.resolvedAt").isNotEmpty())
                .andExpect(jsonPath("$.data.assigneeUsername").value("testmember"));
    }

    @Test
    void assignDefect_and_updateStatus() throws Exception {
        Defect d = defectRepository.save(new Defect(
                project, 1, "Database Connection Leak", "Desc", "Steps", "Exp", "Act",
                DefectSeverity.CRITICAL, TestPriority.CRITICAL, DefectStatus.OPEN,
                null, null, null, orgOwner
        ));

        // Assign to orgMember
        AssignDefectRequest assignReq = new AssignDefectRequest(orgMember.getId());
        mockMvc.perform(patch("/api/v1/defects/" + d.getId() + "/assign")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assigneeUsername").value("testmember"));

        // Update status to IN_PROGRESS
        UpdateDefectStatusRequest statusReq = new UpdateDefectStatusRequest(DefectStatus.IN_PROGRESS);
        mockMvc.perform(patch("/api/v1/defects/" + d.getId() + "/status")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
    }

    @Test
    void deleteDefect_permissionEnforced() throws Exception {
        Defect d = defectRepository.save(new Defect(
                project, 1, "Minor Typo in Footer", "Desc", "Steps", "Exp", "Act",
                DefectSeverity.LOW, TestPriority.LOW, DefectStatus.OPEN,
                null, null, null, orgOwner
        ));

        // Outsider cannot delete
        mockMvc.perform(delete("/api/v1/defects/" + d.getId())
                        .header("Authorization", outsiderToken))
                .andExpect(status().isForbidden());

        // Org owner can delete
        mockMvc.perform(delete("/api/v1/defects/" + d.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());

        assertFalse(defectRepository.existsById(d.getId()));
    }

    @Test
    void getProjectDefectSummary_aggregatesCorrectly() throws Exception {
        defectRepository.save(new Defect(
                project, 1, "Bug 1", "Desc", "Steps", "Exp", "Act",
                DefectSeverity.CRITICAL, TestPriority.HIGH, DefectStatus.OPEN,
                null, null, null, orgOwner
        ));
        defectRepository.save(new Defect(
                project, 2, "Bug 2", "Desc", "Steps", "Exp", "Act",
                DefectSeverity.HIGH, TestPriority.MEDIUM, DefectStatus.IN_PROGRESS,
                null, null, null, orgMember
        ));
        defectRepository.save(new Defect(
                project, 3, "Bug 3", "Desc", "Steps", "Exp", "Act",
                DefectSeverity.LOW, TestPriority.LOW, DefectStatus.RESOLVED,
                null, null, null, orgOwner
        ));

        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/defect-summary")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalDefects").value(3))
                .andExpect(jsonPath("$.data.openDefects").value(1))
                .andExpect(jsonPath("$.data.inProgressDefects").value(1))
                .andExpect(jsonPath("$.data.resolvedDefects").value(1))
                .andExpect(jsonPath("$.data.criticalDefects").value(1))
                .andExpect(jsonPath("$.data.highDefects").value(1))
                .andExpect(jsonPath("$.data.recentDefects", hasSize(3)));
    }

    @Test
    void createTestCase_withLinkedUserStoryAndRequirement() throws Exception {
        UserStory story = userStoryRepository.save(new UserStory(
                project, 101, "User Authentication Flow", "Allow user to login", "Acceptance Criteria",
                StoryPriority.HIGH, 5, orgMember, orgOwner
        ));

        Document prd = documentRepository.save(new Document(
                project, "Authentication PRD", DocumentType.PRODUCT_REQUIREMENTS, "PRD Content", null, orgOwner
        ));

        CreateTestCaseRequest request = new CreateTestCaseRequest(
                "Verify Login Credentials",
                "Ensure valid JWT is returned",
                "User must be registered",
                "1. POST /login",
                "200 OK with token",
                TestPriority.HIGH,
                TestCaseStatus.ACTIVE,
                null,
                story.getId(),
                prd.getId()
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/test-cases")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Verify Login Credentials"))
                .andExpect(jsonPath("$.data.userStoryId").value(story.getId().toString()))
                .andExpect(jsonPath("$.data.userStoryKey").value("QP-101"))
                .andExpect(jsonPath("$.data.userStoryTitle").value("User Authentication Flow"))
                .andExpect(jsonPath("$.data.requirementId").value(prd.getId().toString()))
                .andExpect(jsonPath("$.data.requirementTitle").value("Authentication PRD"));
    }

    @Test
    void linkTestCase_updatesRequirementLinks() throws Exception {
        TestCase tc = testCaseRepository.save(new TestCase(
                project, null, 1, "Stand-alone Test Case", "Desc", "Pre", "Steps", "Exp",
                TestPriority.MEDIUM, TestCaseStatus.DRAFT, orgOwner
        ));

        UserStory story = userStoryRepository.save(new UserStory(
                project, 102, "Cart Checkout Flow", "Allow checkout", "Acceptance Criteria",
                StoryPriority.HIGH, 3, orgMember, orgOwner
        ));

        LinkTestCaseRequest linkReq = new LinkTestCaseRequest(story.getId(), null);

        mockMvc.perform(patch("/api/v1/test-cases/" + tc.getId() + "/link")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(linkReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userStoryId").value(story.getId().toString()))
                .andExpect(jsonPath("$.data.userStoryKey").value("QP-102"));
    }

    @Test
    void getProjectTraceabilityMatrix_calculatesCoverageAndExecution() throws Exception {
        UserStory storyCovered = userStoryRepository.save(new UserStory(
                project, 103, "Payment Integration", "Payment gateway", "Criteria",
                StoryPriority.HIGH, 8, orgMember, orgOwner
        ));
        UserStory storyUncovered = userStoryRepository.save(new UserStory(
                project, 104, "Refund Management", "Process refunds", "Criteria",
                StoryPriority.LOW, 2, orgMember, orgOwner
        ));

        Document prd = documentRepository.save(new Document(
                project, "Billing PRD", DocumentType.PRODUCT_REQUIREMENTS, "Content", null, orgOwner
        ));

        TestCase tc1 = new TestCase(
                project, null, 1, "Test Stripe Payment", "Desc", "Pre", "Steps", "Exp",
                TestPriority.HIGH, TestCaseStatus.ACTIVE, orgOwner
        );
        tc1.setUserStory(storyCovered);
        tc1.setRequirement(prd);
        tc1 = testCaseRepository.save(tc1);

        TestExecution exec = testExecutionRepository.save(new TestExecution(
                tc1, project, TestExecutionStatus.PASSED, "Paid successfully", "Clean run", 120, orgMember
        ));

        defectRepository.save(new Defect(
                project, 1, "Minor receipt typo", "Desc", "Steps", "Exp", "Act",
                DefectSeverity.LOW, TestPriority.LOW, DefectStatus.RESOLVED,
                tc1, exec, orgMember, orgOwner
        ));

        testCaseRepository.save(new TestCase(
                project, null, 2, "Unlinked Security Scan", "Desc", "Pre", "Steps", "Exp",
                TestPriority.CRITICAL, TestCaseStatus.ACTIVE, orgMember
        ));

        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/traceability")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.projectKey").value("QP"))
                .andExpect(jsonPath("$.data.summary.totalRequirements").value(3))
                .andExpect(jsonPath("$.data.summary.coveredRequirements").value(2))
                .andExpect(jsonPath("$.data.summary.uncoveredRequirements").value(1))
                .andExpect(jsonPath("$.data.summary.totalTestCases").value(2))
                .andExpect(jsonPath("$.data.summary.executedTestCases").value(1))
                .andExpect(jsonPath("$.data.summary.neverExecutedTestCases").value(1))
                .andExpect(jsonPath("$.data.summary.totalDefects").value(1))
                .andExpect(jsonPath("$.data.items", hasSize(3)))
                .andExpect(jsonPath("$.data.unlinkedTestCases", hasSize(1)))
                .andExpect(jsonPath("$.data.unlinkedTestCases[0].title").value("Unlinked Security Scan"));
    }

    @Test
    void getProjectTraceabilityMatrix_outsiderForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/traceability")
                        .header("Authorization", outsiderToken))
                .andExpect(status().isForbidden());
    }
}
