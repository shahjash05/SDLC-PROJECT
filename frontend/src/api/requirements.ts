import { API_BASE_URL, type ApiResponse } from './client';
import { getStoredToken } from './auth';
import type {
  StorySummary,
  StoryDetail,
  CreateStoryPayload,
  UpdateStoryPayload,
  StoryStatus,
  TaskItem,
  CreateTaskPayload,
  UpdateTaskPayload,
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

export async function getStories(
  projectId: string,
  params?: { sprintId?: string; backlogOnly?: boolean; status?: string }
): Promise<StorySummary[]> {
  const query = new URLSearchParams();
  if (params?.sprintId) query.set('sprintId', params.sprintId);
  if (params?.backlogOnly) query.set('backlogOnly', 'true');
  if (params?.status) query.set('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stories${qs}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<StorySummary[]>(res, 'Failed to fetch user stories');
}

export async function getStory(id: string): Promise<StoryDetail> {
  const res = await fetch(`${API_BASE_URL}/stories/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<StoryDetail>(res, 'Failed to fetch story details');
}

export async function createStory(
  projectId: string,
  payload: CreateStoryPayload
): Promise<StoryDetail> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<StoryDetail>(res, 'Failed to create user story');
}

export async function updateStory(
  id: string,
  payload: UpdateStoryPayload
): Promise<StoryDetail> {
  const res = await fetch(`${API_BASE_URL}/stories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<StoryDetail>(res, 'Failed to update user story');
}

export async function updateStoryStatus(
  id: string,
  status: StoryStatus
): Promise<StorySummary> {
  const res = await fetch(`${API_BASE_URL}/stories/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<StorySummary>(res, 'Failed to update story status');
}

export async function deleteStory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/stories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res, 'Failed to delete user story');
}

// --- Subtasks ---

export async function getTasks(storyId: string): Promise<TaskItem[]> {
  const res = await fetch(`${API_BASE_URL}/stories/${storyId}/tasks`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TaskItem[]>(res, 'Failed to fetch tasks');
}

export async function createTask(
  storyId: string,
  payload: CreateTaskPayload
): Promise<TaskItem> {
  const res = await fetch(`${API_BASE_URL}/stories/${storyId}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TaskItem>(res, 'Failed to create task');
}

export async function updateTask(
  id: string,
  payload: UpdateTaskPayload
): Promise<TaskItem> {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TaskItem>(res, 'Failed to update task');
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res, 'Failed to delete task');
}
