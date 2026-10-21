import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestCaseManagementView } from './components/workspace/TestCaseManagementView';
import * as projectApi from './api/projects';
import * as testApi from './api/testing';
import * as requirementsApi from './api/requirements';
import * as documentsApi from './api/documents';
import type {
  ProjectSummary,
  TestSuite,
  TestCaseSummary,
  TestCaseDetail,
  TestExecution,
  ProjectExecutionSummary,
  DefectSummary,
  ProjectDefectSummary,
  UserStory,
  DocumentSummary,
  ProjectTraceabilityMatrix,
} from './types/entities';

describe('Phase 5: Test Case Management Components', () => {
  const mockProjects: ProjectSummary[] = [
    {
      id: 'proj-1',
      organizationId: 'org-1',
      organizationName: 'QA Systems',
      name: 'SDLC Platform Testing',
      projectKey: 'TEST',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'proj-2',
      organizationId: 'org-1',
      organizationName: 'QA Systems',
      name: 'Secondary Project',
      projectKey: 'SEC',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  ];

  const mockSuites: TestSuite[] = [
    {
      id: 'suite-1',
      projectId: 'proj-1',
      name: 'Authentication & Session Suite',
      description: 'Tests covering login, logout, and token security',
      testCaseCount: 2,
      createdByUsername: 'qa_lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'suite-2',
      projectId: 'proj-1',
      name: 'Sprint Planning Regression',
      description: 'Backlog and task management tests',
      testCaseCount: 1,
      createdByUsername: 'qa_lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockCases: TestCaseSummary[] = [
    {
      id: 'case-1',
      projectId: 'proj-1',
      projectKey: 'TEST',
      suiteId: 'suite-1',
      suiteName: 'Authentication & Session Suite',
      caseNumber: 1,
      caseKey: 'TEST-TC-1',
      title: 'Verify JWT Login with valid credentials',
      priority: 'HIGH',
      status: 'PASSED',
      userStoryId: 'story-1',
      userStoryKey: 'TEST-US-1',
      requirementId: 'doc-1',
      requirementTitle: 'Platform Architecture & PRD',
      createdByUsername: 'qa_engineer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'case-2',
      projectId: 'proj-1',
      projectKey: 'TEST',
      suiteId: 'suite-1',
      suiteName: 'Authentication & Session Suite',
      caseNumber: 2,
      caseKey: 'TEST-TC-2',
      title: 'Reject login on incorrect password with 401 Unauthorized',
      priority: 'CRITICAL',
      status: 'FAILED',
      createdByUsername: 'qa_engineer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'case-3',
      projectId: 'proj-1',
      projectKey: 'TEST',
      suiteId: 'suite-2',
      suiteName: 'Sprint Planning Regression',
      caseNumber: 3,
      caseKey: 'TEST-TC-3',
      title: 'Verify sprint status transition to ACTIVE',
      priority: 'MEDIUM',
      status: 'DRAFT',
      createdByUsername: 'qa_engineer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockDetail1: TestCaseDetail = {
    ...mockCases[0],
    projectName: 'SDLC Platform Testing',
    userStoryId: 'story-1',
    userStoryKey: 'TEST-US-1',
    userStoryTitle: 'User Authentication Flow',
    requirementId: 'doc-1',
    requirementTitle: 'Platform Architecture & PRD',
    description: 'Validates that a registered user can log in and retrieve a bearer token.',
    preconditions: 'User testuser@sdlc.com is created in the database and active.',
    testSteps: '1. POST /api/v1/auth/login with valid JSON body\n2. Verify HTTP response is 200 OK\n3. Extract token',
    expectedResult: 'HTTP 200 OK with success=true and valid non-empty bearer token.',
  };

  const mockStories: UserStory[] = [
    {
      id: 'story-1',
      projectId: 'proj-1',
      projectKey: 'TEST',
      storyNumber: 1,
      storyKey: 'TEST-US-1',
      title: 'User Authentication Flow',
      status: 'DONE',
      priority: 'HIGH',
      storyPoints: 5,
      taskCount: 2,
      completedTaskCount: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'story-2',
      projectId: 'proj-1',
      projectKey: 'TEST',
      storyNumber: 2,
      storyKey: 'TEST-US-2',
      title: 'Sprint Backlog Management',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      storyPoints: 8,
      taskCount: 3,
      completedTaskCount: 1,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockDocuments: DocumentSummary[] = [
    {
      id: 'doc-1',
      projectId: 'proj-1',
      projectKey: 'TEST',
      projectName: 'SDLC Platform Testing',
      title: 'Platform Architecture & PRD',
      type: 'PRODUCT_REQUIREMENTS',
      status: 'APPROVED',
      currentVersion: 1,
      createdByUsername: 'architect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockTraceabilityMatrix: ProjectTraceabilityMatrix = {
    projectId: 'proj-1',
    projectName: 'SDLC Platform Testing',
    projectKey: 'TEST',
    summary: {
      totalRequirements: 3,
      coveredRequirements: 2,
      uncoveredRequirements: 1,
      coveragePercentage: 66.7,
      totalTestCases: 3,
      executedTestCases: 2,
      neverExecutedTestCases: 1,
      executionPercentage: 66.7,
      totalDefects: 1,
      openDefects: 1,
    },
    items: [
      {
        id: 'doc-1',
        key: 'PRD-1',
        title: 'Platform Architecture & PRD',
        type: 'PRODUCT_REQUIREMENTS',
        status: 'APPROVED',
        priority: 'HIGH',
        hasCoverage: true,
        testCases: [
          {
            id: 'case-1',
            caseNumber: 1,
            caseKey: 'TEST-TC-1',
            title: 'Verify JWT Login with valid credentials',
            priority: 'HIGH',
            status: 'PASSED',
            latestExecutionStatus: 'PASSED',
            latestExecutionDate: new Date().toISOString(),
            latestExecutionDurationMs: 120,
            latestExecutionNotes: 'All passed',
            defects: [],
          },
          {
            id: 'case-2',
            caseNumber: 2,
            caseKey: 'TEST-TC-2',
            title: 'Reject login on incorrect password with 401 Unauthorized',
            priority: 'CRITICAL',
            status: 'FAILED',
            latestExecutionStatus: 'FAILED',
            latestExecutionDate: new Date().toISOString(),
            latestExecutionDurationMs: 300,
            latestExecutionNotes: 'Null pointer encountered',
            defects: [
              {
                id: 'def-1',
                projectId: 'proj-1',
                projectKey: 'TEST',
                defectNumber: 1,
                defectKey: 'TEST-BUG-1',
                title: 'NullPointerException on invalid JWT signature',
                severity: 'CRITICAL',
                priority: 'HIGH',
                status: 'OPEN',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
        ],
      },
      {
        id: 'story-2',
        key: 'TEST-US-2',
        title: 'Sprint Backlog Management',
        type: 'USER_STORY',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        hasCoverage: false,
        testCases: [],
      },
    ],
    unlinkedTestCases: [
      {
        id: 'case-3',
        caseNumber: 3,
        caseKey: 'TEST-TC-3',
        title: 'Verify sprint status transition to ACTIVE',
        priority: 'MEDIUM',
        status: 'DRAFT',
        latestExecutionStatus: null,
        latestExecutionDate: null,
        defects: [],
      },
    ],
  };

  const mockExecutions1: TestExecution[] = [
    {
      id: 'exec-1',
      testCaseId: 'case-1',
      testCaseKey: 'TEST-TC-1',
      testCaseTitle: 'Verify JWT Login with valid credentials',
      projectId: 'proj-1',
      status: 'PASSED',
      actualResult: 'Returned 200 OK with JWT',
      notes: 'Executed against Chrome 122',
      durationMs: 140,
      executedByUsername: 'qa_engineer',
      executedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'exec-0',
      testCaseId: 'case-1',
      testCaseKey: 'TEST-TC-1',
      testCaseTitle: 'Verify JWT Login with valid credentials',
      projectId: 'proj-1',
      status: 'FAILED',
      actualResult: 'Timeout connecting to auth service',
      notes: 'Initial test run before fix',
      durationMs: 5000,
      executedByUsername: 'qa_intern',
      executedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const mockProjectSummary: ProjectExecutionSummary = {
    projectId: 'proj-1',
    totalExecutions: 4,
    passedExecutions: 3,
    failedExecutions: 1,
    blockedExecutions: 0,
    skippedExecutions: 0,
    passRate: 75.0,
    recentExecutions: mockExecutions1,
  };

  const mockDefects: DefectSummary[] = [
    {
      id: 'def-1',
      projectId: 'proj-1',
      projectKey: 'TEST',
      defectNumber: 1,
      defectKey: 'TEST-BUG-1',
      title: 'NullPointerException on invalid JWT signature',
      severity: 'CRITICAL',
      priority: 'HIGH',
      status: 'OPEN',
      assigneeId: 'user-1',
      assigneeUsername: 'developer_1',
      reporterUsername: 'qa_engineer',
      testCaseId: 'case-1',
      testCaseKey: 'TEST-TC-1',
      testCaseTitle: 'Verify JWT Login with valid credentials',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'def-2',
      projectId: 'proj-1',
      projectKey: 'TEST',
      defectNumber: 2,
      defectKey: 'TEST-BUG-2',
      title: 'UI overflow in error toast',
      severity: 'LOW',
      priority: 'LOW',
      status: 'RESOLVED',
      assigneeId: 'user-2',
      assigneeUsername: 'designer_1',
      reporterUsername: 'qa_intern',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
    },
  ];

  const mockDefectSummary: ProjectDefectSummary = {
    totalDefects: 2,
    openDefects: 1,
    inProgressDefects: 0,
    inReviewDefects: 0,
    resolvedDefects: 1,
    closedDefects: 0,
    reopenedDefects: 0,
    criticalDefects: 1,
    highDefects: 0,
    recentDefects: mockDefects,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(projectApi, 'getAllProjects').mockResolvedValue(mockProjects);
    vi.spyOn(testApi, 'getTestSuites').mockResolvedValue(mockSuites);
    vi.spyOn(testApi, 'getTestCases').mockResolvedValue(mockCases);
    vi.spyOn(testApi, 'getProjectExecutionSummary').mockResolvedValue(mockProjectSummary);
    vi.spyOn(testApi, 'getTestCaseExecutions').mockResolvedValue(mockExecutions1);
    vi.spyOn(testApi, 'getProjectExecutions').mockResolvedValue(mockExecutions1);
    vi.spyOn(testApi, 'getProjectDefects').mockResolvedValue(mockDefects);
    vi.spyOn(testApi, 'getProjectDefectSummary').mockResolvedValue(mockDefectSummary);
    vi.spyOn(testApi, 'getTestCaseDefects').mockResolvedValue([mockDefects[0]]);
    vi.spyOn(requirementsApi, 'getStories').mockResolvedValue(mockStories);
    vi.spyOn(requirementsApi, 'getProjectStories').mockResolvedValue(mockStories);
    vi.spyOn(documentsApi, 'getDocumentsForProject').mockResolvedValue(mockDocuments);
    vi.spyOn(documentsApi, 'getProjectDocuments').mockResolvedValue(mockDocuments);
    vi.spyOn(testApi, 'getProjectTraceability').mockResolvedValue(mockTraceabilityMatrix);
    vi.spyOn(testApi, 'linkTestCase').mockImplementation(async (id, req) => ({
      ...mockDetail1,
      id,
      userStoryId: req.userStoryId || null,
      userStoryKey: req.userStoryId ? 'TEST-US-1' : undefined,
      requirementId: req.requirementId || null,
      requirementTitle: req.requirementId ? 'Platform Architecture & PRD' : undefined,
    }));
    vi.spyOn(testApi, 'getDefectById').mockImplementation(async (id: string) => ({
      ...mockDefects[0],
      id,
      projectName: 'SDLC Platform Testing',
      description: 'Stack trace details on invalid token',
      stepsToReproduce: '1. Send invalid token to /auth/login\n2. Observe 500 error',
      expectedResult: 'Returns 401 Unauthorized',
      actualResult: 'Returns 500 NullPointerException',
    }));
    vi.spyOn(testApi, 'createDefect').mockImplementation(async (_pid, payload) => ({
      id: 'def-3',
      projectId: 'proj-1',
      projectName: 'SDLC Platform Testing',
      projectKey: 'TEST',
      defectNumber: 3,
      defectKey: 'TEST-BUG-3',
      title: payload.title,
      description: payload.description,
      stepsToReproduce: payload.stepsToReproduce,
      expectedResult: payload.expectedResult,
      actualResult: payload.actualResult,
      severity: payload.severity || 'MEDIUM',
      priority: payload.priority || 'MEDIUM',
      status: payload.status || 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    vi.spyOn(testApi, 'updateDefectStatus').mockImplementation(async (id, status) => ({
      ...mockDefects[0],
      projectName: 'SDLC Platform Testing',
      id,
      status,
      resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : undefined,
    }));
    vi.spyOn(testApi, 'deleteDefect').mockResolvedValue();
    vi.spyOn(testApi, 'getTestCaseById').mockImplementation(async (id: string) => {
      if (id === 'case-1') return mockDetail1;
      return {
        ...mockCases[1],
        projectName: 'SDLC Platform Testing',
        description: 'Detail description',
        preconditions: 'None',
        testSteps: 'Steps',
        expectedResult: 'Expected 401',
      };
    });
  });

  it('renders test case management view with metrics, project selector, and test cases', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    expect(screen.getByText('Test Case Management & QA')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
      expect(screen.getByText('Verify JWT Login with valid credentials')).toBeInTheDocument();
      expect(screen.getByText('TEST-TC-2')).toBeInTheDocument();
      expect(screen.getByText('TEST-TC-3')).toBeInTheDocument();
    });

    // Check KPI metrics
    expect(screen.getByText('Total Cases')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1); // total 3
  });

  it('filters test cases by suite and search query', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
    });

    // 1. Filter by search query
    const searchInput = screen.getByPlaceholderText(/Search by ID/i);
    fireEvent.change(searchInput, { target: { value: 'sprint status' } });

    expect(screen.getByText('TEST-TC-3')).toBeInTheDocument();
    expect(screen.queryByText('TEST-TC-1')).not.toBeInTheDocument();
    expect(screen.queryByText('TEST-TC-2')).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();

    // 2. Filter by Suite
    const suiteSelect = screen.getByLabelText(/Suite:/i, { selector: 'select' });
    fireEvent.change(suiteSelect, { target: { value: 'suite-2' } });

    expect(screen.getByText('TEST-TC-3')).toBeInTheDocument();
    expect(screen.queryByText('TEST-TC-1')).not.toBeInTheDocument();
  });

  it('opens New Test Case modal, validates required title, and submits', async () => {
    const createSpy = vi.spyOn(testApi, 'createTestCase').mockResolvedValue({
      id: 'case-new',
      projectId: 'proj-1',
      projectName: 'SDLC Platform Testing',
      projectKey: 'TEST',
      suiteId: 'suite-1',
      suiteName: 'Authentication & Session Suite',
      caseNumber: 4,
      caseKey: 'TEST-TC-4',
      title: 'Verify CORS headers on API requests',
      description: 'Checks CORS origin allow-list',
      preconditions: 'None',
      testSteps: '1. Send OPTIONS request',
      expectedResult: 'Access-Control-Allow-Origin present',
      priority: 'MEDIUM',
      status: 'DRAFT',
      createdByUsername: 'qa_engineer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    // Click "New Test Case"
    fireEvent.click(screen.getByRole('button', { name: /New Test Case/i }));

    expect(screen.getByRole('heading', { name: /Create Test Case/i })).toBeInTheDocument();

    // Attempt submit with empty title
    const submitBtn = screen.getByRole('button', { name: /Create Test Case/i });
    const titleInput = screen.getByPlaceholderText(/e\.g\. Verify OAuth token/i);

    fireEvent.change(titleInput, { target: { value: '  ' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Test case title is required/i)).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();

    // Fill valid inputs
    fireEvent.change(titleInput, { target: { value: 'Verify CORS headers on API requests' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          title: 'Verify CORS headers on API requests',
        })
      );
    });
  });

  it('opens View Test Case detail modal and inspects steps and expected results', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
    });

    // Click Eye button
    const viewButtons = screen.getAllByTitle('View Test Case Details');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Execution Steps/i)).toBeInTheDocument();
      expect(screen.getByText(/POST \/api\/v1\/auth\/login with valid JSON/i)).toBeInTheDocument();
      expect(screen.getByText(/User testuser@sdlc\.com is created/i)).toBeInTheDocument();
      expect(screen.getByText(/HTTP 200 OK with success=true/i)).toBeInTheDocument();
    });
  });

  it('performs quick status update on test case', async () => {
    const statusSpy = vi.spyOn(testApi, 'updateTestCaseStatus').mockResolvedValue({
      ...mockCases[1],
      status: 'PASSED',
    });

    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-2')).toBeInTheDocument();
    });

    const statusDropdown = screen.getByLabelText(/Change status for TEST-TC-2/i);
    fireEvent.change(statusDropdown, { target: { value: 'PASSED' } });

    await waitFor(() => {
      expect(statusSpy).toHaveBeenCalledWith('case-2', { status: 'PASSED' });
    });
  });

  it('opens Manage Test Suites modal and creates a new test suite', async () => {
    const createSuiteSpy = vi.spyOn(testApi, 'createTestSuite').mockResolvedValue({
      id: 'suite-new',
      projectId: 'proj-1',
      name: 'Performance & Load Suite',
      description: 'JMeter and Gatling load tests',
      testCaseCount: 0,
      createdByUsername: 'qa_lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Test Suites \(2\)/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Test Suites \(2\)/i }));

    expect(screen.getByRole('heading', { name: /Manage Test Suites/i })).toBeInTheDocument();
    expect(screen.getAllByText('Authentication & Session Suite').length).toBeGreaterThanOrEqual(1);

    const nameInput = screen.getByPlaceholderText(/Suite Name \(e\.g\. Smoke Tests/i);
    fireEvent.change(nameInput, { target: { value: 'Performance & Load Suite' } });

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Suite/i }));

    await waitFor(() => {
      expect(createSuiteSpy).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          name: 'Performance & Load Suite',
        })
      );
    });
  });

  it('renders project execution summary with real statistics and pass rate', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('Project Test Execution Performance')).toBeInTheDocument();
      expect(screen.getAllByText(/75%/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/3 Passed/i)).toBeInTheDocument();
      expect(screen.getByText(/1 Failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Executions \(4\)/i })).toBeInTheDocument();
    });
  });

  it('opens Execute Test Case modal, validates required actual result, and records execution', async () => {
    const executeSpy = vi.spyOn(testApi, 'executeTestCase').mockResolvedValue({
      id: 'exec-new',
      testCaseId: 'case-1',
      testCaseKey: 'TEST-TC-1',
      testCaseTitle: 'Verify JWT Login with valid credentials',
      projectId: 'proj-1',
      status: 'FAILED',
      actualResult: '500 Server Error - DB connection pool exhausted',
      notes: 'Observed during stress testing',
      durationMs: 245,
      executedByUsername: 'qa_engineer',
      executedAt: new Date().toISOString(),
    });

    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
    });

    // Click "Run" button for TEST-TC-1
    const runButtons = screen.getAllByTitle(/Run test TEST-TC-1/i);
    fireEvent.click(runButtons[0]);

    // Verify modal title
    expect(screen.getByRole('heading', { name: /Execute Test Case/i })).toBeInTheDocument();

    // Verify validation: clear actual result and submit
    const submitBtn = screen.getByRole('button', { name: /Record Execution/i });
    const actualResultInput = screen.getByPlaceholderText(/Describe what occurred during execution/i);
    fireEvent.change(actualResultInput, { target: { value: '   ' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Actual result is required/i)).toBeInTheDocument();
    expect(executeSpy).not.toHaveBeenCalled();

    // Fill valid data: select FAILED, fill result, notes, duration
    const failedOutcomeBtn = screen.getByLabelText(/Select FAILED outcome/i);
    fireEvent.click(failedOutcomeBtn);

    fireEvent.change(actualResultInput, {
      target: { value: '500 Server Error - DB connection pool exhausted' },
    });

    const notesInput = screen.getByPlaceholderText(/Optional notes, log traces/i);
    fireEvent.change(notesInput, { target: { value: 'Observed during stress testing' } });

    const durationInput = screen.getByPlaceholderText(/e\.g\. 150/i);
    fireEvent.change(durationInput, { target: { value: '245' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(executeSpy).toHaveBeenCalledWith(
        'case-1',
        expect.objectContaining({
          status: 'FAILED',
          actualResult: '500 Server Error - DB connection pool exhausted',
          notes: 'Observed during stress testing',
          durationMs: 245,
        })
      );
    });
  });

  it('displays execution history inside Test Case details modal', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
    });

    // Open detail modal
    const viewButtons = screen.getAllByTitle('View Test Case Details');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Execution History \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText('Returned 200 OK with JWT')).toBeInTheDocument();
      expect(screen.getByText('Timeout connecting to auth service')).toBeInTheDocument();
      expect(screen.getAllByText(/@qa_engineer/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/@qa_intern/i)).toBeInTheDocument();
    });
  });

  it('allows executing test case directly from Test Case details modal and triggers rerun', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
    });

    // Open detail modal
    const viewButtons = screen.getAllByTitle('View Test Case Details');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Run Test/i })).toBeInTheDocument();
    });

    // Click "Run Test" in detail modal
    fireEvent.click(screen.getByRole('button', { name: /Run Test/i }));

    expect(screen.getByRole('heading', { name: /Execute Test Case/i })).toBeInTheDocument();
  });

  it('switches to Defect Tracking tab and renders defect metrics and list', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
    });

    // Switch to Defect Tracking tab
    fireEvent.click(screen.getByRole('button', { name: /Defect Tracking & Bugs/i }));

    await waitFor(() => {
      expect(screen.getByText('Defect Tracking & Bug Management')).toBeInTheDocument();
      expect(screen.getByText('TEST-BUG-1')).toBeInTheDocument();
      expect(screen.getByText('NullPointerException on invalid JWT signature')).toBeInTheDocument();
      expect(screen.getByText('TEST-BUG-2')).toBeInTheDocument();
    });

    // Verify defect metrics
    expect(screen.getByText('Total Defects')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('opens Create Defect modal, validates title, and creates a defect', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    // Switch to Defect Tracking tab
    fireEvent.click(screen.getByRole('button', { name: /Defect Tracking & Bugs/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New Defect/i })).toBeInTheDocument();
    });

    // Open Create Modal
    fireEvent.click(screen.getByRole('button', { name: /New Defect/i }));
    expect(screen.getByRole('heading', { name: /Report New Defect/i })).toBeInTheDocument();

    // Trigger validation with empty title
    fireEvent.click(screen.getByRole('button', { name: /^Create Defect$/i }));
    expect(screen.getByText(/Defect title is required/i)).toBeInTheDocument();

    // Enter title and submit
    const titleInput = screen.getByPlaceholderText(/e\.g\. Authentication filter throws/i);
    fireEvent.change(titleInput, { target: { value: 'Unhandled NullPointerException on bad token' } });

    fireEvent.click(screen.getByRole('button', { name: /^Create Defect$/i }));

    await waitFor(() => {
      expect(testApi.createDefect).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          title: 'Unhandled NullPointerException on bad token',
        })
      );
    });
  });

  it('opens Defect Detail modal and performs status transition', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    // Switch to Defect Tracking tab
    fireEvent.click(screen.getByRole('button', { name: /Defect Tracking & Bugs/i }));

    await waitFor(() => {
      expect(screen.getByText('TEST-BUG-1')).toBeInTheDocument();
    });

    // Click on defect key to open detail modal
    fireEvent.click(screen.getByText('TEST-BUG-1'));

    await waitFor(() => {
      expect(screen.getByText(/CRITICAL Severity/i)).toBeInTheDocument();
      expect(screen.getByText('Steps to Reproduce')).toBeInTheDocument();
      expect(screen.getByText(/Start Work \(In Progress\)/i)).toBeInTheDocument();
    });

    // Transition status to IN_PROGRESS
    fireEvent.click(screen.getByText(/Start Work \(In Progress\)/i));

    await waitFor(() => {
      expect(testApi.updateDefectStatus).toHaveBeenCalledWith('def-1', 'IN_PROGRESS');
    });
  });

  it('displays linked defects in Test Case Details modal', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
    });

    // Open test case detail modal
    const viewButtons = screen.getAllByTitle('View Test Case Details');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Linked Defects & Bugs \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText('TEST-BUG-1')).toBeInTheDocument();
    });
  });

  it('allows reporting bug directly from failed execution run in history', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
    });

    // Open detail modal
    const viewButtons = screen.getAllByTitle('View Test Case Details');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Timeout connecting to auth service')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Report Bug/i }).length).toBeGreaterThanOrEqual(1);
    });

    // Click Report Bug on the failed execution run
    fireEvent.click(screen.getAllByRole('button', { name: /Report Bug/i })[0]);

    // Should switch to defects view and open the Create Defect modal prefilled
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Report New Defect/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue(/\[Defect\] Verify JWT Login with valid credentials/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // Phase 5, Step 4: Traceability Tests
  // ==========================================

  it('switches to Requirements Traceability tab and renders coverage statistics and linked matrix', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    // Switch to Requirements Traceability tab
    const traceTab = screen.getByRole('button', { name: /Requirements Traceability/i });
    fireEvent.click(traceTab);

    // Verify traceability matrix summary KPIs render
    await waitFor(() => {
      expect(screen.getByText('Requirement Coverage')).toBeInTheDocument();
      expect(screen.getAllByText('66.7%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Uncovered Requirements')).toBeInTheDocument();
      expect(screen.getAllByText('Never Executed').length).toBeGreaterThanOrEqual(1);
    });

    // Check requirement title and user stories in matrix
    expect(screen.getByText('Platform Architecture & PRD')).toBeInTheDocument();
    expect(screen.getByText('PRD-1')).toBeInTheDocument();
    expect(screen.getByText('TEST-US-2')).toBeInTheDocument();
    expect(screen.getByText('Sprint Backlog Management')).toBeInTheDocument();

    // Check linked test cases
    expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
    expect(screen.getByText('TEST-TC-2')).toBeInTheDocument();
    // Check related defect chip in matrix
    expect(screen.getByText('TEST-BUG-1')).toBeInTheDocument();
  });

  it('identifies uncovered requirements and filters matrix', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    fireEvent.click(screen.getByRole('button', { name: /Requirements Traceability/i }));

    await waitFor(() => {
      expect(screen.getByText('Sprint Backlog Management')).toBeInTheDocument();
      expect(screen.getByText('No Linked Tests')).toBeInTheDocument();
    });

    // Toggle uncovered only filter
    const coverageSelect = screen.getByLabelText(/Coverage:/i);
    fireEvent.change(coverageSelect, { target: { value: 'UNCOVERED' } });

    // Only uncovered item should be in table
    expect(screen.getByText('Sprint Backlog Management')).toBeInTheDocument();
    expect(screen.queryByText('Platform Architecture & PRD')).not.toBeInTheDocument();
  });

  it('identifies unlinked orphan test cases and shows never executed status', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    fireEvent.click(screen.getByRole('button', { name: /Requirements Traceability/i }));

    await waitFor(() => {
      expect(screen.getByText(/Unlinked Project Test Cases/i)).toBeInTheDocument();
      expect(screen.getByText('TEST-TC-3')).toBeInTheDocument();
      expect(screen.getAllByText('Never Executed').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('allows quick linking a test case to a user story or PRD specification from Traceability matrix', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    fireEvent.click(screen.getByRole('button', { name: /Requirements Traceability/i }));

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-3')).toBeInTheDocument();
    });

    // Click Link button on unlinked test case
    const linkButtons = screen.getAllByRole('button', { name: /Link to Requirement/i });
    fireEvent.click(linkButtons[0]);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Link Test Case to Requirement/i })).toBeInTheDocument();
    });

    // Select User Story
    const storySelect = screen.getByLabelText(/Linked User Story/i);
    fireEvent.change(storySelect, { target: { value: 'story-2' } });

    // Submit linkage
    fireEvent.click(screen.getByRole('button', { name: /Save Traceability Link/i }));

    await waitFor(() => {
      expect(testApi.linkTestCase).toHaveBeenCalledWith('case-3', {
        userStoryId: 'story-2',
        requirementId: null,
      });
    });
  });

  it('displays linked requirements and user stories in Test Case details modal', async () => {
    render(<TestCaseManagementView selectedProjectId="proj-1" propProjects={mockProjects} />);

    await waitFor(() => {
      expect(screen.getByText('TEST-TC-1')).toBeInTheDocument();
    });

    // Open detail modal for TEST-TC-1
    const viewButtons = screen.getAllByTitle('View Test Case Details');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Traceability & Coverage')).toBeInTheDocument();
      expect(screen.getByText('Linked User Story')).toBeInTheDocument();
      expect(screen.getByText('User Authentication Flow')).toBeInTheDocument();
      expect(screen.getByText('Linked PRD Specification')).toBeInTheDocument();
      expect(screen.getAllByText('Platform Architecture & PRD').length).toBeGreaterThanOrEqual(1);
    });
  });
});
