import { API_BASE_URL, type ApiResponse } from './client';
import { getStoredToken } from './auth';
import type {
  DocumentSummary,
  DocumentDetail,
  DocumentVersion,
  DocumentType,
  CreateDocumentPayload,
  UpdateDocumentPayload,
  UpdateDocumentStatusPayload,
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

export async function getDocumentsForProject(
  projectId: string,
  type?: DocumentType
): Promise<DocumentSummary[]> {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/documents${query}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<DocumentSummary[]>(res, 'Failed to fetch documents');
}

export async function getDocumentById(documentId: string): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<DocumentDetail>(res, 'Failed to fetch document');
}

export async function createDocument(
  projectId: string,
  payload: CreateDocumentPayload
): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<DocumentDetail>(res, 'Failed to create document');
}

export async function updateDocument(
  documentId: string,
  payload: UpdateDocumentPayload
): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<DocumentDetail>(res, 'Failed to update document');
}

export async function updateDocumentStatus(
  documentId: string,
  payload: UpdateDocumentStatusPayload
): Promise<DocumentSummary> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<DocumentSummary>(res, 'Failed to update document status');
}

export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/versions`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<DocumentVersion[]>(res, 'Failed to fetch document versions');
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    let msg = 'Failed to delete document';
    try {
      const body = (await res.json()) as ApiResponse<unknown>;
      if (body?.message) msg = body.message;
    } catch {
      // not json
    }
    throw new Error(msg);
  }
}
