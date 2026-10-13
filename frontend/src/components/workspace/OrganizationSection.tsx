import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Users,
  FolderGit2,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Shield,
} from 'lucide-react';
import type {
  OrganizationSummary,
  OrganizationDetail,
  OrgMemberRole,
} from '../../types/entities';
import * as orgApi from '../../api/organizations';

interface OrganizationSectionProps {
  onSelectOrgForTeams?: (orgId: string) => void;
  onSelectOrgForProjects?: (orgId: string) => void;
}

export function OrganizationSection({
  onSelectOrgForTeams,
  onSelectOrgForProjects,
}: OrganizationSectionProps) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add member states
  const [newMemberIdentifier, setNewMemberIdentifier] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<OrgMemberRole>('MEMBER');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await orgApi.getOrganizations();
      setOrganizations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleSelectOrg = async (id: string) => {
    setError(null);
    try {
      const detail = await orgApi.getOrganization(id);
      setSelectedOrg(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization details');
    }
  };

  const handleNameChange = (val: string) => {
    setCreateName(val);
    if (!createSlug || createSlug === createName.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setCreateSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createSlug.trim()) {
      setError('Organization name and slug are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const newOrg = await orgApi.createOrganization({
        name: createName.trim(),
        slug: createSlug.trim(),
        description: createDesc.trim() || undefined,
      });
      setSuccessMsg(`Organization "${newOrg.name}" created successfully.`);
      setShowCreateForm(false);
      setCreateName('');
      setCreateSlug('');
      setCreateDesc('');
      await fetchOrganizations();
      setSelectedOrg(newOrg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !newMemberIdentifier.trim()) return;

    setIsAddingMember(true);
    setError(null);
    try {
      await orgApi.addOrgMember(selectedOrg.id, {
        usernameOrEmail: newMemberIdentifier.trim(),
        role: newMemberRole,
      });
      setSuccessMsg(`Added member to ${selectedOrg.name}.`);
      setNewMemberIdentifier('');
      // Refresh detail
      const refreshed = await orgApi.getOrganization(selectedOrg.id);
      setSelectedOrg(refreshed);
      await fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedOrg) return;
    setError(null);
    try {
      await orgApi.removeOrgMember(selectedOrg.id, userId);
      setSuccessMsg('Member removed successfully.');
      const refreshed = await orgApi.getOrganization(selectedOrg.id);
      setSelectedOrg(refreshed);
      await fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleDeleteOrg = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this organization? All associated teams and projects will be deleted.')) {
      return;
    }
    setError(null);
    try {
      await orgApi.deleteOrganization(id);
      setSuccessMsg('Organization deleted.');
      setSelectedOrg(null);
      await fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete organization');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            Organizations
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage your workspaces, institutional divisions, and member memberships.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setError(null);
            setSuccessMsg(null);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {showCreateForm ? 'Cancel' : 'New Organization'}
        </button>
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

      {/* Create Org Form */}
      {showCreateForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Create New Organization</h3>
          <form onSubmit={handleCreateSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700" htmlFor="org-name">
                  Organization Name *
                </label>
                <input
                  id="org-name"
                  type="text"
                  required
                  placeholder="e.g. Acme Labs"
                  value={createName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700" htmlFor="org-slug">
                  Slug (unique identifier) *
                </label>
                <input
                  id="org-slug"
                  type="text"
                  required
                  placeholder="e.g. acme-labs"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700" htmlFor="org-desc">
                Description
              </label>
              <input
                id="org-desc"
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
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Organization
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
          Loading organizations...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && organizations.length === 0 && (
        <div className="border border-dashed border-slate-300 rounded-md p-8 text-center space-y-3">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800">No organizations found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are not a member of any organizations yet. Create one or request an invitation to get started.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Organization
          </button>
        </div>
      )}

      {/* Grid of Organizations */}
      {!isLoading && organizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizations.map((org) => {
            const isSelected = selectedOrg?.id === org.id;
            return (
              <div
                key={org.id}
                className={`bg-white border rounded-md p-4 space-y-3 transition-colors ${
                  isSelected ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      {org.name}
                      <span className="text-xs font-normal text-slate-400">/{org.slug}</span>
                    </h3>
                    {org.description && (
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{org.description}</p>
                    )}
                  </div>
                  {org.currentUserRole && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Shield className="w-3 h-3 text-slate-500" />
                      {org.currentUserRole}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {org.teamCount} {org.teamCount === 1 ? 'team' : 'teams'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                    {org.projectCount} {org.projectCount === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSelectOrg(org.id)}
                    className="text-xs font-medium text-slate-900 hover:underline inline-flex items-center gap-1"
                  >
                    {isSelected ? 'Viewing Members' : 'View & Manage'}
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2">
                    {onSelectOrgForTeams && (
                      <button
                        type="button"
                        onClick={() => onSelectOrgForTeams(org.id)}
                        className="text-[11px] text-slate-600 hover:text-slate-900 underline"
                      >
                        Teams ({org.teamCount})
                      </button>
                    )}
                    {onSelectOrgForProjects && (
                      <button
                        type="button"
                        onClick={() => onSelectOrgForProjects(org.id)}
                        className="text-[11px] text-slate-600 hover:text-slate-900 underline"
                      >
                        Projects ({org.projectCount})
                      </button>
                    )}
                    {(org.currentUserRole === 'OWNER' || org.currentUserRole === 'ADMIN') && (
                      <button
                        type="button"
                        title="Delete Organization"
                        onClick={() => handleDeleteOrg(org.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Organization Details & Members Panel */}
      {selectedOrg && (
        <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {selectedOrg.name} · Member Directory
              </h3>
              <p className="text-xs text-slate-500">
                Members assigned to this organization ({selectedOrg.members.length})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedOrg(null)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          {/* Add Member sub-form (for owner/admin) */}
          {(selectedOrg.currentUserRole === 'OWNER' || selectedOrg.currentUserRole === 'ADMIN') && (
            <form onSubmit={handleAddMember} className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col sm:flex-row gap-2.5 items-end">
              <div className="flex-1 w-full space-y-1">
                <label className="block text-[11px] font-medium text-slate-700" htmlFor="add-org-member">
                  Username or Email
                </label>
                <input
                  id="add-org-member"
                  type="text"
                  required
                  placeholder="e.g. dev or dev@example.com"
                  value={newMemberIdentifier}
                  onChange={(e) => setNewMemberIdentifier(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="w-full sm:w-36 space-y-1">
                <label className="block text-[11px] font-medium text-slate-700" htmlFor="member-role">
                  Role
                </label>
                <select
                  id="member-role"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as OrgMemberRole)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isAddingMember}
                className="inline-flex items-center justify-center gap-1 px-3 py-1 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors h-7"
              >
                {isAddingMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Add Member
              </button>
            </form>
          )}

          {/* Members List */}
          <div className="divide-y divide-slate-100">
            {selectedOrg.members.map((member) => (
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
                  {(selectedOrg.currentUserRole === 'OWNER' || selectedOrg.currentUserRole === 'ADMIN') &&
                    member.role !== 'OWNER' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                        title="Remove member"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
