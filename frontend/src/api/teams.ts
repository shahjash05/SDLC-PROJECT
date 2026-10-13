import { API_BASE_URL, type ApiResponse } from './client';
import { getStoredToken } from './auth';
import type {
  TeamSummary,
  TeamDetail,
  CreateTeamPayload,
  UpdateTeamPayload,
  AddTeamMemberPayload,
  TeamMember,
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

export async function getTeams(orgId: string): Promise<TeamSummary[]> {
  const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/teams`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TeamSummary[]>(res, 'Failed to fetch teams');
}

export async function getTeam(id: string): Promise<TeamDetail> {
  const res = await fetch(`${API_BASE_URL}/teams/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TeamDetail>(res, 'Failed to fetch team details');
}

export async function createTeam(orgId: string, payload: CreateTeamPayload): Promise<TeamDetail> {
  const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/teams`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TeamDetail>(res, 'Failed to create team');
}

export async function updateTeam(id: string, payload: UpdateTeamPayload): Promise<TeamDetail> {
  const res = await fetch(`${API_BASE_URL}/teams/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TeamDetail>(res, 'Failed to update team');
}

export async function deleteTeam(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/teams/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res, 'Failed to delete team');
}

export async function addTeamMember(teamId: string, payload: AddTeamMemberPayload): Promise<TeamMember> {
  const res = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TeamMember>(res, 'Failed to add member to team');
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res, 'Failed to remove member from team');
}
