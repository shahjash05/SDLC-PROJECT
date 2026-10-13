import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  LogOut,
  Shield,
  CheckCircle,
  Building2,
  Users,
  FolderGit2,
  Kanban,
} from 'lucide-react';
import { OrganizationSection } from './OrganizationSection';
import { TeamSection } from './TeamSection';
import { ProjectSection } from './ProjectSection';
import { SprintBoardView } from './SprintBoardView';

function formatRoleName(role: string): string {
  switch (role) {
    case 'ROLE_DEVELOPER':
      return 'Developer / Student';
    case 'ROLE_TEAM_LEADER':
      return 'Team Leader';
    case 'ROLE_FACULTY':
      return 'Faculty Advisor';
    case 'ROLE_CLIENT':
      return 'Client Stakeholder';
    case 'ROLE_ADMIN':
      return 'Platform Administrator';
    default:
      return role.replace('ROLE_', '');
  }
}

export function WorkspaceView() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'organizations' | 'teams' | 'projects' | 'sprints' | 'profile'>('organizations');
  const [selectedOrgIdForTeams, setSelectedOrgIdForTeams] = useState<string | null>(null);
  const [selectedOrgIdForProjects, setSelectedOrgIdForProjects] = useState<string | null>(null);
  const [selectedTeamIdForProjects, setSelectedTeamIdForProjects] = useState<string | null>(null);
  const [selectedProjectIdForSprints, setSelectedProjectIdForSprints] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const navigateToTeams = (orgId: string) => {
    setSelectedOrgIdForTeams(orgId);
    setActiveTab('teams');
  };

  const navigateToProjectsFromOrg = (orgId: string) => {
    setSelectedOrgIdForProjects(orgId);
    setSelectedTeamIdForProjects(null);
    setActiveTab('projects');
  };

  const navigateToProjectsFromTeam = (teamId: string, orgId: string) => {
    setSelectedOrgIdForProjects(orgId);
    setSelectedTeamIdForProjects(teamId);
    setActiveTab('projects');
  };

  const navigateToSprintsFromProject = (projectId: string) => {
    setSelectedProjectIdForSprints(projectId);
    setActiveTab('sprints');
  };

  return (
    <div className="space-y-6">
      {/* User Session Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-slate-900">
                {user.fullName}
              </h2>
              <span className="text-xs text-slate-400">(@{user.username})</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 flex-wrap">
            {user.roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
              >
                <Shield className="w-3 h-3 text-slate-600" />
                <span>{formatRoleName(role)}</span>
              </span>
            ))}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>Authenticated</span>
            </span>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 transition-colors ml-2"
            title="Log out of session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('organizations')}
          className={`pb-2.5 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'organizations'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Organizations
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`pb-2.5 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'teams'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Teams
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`pb-2.5 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'projects'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          Projects
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sprints')}
          className={`pb-2.5 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'sprints'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Kanban className="w-4 h-4" />
          Sprints &amp; Backlog
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-2.5 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ml-auto ${
            activeTab === 'profile'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          Session &amp; Roles
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'organizations' && (
        <OrganizationSection
          onSelectOrgForTeams={navigateToTeams}
          onSelectOrgForProjects={navigateToProjectsFromOrg}
        />
      )}

      {activeTab === 'teams' && (
        <TeamSection
          initialOrgId={selectedOrgIdForTeams}
          onSelectTeamForProjects={navigateToProjectsFromTeam}
        />
      )}

      {activeTab === 'projects' && (
        <ProjectSection
          initialOrgId={selectedOrgIdForProjects}
          initialTeamId={selectedTeamIdForProjects}
          onSelectProjectForSprints={navigateToSprintsFromProject}
        />
      )}

      {activeTab === 'sprints' && (
        <SprintBoardView initialProjectId={selectedProjectIdForSprints} />
      )}

      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Account Status
              </span>
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Authenticated</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Assigned Permissions
              </span>
              <p className="text-sm font-medium text-slate-900 truncate">
                {user.roles.map(formatRoleName).join(', ')}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                User ID
              </span>
              <p className="text-xs font-mono text-slate-600 truncate" title={user.id}>
                {user.id}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-5 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Role &amp; Permission Scope
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your account currently holds{' '}
              <strong className="text-slate-900">{user.roles.map(formatRoleName).join(', ')}</strong>.
              Organization creation and leadership capabilities allow you to organize contributors, establish
              teams, and manage projects.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
