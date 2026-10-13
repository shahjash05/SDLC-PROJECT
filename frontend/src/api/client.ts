/**
 * API client configuration — Phase 0 foundation.
 * Full axios/fetch wrapper will be added in Phase 1 with auth interceptors.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
}

export interface ActuatorHealth {
  status: string;
  components?: {
    db?: {
      status: string;
      details?: {
        database?: string;
        validationQuery?: string;
      };
    };
    [key: string]: unknown;
  };
}

/**
 * Check backend health — used by the Phase 0 landing page.
 */
export async function checkHealth(): Promise<ApiResponse<HealthStatus>> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json() as Promise<ApiResponse<HealthStatus>>;
}

/**
 * Check actuator health for component-level verification (e.g. database connectivity).
 */
export async function checkActuatorHealth(): Promise<ActuatorHealth> {
  const response = await fetch('/actuator/health');
  if (!response.ok) {
    throw new Error(`Actuator health check failed: ${response.status}`);
  }
  return response.json() as Promise<ActuatorHealth>;
}

export { API_BASE_URL };

