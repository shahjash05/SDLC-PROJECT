import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  FolderGit2,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Shield,
  Building2,
} from 'lucide-react';
import type {
  OrganizationSummary,
  TeamSummary,
  TeamDetail,
  TeamMemberRole,
} from '../../types/entities';
import * as orgApi from '../../api/organizations';
import * as teamApi from '../../api/teams';

interface TeamSectionProps {
  initialOrgId?: string | null;
  onSelectTeamForProjects?: (teamId: string, orgId: string) => void;
}

export function TeamSection({ initialOrgId, onSelectTeamForProjects }: TeamSectionProps) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(initialOrgId || '');
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create team state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add team member state
  const [newMemberIdentifier, setNewMemberIdentifier] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamMemberRole>('MEMBER');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Fetch organizations
  useEffect(() => {
    async function loadOrgs() {
      try {
        const orgs = await orgApi.getOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0 && !selectedOrgId) {
          setSelectedOrgId(orgs[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organizations');
      }
    }
    loadOrgs();
  }, []);

  // Update selectedOrgId when initialOrgId changes
  useEffect(() => {
    if (initialOrgId) {
      setSelectedOrgId(initialOrgId);
    }
  }, [initialOrgId]);

  // Fetch teams for selected organization
  const fetchTeams = useCallback(async (orgId: string) => {
    if (!orgId) {
      setTeams([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await teamApi.getTeams(orgId);
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      fetchTeams(selectedOrgId);
      setSelectedTeam(null);
    }
  }, [selectedOrgId, fetchTeams]);

  const handleSelectTeam = async (id: string) => {
    setError(null);
    try {
      const detail = await teamApi.getTeam(id);
      setSelectedTeam(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team details');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !createName.trim()) {
      setError('Team name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await teamApi.createTeam(selectedOrgId, {
        name: createName.trim(),
        description: createDesc.trim() || undefined,
      });
      setSuccessMsg(`Team "${created.name}" created.`);
      setShowCreateForm(false);
      setCreateName('');
      setCreateDesc('');
      await fetchTeams(selectedOrgId);
      setSelectedTeam(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !newMemberIdentifier.trim()) return;

    setIsAddingMember(true);
    setError(null);
    try {
      await teamApi.addTeamMember(selectedTeam.id, {
        usernameOrEmail: newMemberIdentifier.trim(),
        role: newMemberRole,
      });
      setSuccessMsg(`Added member to team.`);
      setNewMemberIdentifier('');
      const refreshed = await teamApi.getTeam(selectedTeam.id);
      setSelectedTeam(refreshed);
      await fetchTeams(selectedOrgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member to team');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    setError(null);
    try {
      await teamApi.removeTeamMember(selectedTeam.id, userId);
      setSuccessMsg('Team member removed.');
      const refreshed = await teamApi.getTeam(selectedTeam.id);
      setSelectedTeam(refreshed);
      await fetchTeams(selectedOrgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member from team');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    setError(null);
    try {
      await teamApi.deleteTeam(id);
      setSuccessMsg('Team deleted.');
      setSelectedTeam(null);
      await fetchTeams(selectedOrgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            Teams
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Organize contributors, developers, and project team leads.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Org Selector */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!selectedOrgId}
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setError(null);
              setSuccessMsg(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showCreateForm ? 'Cancel' : 'New Team'}
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

      {/* Create Team Form */}
      {showCreateForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Create Team in Organization</h3>
          <form onSubmit={handleCreateSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700" htmlFor="team-name">
                Team Name *
              </label>
              <input
                id="team-name"
                type="text"
                required
                placeholder="e.g. Core API Team"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700" htmlFor="team-desc">
                Description
              </label>
              <input
                id="team-desc"
                type="text"
                placeholder="Optional description"
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
                Create Team
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
          Loading teams...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && teams.length === 0 && (
        <div className="border border-dashed border-slate-300 rounded-md p-8 text-center space-y-3">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800">No teams in this organization</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create a team to group students, engineers, and assign projects.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Team
          </button>
        </div>
      )}

      {/* Grid of Teams */}
      {!isLoading && teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => {
            const isSelected = selectedTeam?.id === team.id;
            return (
              <div
                key={team.id}
                className={`bg-white border rounded-md p-4 space-y-3 transition-colors ${
                  isSelected ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{team.name}</h3>
                    {team.description && (
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{team.description}</p>
                    )}
                  </div>
                  {team.leaderUsername && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Shield className="w-3 h-3 text-slate-500" />
                      Leader: {team.leaderUsername}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                    {team.projectCount} {team.projectCount === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSelectTeam(team.id)}
                    className="text-xs font-medium text-slate-900 hover:underline inline-flex items-center gap-1"
                  >
                    {isSelected ? 'Viewing Members' : 'Manage Team'}
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2">
                    {onSelectTeamForProjects && (
                      <button
                        type="button"
                        onClick={() => onSelectTeamForProjects(team.id, team.organizationId)}
                        className="text-[11px] text-slate-600 hover:text-slate-900 underline"
                      >
                        Projects ({team.projectCount})
                      </button>
                    )}
                    <button
                      type="button"
                      title="Delete Team"
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Team Detail & Member Management */}
      {selectedTeam && (
        <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {selectedTeam.name} · Team Roster
              </h3>
              <p className="text-xs text-slate-500">
                Members assigned to this team ({selectedTeam.members.length})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTeam(null)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          {/* Add Team Member sub-form */}
          <form onSubmit={handleAddMember} className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col sm:flex-row gap-2.5 items-end">
            <div className="flex-1 w-full space-y-1">
              <label className="block text-[11px] font-medium text-slate-700" htmlFor="add-team-member">
                Member Username or Email (must be in Organization)
              </label>
              <input
                id="add-team-member"
                type="text"
                required
                placeholder="e.g. dev or dev@example.com"
                value={newMemberIdentifier}
                onChange={(e) => setNewMemberIdentifier(e.target.value)}
                className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div className="w-full sm:w-32 space-y-1">
              <label className="block text-[11px] font-medium text-slate-700" htmlFor="team-member-role">
                Role
              </label>
              <select
                id="team-member-role"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as TeamMemberRole)}
                className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="MEMBER">Member</option>
                <option value="LEADER">Leader</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isAddingMember}
              className="inline-flex items-center justify-center gap-1 px-3 py-1 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors h-7"
            >
              {isAddingMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Add to Team
            </button>
          </form>

          {/* Members list */}
          <div className="divide-y divide-slate-100">
            {selectedTeam.members.map((member) => (
              <div key={member.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-medium text-slate-700 text-xs">
                    {member.fullName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">{member.fullName}</span>{' '}
                    <span className="text-slate-400">(@{member.username})</span>
                    <span className="text-slate-500 block text-[11px]">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {member.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.userId)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded"
                    title="Remove from team"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
