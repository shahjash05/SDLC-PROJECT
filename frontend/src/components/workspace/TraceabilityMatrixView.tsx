import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Link2,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  BookOpen,
  Plus,
  Unlink,
  ChevronDown,
  ChevronRight,
  FolderGit2,
  Bug,
  ShieldCheck,
  AlertCircle,
  FileQuestion,
  X,
} from 'lucide-react';
import { getAllProjects } from '../../api/projects';
import {
  getProjectTraceability,
  linkTestCase,
  getTestCases,
} from '../../api/testing';
import { getProjectStories } from '../../api/requirements';
import { getProjectDocuments } from '../../api/documents';
import type {
  ProjectSummary,
  ProjectTraceabilityMatrix,
  TraceabilityItem,
  UnlinkedTestCase,
  TestCaseSummary,
  UserStory,
  DocumentSummary,
} from '../../types/entities';

interface TraceabilityMatrixViewProps {
  selectedProjectId?: string;
  propProjects?: ProjectSummary[];
}

export const TraceabilityMatrixView: React.FC<TraceabilityMatrixViewProps> = ({
  selectedProjectId: initialProjectId,
  propProjects,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>(propProjects || []);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || (propProjects && propProjects.length > 0 ? propProjects[0].id : '')
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<ProjectTraceabilityMatrix | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<'ALL' | 'COVERED' | 'UNCOVERED'>('ALL');
  const [executionFilter, setExecutionFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'UNEXECUTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'USER_STORY' | 'PRODUCT_REQUIREMENTS'>('ALL');
  const [showUnlinkedSection, setShowUnlinkedSection] = useState(true);

  // Quick Link Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTargetRequirement, setLinkTargetRequirement] = useState<{
    id: string;
    key: string;
    title: string;
    type: string;
  } | null>(null);
  const [linkTargetTestCaseId, setLinkTargetTestCaseId] = useState<string>('');
  const [availableTestCases, setAvailableTestCases] = useState<TestCaseSummary[]>([]);
  const [availableStories, setAvailableStories] = useState<UserStory[]>([]);
  const [availablePrds, setAvailablePrds] = useState<DocumentSummary[]>([]);
  const [linkModalSelectedStoryId, setLinkModalSelectedStoryId] = useState<string>('');
  const [linkModalSelectedPrdId, setLinkModalSelectedPrdId] = useState<string>('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Sync propProjects
  useEffect(() => {
    if (propProjects && propProjects.length > 0) {
      setProjects(propProjects);
      if (!selectedProjectId) {
        setSelectedProjectId(propProjects[0].id);
      }
    } else if (projects.length === 0) {
      getAllProjects()
        .then((data) => {
          setProjects(data);
          if (data.length > 0 && !selectedProjectId) {
            setSelectedProjectId(data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [propProjects, selectedProjectId, projects.length]);

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  // Load Traceability Matrix Data
  const loadTraceabilityData = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProjectTraceability(selectedProjectId);
      setMatrix(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load traceability matrix');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadTraceabilityData();
  }, [loadTraceabilityData]);

  // Load available items for linking modal
  const loadAvailableLinkingData = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const [cases, stories, docs] = await Promise.all([
        getTestCases(selectedProjectId).catch(() => []),
        getProjectStories(selectedProjectId).catch(() => []),
        getProjectDocuments(selectedProjectId).catch(() => []),
      ]);
      setAvailableTestCases(cases);
      setAvailableStories(stories);
      setAvailablePrds(docs.filter((d) => d.type === 'PRODUCT_REQUIREMENTS'));
    } catch {
      // Ignore
    }
  }, [selectedProjectId]);

  // Open Link Modal from Requirement Row
  const handleOpenLinkModalForRequirement = (req: TraceabilityItem) => {
    setLinkTargetRequirement({
      id: req.id,
      key: req.key,
      title: req.title,
      type: req.type,
    });
    setLinkTargetTestCaseId('');
    if (req.type === 'USER_STORY') {
      setLinkModalSelectedStoryId(req.id);
      setLinkModalSelectedPrdId('');
    } else {
      setLinkModalSelectedPrdId(req.id);
      setLinkModalSelectedStoryId('');
    }
    setLinkError(null);
    loadAvailableLinkingData();
    setShowLinkModal(true);
  };

  // Open Link Modal from Unlinked Test Case
  const handleOpenLinkModalForTestCase = (tc: UnlinkedTestCase) => {
    setLinkTargetRequirement(null);
    setLinkTargetTestCaseId(tc.id);
    setLinkModalSelectedStoryId('');
    setLinkModalSelectedPrdId('');
    setLinkError(null);
    loadAvailableLinkingData();
    setShowLinkModal(true);
  };

  // Submit Link
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTargetTestCaseId) {
      setLinkError('Please select a test case to link');
      return;
    }
    if (!linkModalSelectedStoryId && !linkModalSelectedPrdId) {
      setLinkError('Please select at least one user story or PRD requirement to link');
      return;
    }

    setLinking(true);
    setLinkError(null);
    try {
      await linkTestCase(linkTargetTestCaseId, {
        userStoryId: linkModalSelectedStoryId || null,
        requirementId: linkModalSelectedPrdId || null,
      });
      setShowLinkModal(false);
      loadTraceabilityData();
    } catch (err: unknown) {
      setLinkError(err instanceof Error ? err.message : 'Failed to link test case');
    } finally {
      setLinking(false);
    }
  };

  // Unlink Test Case
  const handleUnlink = async (testCaseId: string, requirementType: string) => {
    if (!confirm('Are you sure you want to unlink this test case from this requirement?')) {
      return;
    }
    try {
      if (requirementType === 'USER_STORY') {
        await linkTestCase(testCaseId, { userStoryId: null });
      } else {
        await linkTestCase(testCaseId, { requirementId: null });
      }
      loadTraceabilityData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to unlink test case');
    }
  };

  // Filtered Traceability Items
  const filteredItems = useMemo(() => {
    if (!matrix) return [];
    const q = searchQuery.toLowerCase().trim();

    return matrix.items.filter((item) => {
      // 1. Coverage Filter
      if (coverageFilter === 'COVERED' && !item.hasCoverage) return false;
      if (coverageFilter === 'UNCOVERED' && item.hasCoverage) return false;

      // 2. Type Filter
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;

      // 3. Execution Filter
      if (executionFilter !== 'ALL') {
        if (!item.hasCoverage) return false;
        if (executionFilter === 'PASSED') {
          const hasPassed = item.testCases.some((tc) => tc.latestExecutionStatus === 'PASSED');
          if (!hasPassed) return false;
        } else if (executionFilter === 'FAILED') {
          const hasFailed = item.testCases.some((tc) => tc.latestExecutionStatus === 'FAILED');
          if (!hasFailed) return false;
        } else if (executionFilter === 'UNEXECUTED') {
          const hasUnexecuted = item.testCases.some((tc) => !tc.latestExecutionStatus);
          if (!hasUnexecuted) return false;
        }
      }

      // 4. Search Filter
      if (q) {
        const matchesReq =
          item.key.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q);

        const matchesTestCase = item.testCases.some(
          (tc) =>
            tc.caseKey.toLowerCase().includes(q) ||
            tc.title.toLowerCase().includes(q) ||
            (tc.latestExecutionStatus && tc.latestExecutionStatus.toLowerCase().includes(q)) ||
            tc.defects.some((d) => d.defectKey.toLowerCase().includes(q) || d.title.toLowerCase().includes(q))
        );

        if (!matchesReq && !matchesTestCase) return false;
      }

      return true;
    });
  }, [matrix, searchQuery, coverageFilter, executionFilter, typeFilter]);

  // Helper Badge Color Functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE':
      case 'APPROVED':
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
      case 'ACTIVE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_REVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'BACKLOG':
      case 'DRAFT':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getExecutionBadge = (status?: string | null) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASSED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
            <XCircle className="w-3 h-3 text-rose-600" /> FAILED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> BLOCKED
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            SKIPPED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded">
            <Clock className="w-3 h-3 text-amber-600" /> Never Executed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-slate-800" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Requirements & Testing Traceability
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end matrix linking requirements and user stories to test cases, execution runs, and defects.
          </p>
        </div>

        {/* Project Selector & Refresh */}
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs">
              <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
              <select
                aria-label="Project:"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.projectKey}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={loadTraceabilityData}
            disabled={loading}
            title="Refresh Traceability Matrix"
            className="p-1.5 bg-white border border-slate-300 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            ✕
          </button>
        </div>
      )}

      {/* KPI Metrics Summary Strip */}
      {matrix && matrix.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Card 1: Requirement Coverage */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Requirement Coverage
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900">
                {matrix.summary.coveragePercentage}%
              </span>
              <span className="text-[11px] text-slate-500">
                ({matrix.summary.coveredRequirements}/{matrix.summary.totalRequirements})
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, matrix.summary.coveragePercentage))}%` }}
              />
            </div>
          </div>

          {/* Card 2: Uncovered Requirements */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Uncovered Requirements
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-xl font-bold ${
                  matrix.summary.uncoveredRequirements > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {matrix.summary.uncoveredRequirements}
              </span>
              <span className="text-[11px] text-slate-500">No linked tests</span>
            </div>
            <div className="mt-2">
              {matrix.summary.uncoveredRequirements > 0 ? (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Action Required
                </span>
              ) : (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 100% Coverage
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Test Execution Rate */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Test Execution Rate
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900">
                {matrix.summary.executionPercentage}%
              </span>
              <span className="text-[11px] text-slate-500">
                ({matrix.summary.executedTestCases}/{matrix.summary.totalTestCases})
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, matrix.summary.executionPercentage))}%` }}
              />
            </div>
          </div>

          {/* Card 4: Never Executed Test Cases */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Never Executed
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-xl font-bold ${
                  matrix.summary.neverExecutedTestCases > 0 ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {matrix.summary.neverExecutedTestCases}
              </span>
              <span className="text-[11px] text-slate-500">Unverified cases</span>
            </div>
            <div className="mt-2">
              <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Pending Execution
              </span>
            </div>
          </div>

          {/* Card 5: Linked Defects */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Defects
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-xl font-bold ${
                  matrix.summary.openDefects > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {matrix.summary.openDefects}
              </span>
              <span className="text-[11px] text-slate-500">
                / {matrix.summary.totalDefects} Total
              </span>
            </div>
            <div className="mt-2">
              <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                <Bug className="w-2.5 h-2.5 text-rose-500" /> Linked to QA Items
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60 p-2.5 rounded border border-slate-200">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-white border border-slate-300 rounded px-2.5 py-1 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by requirement key, title, test case, defect..."
            className="w-full bg-transparent outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Coverage Filter */}
          <div className="flex items-center gap-1">
            <label className="text-slate-500 font-medium">Coverage:</label>
            <select
              aria-label="Coverage:"
              value={coverageFilter}
              onChange={(e) => setCoverageFilter(e.target.value as 'ALL' | 'COVERED' | 'UNCOVERED')}
              className="bg-white border border-slate-300 rounded px-2 py-1 outline-none"
            >
              <option value="ALL">All Requirements</option>
              <option value="COVERED">Covered Only</option>
              <option value="UNCOVERED">⚠️ Uncovered Only</option>
            </select>
          </div>

          {/* Execution Filter */}
          <div className="flex items-center gap-1">
            <label className="text-slate-500 font-medium">Execution:</label>
            <select
              aria-label="Execution:"
              value={executionFilter}
              onChange={(e) => setExecutionFilter(e.target.value as 'ALL' | 'PASSED' | 'FAILED' | 'UNEXECUTED')}
              className="bg-white border border-slate-300 rounded px-2 py-1 outline-none"
            >
              <option value="ALL">All Test Results</option>
              <option value="PASSED">Passing Tests</option>
              <option value="FAILED">Failing Tests</option>
              <option value="UNEXECUTED">⚠️ Never Executed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <label className="text-slate-500 font-medium">Type:</label>
            <select
              aria-label="Type:"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'USER_STORY' | 'PRODUCT_REQUIREMENTS')}
              className="bg-white border border-slate-300 rounded px-2 py-1 outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="USER_STORY">User Stories</option>
              <option value="PRODUCT_REQUIREMENTS">PRDs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Traceability Table */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Traceability Matrix ({filteredItems.length} Requirements)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Showing requirements with test coverage and defect associations
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
            Loading traceability matrix...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <FileQuestion className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            No requirements match the selected filters or search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-72">Requirement / Story</th>
                  <th className="py-2.5 px-3 w-40">Coverage Status</th>
                  <th className="py-2.5 px-3">Linked Test Cases & Execution Runs</th>
                  <th className="py-2.5 px-3 w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition">
                    {/* Requirement details */}
                    <td className="py-3 px-3 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.type === 'USER_STORY' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                              <Layers className="w-2.5 h-2.5" /> Story
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                              <BookOpen className="w-2.5 h-2.5" /> PRD
                            </span>
                          )}
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {item.key}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="font-medium text-slate-900 leading-snug">
                          {item.title}
                        </p>
                      </div>
                    </td>

                    {/* Coverage status */}
                    <td className="py-3 px-3 align-top">
                      {item.hasCoverage ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Covered ({item.testCases.length})
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {item.testCases.filter((tc) => tc.latestExecutionStatus === 'PASSED').length} Passing /{' '}
                            {item.testCases.filter((tc) => tc.latestExecutionStatus === 'FAILED').length} Failing
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            No Linked Tests
                          </span>
                          <span className="block text-[10px] text-amber-700">
                            Missing QA verification
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Linked Test Cases list */}
                    <td className="py-3 px-3 align-top">
                      {item.testCases.length === 0 ? (
                        <div className="text-slate-400 italic text-[11px] py-1 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          No test cases currently verify this requirement.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {item.testCases.map((tc) => (
                            <div
                              key={tc.id}
                              className="bg-slate-50/70 border border-slate-200 rounded p-2 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-slate-800">
                                    {tc.caseKey}
                                  </span>
                                  <span className="text-slate-900 font-medium">
                                    {tc.title}
                                  </span>
                                  <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1 rounded">
                                    {tc.priority}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px]">
                                  {getExecutionBadge(tc.latestExecutionStatus)}
                                  {tc.latestExecutionDate && (
                                    <span className="text-slate-400 text-[10px]">
                                      Run on {new Date(tc.latestExecutionDate).toLocaleDateString()}
                                      {tc.latestExecutionDurationMs != null ? ` (${tc.latestExecutionDurationMs}ms)` : ''}
                                    </span>
                                  )}
                                </div>

                                {/* Linked defects */}
                                {tc.defects && tc.defects.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                    <span className="text-[10px] font-semibold text-rose-700 flex items-center gap-0.5">
                                      <Bug className="w-3 h-3" /> Defects:
                                    </span>
                                    {tc.defects.map((d) => (
                                      <span
                                        key={d.id}
                                        title={`${d.title} (${d.status})`}
                                        className="inline-flex items-center gap-1 text-[10px] bg-rose-50 border border-rose-200 text-rose-800 px-1.5 py-0.2 rounded font-mono"
                                      >
                                        {d.defectKey}
                                        <span className="text-[9px] text-rose-600">[{d.severity}]</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleUnlink(tc.id, item.type)}
                                title="Unlink test case from requirement"
                                className="text-slate-400 hover:text-rose-600 text-[10px] font-medium p-1 transition self-end sm:self-center"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Row action */}
                    <td className="py-3 px-3 align-top text-right">
                      <button
                        onClick={() => handleOpenLinkModalForRequirement(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-semibold transition"
                      >
                        <Plus className="w-3 h-3" /> Link Test
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unlinked / Orphan Test Cases Section */}
      {matrix && matrix.unlinkedTestCases && matrix.unlinkedTestCases.length > 0 && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
          <button
            onClick={() => setShowUnlinkedSection(!showUnlinkedSection)}
            className="w-full px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-left hover:bg-slate-100/60 transition"
          >
            <div className="flex items-center gap-2">
              {showUnlinkedSection ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Unlinked Project Test Cases ({matrix.unlinkedTestCases.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              Test cases not yet associated with any requirement or story
            </span>
          </button>

          {showUnlinkedSection && (
            <div className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {matrix.unlinkedTestCases.map((tc) => (
                  <div
                    key={tc.id}
                    className="p-2.5 rounded border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-slate-800">
                          {tc.caseKey}
                        </span>
                        <span className="font-medium text-slate-900">
                          {tc.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getExecutionBadge(tc.latestExecutionStatus)}
                        {tc.defects && tc.defects.length > 0 && (
                          <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1 rounded flex items-center gap-0.5">
                            <Bug className="w-2.5 h-2.5" /> {tc.defects.length} defect(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenLinkModalForTestCase(tc)}
                      className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shrink-0"
                    >
                      Link to Requirement
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Link Test Case Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  {linkTargetRequirement
                    ? `Link Test Case to [${linkTargetRequirement.key}]`
                    : 'Link Test Case to Requirement'}
                </h3>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="p-4 space-y-4 text-xs">
              {linkError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded">
                  {linkError}
                </div>
              )}

              {/* Requirement Target Preview if opened from row */}
              {linkTargetRequirement && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                    Target Requirement
                  </span>
                  <p className="font-bold text-slate-800">
                    [{linkTargetRequirement.key}] {linkTargetRequirement.title}
                  </p>
                </div>
              )}

              {/* Test Case Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Test Case <span className="text-rose-600">*</span>
                </label>
                <select
                  aria-label="Select Test Case"
                  value={linkTargetTestCaseId}
                  onChange={(e) => setLinkTargetTestCaseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:border-slate-800 focus:outline-none"
                >
                  <option value="">-- Choose a test case --</option>
                  {availableTestCases.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      [{tc.caseKey}] {tc.title} ({tc.priority})
                    </option>
                  ))}
                </select>
              </div>

              {/* User Story Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Linked User Story / Backlog Item
                </label>
                <select
                  aria-label="Linked User Story"
                  value={linkModalSelectedStoryId}
                  onChange={(e) => setLinkModalSelectedStoryId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:border-slate-800 focus:outline-none"
                >
                  <option value="">-- No User Story Linked --</option>
                  {availableStories.map((story) => (
                    <option key={story.id} value={story.id}>
                      [{story.storyKey}] {story.title} ({story.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* PRD Document Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Linked PRD / Specification Document
                </label>
                <select
                  aria-label="Linked PRD Document"
                  value={linkModalSelectedPrdId}
                  onChange={(e) => setLinkModalSelectedPrdId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:border-slate-800 focus:outline-none"
                >
                  <option value="">-- No PRD Document Linked --</option>
                  {availablePrds.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      [PRD-v{doc.currentVersion}] {doc.title} ({doc.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {linking ? 'Saving Link...' : 'Save Traceability Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
