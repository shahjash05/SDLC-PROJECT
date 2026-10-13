import { API_BASE_URL, type ApiResponse } from './client';
import type {
  AuthResponseData,
  LoginPayload,
  RegisterPayload,
  UserSummary,
} from '../types/auth';

const TOKEN_KEY = 'sdlc_access_token';

/**
 * Token management utilities (localStorage backed)
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore local storage errors in constrained environments
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore local storage errors
  }
}

/**
 * Helper to parse backend error responses cleanly.
 */
async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const errorJson = (await response.json()) as ApiResponse<unknown>;
    if (errorJson && typeof errorJson.message === 'string' && errorJson.message.trim().length > 0) {
      return errorJson.message;
    }
  } catch {
    // Not valid JSON, use fallback
  }
  return fallback;
}

/**
 * Register a new user account.
 * Note: Server strictly assigns ROLE_DEVELOPER.
 */
export async function register(payload: RegisterPayload): Promise<AuthResponseData> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response, `Registration failed (${response.status})`);
    throw new Error(message);
  }

  const json = (await response.json()) as ApiResponse<AuthResponseData>;
  return json.data;
}

/**
 * Authenticate with username or email and password.
 */
export async function login(payload: LoginPayload): Promise<AuthResponseData> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response, 'Invalid username/email or password.');
    throw new Error(message);
  }

  const json = (await response.json()) as ApiResponse<AuthResponseData>;
  return json.data;
}

/**
 * Retrieve current user profile using the stored or provided JWT.
 */
export async function getCurrentUser(tokenOverride?: string): Promise<UserSummary> {
  const token = tokenOverride ?? getStoredToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearStoredToken();
    throw new Error('Session expired or unauthorized');
  }

  if (!response.ok) {
    const message = await extractErrorMessage(response, `Failed to load profile (${response.status})`);
    throw new Error(message);
  }

  const json = (await response.json()) as ApiResponse<UserSummary>;
  return json.data;
}
