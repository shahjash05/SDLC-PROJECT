import { API_BASE_URL, type ApiResponse } from './client';
import { getStoredToken } from './auth';
import type {
  TestSuite,
  TestCaseSummary,
  TestCaseDetail,
  CreateTestSuitePayload,
  UpdateTestSuitePayload,
  CreateTestCasePayload,
  UpdateTestCasePayload,
  UpdateTestCaseStatusPayload,
  TestCaseStatus,
  TestPriority,
  DefectSummary,
  DefectDetail,
  CreateDefectPayload,
  UpdateDefectPayload,
  ProjectDefectSummary,
  DefectStatus,
  ProjectTraceabilityMatrix,
  LinkTestCasePayload,
} from '../types/entities';

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response, fallbackError: string): Promise<T> {
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    // response not json
  }

  if (!res.ok) {
    const errorMsg = body?.message || `${fallbackError} (${res.status})`;
    throw new Error(errorMsg);
  }

  return body!.data;
}

// ==========================================
// Test Suites API
// ==========================================

export async function getTestSuites(projectId: string): Promise<TestSuite[]> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/test-suites`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TestSuite[]>(res, 'Failed to fetch test suites');
}

export async function getTestSuiteById(suiteId: string): Promise<TestSuite> {
  const res = await fetch(`${API_BASE_URL}/test-suites/${suiteId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TestSuite>(res, 'Failed to fetch test suite');
}

export async function createTestSuite(
  projectId: string,
  payload: CreateTestSuitePayload
): Promise<TestSuite> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/test-suites`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TestSuite>(res, 'Failed to create test suite');
}

export async function updateTestSuite(
  suiteId: string,
  payload: UpdateTestSuitePayload
): Promise<TestSuite> {
  const res = await fetch(`${API_BASE_URL}/test-suites/${suiteId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TestSuite>(res, 'Failed to update test suite');
}

