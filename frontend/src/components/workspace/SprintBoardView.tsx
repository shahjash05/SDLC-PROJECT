import React, { useState, useEffect } from 'react';
import {
  Kanban,
  ListTodo,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { getOrganizations } from '../../api/organizations';
import { getAllProjects } from '../../api/projects';
import {
  getSprints,
  createSprint,
  updateSprint,
} from '../../api/sprints';
import {
  getStories,
  getStory,
  createStory,
  updateStoryStatus,
  createTask,
  updateTask,
  deleteTask,
} from '../../api/requirements';
import type {
  OrganizationSummary,
  ProjectSummary,
  SprintSummary,
  StorySummary,
  StoryDetail,
  StoryStatus,
  StoryPriority,
  TaskItem,
} from '../../types/entities';

interface SprintBoardViewProps {
  initialProjectId?: string | null;
}

export function SprintBoardView({ initialProjectId }: SprintBoardViewProps) {
  // Context state
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');

  // View mode
  const [viewMode, setViewMode] = useState<'board' | 'backlog'>('board');

  // Sprints & Stories
  const [sprints, setSprints] = useState<SprintSummary[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [stories, setStories] = useState<StorySummary[]>([]);

  // Story details modal
  const [selectedStoryDetail, setSelectedStoryDetail] = useState<StoryDetail | null>(null);
  const [loadingStoryDetail, setLoadingStoryDetail] = useState(false);

  // Forms & Dialogs
  const [isNewSprintOpen, setIsNewSprintOpen] = useState(false);
  const [isNewStoryOpen, setIsNewStoryOpen] = useState(false);

  // Task form within story modal
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskHours, setNewTaskHours] = useState('');

  // Form states
  const [sprintForm, setSprintForm] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
  });

  const [storyForm, setStoryForm] = useState({
    title: '',
    description: '',
    acceptanceCriteria: '',
    priority: 'MEDIUM' as StoryPriority,
    storyPoints: 3,
    sprintId: '',
  });

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load organizations
  useEffect(() => {
    async function initOrgs() {
      try {
        const orgs = await getOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0 && !selectedOrgId) {
          setSelectedOrgId(orgs[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load organizations');
      }
    }
    initOrgs();
  }, []);

  // Load projects when org changes
  useEffect(() => {
    async function loadProjects() {
      if (!selectedOrgId) return;
      try {
        const allProj = await getAllProjects();
        const filtered = allProj.filter((p) => p.organizationId === selectedOrgId);
        setProjects(filtered);
        if (filtered.length > 0) {
          if (!selectedProjectId || !filtered.some((p) => p.id === selectedProjectId)) {
            setSelectedProjectId(filtered[0].id);
          }
        } else {
          setSelectedProjectId('');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
      }
    }
    loadProjects();
  }, [selectedOrgId]);

  // Load sprints & stories when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setSprints([]);
      setStories([]);
      return;
    }
    loadProjectData(selectedProjectId);
  }, [selectedProjectId]);

  async function loadProjectData(projectId: string) {
    setLoading(true);
    setError(null);
    try {
      const [sprintList, storyList] = await Promise.all([
        getSprints(projectId),
        getStories(projectId),
      ]);
      setSprints(sprintList);
      setStories(storyList);

      // Auto-select active sprint or first sprint
      const active = sprintList.find((s) => s.status === 'ACTIVE') || sprintList[0];
      if (active) {
        setSelectedSprintId(active.id);
      } else {
        setSelectedSprintId('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project requirements and sprints');
    } finally {
      setLoading(false);
    }
  }

  // Handle Sprint creation
  async function handleCreateSprint(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) return;
    setError(null);
    try {
      await createSprint(selectedProjectId, {
        name: sprintForm.name,
        goal: sprintForm.goal || undefined,
        startDate: sprintForm.startDate || undefined,
        endDate: sprintForm.endDate || undefined,
      });
      setSuccess('Sprint created successfully');
      setIsNewSprintOpen(false);
      setSprintForm({ name: '', goal: '', startDate: '', endDate: '' });
      await loadProjectData(selectedProjectId);
    } catch (err: any) {
      setError(err.message || 'Failed to create sprint');
    }
  }

  // Handle Sprint Status transition (Start or Complete)
  async function handleToggleSprintStatus(sprint: SprintSummary, nextStatus: 'ACTIVE' | 'COMPLETED') {
    setError(null);
    try {
      await updateSprint(sprint.id, {
        name: sprint.name,
        goal: sprint.goal,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        status: nextStatus,
      });
      setSuccess(`Sprint ${nextStatus === 'ACTIVE' ? 'started' : 'completed'} successfully`);
      await loadProjectData(selectedProjectId);
    } catch (err: any) {
      setError(err.message || 'Failed to update sprint status');
    }
  }

  // Handle User Story creation
  async function handleCreateStory(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) return;
    setError(null);
    try {
      await createStory(selectedProjectId, {
        title: storyForm.title,
        description: storyForm.description || undefined,
        acceptanceCriteria: storyForm.acceptanceCriteria || undefined,
        priority: storyForm.priority,
        storyPoints: storyForm.storyPoints ? Number(storyForm.storyPoints) : undefined,
        sprintId: storyForm.sprintId || undefined,
      });
      setSuccess('User story created successfully');
      setIsNewStoryOpen(false);
      setStoryForm({
        title: '',
        description: '',
        acceptanceCriteria: '',
        priority: 'MEDIUM',
        storyPoints: 3,
        sprintId: '',
      });
      await loadProjectData(selectedProjectId);
    } catch (err: any) {
      setError(err.message || 'Failed to create user story');
    }
  }

  // Handle Story Status change (Board transition)
  async function handleMoveStoryStatus(storyId: string, nextStatus: StoryStatus) {
    setError(null);
    try {
      await updateStoryStatus(storyId, nextStatus);
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, status: nextStatus } : s))
      );
      if (selectedStoryDetail && selectedStoryDetail.id === storyId) {
        setSelectedStoryDetail({ ...selectedStoryDetail, status: nextStatus });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update story status');
    }
  }

  // Open story detail modal
  async function handleOpenStory(storyId: string) {
    setLoadingStoryDetail(true);
    try {
      const detail = await getStory(storyId);
      setSelectedStoryDetail(detail);
    } catch (err: any) {
      setError(err.message || 'Failed to load story details');
    } finally {
      setLoadingStoryDetail(false);
    }
  }

  // Add Task to Story
  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStoryDetail || !newTaskTitle.trim()) return;
    try {
      const created = await createTask(selectedStoryDetail.id, {
        title: newTaskTitle.trim(),
        estimatedHours: newTaskHours ? Number(newTaskHours) : undefined,
      });
      setSelectedStoryDetail({
        ...selectedStoryDetail,
        tasks: [...selectedStoryDetail.tasks, created],
      });
      setNewTaskTitle('');
      setNewTaskHours('');
    } catch (err: any) {
      setError(err.message || 'Failed to add task');
    }
  }

  // Toggle Task Status
  async function handleToggleTaskStatus(task: TaskItem) {
    if (!selectedStoryDetail) return;
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      const updated = await updateTask(task.id, {
        title: task.title,
        status: nextStatus,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
      });
      setSelectedStoryDetail({
        ...selectedStoryDetail,
        tasks: selectedStoryDetail.tasks.map((t) => (t.id === task.id ? updated : t)),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  }

  // Delete Task
  async function handleDeleteTask(taskId: string) {
    if (!selectedStoryDetail) return;
    try {
      await deleteTask(taskId);
      setSelectedStoryDetail({
        ...selectedStoryDetail,
        tasks: selectedStoryDetail.tasks.filter((t) => t.id !== taskId),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  }

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId);
  const currentSprintStories = stories.filter((s) => s.sprintId === selectedSprintId);
  const backlogStories = stories.filter((s) => !s.sprintId);

  // Status columns for board
  const columns: { status: StoryStatus; title: string; count: number }[] = [
    {
      status: 'TODO',
      title: 'To Do',
      count: currentSprintStories.filter((s) => s.status === 'TODO').length,
    },
    {
      status: 'IN_PROGRESS',
      title: 'In Progress',
      count: currentSprintStories.filter((s) => s.status === 'IN_PROGRESS').length,
    },
    {
      status: 'IN_REVIEW',
      title: 'In Review',
      count: currentSprintStories.filter((s) => s.status === 'IN_REVIEW').length,
    },
    {
      status: 'DONE',
      title: 'Done',
      count: currentSprintStories.filter((s) => s.status === 'DONE').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Project Context Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Org Selector */}
          <div>
            <label htmlFor="org-select" className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Organization
            </label>
            <select
              id="org-select"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-slate-400"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300 mt-4 hidden sm:block" />

          {/* Project Selector */}
          <div>
            <label htmlFor="project-select" className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Project
            </label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-slate-400"
            >
              {projects.length === 0 ? (
                <option value="">No projects in this organization</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.projectKey}] {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-4">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        {/* View mode toggle & Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded ${
                viewMode === 'board'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Sprint Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('backlog')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded ${
                viewMode === 'backlog'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              Product Backlog ({backlogStories.length})
            </button>
          </div>

          {selectedProjectId && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStoryForm((prev) => ({
                    ...prev,
                    sprintId: viewMode === 'board' ? selectedSprintId : '',
                  }));
                  setIsNewStoryOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Story
              </button>

              <button
                type="button"
                onClick={() => setIsNewSprintOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                New Sprint
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button type="button" onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-md p-10 text-center space-y-2">
          <Kanban className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No Projects Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a project in the Projects tab before planning sprints and user stories.
          </p>
        </div>
      ) : viewMode === 'board' ? (
        /* ================= SPRINT BOARD VIEW ================= */
        <div className="space-y-4">
          {/* Sprint Selector & Metrics Bar */}
          <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label htmlFor="sprint-select" className="text-xs font-semibold text-slate-700">
                Sprint:
              </label>
              {sprints.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No sprints created yet</span>
              ) : (
                <select
                  id="sprint-select"
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-800 font-medium"
                >
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              )}

              {selectedSprint && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase ${
                    selectedSprint.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedSprint.status === 'COMPLETED'
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {selectedSprint.status}
                </span>
              )}

              {selectedSprint?.goal && (
                <span className="text-xs text-slate-500 border-l border-slate-200 pl-3">
                  <span className="font-medium text-slate-700">Goal:</span> {selectedSprint.goal}
                </span>
              )}
            </div>

            {selectedSprint && (
              <div className="flex items-center gap-2">
                {selectedSprint.status === 'PLANNED' && (
                  <button
                    type="button"
                    onClick={() => handleToggleSprintStatus(selectedSprint, 'ACTIVE')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Play className="w-3 h-3" />
                    Start Sprint
                  </button>
                )}
                {selectedSprint.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => handleToggleSprintStatus(selectedSprint, 'COMPLETED')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-800 text-white hover:bg-slate-900"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Complete Sprint
                  </button>
                )}
                <span className="text-xs text-slate-500 font-mono">
                  Points: {selectedSprint.totalStoryPoints}
                </span>
              </div>
            )}
          </div>

          {/* Kanban Columns */}
          {!selectedSprintId ? (
            <div className="bg-white border border-slate-200 rounded-md p-10 text-center space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900">No Sprint Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an existing sprint above or click "New Sprint" to begin iteration planning.
              </p>
              <button
                type="button"
                onClick={() => setIsNewSprintOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                Create First Sprint
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {columns.map((col) => {
                const colStories = currentSprintStories.filter((s) => s.status === col.status);
                return (
                  <div
                    key={col.status}
                    className="bg-slate-50 border border-slate-200 rounded-md flex flex-col min-h-[500px]"
                  >
                    {/* Column Header */}
                    <div className="p-3 border-b border-slate-200 bg-white rounded-t-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">{col.title}</span>
                        <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
                          {col.count}
                        </span>
                      </div>
                    </div>

                    {/* Column Cards */}
                    <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                      {colStories.length === 0 ? (
                        <div className="h-24 border border-dashed border-slate-200 rounded flex items-center justify-center text-[11px] text-slate-400">
                          Empty
                        </div>
                      ) : (
                        colStories.map((story) => (
                          <div
                            key={story.id}
                            className="bg-white border border-slate-200 rounded p-3 space-y-2 shadow-none hover:border-slate-300 transition-colors cursor-pointer group"
                            onClick={() => handleOpenStory(story.id)}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] font-mono font-semibold text-blue-700">
                                {story.storyKey}
                              </span>
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.2 rounded border uppercase ${
                                  story.priority === 'URGENT'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : story.priority === 'HIGH'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {story.priority}
                              </span>
                            </div>

                            <p className="text-xs font-medium text-slate-900 leading-snug">
                              {story.title}
                            </p>

                            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                              <div className="flex items-center gap-1.5">
                                {story.storyPoints != null && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-medium text-[10px]">
                                    {story.storyPoints} pts
                                  </span>
                                )}
                                {story.taskCount > 0 && (
                                  <span className="text-[10px] text-slate-500">
                                    {story.completedTaskCount}/{story.taskCount} tasks
                                  </span>
                                )}
                              </div>

                              {story.assigneeUsername ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                                  <User className="w-3 h-3 text-slate-400" />
                                  {story.assigneeUsername}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Unassigned</span>
                              )}
                            </div>

                            {/* Move quick actions */}
                            <div
                              className="pt-1 flex items-center justify-between gap-1 border-t border-slate-100 text-[10px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {col.status !== 'TODO' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const prevStatus: StoryStatus =
                                      col.status === 'DONE'
                                        ? 'IN_REVIEW'
                                        : col.status === 'IN_REVIEW'
                                        ? 'IN_PROGRESS'
                                        : 'TODO';
                                    handleMoveStoryStatus(story.id, prevStatus);
                                  }}
                                  className="text-slate-500 hover:text-slate-800 p-0.5 rounded hover:bg-slate-50"
                                  title="Move backwards"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                              ) : <span />}

                              {col.status !== 'DONE' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus: StoryStatus =
                                      col.status === 'TODO'
                                        ? 'IN_PROGRESS'
                                        : col.status === 'IN_PROGRESS'
                                        ? 'IN_REVIEW'
                                        : 'DONE';
                                    handleMoveStoryStatus(story.id, nextStatus);
                                  }}
                                  className="text-slate-500 hover:text-slate-800 p-0.5 rounded hover:bg-slate-50 flex items-center gap-0.5"
                                  title="Move forwards"
                                >
                                  <span>Next</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= PRODUCT BACKLOG VIEW ================= */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Product Backlog</h3>
              <p className="text-xs text-slate-500">
                User stories awaiting prioritization and sprint planning assignment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStoryForm((prev) => ({ ...prev, sprintId: '' }));
                setIsNewStoryOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Story to Backlog
            </button>
          </div>

          {backlogStories.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-md p-10 text-center space-y-2">
              <ListTodo className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900">Backlog is Empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All user stories have been assigned to sprints, or no stories have been written yet.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-100">
              {backlogStories.map((story) => (
                <div
                  key={story.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="space-y-1 flex-1 cursor-pointer"
                    onClick={() => handleOpenStory(story.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-blue-700">
                        {story.storyKey}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.2 rounded border uppercase ${
                          story.priority === 'URGENT'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : story.priority === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {story.priority}
                      </span>
                      {story.storyPoints != null && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {story.storyPoints} pts
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900">{story.title}</h4>
                    {story.assigneeUsername && (
                      <p className="text-[11px] text-slate-500">
                        Assignee: @{story.assigneeUsername}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {sprints.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            // Assign story to sprint
                            handleMoveStoryStatus(story.id, 'TODO');
                          }
                        }}
                        defaultValue=""
                        className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-700"
                      >
                        <option value="" disabled>
                          Assign to sprint...
                        </option>
                        {sprints.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenStory(story.id)}
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 hover:bg-slate-50"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CREATE SPRINT ================= */}
      {isNewSprintOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-md p-6 max-w-md w-full space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Create New Sprint</h3>
              <button
                type="button"
                onClick={() => setIsNewSprintOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSprint} className="space-y-3">
              <div>
                <label htmlFor="sprint-name" className="block text-xs font-medium text-slate-700 mb-1">
                  Sprint Name *
                </label>
                <input
                  id="sprint-name"
                  type="text"
                  required
                  placeholder="e.g. Sprint 1 - Foundation"
                  value={sprintForm.name}
                  onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label htmlFor="sprint-goal" className="block text-xs font-medium text-slate-700 mb-1">
                  Sprint Goal
                </label>
                <textarea
                  id="sprint-goal"
                  rows={2}
                  placeholder="What is the primary deliverable for this sprint?"
                  value={sprintForm.goal}
                  onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sprint-start" className="block text-xs font-medium text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    id="sprint-start"
                    type="date"
                    value={sprintForm.startDate}
                    onChange={(e) => setSprintForm({ ...sprintForm, startDate: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label htmlFor="sprint-end" className="block text-xs font-medium text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    id="sprint-end"
                    type="date"
                    value={sprintForm.endDate}
                    onChange={(e) => setSprintForm({ ...sprintForm, endDate: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 text-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSprintOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE USER STORY ================= */}
      {isNewStoryOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-md p-6 max-w-lg w-full space-y-4 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Create User Story</h3>
              <button
                type="button"
                onClick={() => setIsNewStoryOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-3">
              <div>
                <label htmlFor="story-title" className="block text-xs font-medium text-slate-700 mb-1">
                  Story Title *
                </label>
                <input
                  id="story-title"
                  type="text"
                  required
                  placeholder="As a [user], I want to [action] so that [benefit]"
                  value={storyForm.title}
                  onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label htmlFor="story-desc" className="block text-xs font-medium text-slate-700 mb-1">
                  Description / Context
                </label>
                <textarea
                  id="story-desc"
                  rows={2}
                  placeholder="Background details, user requirements, technical constraints..."
                  value={storyForm.description}
                  onChange={(e) => setStoryForm({ ...storyForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label htmlFor="story-ac" className="block text-xs font-medium text-slate-700 mb-1">
                  Acceptance Criteria (Gherkin or Checklist)
                </label>
                <textarea
                  id="story-ac"
                  rows={3}
                  placeholder="Given [initial state], When [action], Then [expected outcome]"
                  value={storyForm.acceptanceCriteria}
                  onChange={(e) => setStoryForm({ ...storyForm, acceptanceCriteria: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="story-priority" className="block text-xs font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="story-priority"
                    value={storyForm.priority}
                    onChange={(e) =>
                      setStoryForm({ ...storyForm, priority: e.target.value as StoryPriority })
                    }
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-slate-50"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="story-points" className="block text-xs font-medium text-slate-700 mb-1">
                    Story Points
                  </label>
                  <input
                    id="story-points"
                    type="number"
                    min={0}
                    max={100}
                    value={storyForm.storyPoints}
                    onChange={(e) =>
                      setStoryForm({ ...storyForm, storyPoints: Number(e.target.value) })
                    }
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-slate-50"
                  />
                </div>

                <div>
                  <label htmlFor="story-sprint" className="block text-xs font-medium text-slate-700 mb-1">
                    Sprint
                  </label>
                  <select
                    id="story-sprint"
                    value={storyForm.sprintId}
                    onChange={(e) => setStoryForm({ ...storyForm, sprintId: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-slate-50"
                  >
                    <option value="">(Product Backlog)</option>
                    {sprints.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewStoryOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800"
                >
                  Create Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loadingStoryDetail && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-md p-4 flex items-center gap-2.5 shadow-md">
            <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
            <span className="text-xs font-medium text-slate-800">Loading story details...</span>
          </div>
        </div>
      )}

      {/* ================= MODAL: STORY DETAIL & TASK TRACKING ================= */}
      {selectedStoryDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-md p-6 max-w-2xl w-full space-y-5 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-blue-700">
                  {selectedStoryDetail.storyKey}
                </span>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                  {selectedStoryDetail.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStoryDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Story Meta & Status */}
            <div className="flex items-center gap-3 flex-wrap text-xs bg-slate-50 border border-slate-100 rounded p-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Status</span>
                <select
                  value={selectedStoryDetail.status}
                  onChange={(e) =>
                    handleMoveStoryStatus(selectedStoryDetail.id, e.target.value as StoryStatus)
                  }
                  className="font-medium text-slate-800 bg-white border border-slate-200 rounded px-2 py-0.5 mt-0.5"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Priority</span>
                <span className="font-medium text-slate-700 mt-1 inline-block">
                  {selectedStoryDetail.priority}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Story Points</span>
                <span className="font-mono font-medium text-slate-700 mt-1 inline-block">
                  {selectedStoryDetail.storyPoints ?? 0}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Assignee</span>
                <span className="font-medium text-slate-700 mt-1 inline-block">
                  {selectedStoryDetail.assigneeUsername || 'Unassigned'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Sprint</span>
                <span className="font-medium text-slate-700 mt-1 inline-block">
                  {selectedStoryDetail.sprintName || 'None (Backlog)'}
                </span>
              </div>
            </div>

            {/* Description */}
            {selectedStoryDetail.description && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-800">User Story Description</h4>
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded p-3 leading-relaxed whitespace-pre-wrap">
                  {selectedStoryDetail.description}
                </p>
              </div>
            )}

            {/* Acceptance Criteria */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Acceptance Criteria
              </h4>
              {selectedStoryDetail.acceptanceCriteria ? (
                <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-3 font-mono leading-relaxed whitespace-pre-wrap">
                  {selectedStoryDetail.acceptanceCriteria}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No acceptance criteria defined.</p>
              )}
            </div>

            {/* Technical Subtasks & Task Tracking */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Task Breakdown ({selectedStoryDetail.tasks.length})
              </h4>

              {/* Task list */}
              <div className="space-y-1.5">
                {selectedStoryDetail.tasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No tasks created under this story.</p>
                ) : (
                  selectedStoryDetail.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded border border-slate-200 bg-slate-50 text-xs gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            task.status === 'DONE'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {task.status === 'DONE' && <Check className="w-3 h-3" />}
                        </button>
                        <span
                          className={`font-medium ${
                            task.status === 'DONE'
                              ? 'line-through text-slate-400'
                              : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.estimatedHours != null && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {task.estimatedHours}h
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Task Form */}
              <form onSubmit={handleAddTask} className="flex gap-2 pt-2">
                <input
                  type="text"
                  required
                  placeholder="Add new subtask title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none"
                />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Hours"
                  value={newTaskHours}
                  onChange={(e) => setNewTaskHours(e.target.value)}
                  className="w-16 text-xs px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
