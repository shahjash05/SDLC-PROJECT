import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit3,
  Eye,
  X,
  Search,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FolderGit2,
  Check,
  Play,
  History,
  Bug,
  Link2,
  BookOpen,
  GitMerge,
} from 'lucide-react';
import { getAllProjects } from '../../api/projects';
import { getProjectStories } from '../../api/requirements';
import { getProjectDocuments } from '../../api/documents';
import {
  getTestSuites,
  createTestSuite,
  deleteTestSuite,
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  updateTestCaseStatus,
  deleteTestCase,
  executeTestCase,
  getTestCaseExecutions,
  getProjectExecutionSummary,
  getProjectExecutions,
  getTestCaseDefects,
} from '../../api/testing';
import { DefectTrackingView, getDefectSeverityBadge, getDefectStatusBadge } from './DefectTrackingView';
import { TraceabilityMatrixView } from './TraceabilityMatrixView';
import type {
  ProjectSummary,
  TestSuite,
  TestCaseSummary,
  TestCaseDetail,
  TestCaseStatus,
  UserStory,
  DocumentSummary,
  TestPriority,
  CreateTestCasePayload,
  UpdateTestCasePayload,
  TestExecution,
  TestExecutionStatus,
  ProjectExecutionSummary,
  DefectSummary,
  CreateDefectPayload,
} from '../../types/entities';

interface TestCaseManagementViewProps {
  selectedProjectId?: string | null;
  propProjects?: ProjectSummary[];
}

