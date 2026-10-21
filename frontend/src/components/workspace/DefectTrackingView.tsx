import React, { useState, useEffect, useCallback } from 'react';
import {
  Bug,
  Plus,
  Trash2,
  Edit3,
  Eye,
  X,
  Search,
  AlertCircle,
  Clock,
  UserCheck,
  CheckCircle2,
  FolderGit2,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { getAllProjects } from '../../api/projects';
import {
  getProjectDefects,
  getProjectDefectSummary,
  getDefectById,
  createDefect,
  updateDefect,
  assignDefect,
  updateDefectStatus,
  deleteDefect,
  getTestCases,
} from '../../api/testing';
import type {
  ProjectSummary,
  DefectSummary,
  DefectDetail,
  DefectStatus,
  DefectSeverity,
  TestPriority,
  CreateDefectPayload,
  UpdateDefectPayload,
  ProjectDefectSummary,
  TestCaseSummary,
} from '../../types/entities';

export function getDefectSeverityBadge(severity?: DefectSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
    case 'HIGH':
      return 'bg-orange-50 text-orange-700 border-orange-200 font-medium';
    case 'MEDIUM':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'LOW':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getDefectPriorityBadge(priority?: TestPriority) {
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

export function getDefectStatusBadge(status?: DefectStatus) {
  switch (status) {
    case 'OPEN':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'IN_REVIEW':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'RESOLVED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'CLOSED':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'REOPENED':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

interface DefectTrackingViewProps {
  activeProjectId?: string;
  propProjects?: ProjectSummary[];
  prefilledDefect?: CreateDefectPayload | null;
  onClearPrefilled?: () => void;
}

export function DefectTrackingView({
  activeProjectId: propActiveProjectId,
  propProjects,
  prefilledDefect,
  onClearPrefilled,
}: DefectTrackingViewProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>(propProjects || []);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(propActiveProjectId || '');

  // Defect data
  const [defects, setDefects] = useState<DefectSummary[]>([]);
  const [defectSummary, setDefectSummary] = useState<ProjectDefectSummary | null>(null);
  const [projectTestCases, setProjectTestCases] = useState<TestCaseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Active / Detailed Defect
  const [activeDefectDetail, setActiveDefectDetail] = useState<DefectDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAssignInput, setShowAssignInput] = useState(false);
  const [assigneeInput, setAssigneeInput] = useState('');

  // Form states for Create & Edit
  const [formData, setFormData] = useState<CreateDefectPayload>({
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    severity: 'MEDIUM',
    priority: 'MEDIUM',
    status: 'OPEN',
    testCaseId: null,
    testExecutionId: null,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingDefectId, setEditingDefectId] = useState<string | null>(null);

  // Load Projects if not passed
  useEffect(() => {
    if (propProjects && propProjects.length > 0) {
      setProjects(propProjects);
      if (!selectedProjectId) {
        setSelectedProjectId(propActiveProjectId || propProjects[0].id);
      }
    } else {
      getAllProjects()
        .then((data) => {
          setProjects(data);
          if (data.length > 0 && !selectedProjectId) {
            setSelectedProjectId(propActiveProjectId || data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [propProjects, propActiveProjectId, selectedProjectId]);

  useEffect(() => {
    if (propActiveProjectId) {
      setSelectedProjectId(propActiveProjectId);
    }
  }, [propActiveProjectId]);

  // Handle prefilled defect request from failed execution
  useEffect(() => {
    if (prefilledDefect) {
      setFormData({
        title: prefilledDefect.title || '',
        description: prefilledDefect.description || '',
        stepsToReproduce: prefilledDefect.stepsToReproduce || '',
        expectedResult: prefilledDefect.expectedResult || '',
        actualResult: prefilledDefect.actualResult || '',
        severity: prefilledDefect.severity || 'HIGH',
        priority: prefilledDefect.priority || 'HIGH',
        status: prefilledDefect.status || 'OPEN',
        testCaseId: prefilledDefect.testCaseId || null,
        testExecutionId: prefilledDefect.testExecutionId || null,
      });
      setShowCreateModal(true);
      if (onClearPrefilled) {
        onClearPrefilled();
      }
    }
  }, [prefilledDefect, onClearPrefilled]);

  // Load Defects and Summary
  const loadDefectsData = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const [defectList, summary, testCases] = await Promise.all([
        getProjectDefects(selectedProjectId, {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          severity: severityFilter !== 'ALL' ? severityFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        }),
        getProjectDefectSummary(selectedProjectId).catch(() => null),
        getTestCases(selectedProjectId).catch(() => []),
      ]);
      setDefects(defectList);
      if (summary) setDefectSummary(summary);
      setProjectTestCases(testCases);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load defect data');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, statusFilter, severityFilter, priorityFilter]);

  useEffect(() => {
    loadDefectsData();
  }, [loadDefectsData]);

  // Open Create Form
  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      stepsToReproduce: '1. Navigate to ...\n2. Trigger ...\n3. Observe ...',
      expectedResult: '',
      actualResult: '',
      severity: 'MEDIUM',
      priority: 'MEDIUM',
      status: 'OPEN',
      testCaseId: null,
      testExecutionId: null,
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  // Submit Create Defect
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!formData.title.trim()) {
      setFormError('Defect title is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await createDefect(selectedProjectId, {
        ...formData,
        title: formData.title.trim(),
        testCaseId: formData.testCaseId || null,
        testExecutionId: formData.testExecutionId || null,
      });
      setShowCreateModal(false);
      loadDefectsData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create defect');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Form
  const handleOpenEdit = async (defectId: string) => {
    setEditingDefectId(defectId);
    setFormError(null);
    try {
      const detail = await getDefectById(defectId);
      setFormData({
        title: detail.title,
        description: detail.description || '',
        stepsToReproduce: detail.stepsToReproduce || '',
        expectedResult: detail.expectedResult || '',
        actualResult: detail.actualResult || '',
        severity: detail.severity,
        priority: detail.priority,
        status: detail.status,
        testCaseId: detail.testCaseId || null,
        testExecutionId: detail.testExecutionId || null,
      });
      setShowEditModal(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch defect for editing');
    }
  };

  // Submit Edit Defect
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDefectId) return;
    if (!formData.title.trim()) {
      setFormError('Defect title is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload: UpdateDefectPayload = {
        ...formData,
        title: formData.title.trim(),
        testCaseId: formData.testCaseId || null,
        testExecutionId: formData.testExecutionId || null,
      };
      const updated = await updateDefect(editingDefectId, payload);
      setShowEditModal(false);
      if (activeDefectDetail?.id === editingDefectId) {
        setActiveDefectDetail(updated);
      }
      loadDefectsData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update defect');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Detail Modal
  const handleOpenDetail = async (defectId: string) => {
    setLoadingDetail(true);
    setShowDetailModal(true);
    setError(null);
    try {
      const detail = await getDefectById(defectId);
      setActiveDefectDetail(detail);
      setAssigneeInput(detail.assigneeUsername || '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load defect details');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Status transition handler
  const handleStatusTransition = async (defectId: string, newStatus: DefectStatus) => {
    try {
      const updated = await updateDefectStatus(defectId, newStatus);
      setDefects((prev) =>
        prev.map((d) =>
          d.id === defectId
            ? {
                ...d,
                status: newStatus,
                resolvedAt: updated.resolvedAt,
                closedAt: updated.closedAt,
              }
            : d
        )
      );
      if (activeDefectDetail?.id === defectId) {
        setActiveDefectDetail(updated);
      }
      // Reload summary counts
      if (selectedProjectId) {
        getProjectDefectSummary(selectedProjectId).then(setDefectSummary).catch(() => {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update defect status');
    }
  };

  // Assign Defect handler
  const handleAssignSubmit = async () => {
    if (!activeDefectDetail) return;
    const targetId = assigneeInput.trim() || null;
    try {
      const updated = await assignDefect(activeDefectDetail.id, targetId);
      setActiveDefectDetail(updated);
      setDefects((prev) =>
        prev.map((d) =>
          d.id === updated.id
            ? {
                ...d,
                assigneeId: updated.assigneeId,
                assigneeUsername: updated.assigneeUsername,
              }
            : d
        )
      );
      setShowAssignInput(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
    }
  };

  // Delete Defect
  const handleDeleteDefect = async (defectId: string, defectKey: string) => {
    if (!confirm(`Are you sure you want to delete defect "${defectKey}"?`)) {
      return;
    }
    try {
      await deleteDefect(defectId);
      if (activeDefectDetail?.id === defectId) {
        setShowDetailModal(false);
        setActiveDefectDetail(null);
      }
      loadDefectsData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete defect');
    }
  };

  // Filter defects locally by text search
  const filteredDefects = defects.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.defectKey.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      (d.testCaseKey && d.testCaseKey.toLowerCase().includes(q)) ||
      (d.reporterUsername && d.reporterUsername.toLowerCase().includes(q)) ||
      (d.assigneeUsername && d.assigneeUsername.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Project Controls */}
      <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-700" />
            <h2 className="text-base font-semibold text-slate-900">
              Defect Tracking &amp; Bug Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Capture, track, assign, and resolve software defects linked to test cases and execution runs.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
              <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="text-xs bg-transparent border-none text-slate-800 font-medium focus:outline-none cursor-pointer"
                aria-label="Select Defect Project"
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
            onClick={handleOpenCreate}
            disabled={!selectedProjectId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            New Defect
          </button>
        </div>
      </div>

      {/* Real Project Defect Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Defects
          </span>
          <span className="text-lg font-bold text-slate-900">
            {defectSummary?.totalDefects ?? defects.length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-red-600 uppercase tracking-wider block flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Open
          </span>
          <span className="text-lg font-bold text-red-700">
            {defectSummary?.openDefects ?? defects.filter((d) => d.status === 'OPEN').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3" /> In Progress
          </span>
          <span className="text-lg font-bold text-blue-700">
            {defectSummary?.inProgressDefects ??
              defects.filter((d) => d.status === 'IN_PROGRESS').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-purple-600 uppercase tracking-wider block flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> In Review
          </span>
          <span className="text-lg font-bold text-purple-700">
            {defectSummary?.inReviewDefects ??
              defects.filter((d) => d.status === 'IN_REVIEW').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
          <span className="text-lg font-bold text-emerald-700">
            {defectSummary?.resolvedDefects ??
              defects.filter((d) => d.status === 'RESOLVED').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
          <span className="text-[11px] font-medium text-rose-700 uppercase tracking-wider block flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Critical / High
          </span>
          <span className="text-lg font-bold text-rose-700">
            {defectSummary
              ? defectSummary.criticalDefects + defectSummary.highDefects
              : defects.filter((d) => d.severity === 'CRITICAL' || d.severity === 'HIGH').length}
          </span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search defects by key, title, assignee, or reporter..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              &times;
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
            <span className="text-[11px] text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer"
              aria-label="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
            <span className="text-[11px] text-slate-500 font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer"
              aria-label="Filter by Severity"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
            <span className="text-[11px] text-slate-500 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer"
              aria-label="Filter by Priority"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {(statusFilter !== 'ALL' || severityFilter !== 'ALL' || priorityFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setSeverityFilter('ALL');
                setPriorityFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Defect Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
            <span>Loading defects...</span>
          </div>
        ) : filteredDefects.length === 0 ? (
          <div className="p-12 text-center">
            <Bug className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No defects found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL'
                ? 'No defects match the current filter criteria. Try resetting your search filters.'
                : 'No defects have been reported for this project yet. Use "New Defect" to log an issue or report a bug directly from a failed test run.'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={!selectedProjectId}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Report a Defect
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 w-28">Key</th>
                  <th className="py-2.5 px-3">Title &amp; Linked Test</th>
                  <th className="py-2.5 px-3 w-24">Severity</th>
                  <th className="py-2.5 px-3 w-24">Priority</th>
                  <th className="py-2.5 px-3 w-28">Status</th>
                  <th className="py-2.5 px-3 w-32">Reporter</th>
                  <th className="py-2.5 px-3 w-32">Assignee</th>
                  <th className="py-2.5 px-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDefects.map((defect) => (
                  <tr key={defect.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Key */}
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(defect.id)}
                        className="text-slate-900 hover:underline flex items-center gap-1"
                        title="View Defect Details"
                      >
                        <Bug className="w-3.5 h-3.5 text-rose-600" />
                        <span>{defect.defectKey}</span>
                      </button>
                    </td>

                    {/* Title & Linked Test */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900">{defect.title}</div>
                      {defect.testCaseKey && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                            {defect.testCaseKey}
                          </span>
                          <span className="truncate max-w-xs">{defect.testCaseTitle}</span>
                        </div>
                      )}
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] border ${getDefectSeverityBadge(
                          defect.severity
                        )}`}
                      >
                        {defect.severity}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] border ${getDefectPriorityBadge(
                          defect.priority
                        )}`}
                      >
                        {defect.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] border ${getDefectStatusBadge(
                          defect.status
                        )}`}
                      >
                        {defect.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Reporter */}
                    <td className="py-3 px-3 text-slate-600">
                      @{defect.reporterUsername || 'unknown'}
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-3">
                      {defect.assigneeUsername ? (
                        <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                          <UserCheck className="w-3 h-3 text-slate-500" />
                          @{defect.assigneeUsername}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(defect.id)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          title="View Defect Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(defect.id)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Defect"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDefect(defect.id, defect.defectKey)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Defect"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE DEFECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-semibold text-slate-900">Report New Defect</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Defect Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Authentication filter throws NullPointerException when token is expired"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                />
              </div>

              {/* Severity & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Severity
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as DefectSeverity[]).map((sev) => (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => setFormData({ ...formData, severity: sev })}
                        className={`py-1 text-[11px] font-medium rounded border transition-colors ${
                          formData.severity === sev
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TestPriority[]).map((prio) => (
                      <button
                        type="button"
                        key={prio}
                        onClick={() => setFormData({ ...formData, priority: prio })}
                        className={`py-1 text-[11px] font-medium rounded border transition-colors ${
                          formData.priority === prio
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {prio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Linked Test Case */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link to Test Case (Optional)
                </label>
                <select
                  value={formData.testCaseId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, testCaseId: e.target.value || null })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                >
                  <option value="">-- No linked test case --</option>
                  {projectTestCases.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.caseKey} - {tc.title} ({tc.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Steps to Reproduce */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Steps to Reproduce
                </label>
                <textarea
                  rows={3}
                  value={formData.stepsToReproduce}
                  onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                  placeholder="1. Send request...\n2. Provide input...\n3. Observe error..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none font-mono"
                />
              </div>

              {/* Expected vs Actual Result */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Result
                  </label>
                  <textarea
                    rows={2}
                    value={formData.expectedResult}
                    onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                    placeholder="What should have happened..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actual Result
                  </label>
                  <textarea
                    rows={2}
                    value={formData.actualResult}
                    onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                    placeholder="What actually occurred..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes / Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="System logs, stack traces, environment details, or browser version..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating Defect...' : 'Create Defect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEFECT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">Edit Defect</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Defect Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                />
              </div>

              {/* Severity & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Severity
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as DefectSeverity[]).map((sev) => (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => setFormData({ ...formData, severity: sev })}
                        className={`py-1 text-[11px] font-medium rounded border transition-colors ${
                          formData.severity === sev
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TestPriority[]).map((prio) => (
                      <button
                        type="button"
                        key={prio}
                        onClick={() => setFormData({ ...formData, priority: prio })}
                        className={`py-1 text-[11px] font-medium rounded border transition-colors ${
                          formData.priority === prio
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {prio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as DefectStatus })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REOPENED">Reopened</option>
                </select>
              </div>

              {/* Linked Test Case */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link to Test Case
                </label>
                <select
                  value={formData.testCaseId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, testCaseId: e.target.value || null })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                >
                  <option value="">-- No linked test case --</option>
                  {projectTestCases.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.caseKey} - {tc.title} ({tc.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Steps to Reproduce */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Steps to Reproduce
                </label>
                <textarea
                  rows={3}
                  value={formData.stepsToReproduce}
                  onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none font-mono"
                />
              </div>

              {/* Expected vs Actual Result */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Result
                  </label>
                  <textarea
                    rows={2}
                    value={formData.expectedResult}
                    onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actual Result
                  </label>
                  <textarea
                    rows={2}
                    value={formData.actualResult}
                    onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEFECT DETAIL MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {loadingDetail || !activeDefectDetail ? (
              <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                <span>Loading defect details...</span>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {activeDefectDetail.defectKey}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] border ${getDefectStatusBadge(
                          activeDefectDetail.status
                        )}`}
                      >
                        {activeDefectDetail.status.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] border ${getDefectSeverityBadge(
                          activeDefectDetail.severity
                        )}`}
                      >
                        {activeDefectDetail.severity} Severity
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] border ${getDefectPriorityBadge(
                          activeDefectDetail.priority
                        )}`}
                      >
                        {activeDefectDetail.priority} Priority
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mt-2">
                      {activeDefectDetail.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Metadata Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Reporter
                    </span>
                    <span className="text-slate-800 font-medium">
                      @{activeDefectDetail.reporterUsername || 'unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Assignee
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-800 font-medium">
                        {activeDefectDetail.assigneeUsername
                          ? `@${activeDefectDetail.assigneeUsername}`
                          : 'Unassigned'}
                      </span>
                      {!showAssignInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssigneeInput(activeDefectDetail.assigneeId || '');
                            setShowAssignInput(true);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          Change
                        </button>
                      )}
                    </div>
                    {showAssignInput && (
                      <div className="mt-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={assigneeInput}
                          onChange={(e) => setAssigneeInput(e.target.value)}
                          placeholder="User UUID or blank"
                          className="px-1.5 py-0.5 text-[11px] border border-slate-300 rounded w-28 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleAssignSubmit}
                          className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-white rounded hover:bg-slate-900"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAssignInput(false)}
                          className="px-1 py-0.5 text-[10px] text-slate-500 hover:text-slate-700"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Reported At
                    </span>
                    <span className="text-slate-800">
                      {new Date(activeDefectDetail.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Resolved At
                    </span>
                    <span className="text-slate-800">
                      {activeDefectDetail.resolvedAt
                        ? new Date(activeDefectDetail.resolvedAt).toLocaleDateString()
                        : 'Not resolved'}
                    </span>
                  </div>
                </div>

                {/* Lifecycle Status Transition Buttons */}
                <div className="flex items-center gap-2 flex-wrap border-y border-slate-100 py-3">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Move Status:</span>
                  {activeDefectDetail.status !== 'IN_PROGRESS' && activeDefectDetail.status !== 'RESOLVED' && activeDefectDetail.status !== 'CLOSED' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusTransition(activeDefectDetail.id, 'IN_PROGRESS')
                      }
                      className="px-2.5 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      Start Work (In Progress)
                    </button>
                  )}
                  {activeDefectDetail.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusTransition(activeDefectDetail.id, 'IN_REVIEW')
                      }
                      className="px-2.5 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                    >
                      Submit for Review
                    </button>
                  )}
                  {activeDefectDetail.status !== 'RESOLVED' && activeDefectDetail.status !== 'CLOSED' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusTransition(activeDefectDetail.id, 'RESOLVED')
                      }
                      className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {activeDefectDetail.status === 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusTransition(activeDefectDetail.id, 'CLOSED')
                      }
                      className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors"
                    >
                      Close Defect
                    </button>
                  )}
                  {(activeDefectDetail.status === 'RESOLVED' || activeDefectDetail.status === 'CLOSED') && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusTransition(activeDefectDetail.id, 'REOPENED')
                      }
                      className="px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reopen Defect
                    </button>
                  )}
                </div>

                {/* Linked Test Case / Execution Card */}
                {activeDefectDetail.testCaseKey && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Linked Test Case
                    </span>
                    <div className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                      <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {activeDefectDetail.testCaseKey}
                      </span>
                      <span>{activeDefectDetail.testCaseTitle}</span>
                    </div>
                    {activeDefectDetail.testExecutionStatus && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Reported from execution run with outcome:{' '}
                        <span className="font-semibold text-rose-700">
                          {activeDefectDetail.testExecutionStatus}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Steps to Reproduce */}
                {activeDefectDetail.stepsToReproduce && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-1">
                      Steps to Reproduce
                    </h4>
                    <pre className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 whitespace-pre-wrap font-mono">
                      {activeDefectDetail.stepsToReproduce}
                    </pre>
                  </div>
                )}

                {/* Expected & Actual Results */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded">
                    <span className="text-[10px] uppercase font-semibold text-emerald-800 block">
                      Expected Result
                    </span>
                    <p className="text-slate-800 mt-1">
                      {activeDefectDetail.expectedResult || 'None specified.'}
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50/50 border border-rose-100 rounded">
                    <span className="text-[10px] uppercase font-semibold text-rose-800 block">
                      Actual Result
                    </span>
                    <p className="text-slate-800 mt-1">
                      {activeDefectDetail.actualResult || 'None specified.'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {activeDefectDetail.description && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-1">
                      Additional Notes / Description
                    </h4>
                    <p className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 whitespace-pre-wrap">
                      {activeDefectDetail.description}
                    </p>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteDefect(activeDefectDetail.id, activeDefectDetail.defectKey)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Defect</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(activeDefectDetail.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 hover:bg-slate-50 rounded text-slate-700 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDetailModal(false)}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