export async function deleteTestSuite(suiteId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/test-suites/${suiteId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse<void>(res, 'Failed to delete test suite');
}

// ==========================================
// Test Cases API
// ==========================================

export async function getTestCases(
  projectId: string,
  filters?: {
    suiteId?: string;
    status?: TestCaseStatus;
    priority?: TestPriority;
  }
): Promise<TestCaseSummary[]> {
  const params = new URLSearchParams();
  if (filters?.suiteId) params.append('suiteId', filters.suiteId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/test-cases${qs}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TestCaseSummary[]>(res, 'Failed to fetch test cases');
}

export async function getTestCaseById(caseId: string): Promise<TestCaseDetail> {
  const res = await fetch(`${API_BASE_URL}/test-cases/${caseId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TestCaseDetail>(res, 'Failed to fetch test case');
}

export async function createTestCase(
  projectId: string,
  payload: CreateTestCasePayload
): Promise<TestCaseDetail> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/test-cases`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TestCaseDetail>(res, 'Failed to create test case');
}

export async function updateTestCase(
  caseId: string,
  payload: UpdateTestCasePayload
): Promise<TestCaseDetail> {
  const res = await fetch(`${API_BASE_URL}/test-cases/${caseId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TestCaseDetail>(res, 'Failed to update test case');
}

export async function updateTestCaseStatus(
  caseId: string,
  payload: UpdateTestCaseStatusPayload
): Promise<TestCaseSummary> {
  const res = await fetch(`${API_BASE_URL}/test-cases/${caseId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TestCaseSummary>(res, 'Failed to update test case status');
}

export async function deleteTestCase(caseId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/test-cases/${caseId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse<void>(res, 'Failed to delete test case');
}

// ==========================================
// Test Execution & History API (Phase 5, Step 2)
// ==========================================

export async function executeTestCase(
  caseId: string,
  payload: import('../types/entities').ExecuteTestCasePayload
): Promise<import('../types/entities').TestExecution> {
  const res = await fetch(`${API_BASE_URL}/test-cases/${caseId}/executions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<import('../types/entities').TestExecution>(res, 'Failed to record test execution');
}

export async function getTestCaseExecutions(
  caseId: string
): Promise<import('../types/entities').TestExecution[]> {
  const res = await fetch(`${API_BASE_URL}/test-cases/${caseId}/executions`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<import('../types/entities').TestExecution[]>(res, 'Failed to fetch test execution history');
}

export async function getProjectExecutionSummary(
  projectId: string
): Promise<import('../types/entities').ProjectExecutionSummary> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/test-execution-summary`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<import('../types/entities').ProjectExecutionSummary>(
    res,
    'Failed to fetch project execution summary'
  );
}

export async function getProjectExecutions(
  projectId: string
): Promise<import('../types/entities').TestExecution[]> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/test-executions`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<import('../types/entities').TestExecution[]>(
    res,
    'Failed to fetch project executions'
  );
}

// ============================================================================
// Phase 5, Step 3: Defect Tracking & Bug Management API
// ============================================================================

export async function getProjectDefects(
  projectId: string,
  filters?: { status?: string; severity?: string; priority?: string; assigneeId?: string }
): Promise<DefectSummary[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
  if (filters?.severity && filters.severity !== 'ALL') params.append('severity', filters.severity);
  if (filters?.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
  if (filters?.assigneeId && filters.assigneeId !== 'ALL') params.append('assigneeId', filters.assigneeId);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/defects${query}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<DefectSummary[]>(res, 'Failed to fetch project defects');
}

export async function getProjectDefectSummary(
  projectId: string
): Promise<ProjectDefectSummary> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/defect-summary`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ProjectDefectSummary>(res, 'Failed to fetch project defect summary');
}

export async function getDefectById(defectId: string): Promise<DefectDetail> {
  const res = await fetch(`${API_BASE_URL}/defects/${defectId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<DefectDetail>(res, 'Failed to fetch defect details');
}

export async function getTestCaseDefects(testCaseId: string): Promise<DefectSummary[]> {
  const res = await fetch(`${API_BASE_URL}/test-cases/${testCaseId}/defects`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<DefectSummary[]>(res, 'Failed to fetch defects for test case');
}

export async function createDefect(
  projectId: string,
  payload: CreateDefectPayload
): Promise<DefectDetail> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/defects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<DefectDetail>(res, 'Failed to create defect');
}

export async function updateDefect(
  defectId: string,
  payload: UpdateDefectPayload
): Promise<DefectDetail> {
  const res = await fetch(`${API_BASE_URL}/defects/${defectId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<DefectDetail>(res, 'Failed to update defect');
}

export async function assignDefect(
  defectId: string,
  assigneeId: string | null
): Promise<DefectDetail> {
  const res = await fetch(`${API_BASE_URL}/defects/${defectId}/assign`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ assigneeId }),
  });
  return handleResponse<DefectDetail>(res, 'Failed to assign defect');
}

export async function updateDefectStatus(
  defectId: string,
  status: DefectStatus
): Promise<DefectDetail> {
  const res = await fetch(`${API_BASE_URL}/defects/${defectId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<DefectDetail>(res, 'Failed to update defect status');
}

export async function deleteDefect(defectId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/defects/${defectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res, 'Failed to delete defect');
}

// ============================================================================
// Phase 5, Step 4: Requirements & Testing Traceability API
// ============================================================================

export async function getProjectTraceability(
  projectId: string
): Promise<ProjectTraceabilityMatrix> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/traceability`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ProjectTraceabilityMatrix>(
    res,
    'Failed to fetch project requirements & testing traceability matrix'
  );
}

export async function linkTestCase(
  caseId: string,
  payload: LinkTestCasePayload
): Promise<TestCaseDetail> {
  const res = await fetch(`${API_BASE_URL}/test-cases/${caseId}/link`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TestCaseDetail>(res, 'Failed to update test case requirement link');
}