export function getPriorityBadge(priority?: TestPriority) {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'HIGH':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'MEDIUM':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'LOW':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getStatusBadge(status?: TestCaseStatus) {
  switch (status) {
    case 'PASSED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'FAILED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'BLOCKED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'SKIPPED':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'ACTIVE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'DEPRECATED':
      return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    case 'DRAFT':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function getExecutionStatusBadge(status?: TestExecutionStatus | TestCaseStatus) {
  switch (status) {
    case 'PASSED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'FAILED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'BLOCKED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'SKIPPED':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function TestCaseManagementView({
  selectedProjectId,
  propProjects,
}: TestCaseManagementViewProps) {
  // Project state
  const [projects, setProjects] = useState<ProjectSummary[]>(propProjects || []);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    selectedProjectId || propProjects?.[0]?.id || ''
  );

  // Test data
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [testCases, setTestCases] = useState<TestCaseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [suiteFilter, setSuiteFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuitesModal, setShowSuitesModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [showRecentExecutionsModal, setShowRecentExecutionsModal] = useState(false);

  // Subview Switcher: 'test-cases' vs 'defects' vs 'traceability'
  const [activeSubView, setActiveSubView] = useState<'test-cases' | 'defects' | 'traceability'>('test-cases');
  const [prefilledDefect, setPrefilledDefect] = useState<CreateDefectPayload | null>(null);

  // Requirements & Stories available for linking
  const [projectStories, setProjectStories] = useState<UserStory[]>([]);
  const [projectPrds, setProjectPrds] = useState<DocumentSummary[]>([]);

  // Active / Detailed Test Case
  const [activeCaseDetail, setActiveCaseDetail] = useState<TestCaseDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [caseExecutions, setCaseExecutions] = useState<TestExecution[]>([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  const [caseDefects, setCaseDefects] = useState<DefectSummary[]>([]);
  const [loadingCaseDefects, setLoadingCaseDefects] = useState(false);

  // Execution Summary & Project Executions
  const [execSummary, setExecSummary] = useState<ProjectExecutionSummary | null>(null);
  const [projectExecutions, setProjectExecutions] = useState<TestExecution[]>([]);
  const [loadingProjectExecutions, setLoadingProjectExecutions] = useState(false);

  // Executing Test Case state
  const [executingCase, setExecutingCase] = useState<TestCaseSummary | null>(null);
  const [executingDetail, setExecutingDetail] = useState<TestCaseDetail | null>(null);
  const [execStatus, setExecStatus] = useState<TestExecutionStatus>('PASSED');
  const [execActualResult, setExecActualResult] = useState('');
  const [execNotes, setExecNotes] = useState('');
  const [execDuration, setExecDuration] = useState('');
  const [execSubmitting, setExecSubmitting] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);

  // Form states for Create & Edit
  const [formData, setFormData] = useState<CreateTestCasePayload>({
    title: '',
    description: '',
    preconditions: '',
    testSteps: '',
    expectedResult: '',
    priority: 'MEDIUM',
    status: 'DRAFT',
    suiteId: null,
    userStoryId: null,
    requirementId: null,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  // New Suite Form state
  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuiteDescription, setNewSuiteDescription] = useState('');
  const [suiteSubmitting, setSuiteSubmitting] = useState(false);
  const [suiteError, setSuiteError] = useState<string | null>(null);

  // Load Projects if not passed
  useEffect(() => {
    if (propProjects && propProjects.length > 0) {
      setProjects(propProjects);
      if (!activeProjectId) {
        setActiveProjectId(selectedProjectId || propProjects[0].id);
      }
    } else {
      getAllProjects()
        .then((data) => {
          setProjects(data);
          if (data.length > 0 && !activeProjectId) {
            setActiveProjectId(selectedProjectId || data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [propProjects, selectedProjectId, activeProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Load Suites, Test Cases, and Execution Summary for active project
  const loadTestingData = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const [suites, cases, summary, stories, docs] = await Promise.all([
        getTestSuites(activeProjectId),
        getTestCases(activeProjectId),
        getProjectExecutionSummary(activeProjectId).catch(() => null),
        getProjectStories(activeProjectId).catch(() => []),
        getProjectDocuments(activeProjectId).catch(() => []),
      ]);
      setTestSuites(suites);
      setTestCases(cases);
      if (summary) {
        setExecSummary(summary);
      }
      setProjectStories(stories);
      setProjectPrds(docs.filter((d) => d.type === 'PRODUCT_REQUIREMENTS'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load test data');
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    loadTestingData();
  }, [loadTestingData]);

  // Open Detail
  const handleOpenDetail = async (caseId: string) => {
    setLoadingDetail(true);
    setLoadingExecutions(true);
    setLoadingCaseDefects(true);
    setShowDetailModal(true);
    try {
      const [detail, executions, defects] = await Promise.all([
        getTestCaseById(caseId),
        getTestCaseExecutions(caseId).catch(() => []),
        getTestCaseDefects(caseId).catch(() => []),
      ]);
      setActiveCaseDetail(detail);
      setCaseExecutions(executions);
      setCaseDefects(defects);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch test case details');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
      setLoadingExecutions(false);
      setLoadingCaseDefects(false);
    }
  };

  const handleReportDefectFromExecution = (exec: TestExecution, tc: TestCaseDetail) => {
    setPrefilledDefect({
      title: `[Defect] ${tc.title}`,
      stepsToReproduce: tc.testSteps || '',
      expectedResult: tc.expectedResult || '',
      actualResult: exec.actualResult || '',
      severity: 'HIGH',
      priority: 'HIGH',
      status: 'OPEN',
      testCaseId: tc.id,
      testExecutionId: exec.id,
    });
    setShowDetailModal(false);
    setActiveSubView('defects');
  };

  const handleReportDefectFromTestCase = (tc: TestCaseDetail) => {
    setPrefilledDefect({
      title: `[Defect] ${tc.title}`,
      stepsToReproduce: tc.testSteps || '',
      expectedResult: tc.expectedResult || '',
      actualResult: '',
      severity: 'MEDIUM',
      priority: 'MEDIUM',
      status: 'OPEN',
      testCaseId: tc.id,
      testExecutionId: null,
    });
    setShowDetailModal(false);
    setActiveSubView('defects');
  };

  // Open Execute
  const handleOpenExecute = async (tc: TestCaseSummary | TestCaseDetail) => {
    setExecutingCase(tc);
    setExecStatus('PASSED');
    setExecActualResult('');
    setExecNotes('');
    setExecDuration('');
    setExecError(null);
    setExecutingDetail(null);
    setShowExecuteModal(true);

    try {
      const detail = await getTestCaseById(tc.id);
      setExecutingDetail(detail);
    } catch {
      // keep basic summary if detail fails
    }
  };

  // Submit Execution
  const handleExecuteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingCase) return;

    if (!execActualResult.trim()) {
      setExecError('Actual result is required.');
      return;
    }

    setExecSubmitting(true);
    setExecError(null);

    const durationNum = execDuration.trim() ? parseInt(execDuration.trim(), 10) : undefined;

    try {
      const newExecution = await executeTestCase(executingCase.id, {
        status: execStatus,
        actualResult: execActualResult.trim(),
        notes: execNotes.trim() || undefined,
        durationMs: isNaN(durationNum as number) ? undefined : durationNum,
      });

      // Update case status in state immediately
      setTestCases((prev) =>
        prev.map((c) =>
          c.id === executingCase.id ? { ...c, status: execStatus as TestCaseStatus } : c
        )
      );

      // If viewing details of this case, prepend execution to history
      if (activeCaseDetail && activeCaseDetail.id === executingCase.id) {
        setActiveCaseDetail((prev) =>
          prev ? { ...prev, status: execStatus as TestCaseStatus } : null
        );
        setCaseExecutions((prev) => [newExecution, ...prev]);
      }

      setShowExecuteModal(false);
      // Refresh summary
      if (activeProjectId) {
        getProjectExecutionSummary(activeProjectId)
          .then(setExecSummary)
          .catch(() => {});
      }
    } catch (err: unknown) {
      setExecError(err instanceof Error ? err.message : 'Failed to record test execution');
    } finally {
      setExecSubmitting(false);
    }
  };

  // Open Recent Executions Modal
  const handleOpenRecentExecutions = async () => {
    if (!activeProjectId) return;
    setLoadingProjectExecutions(true);
    setShowRecentExecutionsModal(true);
    try {
      const logs = await getProjectExecutions(activeProjectId);
      setProjectExecutions(logs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load project executions');
    } finally {
      setLoadingProjectExecutions(false);
    }
  };

  // Open Edit
  const handleOpenEdit = async (caseId: string) => {
    setEditingCaseId(caseId);
    setFormError(null);
    try {
      const detail = await getTestCaseById(caseId);
      setFormData({
        title: detail.title,
        description: detail.description || '',
        preconditions: detail.preconditions || '',
        testSteps: detail.testSteps || '',
        expectedResult: detail.expectedResult || '',
        priority: detail.priority,
        status: detail.status,
        suiteId: detail.suiteId || null,
        userStoryId: detail.userStoryId || null,
        requirementId: detail.requirementId || null,
      });
      setShowEditModal(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch test case for editing');
    }
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      preconditions: '',
      testSteps: '1. Navigate to ...\n2. Perform action ...\n3. Verify output ...',
      expectedResult: '',
      priority: 'MEDIUM',
      status: 'DRAFT',
      suiteId: suiteFilter !== 'ALL' ? suiteFilter : null,
      userStoryId: null,
      requirementId: null,
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId) return;
    if (!formData.title.trim()) {
      setFormError('Test case title is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await createTestCase(activeProjectId, {
        ...formData,
        title: formData.title.trim(),
        suiteId: formData.suiteId || undefined,
        userStoryId: formData.userStoryId || undefined,
        requirementId: formData.requirementId || undefined,
      });
      setShowCreateModal(false);
      loadTestingData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create test case');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaseId) return;
    if (!formData.title.trim()) {
      setFormError('Test case title is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload: UpdateTestCasePayload = {
        ...formData,
        title: formData.title.trim(),
        suiteId: formData.suiteId || null,
        userStoryId: formData.userStoryId || null,
        requirementId: formData.requirementId || null,
      };
      const updated = await updateTestCase(editingCaseId, payload);
      setShowEditModal(false);
      if (activeCaseDetail?.id === editingCaseId) {
        setActiveCaseDetail(updated);
      }
      loadTestingData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update test case');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Change
  const handleQuickStatusChange = async (caseId: string, newStatus: TestCaseStatus) => {
    try {
      await updateTestCaseStatus(caseId, { status: newStatus });
      setTestCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
      );
      if (activeCaseDetail?.id === caseId) {
        setActiveCaseDetail({ ...activeCaseDetail, status: newStatus });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update test status');
    }
  };

  // Delete Test Case
  const handleDeleteCase = async (caseId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete test case "${title}"?`)) {
      return;
    }
    try {
      await deleteTestCase(caseId);
      if (showDetailModal && activeCaseDetail?.id === caseId) {
        setShowDetailModal(false);
      }
      loadTestingData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete test case');
    }
  };

  // Create Test Suite
  const handleCreateSuiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !newSuiteName.trim()) return;
    setSuiteSubmitting(true);
    setSuiteError(null);
    try {
      await createTestSuite(activeProjectId, {
        name: newSuiteName.trim(),
        description: newSuiteDescription.trim() || undefined,
      });
      setNewSuiteName('');
      setNewSuiteDescription('');
      loadTestingData();
    } catch (err: unknown) {
      setSuiteError(err instanceof Error ? err.message : 'Failed to create test suite');
    } finally {
      setSuiteSubmitting(false);
    }
  };

  // Delete Test Suite
  const handleDeleteSuite = async (suiteId: string, name: string) => {
    if (!confirm(`Delete test suite "${name}"? Existing test cases will become standalone.`)) {
      return;
    }
    try {
      await deleteTestSuite(suiteId);
      if (suiteFilter === suiteId) {
        setSuiteFilter('ALL');
      }
      loadTestingData();
    } catch (err: unknown) {
      setSuiteError(err instanceof Error ? err.message : 'Failed to delete test suite');
    }
  };

  // Filtered cases
  const filteredCases = testCases.filter((tc) => {
    if (suiteFilter !== 'ALL' && tc.suiteId !== suiteFilter) return false;
    if (statusFilter !== 'ALL' && tc.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && tc.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tc.title.toLowerCase().includes(q);
      const matchKey = tc.caseKey.toLowerCase().includes(q);
      const matchSuite = tc.suiteName?.toLowerCase().includes(q);
      return matchTitle || matchKey || matchSuite;
    }
    return true;
  });

  // Calculate Metrics
  const totalCount = testCases.length;
  const passedCount = testCases.filter((c) => c.status === 'PASSED').length;
  const failedCount = testCases.filter((c) => c.status === 'FAILED').length;
  const blockedCount = testCases.filter((c) => c.status === 'BLOCKED').length;
  const activeCount = testCases.filter((c) => c.status === 'ACTIVE').length;
  const draftCount = testCases.filter((c) => c.status === 'DRAFT').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Project Controls */}
      <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">
              Test Case Management &amp; QA
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Author and organize test suites, define step-by-step test cases, and manage verification outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
              <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={activeProjectId}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="text-xs bg-transparent border-none text-slate-800 font-medium focus:outline-none cursor-pointer"
                aria-label="Select Project"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectKey})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSuitesModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Test Suites ({testSuites.length})
          </button>

          <button
            type="button"
            onClick={handleOpenRecentExecutions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            Executions ({execSummary?.totalExecutions ?? 0})
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={!activeProjectId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            New Test Case
          </button>
        </div>
      </div>

      {/* Sub-view Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubView('test-cases')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubView === 'test-cases'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Test Cases &amp; Suites</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-medium">
            {testCases.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('defects')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubView === 'defects'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bug className="w-4 h-4 text-rose-600" />
          <span>Defect Tracking &amp; Bugs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('traceability')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubView === 'traceability'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GitMerge className="w-4 h-4 text-indigo-600" />
          <span>Requirements Traceability</span>
        </button>
      </div>

      {activeSubView === 'defects' && (
        <DefectTrackingView
          activeProjectId={activeProjectId}
          propProjects={projects}
          prefilledDefect={prefilledDefect}
          onClearPrefilled={() => setPrefilledDefect(null)}
        />
      )}

      {activeSubView === 'traceability' && (
        <TraceabilityMatrixView
          selectedProjectId={activeProjectId}
          propProjects={projects}
        />
      )}

      {activeSubView === 'test-cases' && (
        <>
          {/* Real Project Execution Summary Banner */}
          {execSummary && execSummary.totalExecutions > 0 && (
        <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex flex-col items-center justify-center font-bold">
              <span className="text-xs leading-none">{execSummary.passRate}%</span>
              <span className="text-[9px] font-normal text-emerald-600">pass</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Project Test Execution Performance
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Pass rate of <strong>{execSummary.passRate}%</strong> across{' '}
                <strong>{execSummary.totalExecutions}</strong> recorded executions.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded font-semibold border border-emerald-200">
              {execSummary.passedExecutions} Passed
            </span>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded font-semibold border border-rose-200">
              {execSummary.failedExecutions} Failed
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded font-semibold border border-amber-200">
              {execSummary.blockedExecutions} Blocked
            </span>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded font-semibold border border-purple-200">
              {execSummary.skippedExecutions} Skipped
            </span>
          </div>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Cases
          </span>
          <span className="text-lg font-bold text-slate-900">{totalCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Passed
          </span>
          <span className="text-lg font-bold text-emerald-700">{passedCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-rose-600 uppercase tracking-wider block flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Failed
          </span>
          <span className="text-lg font-bold text-rose-700">{failedCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-amber-600 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Blocked
          </span>
          <span className="text-lg font-bold text-amber-700">{blockedCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3" /> Active
          </span>
          <span className="text-lg font-bold text-blue-700">{activeCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Draft
          </span>
          <span className="text-lg font-bold text-slate-600">{draftCount}</span>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID (e.g. TC-1), title, or suite..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/50"
            />
          </div>

          {/* Suite Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="suite-filter-select" className="text-xs text-slate-500 whitespace-nowrap">Suite:</label>
            <select
              id="suite-filter-select"
              value={suiteFilter}
              onChange={(e) => setSuiteFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Suites</option>
              {testSuites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.testCaseCount})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="priority-filter-select" className="text-xs text-slate-500 whitespace-nowrap">Priority:</label>
            <select
              id="priority-filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-100 pt-2.5 overflow-x-auto">
          {(
            [
              'ALL',
              'ACTIVE',
              'PASSED',
              'FAILED',
              'BLOCKED',
              'SKIPPED',
              'DRAFT',
              'DEPRECATED',
            ] as const
          ).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Test Cases Table / List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-md p-12 text-center text-xs text-slate-500">
          Loading test cases...
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-md p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">No Test Cases Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || suiteFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'No test cases match your filter criteria. Try resetting filters.'
                : 'Get started by creating your first QA test case for this project.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Test Case
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-100 overflow-hidden">
          {filteredCases.map((tc) => (
            <div
              key={tc.id}
              className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {tc.caseKey}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(tc.id)}
                    className="text-xs font-semibold text-slate-900 hover:text-blue-600 text-left truncate"
                  >
                    {tc.title}
                  </button>
                  {tc.suiteName && (
                    <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {tc.suiteName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                  <span>Author: @{tc.createdByUsername || 'user'}</span>
                  <span>•</span>
                  <span>{new Date(tc.createdAt).toLocaleDateString()}</span>
                  {tc.userStoryKey && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                        {tc.userStoryKey}
                      </span>
                    </>
                  )}
                  {tc.requirementTitle && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[150px]">
                        <BookOpen className="w-3 h-3 text-slate-500 shrink-0" />
                        {tc.requirementTitle}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Priority Badge */}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(
                    tc.priority
                  )}`}
                >
                  {tc.priority}
                </span>

                {/* Status Dropdown */}
                <select
                  value={tc.status}
                  onChange={(e) =>
                    handleQuickStatusChange(tc.id, e.target.value as TestCaseStatus)
                  }
                  className={`text-[11px] font-semibold border rounded px-2 py-1 cursor-pointer focus:outline-none ${getStatusBadge(
                    tc.status
                  )}`}
                  aria-label={`Change status for ${tc.caseKey}`}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="SKIPPED">SKIPPED</option>
                  <option value="DEPRECATED">DEPRECATED</option>
                </select>

                {/* Actions */}
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
                  <button
                    type="button"
                    onClick={() => handleOpenExecute(tc)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded transition-colors"
                    title={`Run test ${tc.caseKey}`}
                  >
                    <Play className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                    Run
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(tc.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="View Test Case Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(tc.id)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    title="Edit Test Case"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCase(tc.id, tc.title)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Delete Test Case"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* CREATE TEST CASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-slate-700" />
                Create Test Case
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded p-3">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Case Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify OAuth token refresh on expiry"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test Suite
                  </label>
                  <select
                    value={formData.suiteId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, suiteId: e.target.value || null })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="">(None - Standalone)</option>
                    {testSuites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as TestPriority })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as TestCaseStatus })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="SKIPPED">SKIPPED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                    Link User Story / Requirement
                  </label>
                  <select
                    value={formData.userStoryId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, userStoryId: e.target.value || null })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="">(None - Standalone / No Story)</option>
                    {projectStories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.storyKey ? `[${s.storyKey}] ` : ''}{s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                    Link PRD Specification Document
                  </label>
                  <select
                    value={formData.requirementId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, requirementId: e.target.value || null })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="">(None - No PRD Linked)</option>
                    {projectPrds.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} (v{doc.currentVersion || 1})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Goal
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of what this test case verifies..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preconditions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. User account exists in database and has ROLE_DEVELOPER"
                  value={formData.preconditions}
                  onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Steps
                </label>
                <textarea
                  rows={4}
                  placeholder="1. Send POST /api/v1/...\n2. Check status..."
                  value={formData.testSteps}
                  onChange={(e) => setFormData({ ...formData, testSteps: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Result
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Returns HTTP 200 OK with success=true and valid response body"
                  value={formData.expectedResult}
                  onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Test Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEST CASE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-slate-700" />
                Edit Test Case
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded p-3">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Case Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test Suite
                  </label>
                  <select
                    value={formData.suiteId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, suiteId: e.target.value || null })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="">(None - Standalone)</option>
                    {testSuites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as TestPriority })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as TestCaseStatus })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="SKIPPED">SKIPPED</option>
                    <option value="DEPRECATED">DEPRECATED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                    Link User Story / Requirement
                  </label>
                  <select
                    value={formData.userStoryId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, userStoryId: e.target.value || null })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="">(None - Standalone / No Story)</option>
                    {projectStories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.storyKey ? `[${s.storyKey}] ` : ''}{s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                    Link PRD Specification Document
                  </label>
                  <select
                    value={formData.requirementId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, requirementId: e.target.value || null })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="">(None - No PRD Linked)</option>
                    {projectPrds.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} (v{doc.currentVersion || 1})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Goal
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preconditions
                </label>
                <textarea
                  rows={2}
                  value={formData.preconditions}
                  onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Steps
                </label>
                <textarea
                  rows={4}
                  value={formData.testSteps}
                  onChange={(e) => setFormData({ ...formData, testSteps: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Result
                </label>
                <textarea
                  rows={2}
                  value={formData.expectedResult}
                  onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW TEST CASE DETAIL MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {loadingDetail ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading test case details...
              </div>
            ) : activeCaseDetail ? (
              <>
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {activeCaseDetail.caseKey}
                      </span>
                      <h3 className="text-base font-semibold text-slate-900">
                        {activeCaseDetail.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
                      <span>Project: {activeCaseDetail.projectName}</span>
                      {activeCaseDetail.suiteName && (
                        <>
                          <span>•</span>
                          <span>Suite: {activeCaseDetail.suiteName}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Author: @{activeCaseDetail.createdByUsername || 'user'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenExecute(activeCaseDetail)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                      title="Execute this test case now"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Run Test
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenEdit(activeCaseDetail.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDetailModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Priority & Status Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Priority:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityBadge(
                        activeCaseDetail.priority
                      )}`}
                    >
                      {activeCaseDetail.priority}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">|</span>
                    <span className="text-xs text-slate-500 font-medium ml-1">Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadge(
                        activeCaseDetail.status
                      )}`}
                    >
                      {activeCaseDetail.status}
                    </span>
                  </div>

                  {/* Quick Execution Status Actions */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 mr-1">Mark as:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(activeCaseDetail.id, 'PASSED')}
                      className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(activeCaseDetail.id, 'FAILED')}
                      className="px-2 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Fail
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(activeCaseDetail.id, 'BLOCKED')}
                      className="px-2 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded transition-colors"
                    >
                      Block
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(activeCaseDetail.id, 'ACTIVE')}
                      className="px-2 py-1 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded transition-colors"
                    >
                      Active
                    </button>
                  </div>
                </div>

                {/* Traceability & Requirements Section */}
                <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                      Traceability & Coverage
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenEdit(activeCaseDetail.id);
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Update Links
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Linked User Story</div>
                      {activeCaseDetail.userStoryId ? (
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                            {activeCaseDetail.userStoryKey || 'STORY'}
                          </span>
                          <span className="truncate">{activeCaseDetail.userStoryTitle || 'Story Linked'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No User Story linked</span>
                      )}
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-100 rounded">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Linked PRD Specification</div>
                      {activeCaseDetail.requirementId ? (
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{activeCaseDetail.requirementTitle || 'PRD Document'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No PRD Document linked</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {activeCaseDetail.description && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Description
                    </h4>
                    <p className="text-xs text-slate-800 bg-slate-50 border border-slate-100 rounded p-3 whitespace-pre-wrap">
                      {activeCaseDetail.description}
                    </p>
                  </div>
                )}

                {/* Preconditions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Preconditions
                  </h4>
                  <div className="text-xs text-slate-800 bg-slate-50 border border-slate-100 rounded p-3 whitespace-pre-wrap">
                    {activeCaseDetail.preconditions || (
                      <span className="text-slate-400 italic">No specific preconditions defined.</span>
                    )}
                  </div>
                </div>

                {/* Test Steps */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Execution Steps
                  </h4>
                  <div className="text-xs font-mono text-slate-800 bg-slate-50 border border-slate-100 rounded p-3 whitespace-pre-wrap leading-relaxed">
                    {activeCaseDetail.testSteps || (
                      <span className="text-slate-400 italic font-sans">No steps specified.</span>
                    )}
                  </div>
                </div>

                {/* Expected Result */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Result
                  </h4>
                  <div className="text-xs text-slate-800 bg-emerald-50/50 border border-emerald-100 rounded p-3 whitespace-pre-wrap">
                    {activeCaseDetail.expectedResult || (
                      <span className="text-slate-400 italic">No expected result specified.</span>
                    )}
                  </div>
                </div>

                {/* Execution History Section */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      Execution History ({caseExecutions.length})
                    </h4>
                    {caseExecutions.length > 0 && (
                      <span className="text-[11px] text-slate-500">
                        Latest Outcome: <strong className="text-slate-700">{caseExecutions[0].status}</strong> (
                        {new Date(caseExecutions[0].executedAt).toLocaleString()})
                      </span>
                    )}
                  </div>

                  {loadingExecutions ? (
                    <div className="py-4 text-center text-xs text-slate-400">Loading history...</div>
                  ) : caseExecutions.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded text-center text-xs text-slate-500">
                      No execution runs recorded yet. Click &quot;Run Test&quot; above to execute this test case and record results.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {caseExecutions.map((exec) => (
                        <div
                          key={exec.id}
                          className="bg-white border border-slate-200 rounded p-3 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getExecutionStatusBadge(
                                  exec.status
                                )}`}
                              >
                                {exec.status}
                              </span>
                              <span className="text-slate-600">
                                by <strong className="text-slate-900">@{exec.executedByUsername || 'user'}</strong>
                              </span>
                              {exec.durationMs != null && (
                                <span className="text-[11px] text-slate-400">
                                  ({exec.durationMs} ms)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {(exec.status === 'FAILED' || exec.status === 'BLOCKED') && (
                                <button
                                  type="button"
                                  onClick={() => handleReportDefectFromExecution(exec, activeCaseDetail)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded transition-colors"
                                  title="Log defect for this failed execution"
                                >
                                  <Bug className="w-3 h-3" /> Report Bug
                                </button>
                              )}
                              <span className="text-[11px] text-slate-400">
                                {new Date(exec.executedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-slate-700 font-medium">Actual Result:</div>
                            <div className="text-slate-900 bg-slate-50 border border-slate-100 rounded px-2.5 py-1.5 whitespace-pre-wrap font-mono text-[11px]">
                              {exec.actualResult}
                            </div>
                          </div>

                          {exec.notes && (
                            <div className="space-y-1">
                              <div className="text-slate-500 font-medium">Notes &amp; Evidence:</div>
                              <div className="text-slate-700 bg-slate-50/50 border border-slate-100 rounded px-2.5 py-1.5 whitespace-pre-wrap text-[11px]">
                                {exec.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked Defects Section */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Bug className="w-3.5 h-3.5 text-rose-600" />
                      Linked Defects &amp; Bugs ({caseDefects.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleReportDefectFromTestCase(activeCaseDetail)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Report Bug
                    </button>
                  </div>

                  {loadingCaseDefects ? (
                    <div className="py-4 text-center text-xs text-slate-400">Loading defects...</div>
                  ) : caseDefects.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded text-center text-xs text-slate-500">
                      No defects currently linked to this test case.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {caseDefects.map((d) => (
                        <div
                          key={d.id}
                          className="bg-white border border-slate-200 rounded p-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                              {d.defectKey}
                            </span>
                            <span className="font-medium text-slate-900">{d.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] border ${getDefectSeverityBadge(
                                d.severity
                              )}`}
                            >
                              {d.severity}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] border ${getDefectStatusBadge(
                                d.status
                              )}`}
                            >
                              {d.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* MANAGE TEST SUITES MODAL */}
      {showSuitesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-700" />
                Manage Test Suites
              </h3>
              <button
                type="button"
                onClick={() => setShowSuitesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {suiteError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded p-3">
                {suiteError}
              </div>
            )}

            {/* Create Suite Form */}
            <form onSubmit={handleCreateSuiteSubmit} className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Add New Suite</h4>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Suite Name (e.g. Smoke Tests, Regression Suite)"
                  value={newSuiteName}
                  onChange={(e) => setNewSuiteName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-1.5 bg-white text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Optional description..."
                  value={newSuiteDescription}
                  onChange={(e) => setNewSuiteDescription(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-1.5 bg-white text-slate-900 focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={suiteSubmitting}
                  className="px-3 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                  {suiteSubmitting ? 'Adding...' : '+ Add Suite'}
                </button>
              </div>
            </form>

            {/* List Suites */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Existing Suites ({testSuites.length})
              </h4>
              {testSuites.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No test suites created yet.</p>
              ) : (
                <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {testSuites.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 flex items-center justify-between gap-3 text-xs bg-white"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{s.name}</span>
                        <span className="text-[11px] text-slate-500 ml-2">
                          ({s.testCaseCount} {s.testCaseCount === 1 ? 'case' : 'cases'})
                        </span>
                        {s.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{s.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSuite(s.id, s.name)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete Suite"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSuitesModal(false)}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTE TEST CASE MODAL */}
      {showExecuteModal && executingCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  Execute Test Case
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-mono font-bold text-slate-700">{executingCase.caseKey}</span> — {executingCase.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExecuteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reference context: Steps & Expected Result */}
            {executingDetail && (
              <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2 text-xs">
                {executingDetail.preconditions && (
                  <div>
                    <span className="font-semibold text-slate-700">Preconditions: </span>
                    <span className="text-slate-600">{executingDetail.preconditions}</span>
                  </div>
                )}
                {executingDetail.testSteps && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Test Steps:</span>
                    <pre className="font-mono text-[11px] text-slate-800 bg-white border border-slate-200 rounded p-2 whitespace-pre-wrap">
                      {executingDetail.testSteps}
                    </pre>
                  </div>
                )}
                {executingDetail.expectedResult && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Expected Result:</span>
                    <div className="text-[11px] text-emerald-900 bg-emerald-50/70 border border-emerald-100 rounded p-2">
                      {executingDetail.expectedResult}
                    </div>
                  </div>
                )}
              </div>
            )}

            {execError && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{execError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteSubmit} className="space-y-4">
              {/* Execution Result Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Execution Result Outcome <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'] as TestExecutionStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      aria-label={`Select ${st} outcome`}
                      onClick={() => setExecStatus(st)}
                      className={`px-3 py-2 text-xs font-bold rounded border transition-all text-center flex items-center justify-center gap-1.5 ${
                        execStatus === st
                          ? st === 'PASSED'
                            ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300'
                            : st === 'FAILED'
                            ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-300'
                            : st === 'BLOCKED'
                            ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-300'
                            : 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-300'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actual Result Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Result / Observed Behavior <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what occurred during execution (e.g. Returned 200 OK with expected payload)..."
                  value={execActualResult}
                  onChange={(e) => setExecActualResult(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Notes & Evidence */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes &amp; Evidence <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes, log traces, failure stack trace, or link to artifact/screenshot..."
                  value={execNotes}
                  onChange={(e) => setExecNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Duration (ms) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration in Milliseconds <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={execDuration}
                  onChange={(e) => setExecDuration(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExecuteModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={execSubmitting}
                  className="px-4 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium rounded transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  {execSubmitting ? 'Recording...' : 'Record Execution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECENT PROJECT EXECUTIONS MODAL */}
      {showRecentExecutionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                Project Execution History
              </h3>
              <button
                type="button"
                onClick={() => setShowRecentExecutionsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingProjectExecutions ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading executions...</div>
            ) : projectExecutions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded">
                No test executions have been recorded yet for this project.
              </div>
            ) : (
              <div className="border border-slate-200 rounded divide-y divide-slate-100 overflow-hidden max-h-[60vh] overflow-y-auto">
                {projectExecutions.map((log) => (
                  <div key={log.id} className="p-3 bg-white space-y-1.5 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.testCaseKey}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getExecutionStatusBadge(
                            log.status
                          )}`}
                        >
                          {log.status}
                        </span>
                        <span className="font-medium text-slate-800">{log.testCaseTitle}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.executedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Executor: @{log.executedByUsername || 'user'}</span>
                      {log.durationMs != null && <span>• Duration: {log.durationMs} ms</span>}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-800">
                      {log.actualResult}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRecentExecutionsModal(false)}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
