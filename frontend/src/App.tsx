import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { WorkspaceView } from './components/workspace/WorkspaceView';
import {
  checkHealth,
  checkActuatorHealth,
  type HealthStatus,
  type ApiResponse,
  type ActuatorHealth,
} from './api/client';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  LayoutDashboard,
  Activity,
  LogOut,
} from 'lucide-react';
import './index.css';

type ServiceState = 'UP' | 'DOWN' | 'CHECKING' | 'UNVERIFIED';

interface StatusBadgeProps {
  state: ServiceState;
  label?: string;
}

function StatusBadge({ state, label }: StatusBadgeProps) {
  const displayLabel = label ?? state;

  if (state === 'UP') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (state === 'DOWN') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-800 border border-red-200">
        <XCircle className="w-3.5 h-3.5 text-red-600" />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (state === 'CHECKING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
        <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
        <span>Checking...</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
      <span>{displayLabel}</span>
    </span>
  );
}

const ROADMAP_PHASES = [
  {
    phase: 'Phase 0',
    name: 'Foundation & Infrastructure',
    description: 'Project setup, PostgreSQL container, Flyway baseline schema, Spring Boot 3 & Vite React client.',
    status: 'Completed',
    statusVariant: 'completed' as const,
  },
  {
    phase: 'Phase 1',
    name: 'Authentication & Permissions',
    description: 'User registration, login, JWT token auth, RBAC (Developer, Team Lead, Faculty, Client, Admin).',
    status: 'Completed',
    statusVariant: 'completed' as const,
  },
  {
    phase: 'Phase 2',
    name: 'Organizations, Teams & Projects',
    description: 'Workspace hierarchy, project creation, member invites, and role delegation.',
    status: 'Completed',
    statusVariant: 'completed' as const,
  },
  {
    phase: 'Phase 3',
    name: 'Requirements & Sprint Planning',
    description: 'User stories, acceptance criteria, backlogs, sprint boards, and task tracking.',
    status: 'Active (Current)',
    statusVariant: 'active' as const,
  },
  {
    phase: 'Phase 4',
    name: 'Documents & Architecture Diagrams',
    description: 'Collaborative technical specifications, Mermaid architecture diagrams, and review workflows.',
    status: 'Next Up',
    statusVariant: 'next' as const,
  },
  {
    phase: 'Phase 5',
    name: 'QA & Bug Tracking',
    description: 'Test case authoring, execution runs, defect lifecycle, and release readiness reporting.',
    status: 'Planned',
    statusVariant: 'planned' as const,
  },
];

