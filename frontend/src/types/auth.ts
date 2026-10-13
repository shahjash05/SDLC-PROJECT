/**
 * Authentication and User data models for Phase 1.
 */

export interface UserSummary {
  id: string;
  email: string;
  username: string;
  fullName: string;
  roles: string[];
}

export interface AuthResponseData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface RegisterPayload {
  email: string;
  username: string;
  fullName: string;
  password: string;
}

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}
