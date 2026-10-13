import { API_BASE_URL, type ApiResponse } from './client';
import { getStoredToken } from './auth';
import type {
  ProjectSummary,
  ProjectDetail,
  CreateProjectPayload,
  UpdateProjectPayload,
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

export async function getAllProjects(): Promise<ProjectSummary[]> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ProjectSummary[]>(res, 'Failed to fetch projects');
}

export async function getProjectsForOrganization(orgId: string): Promise<ProjectSummary[]> {
  const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/projects`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ProjectSummary[]>(res, 'Failed to fetch organization projects');
}

export async function getProject(id: string): Promise<ProjectDetail> {
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ProjectDetail>(res, 'Failed to fetch project details');
}

export async function createProject(
  orgId: string,
  payload: CreateProjectPayload
): Promise<ProjectDetail> {
  const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<ProjectDetail>(res, 'Failed to create project');
}

export async function updateProject(
  id: string,
  payload: UpdateProjectPayload
): Promise<ProjectDetail> {
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<ProjectDetail>(res, 'Failed to update project');
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res, 'Failed to delete project');
}
