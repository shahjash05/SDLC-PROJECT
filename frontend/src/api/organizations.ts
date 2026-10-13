import { API_BASE_URL, type ApiResponse } from './client';
import { getStoredToken } from './auth';
import type {
  OrganizationSummary,
  OrganizationDetail,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  AddOrgMemberPayload,
  OrgMember,
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

export async function getOrganizations(): Promise<OrganizationSummary[]> {
  const res = await fetch(`${API_BASE_URL}/organizations`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<OrganizationSummary[]>(res, 'Failed to fetch organizations');
}

export async function getOrganization(id: string): Promise<OrganizationDetail> {
  const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<OrganizationDetail>(res, 'Failed to fetch organization details');
}

export async function createOrganization(payload: CreateOrganizationPayload): Promise<OrganizationDetail> {
  const res = await fetch(`${API_BASE_URL}/organizations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<OrganizationDetail>(res, 'Failed to create organization');
}

export async function updateOrganization(
  id: string,
  payload: UpdateOrganizationPayload
): Promise<OrganizationDetail> {
  const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<OrganizationDetail>(res, 'Failed to update organization');
}

export async function deleteOrganization(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res, 'Failed to delete organization');
}

export async function addOrgMember(
  orgId: string,
  payload: AddOrgMemberPayload
): Promise<OrgMember> {
  const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/members`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<OrgMember>(res, 'Failed to add member to organization');
}

export async function removeOrgMember(orgId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/members/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res, 'Failed to remove member from organization');
}
