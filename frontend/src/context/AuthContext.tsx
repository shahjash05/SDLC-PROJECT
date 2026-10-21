import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  LoginPayload,
  RegisterPayload,
  UserSummary,
} from '../types/auth';
import * as authApi from '../api/auth';

export interface AuthContextType {
  user: UserSummary | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(authApi.getStoredToken());
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const storedToken = authApi.getStoredToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const userProfile = await authApi.getCurrentUser(storedToken);
        if (isMounted) {
          setUser(userProfile);
          setToken(storedToken);
          setError(null);
        }
      } catch {
        if (isMounted) {
          authApi.clearStoredToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setError(null);
    try {
      const authData = await authApi.login(payload);
      authApi.setStoredToken(authData.accessToken);
      setToken(authData.accessToken);
      setUser(authData.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setError(null);
    try {
      const authData = await authApi.register(payload);
      authApi.setStoredToken(authData.accessToken);
      setToken(authData.accessToken);
      setUser(authData.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    authApi.clearStoredToken();
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useOptionalAuth(): AuthContextType | undefined {
  return useContext(AuthContext);
}