function AppContent() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'workspace' | 'diagnostics'>('workspace');

  // Phase 0 health check states
  const [health, setHealth] = useState<ApiResponse<HealthStatus> | null>(null);
  const [actuator, setActuator] = useState<ActuatorHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const performHealthChecks = useCallback(async () => {
    setHealthLoading(true);
    let backendSuccess = false;

    try {
      const data = await checkHealth();
      setHealth(data);
      setHealthError(null);
      backendSuccess = true;
    } catch (err) {
      setHealth(null);
      setHealthError(err instanceof Error ? err.message : 'Backend unreachable');
    }

    if (backendSuccess) {
      try {
        const actuatorData = await checkActuatorHealth();
        setActuator(actuatorData);
      } catch {
        setActuator(null);
      }
    } else {
      setActuator(null);
    }

    setLastChecked(new Date());
    setHealthLoading(false);
  }, []);

  useEffect(() => {
    performHealthChecks();
    const interval = setInterval(performHealthChecks, 30_000);
    return () => clearInterval(interval);
  }, [performHealthChecks]);

  const backendState: ServiceState = healthLoading
    ? 'CHECKING'
    : health?.data?.status === 'UP'
      ? 'UP'
      : 'DOWN';

  const isDbUp = actuator?.components?.db?.status === 'UP';
  const isDbChecked = actuator !== null && actuator.components?.db !== undefined;

  let dbState: ServiceState;
  let dbLabel: string;

  if (healthLoading) {
    dbState = 'CHECKING';
    dbLabel = 'Checking...';
  } else if (backendState === 'DOWN') {
    dbState = 'UNVERIFIED';
    dbLabel = 'Unverified (Backend Offline)';
  } else if (isDbChecked && isDbUp) {
    dbState = 'UP';
    dbLabel = 'UP (PostgreSQL 16)';
  } else if (isDbChecked && !isDbUp) {
    dbState = 'DOWN';
    dbLabel = 'DOWN';
  } else {
    dbState = 'UNVERIFIED';
    dbLabel = 'Unverified (Actuator Probe Failed)';
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900 tracking-tight text-base">
              SDLC Platform
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Phase 1 Auth
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher Tabs */}
            <div className="hidden sm:flex items-center p-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('workspace')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'workspace'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{isAuthenticated ? 'Workspace' : 'Authentication'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('diagnostics')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'diagnostics'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>System Health</span>
              </button>
            </div>

            <StatusBadge
              state={backendState}
              label={
                backendState === 'UP'
                  ? 'Backend: Connected'
                  : backendState === 'CHECKING'
                    ? 'Checking...'
                    : 'Backend: Offline'
              }
            />

            <button
              onClick={performHealthChecks}
              disabled={healthLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 disabled:opacity-50 transition-colors"
              title="Refresh health checks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={logout}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Navigation Tabs (Mobile View) */}
        <div className="flex sm:hidden items-center justify-center p-1 rounded bg-slate-200/60 border border-slate-300 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className={`flex-1 py-1.5 rounded font-medium text-center ${
              activeTab === 'workspace' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {isAuthenticated ? 'Workspace' : 'Authentication'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`flex-1 py-1.5 rounded font-medium text-center ${
              activeTab === 'diagnostics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            System Health
          </button>
        </div>

        {/* Offline Warning Notice */}
        {backendState === 'DOWN' && (
          <div className="rounded-md border border-red-200 bg-red-50/70 p-4 text-sm text-red-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-red-950">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>Backend Service Offline</span>
            </div>
            <p className="text-xs text-red-800">
              {healthError
                ? `Connection error: ${healthError}.`
                : 'Could not connect to Spring Boot API on port 8081.'}
            </p>
            <div className="pt-1 text-xs text-red-900">
              <p className="font-medium mb-1">To start required dev services:</p>
              <ol className="list-decimal list-inside space-y-0.5 font-mono text-[11px] text-red-950">
                <li>docker compose -f docker-compose.dev.yml up -d</li>
                <li>cd backend &amp;&amp; mvn spring-boot:run</li>
              </ol>
            </div>
          </div>
        )}

        {/* Loading Session Indicator */}
        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-600" />
            <p className="text-xs font-medium">Verifying authentication session...</p>
          </div>
        ) : activeTab === 'workspace' ? (
          isAuthenticated ? (
            /* Authenticated Workspace View */
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                  Developer Workspace
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Authenticated session active. Ready for collaborative SDLC modules.
                </p>
              </div>

              <WorkspaceView />
            </div>
          ) : (
            /* Unauthenticated View: Login / Register Form */
            <div className="space-y-8">
              <div className="text-center max-w-md mx-auto space-y-2">
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Collaborative SDLC Platform
                </h1>
                <p className="text-sm text-slate-600">
                  Phase 1 Authentication &amp; Role-Based Access Control
                </p>
              </div>

              <div className="flex justify-center">
                {authMode === 'login' ? (
                  <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
                ) : (
                  <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
                )}
              </div>
            </div>
          )
        ) : (
          /* System Diagnostics View (Phase 0 Health Monitoring) */
          <div className="space-y-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                System Diagnostics &amp; Health Monitoring
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Phase 0 runtime connectivity, PostgreSQL status, and implementation roadmap.
              </p>
            </div>

            {/* Section 1: Runtime Services */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Runtime Services
                </h2>
                {lastChecked && (
                  <span className="text-xs text-slate-500">
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                      <tr>
                        <th scope="col" className="px-4 py-2.5">Service</th>
                        <th scope="col" className="px-4 py-2.5">Component / Tech</th>
                        <th scope="col" className="px-4 py-2.5">Endpoint / Host</th>
                        <th scope="col" className="px-4 py-2.5">Verification</th>
                        <th scope="col" className="px-4 py-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">Backend API</td>
                        <td className="px-4 py-3 text-xs text-slate-600">Spring Boot 3.4.1</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">http://localhost:8081</td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">GET /api/v1/health</td>
                        <td className="px-4 py-3 text-right">
                          <StatusBadge state={backendState} />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">Database</td>
                        <td className="px-4 py-3 text-xs text-slate-600">PostgreSQL 16 (Docker)</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">localhost:5432 / sdlc_db</td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">GET /actuator/health [db]</td>
                        <td className="px-4 py-3 text-right">
                          <StatusBadge state={dbState} label={dbLabel} />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">Frontend Client</td>
                        <td className="px-4 py-3 text-xs text-slate-600">React 19 + TypeScript + Vite</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">http://localhost:5173</td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">Vite Dev Server</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ready</span>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">Java Runtime</td>
                        <td className="px-4 py-3 text-xs text-slate-600">OpenJDK 21 (Temurin)</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">Local Environment</td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">Maven compiler target 21</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <span>Configured</span>
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 2: Implementation Roadmap */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Implementation Roadmap
                </h2>
                <span className="text-xs text-slate-500">
                  Current Phase: Phase 1 Authentication
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-100">
                {ROADMAP_PHASES.map((item) => (
                  <div
                    key={item.phase}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-colors hover:bg-slate-50/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-slate-500">
                          {item.phase}:
                        </span>
                        <span className="text-sm font-medium text-slate-900">
                          {item.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 max-w-2xl">
                        {item.description}
                      </p>
                    </div>

                    <div className="sm:text-right flex-shrink-0">
                      {item.statusVariant === 'completed' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {item.status}
                        </span>
                      )}
                      {item.statusVariant === 'active' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status}
                        </span>
                      )}
                      {item.statusVariant === 'next' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.status}
                        </span>
                      )}
                      {item.statusVariant === 'planned' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-slate-500">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-6 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>SDLC Platform · Phase 1 Authentication &amp; RBAC</span>
          <span>Clean Light Theme · Spring Boot 3.4 &amp; React 19</span>
        </footer>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
