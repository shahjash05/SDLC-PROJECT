import { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  Users,
  Edit2,
  Kanban,
  FileCode,
} from 'lucide-react';
import type {
  OrganizationSummary,
  TeamSummary,
  ProjectSummary,
  ProjectStatus,
} from '../../types/entities';
import * as orgApi from '../../api/organizations';
import * as teamApi from '../../api/teams';
import * as projectApi from '../../api/projects';

interface ProjectSectionProps {
  initialOrgId?: string | null;
  initialTeamId?: string | null;
  onSelectProjectForSprints?: (projectId: string) => void;
  onSelectProjectForDocs?: (projectId: string) => void;
}

function getStatusBadgeClass(status: ProjectStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'PLANNING':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'ON_HOLD':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'COMPLETED':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'ARCHIVED':
      return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function ProjectSection({
  initialOrgId,
  initialTeamId,
  onSelectProjectForSprints,
  onSelectProjectForDocs,
}: ProjectSectionProps) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(initialOrgId || 'ALL');
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createOrgId, setCreateOrgId] = useState<string>(initialOrgId || '');
  const [createName, setCreateName] = useState('');
  const [createKey, setCreateKey] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createTeamId, setCreateTeamId] = useState<string>(initialTeamId || '');
  const [createStatus, setCreateStatus] = useState<ProjectStatus>('PLANNING');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit status state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ProjectStatus>('ACTIVE');

  // Load organizations
  useEffect(() => {
    async function loadOrgs() {
      try {
        const orgs = await orgApi.getOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0 && !createOrgId) {
          setCreateOrgId(orgs[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organizations');
      }
    }
    loadOrgs();
  }, [createOrgId]);

  // Load teams when createOrgId changes
  useEffect(() => {
    async function loadOrgTeams() {
      if (!createOrgId) return;
      try {
        const orgTeams = await teamApi.getTeams(createOrgId);
        setTeams(orgTeams);
      } catch {
        setTeams([]);
      }
    }
    loadOrgTeams();
  }, [createOrgId]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (selectedOrgId && selectedOrgId !== 'ALL') {
        const data = await projectApi.getProjectsForOrganization(selectedOrgId);
        setProjects(data);
      } else {
        const data = await projectApi.getAllProjects();
        setProjects(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createOrgId || !createName.trim() || !createKey.trim()) {
      setError('Organization, project name, and project key are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await projectApi.createProject(createOrgId, {
        name: createName.trim(),
        projectKey: createKey.trim().toUpperCase(),
        description: createDesc.trim() || undefined,
        teamId: createTeamId || undefined,
        status: createStatus,
      });
      setSuccessMsg(`Project [${created.projectKey}] "${created.name}" created.`);
      setShowCreateForm(false);
      setCreateName('');
      setCreateKey('');
      setCreateDesc('');
      setCreateTeamId('');
      setCreateStatus('PLANNING');
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (projectId: string) => {
    setError(null);
    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      await projectApi.updateProject(projectId, {
        name: project.name,
        description: project.description,
        status: newStatus,
        teamId: project.teamId || undefined,
      });
      setSuccessMsg('Project status updated.');
      setEditingProjectId(null);
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project status');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setError(null);
    try {
      await projectApi.deleteProject(id);
      setSuccessMsg('Project deleted.');
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-slate-700" />
            Projects
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Track software development projects, keys, and assigned teams.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Org Filter */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setError(null);
              setSuccessMsg(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showCreateForm ? 'Cancel' : 'New Project'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Create New Project</h3>
          <form onSubmit={handleCreateSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700" htmlFor="proj-org">
                  Organization *
                </label>
                <select
                  id="proj-org"
                  required
                  value={createOrgId}
                  onChange={(e) => setCreateOrgId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700" htmlFor="proj-key">
                  Project Key (e.g. SDLC, PROJ) *
                </label>
                <input
                  id="proj-key"
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. SDLC"
                  value={createKey}
                  onChange={(e) => setCreateKey(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700" htmlFor="proj-name">
                Project Name *
              </label>
              <input
                id="proj-name"
                type="text"
                required
                placeholder="e.g. Collaborative SDLC Management Platform"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700" htmlFor="proj-team">
                  Assigned Team (optional)
                </label>
                <select
                  id="proj-team"
                  value={createTeamId}
                  onChange={(e) => setCreateTeamId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">No Team Assigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700" htmlFor="proj-status">
                  Lifecycle Status
                </label>
                <select
                  id="proj-status"
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700" htmlFor="proj-desc">
                Description
              </label>
              <input
                id="proj-desc"
                type="text"
                placeholder="Project overview and goals"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded bg-white hover:bg-slate-100 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
          Loading projects...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProjects.length === 0 && (
        <div className="border border-dashed border-slate-300 rounded-md p-8 text-center space-y-3">
          <FolderGit2 className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800">No projects found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first project within an organization to start managing requirements, sprints, and code.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Project
          </button>
        </div>
      )}

      {/* Grid of Projects */}
      {!isLoading && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-slate-200 rounded-md p-4 space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {project.projectKey}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{project.name}</h3>
                  </div>
                  {project.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">{project.description}</p>
                  )}
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadgeClass(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {project.organizationName}
                </span>
                {project.teamName && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Team: {project.teamName}
                  </span>
                )}
                {project.createdByUsername && (
                  <span className="text-slate-400 text-[11px] ml-auto">
                    by @{project.createdByUsername}
                  </span>
                )}
              </div>

              {/* Status editing inline */}
              {editingProjectId === project.id ? (
                <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(project.id)}
                    className="px-2.5 py-1 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProjectId(null)}
                    className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProjectId(project.id);
                        setNewStatus(project.status);
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Change Status
                    </button>

                    {onSelectProjectForSprints && (
                      <button
                        type="button"
                        onClick={() => onSelectProjectForSprints(project.id)}
                        className="text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <Kanban className="w-3 h-3" />
                        Sprint Board
                      </button>
                    )}

                    {onSelectProjectForDocs && (
                      <button
                        type="button"
                        onClick={() => onSelectProjectForDocs(project.id)}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                      >
                        <FileCode className="w-3 h-3" />
                        Docs &amp; Diagrams
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    title="Delete Project"
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
