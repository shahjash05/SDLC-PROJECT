import { API_BASE_URL, type ApiResponse } from './client';
import { getStoredToken } from './auth';
import type {
  SprintSummary,
  SprintDetail,
  CreateSprintPayload,
  UpdateSprintPayload,
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

export async function getSprints(projectId: string): Promise<SprintSummary[]> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/sprints`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<SprintSummary[]>(res, 'Failed to fetch sprints');
}

export async function getSprint(id: string): Promise<SprintDetail> {
  const res = await fetch(`${API_BASE_URL}/sprints/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<SprintDetail>(res, 'Failed to fetch sprint details');
}

export async function createSprint(
  projectId: string,
  payload: CreateSprintPayload
): Promise<SprintDetail> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/sprints`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<SprintDetail>(res, 'Failed to create sprint');
}

export async function updateSprint(
  id: string,
  payload: UpdateSprintPayload
): Promise<SprintDetail> {
  const res = await fetch(`${API_BASE_URL}/sprints/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<SprintDetail>(res, 'Failed to update sprint');
}

export async function deleteSprint(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/sprints/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res, 'Failed to delete sprint');
}
