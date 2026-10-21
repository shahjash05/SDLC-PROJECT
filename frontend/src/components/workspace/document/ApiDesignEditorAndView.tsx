import { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Server,
  Search,
  Lock,
  Layers,
  FileCode,
  Copy,
  Check,
} from 'lucide-react';
import type {
  ApiDesignContent,
  ApiEndpointItem,
  DocumentStatus,
} from '../../../types/entities';

interface ApiDesignProps {
  content: ApiDesignContent;
  onChange?: (updated: ApiDesignContent) => void;
  isEditing?: boolean;
  documentStatus?: DocumentStatus;
}

export interface BackendEndpointReference {
  domain: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  authRequired: boolean;
  implementedIn: string;
}

/**
 * Read-only catalog of actual live backend endpoints derived directly
 * from the Spring Boot application controllers running on port 8081.
 */
export const IMPLEMENTED_BACKEND_ENDPOINTS: BackendEndpointReference[] = [
  // Authentication & Profile (AuthController)
  {
    domain: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/register',
    summary: 'Register a new user account with role and credentials',
    authRequired: false,
    implementedIn: 'AuthController (Port 8081)',
  },
  {
    domain: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/login',
    summary: 'Authenticate credentials and issue JWT bearer token',
    authRequired: false,
    implementedIn: 'AuthController (Port 8081)',
  },
  {
    domain: 'Authentication',
    method: 'GET',
    path: '/api/v1/auth/me',
    summary: 'Retrieve currently authenticated user profile and roles',
    authRequired: true,
    implementedIn: 'AuthController (Port 8081)',
  },

  // Organizations (OrganizationController)
  {
    domain: 'Organizations',
    method: 'POST',
    path: '/api/v1/organizations',
    summary: 'Create a new multi-tenant organization',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },
  {
    domain: 'Organizations',
    method: 'GET',
    path: '/api/v1/organizations',
    summary: 'List all organizations the user belongs to',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },
  {
    domain: 'Organizations',
    method: 'GET',
    path: '/api/v1/organizations/{id}',
    summary: 'Get organization details and membership roster',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },
  {
    domain: 'Organizations',
    method: 'PUT',
    path: '/api/v1/organizations/{id}',
    summary: 'Update organization name and properties',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },
  {
    domain: 'Organizations',
    method: 'DELETE',
    path: '/api/v1/organizations/{id}',
    summary: 'Delete organization (Admin role required)',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },
  {
    domain: 'Organizations',
    method: 'POST',
    path: '/api/v1/organizations/{id}/members',
    summary: 'Add user to organization with specified role',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },
  {
    domain: 'Organizations',
    method: 'DELETE',
    path: '/api/v1/organizations/{id}/members/{userId}',
    summary: 'Remove user from organization membership',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },
  {
    domain: 'Organizations',
    method: 'POST',
    path: '/api/v1/organizations/{orgId}/teams',
    summary: 'Create a team within an organization',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },
  {
    domain: 'Organizations',
    method: 'GET',
    path: '/api/v1/organizations/{orgId}/teams',
    summary: 'List all teams within an organization',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },
  {
    domain: 'Organizations',
    method: 'POST',
    path: '/api/v1/organizations/{orgId}/projects',
    summary: 'Create a new project under organization',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },
  {
    domain: 'Organizations',
    method: 'GET',
    path: '/api/v1/organizations/{orgId}/projects',
    summary: 'List projects belonging to organization',
    authRequired: true,
    implementedIn: 'OrganizationController (Port 8081)',
  },

  // Teams (TeamController)
  {
    domain: 'Teams',
    method: 'GET',
    path: '/api/v1/teams/{id}',
    summary: 'Get team details and members',
    authRequired: true,
    implementedIn: 'TeamController (Port 8081)',
  },
  {
    domain: 'Teams',
    method: 'PUT',
    path: '/api/v1/teams/{id}',
    summary: 'Update team name and description',
    authRequired: true,
    implementedIn: 'TeamController (Port 8081)',
  },
  {
    domain: 'Teams',
    method: 'DELETE',
    path: '/api/v1/teams/{id}',
    summary: 'Delete team and dissociate assignments',
    authRequired: true,
    implementedIn: 'TeamController (Port 8081)',
  },
  {
    domain: 'Teams',
    method: 'POST',
    path: '/api/v1/teams/{id}/members',
    summary: 'Add user to team with team-level role',
    authRequired: true,
    implementedIn: 'TeamController (Port 8081)',
  },
  {
    domain: 'Teams',
    method: 'DELETE',
    path: '/api/v1/teams/{id}/members/{userId}',
    summary: 'Remove member from team',
    authRequired: true,
    implementedIn: 'TeamController (Port 8081)',
  },

  // Projects (ProjectController)
  {
    domain: 'Projects',
    method: 'GET',
    path: '/api/v1/projects',
    summary: 'List all accessible projects for user',
    authRequired: true,
    implementedIn: 'ProjectController (Port 8081)',
  },
  {
    domain: 'Projects',
    method: 'GET',
    path: '/api/v1/projects/{id}',
    summary: 'Get project details, status, and team assignment',
    authRequired: true,
    implementedIn: 'ProjectController (Port 8081)',
  },
  {
    domain: 'Projects',
    method: 'PUT',
    path: '/api/v1/projects/{id}',
    summary: 'Update project name, description, and status',
    authRequired: true,
    implementedIn: 'ProjectController (Port 8081)',
  },
  {
    domain: 'Projects',
    method: 'DELETE',
    path: '/api/v1/projects/{id}',
    summary: 'Delete project and cascade associated entities',
    authRequired: true,
    implementedIn: 'ProjectController (Port 8081)',
  },

  // Sprints (SprintController)
  {
    domain: 'Sprints',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/sprints',
    summary: 'Create a new sprint under project',
    authRequired: true,
    implementedIn: 'SprintController (Port 8081)',
  },
  {
    domain: 'Sprints',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/sprints',
    summary: 'List sprints for project with story and point metrics',
    authRequired: true,
    implementedIn: 'SprintController (Port 8081)',
  },
  {
    domain: 'Sprints',
    method: 'GET',
    path: '/api/v1/sprints/{id}',
    summary: 'Get sprint details and progress breakdown',
    authRequired: true,
    implementedIn: 'SprintController (Port 8081)',
  },
  {
    domain: 'Sprints',
    method: 'PUT',
    path: '/api/v1/sprints/{id}',
    summary: 'Update sprint details and lifecycle status (PLANNED, ACTIVE, COMPLETED)',
    authRequired: true,
    implementedIn: 'SprintController (Port 8081)',
  },
  {
    domain: 'Sprints',
    method: 'DELETE',
    path: '/api/v1/sprints/{id}',
    summary: 'Delete sprint and return stories to backlog',
    authRequired: true,
    implementedIn: 'SprintController (Port 8081)',
  },

  // Requirements & Stories (RequirementController)
  {
    domain: 'Requirements & Stories',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/stories',
    summary: 'Create user story with acceptance criteria and points',
    authRequired: true,
    implementedIn: 'RequirementController (Port 8081)',
  },
  {
    domain: 'Requirements & Stories',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/stories',
    summary: 'List project stories with optional sprint and status filtering',
    authRequired: true,
    implementedIn: 'RequirementController (Port 8081)',
  },
  {
    domain: 'Requirements & Stories',
    method: 'GET',
    path: '/api/v1/stories/{id}',
    summary: 'Get user story details, assignee, and task list',
    authRequired: true,
    implementedIn: 'RequirementController (Port 8081)',
  },
  {
    domain: 'Requirements & Stories',
    method: 'PUT',
    path: '/api/v1/stories/{id}',
    summary: 'Update story title, priority, points, and sprint',
    authRequired: true,
    implementedIn: 'RequirementController (Port 8081)',
  },
  {
    domain: 'Requirements & Stories',
    method: 'PATCH',
    path: '/api/v1/stories/{id}/status',
    summary: 'Transition story status (BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE)',
    authRequired: true,
    implementedIn: 'RequirementController (Port 8081)',
  },
  {
    domain: 'Requirements & Stories',
    method: 'DELETE',
    path: '/api/v1/stories/{id}',
    summary: 'Delete story and associated tasks',
    authRequired: true,
    implementedIn: 'RequirementController (Port 8081)',
  },
  {
    domain: 'Requirements & Stories',
    method: 'POST',
    path: '/api/v1/stories/{storyId}/tasks',
    summary: 'Add task item under user story',
    authRequired: true,
    implementedIn: 'RequirementController (Port 8081)',
  },
  {
    domain: 'Requirements & Stories',
    method: 'GET',
    path: '/api/v1/stories/{storyId}/tasks',
    summary: 'List tasks under user story',
    authRequired: true,
    implementedIn: 'RequirementController (Port 8081)',
  },
  {
    domain: 'Requirements & Stories',
    method: 'PUT',
    path: '/api/v1/tasks/{id}',
    summary: 'Update task title, status, and hours',
    authRequired: true,
    implementedIn: 'RequirementController (Port 8081)',
  },
  {
    domain: 'Requirements & Stories',
    method: 'DELETE',
    path: '/api/v1/tasks/{id}',
    summary: 'Delete task item',
    authRequired: true,
    implementedIn: 'RequirementController (Port 8081)',
  },

  // Documents & Diagrams (DocumentController)
  {
    domain: 'Documents & Diagrams',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/documents',
    summary: 'Create document/diagram with initial version 1 snapshot',
    authRequired: true,
    implementedIn: 'DocumentController (Port 8081)',
  },
  {
    domain: 'Documents & Diagrams',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/documents',
    summary: 'List project documents with optional category type filter',
    authRequired: true,
    implementedIn: 'DocumentController (Port 8081)',
  },
  {
    domain: 'Documents & Diagrams',
    method: 'GET',
    path: '/api/v1/documents/{id}',
    summary: 'Get document details, current content, and recent versions',
    authRequired: true,
    implementedIn: 'DocumentController (Port 8081)',
  },
  {
    domain: 'Documents & Diagrams',
    method: 'PUT',
    path: '/api/v1/documents/{id}',
    summary: 'Update document and save immutable historical version snapshot',
    authRequired: true,
    implementedIn: 'DocumentController (Port 8081)',
  },
  {
    domain: 'Documents & Diagrams',
    method: 'PATCH',
    path: '/api/v1/documents/{id}/status',
    summary: 'Update document review/governance status (DRAFT, IN_REVIEW, APPROVED, etc.)',
    authRequired: true,
    implementedIn: 'DocumentController (Port 8081)',
  },
  {
    domain: 'Documents & Diagrams',
    method: 'GET',
    path: '/api/v1/documents/{id}/versions',
    summary: 'List full version history timeline for document',
    authRequired: true,
    implementedIn: 'DocumentController (Port 8081)',
  },
  {
    domain: 'Documents & Diagrams',
    method: 'GET',
    path: '/api/v1/documents/{id}/versions/{versionNumber}',
    summary: 'Get point-in-time document snapshot for specific version',
    authRequired: true,
    implementedIn: 'DocumentController (Port 8081)',
  },
  {
    domain: 'Documents & Diagrams',
    method: 'DELETE',
    path: '/api/v1/documents/{id}',
    summary: 'Delete document and all historical version snapshots',
    authRequired: true,
    implementedIn: 'DocumentController (Port 8081)',
  },

  // Testing & Quality Assurance (TestingController)
  {
    domain: 'Testing & QA',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/test-suites',
    summary: 'Create test suite under project',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/test-suites',
    summary: 'List all test suites for project',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/test-suites/{id}',
    summary: 'Get test suite details and case count',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'PUT',
    path: '/api/v1/test-suites/{id}',
    summary: 'Update test suite name and description',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'DELETE',
    path: '/api/v1/test-suites/{id}',
    summary: 'Delete test suite (cases become standalone)',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/test-cases',
    summary: 'Create test case with preconditions, steps, expected result and priority',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/test-cases',
    summary: 'List project test cases with optional suite, status and priority filters',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/test-cases/{id}',
    summary: 'Get test case details, steps and expected result',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'PUT',
    path: '/api/v1/test-cases/{id}',
    summary: 'Update test case specification and suite assignment',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'PATCH',
    path: '/api/v1/test-cases/{id}/status',
    summary: 'Update test case execution/lifecycle status (PASSED, FAILED, BLOCKED, etc.)',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'DELETE',
    path: '/api/v1/test-cases/{id}',
    summary: 'Delete test case item',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'POST',
    path: '/api/v1/test-cases/{id}/executions',
    summary: 'Execute test case and record outcome (PASSED, FAILED, BLOCKED, SKIPPED)',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/test-cases/{id}/executions',
    summary: 'Get execution run history for a test case ordered newest to oldest',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/test-execution-summary',
    summary: 'Get real project-level execution summary, pass rate %, and metrics',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/test-executions',
    summary: 'List recent test case execution logs for a project',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/defects',
    summary: 'Report and create a new defect/bug with optional test linkage',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/defects',
    summary: 'List and filter defects for a project by status, severity, and assignee',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/defect-summary',
    summary: 'Get real project-level defect summary metrics and counts',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/defects/{id}',
    summary: 'Get comprehensive defect details, reproduction steps, and links',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/test-cases/{id}/defects',
    summary: 'List defects linked to a specific test case',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'PUT',
    path: '/api/v1/defects/{id}',
    summary: 'Update defect details, severity, priority, or lifecycle status',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'PATCH',
    path: '/api/v1/defects/{id}/assign',
    summary: 'Assign or reassign defect to a team member',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'PATCH',
    path: '/api/v1/defects/{id}/status',
    summary: 'Transition defect lifecycle status (OPEN, IN_PROGRESS, RESOLVED, CLOSED, etc.)',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'DELETE',
    path: '/api/v1/defects/{id}',
    summary: 'Delete defect record (restricted to reporter, lead, or admin)',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'PATCH',
    path: '/api/v1/test-cases/{id}/link',
    summary: 'Link or unlink test case with user story and requirement PRD document',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/traceability',
    summary: 'Retrieve project requirements & testing traceability matrix with coverage, test runs, and defects',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },
  {
    domain: 'Testing & QA',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/release-readiness',
    summary: 'Evaluate project release readiness against quality gates (blockers, warnings, test pass rate, defect severity)',
    authRequired: true,
    implementedIn: 'TestingController (Port 8081)',
  },

  // System Health & Liveness (HealthController)
  {
    domain: 'System Health',
    method: 'GET',
    path: '/api/v1/health',
    summary: 'System health check (Database, Uptime, Memory)',
    authRequired: false,
    implementedIn: 'HealthController (Port 8081)',
  },
  {
    domain: 'System Health',
    method: 'GET',
    path: '/api/v1/ping',
    summary: 'Liveness ping probe',
    authRequired: false,
    implementedIn: 'HealthController (Port 8081)',
  },
];

/**
 * Validates whether a given raw string is valid JSON syntax.
 * Allows empty or whitespace-only strings as valid (allowing empty examples).
 */
export function isValidJson(raw?: string): { isValid: boolean; error?: string } {
  if (!raw || !raw.trim()) {
    return { isValid: true };
  }
  try {
    JSON.parse(raw);
    return { isValid: true };
  } catch (err: unknown) {
    return {
      isValid: false,
      error: err instanceof Error ? err.message : 'Invalid JSON format',
    };
  }
}

export function defaultApiDesignContent(): ApiDesignContent {
  return {
    basePath: '/api/v1',
    version: '1.0.0',
    lifecycle: 'PROPOSED',
    endpoints: [
      {
        id: 'ep-1',
        method: 'GET',
        path: '/example',
        summary: 'Example Resource Retrieval',
        description: 'Proposed endpoint specification for retrieving resources.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Resource UUID identifier',
          },
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Resource retrieved successfully',
            exampleJson: '{\n  "success": true,\n  "data": {\n    "id": "123",\n    "name": "Sample"\n  }\n}',
          },
        ],
        errorCodes: [
          {
            code: '404',
            reason: 'Resource not found',
            exampleJson: '{\n  "success": false,\n  "message": "Resource not found"\n}',
          },
        ],
      },
    ],
  };
}

/**
 * Validates the API Design specification content.
 * Checks required fields and ensures all non-empty JSON examples are syntactically valid JSON.
 */
export function validateApiDesignContent(content: ApiDesignContent): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (!content.basePath || !content.basePath.trim()) {
    return {
      isValid: false,
      errorMessage: 'Base Path is required for API Design specifications (e.g., /api/v1).',
    };
  }

  if (!content.endpoints || content.endpoints.length === 0) {
    return {
      isValid: false,
      errorMessage: 'At least one endpoint specification is required in an API Design document.',
    };
  }

  for (let i = 0; i < content.endpoints.length; i++) {
    const ep = content.endpoints[i];
    if (!ep.path || !ep.path.trim()) {
      return {
        isValid: false,
        errorMessage: `Endpoint #${i + 1} (${ep.method}) must have a valid path.`,
      };
    }
    if (!ep.summary || !ep.summary.trim()) {
      return {
        isValid: false,
        errorMessage: `Endpoint #${i + 1} (${ep.method} ${ep.path}) must have a summary.`,
      };
    }

    // Validate Request Body JSON if present
    if (ep.requestBody?.exampleJson && ep.requestBody.exampleJson.trim()) {
      const check = isValidJson(ep.requestBody.exampleJson);
      if (!check.isValid) {
        return {
          isValid: false,
          errorMessage: `Endpoint #${i + 1} (${ep.method} ${ep.path}) Request Body has invalid JSON: ${check.error}`,
        };
      }
    }

    // Validate Responses JSON examples
    if (ep.responses) {
      for (let r = 0; r < ep.responses.length; r++) {
        const resp = ep.responses[r];
        if (resp.exampleJson && resp.exampleJson.trim()) {
          const check = isValidJson(resp.exampleJson);
          if (!check.isValid) {
            return {
              isValid: false,
              errorMessage: `Endpoint #${i + 1} (${ep.method} ${ep.path}) Response HTTP ${resp.statusCode} has invalid JSON: ${check.error}`,
            };
          }
        }
      }
    }

    // Validate Error Codes JSON examples
    if (ep.errorCodes) {
      for (let e = 0; e < ep.errorCodes.length; e++) {
        const errItem = ep.errorCodes[e];
        if (errItem.exampleJson && errItem.exampleJson.trim()) {
          const check = isValidJson(errItem.exampleJson);
          if (!check.isValid) {
            return {
              isValid: false,
              errorMessage: `Endpoint #${i + 1} (${ep.method} ${ep.path}) Error code ${errItem.code} has invalid JSON: ${check.error}`,
            };
          }
        }
      }
    }
  }

  return { isValid: true };
}

export function parseApiDesignContent(rawContent?: string): ApiDesignContent {
  if (!rawContent || !rawContent.trim()) {
    return defaultApiDesignContent();
  }
  try {
    const parsed = JSON.parse(rawContent) as Partial<ApiDesignContent>;
    return {
      basePath: parsed.basePath || '/api/v1',
      version: parsed.version || '1.0.0',
      lifecycle: parsed.lifecycle || 'PROPOSED',
      endpoints: parsed.endpoints?.length ? parsed.endpoints : defaultApiDesignContent().endpoints,
    };
  } catch {
    return {
      ...defaultApiDesignContent(),
      endpoints: [
        {
          id: 'ep-legacy',
          method: 'GET',
          path: '/raw-spec',
          summary: 'Imported Raw Specification',
          description: rawContent,
          parameters: [],
          responses: [
            {
              statusCode: 200,
              description: 'Success',
              exampleJson: '{}',
            },
          ],
          errorCodes: [],
        },
      ],
    };
  }
}

export function ApiDesignEditorAndView({
  content,
  onChange,
  isEditing = false,
  documentStatus,
}: ApiDesignProps) {
  const [data, setData] = useState<ApiDesignContent>(content);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    'ep-1': true,
  });

  // Quick Reference state
  const [showQuickRef, setShowQuickRef] = useState(false);
  const [quickRefSearch, setQuickRefSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  useEffect(() => {
    setData(content);
  }, [content]);

  const update = (patch: Partial<ApiDesignContent>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.(next);
  };

  const toggleEndpoint = (id: string) => {
    setExpandedEndpoints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard?.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const getMethodBadge = (method: ApiEndpointItem['method']) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'POST':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PUT':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getLifecycleBadge = (lifecycle?: ApiDesignContent['lifecycle']) => {
    switch (lifecycle) {
      case 'IMPLEMENTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DRAFT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DEPRECATED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'PROPOSED':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getLifecycleExplanation = (lifecycle?: ApiDesignContent['lifecycle']) => {
    switch (lifecycle) {
      case 'IMPLEMENTED':
        return 'Active in Spring Boot backend codebase (Port 8081).';
      case 'DRAFT':
        return 'In active development / coding phase.';
      case 'DEPRECATED':
        return 'Scheduled for removal in a future major version.';
      case 'PROPOSED':
      default:
        return 'Design contract under review; not yet implemented in backend.';
    }
  };

  const formatJson = (val: string): string => {
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  };

  // Filter backend endpoints
  const domains = ['ALL', ...Array.from(new Set(IMPLEMENTED_BACKEND_ENDPOINTS.map((e) => e.domain)))];
  const filteredBackendEndpoints = IMPLEMENTED_BACKEND_ENDPOINTS.filter((ep) => {
    const matchesDomain = selectedDomain === 'ALL' || ep.domain === selectedDomain;
    const query = quickRefSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ep.path.toLowerCase().includes(query) ||
      ep.summary.toLowerCase().includes(query) ||
      ep.method.toLowerCase().includes(query) ||
      ep.domain.toLowerCase().includes(query);
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Distinction Banner: Document Review Status vs API Contract Lifecycle Status */}
      <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-700" /> {data.lifecycle} SPECIFICATION
            </span>
            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-semibold border border-slate-200">
              {data.basePath}
            </span>
            <span className="text-xs text-slate-500 font-medium">v{data.version}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* API Contract Lifecycle Badge */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-500 font-medium">API Lifecycle:</span>
              <span className={`px-2 py-0.5 rounded font-semibold border ${getLifecycleBadge(data.lifecycle)}`}>
                {data.lifecycle}
              </span>
            </div>

            {/* Document Review Status (Governance) if provided */}
            {documentStatus && (
              <div className="flex items-center gap-1 text-[11px] pl-2 border-l border-slate-200">
                <span className="text-slate-500 font-medium">Document Status:</span>
                <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {documentStatus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Distinction Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> API Contract Lifecycle: {data.lifecycle}
            </div>
            <p className="text-amber-800 leading-relaxed">
              {getLifecycleExplanation(data.lifecycle)} Tracks engineering implementation progress on backend port 8081.
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-800 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-slate-700">
              <Layers className="w-3.5 h-3.5 text-slate-600" /> Document Review Status: {documentStatus || 'DRAFT'}
            </div>
            <p className="text-slate-600 leading-relaxed">
              Tracks architectural sign-off and approval governance. Distinct and decoupled from API contract lifecycle status.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Reference Toggle Button */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md p-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-600" />
          <div>
            <h4 className="text-xs font-semibold text-slate-900">
              Backend Endpoints Quick Reference (Spring Boot Port 8081)
            </h4>
            <p className="text-[11px] text-slate-500">
              {IMPLEMENTED_BACKEND_ENDPOINTS.length} implemented endpoints derived from current codebase controllers.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowQuickRef(!showQuickRef)}
          className="px-2.5 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1.5 transition-colors"
        >
          {showQuickRef ? (
            <>Hide Implemented Endpoints</>
          ) : (
            <>
              View Implemented Endpoints ({IMPLEMENTED_BACKEND_ENDPOINTS.length})
            </>
          )}
        </button>
      </div>

      {/* Read-Only Quick Reference Section */}
      {showQuickRef && (
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Live Implemented Endpoints ({filteredBackendEndpoints.length})
              </h4>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                LIVE BACKEND
              </span>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={quickRefSearch}
                onChange={(e) => setQuickRefSearch(e.target.value)}
                placeholder="Search by path, summary, or method..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Domain Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 text-[11px]">
            {domains.map((dom) => (
              <button
                key={dom}
                type="button"
                onClick={() => setSelectedDomain(dom)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedDomain === dom
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>

          {/* Endpoints Table / Cards */}
          <div className="border border-slate-200 rounded-md overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredBackendEndpoints.length > 0 ? (
              filteredBackendEndpoints.map((ep, i) => (
                <div
                  key={i}
                  className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[11px] border ${getMethodBadge(ep.method)}`}>
                      {ep.method}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 break-all">
                      {ep.path}
                    </span>
                    {ep.authRequired ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded" title="Requires JWT Bearer Token">
                        <Lock className="w-2.5 h-2.5" /> JWT
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                        Public
                      </span>
                    )}
                    <span className="text-slate-400 hidden sm:inline">•</span>
                    <span className="text-slate-600 truncate">{ep.summary}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px]">
                    <span className="text-slate-500 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {ep.implementedIn}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyPath(ep.path)}
                      className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-200"
                      title="Copy path to clipboard"
                    >
                      {copiedPath === ep.path ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          const newId = `ep-${Date.now()}`;
                          update({
                            endpoints: [
                              ...data.endpoints,
                              {
                                id: newId,
                                method: ep.method,
                                path: ep.path.replace(/^\/api\/v1/, ''),
                                summary: `Amendment: ${ep.summary}`,
                                description: `Specification amendment for existing ${ep.path}`,
                                parameters: [],
                                responses: [
                                  {
                                    statusCode: 200,
                                    description: 'OK',
                                    exampleJson: '{\n  "success": true\n}',
                                  },
                                ],
                                errorCodes: [],
                              },
                            ],
                          });
                          setExpandedEndpoints((prev) => ({ ...prev, [newId]: true }));
                        }}
                        className="text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded"
                        title="Add as a proposed endpoint specification template"
                      >
                        + Use as Template
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                No backend endpoints match your search criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {!isEditing ? (
        /* VIEW MODE */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              Proposed Specification Endpoints ({data.endpoints.length})
            </span>
            <span>API Version: {data.version}</span>
          </div>

          <div className="space-y-3">
            {data.endpoints.map((ep, idx) => {
              const isExpanded = expandedEndpoints[ep.id] ?? (idx === 0);
              return (
                <div key={ep.id} className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
                  {/* Endpoint Header Bar */}
                  <div
                    onClick={() => toggleEndpoint(ep.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getMethodBadge(ep.method)}`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {data.basePath}{ep.path.startsWith('/') ? ep.path : `/${ep.path}`}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-700 font-medium">{ep.summary}</span>
                      <span className="text-[10px] uppercase font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                        PROPOSED
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/30 text-xs">
                      {ep.description && (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-0.5">Description</span>
                          <p className="text-slate-600">{ep.description}</p>
                        </div>
                      )}

                      {/* Parameters */}
                      {ep.parameters && ep.parameters.length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-1.5">Request Parameters</span>
                          <div className="border border-slate-200 rounded bg-white overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                                <tr>
                                  <th className="p-2">Name</th>
                                  <th className="p-2">Location</th>
                                  <th className="p-2">Type</th>
                                  <th className="p-2">Required</th>
                                  <th className="p-2">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {ep.parameters.map((param, pIdx) => (
                                  <tr key={pIdx}>
                                    <td className="p-2 font-mono font-medium text-slate-900">{param.name}</td>
                                    <td className="p-2 text-slate-600">{param.in}</td>
                                    <td className="p-2 font-mono text-slate-600">{param.type}</td>
                                    <td className="p-2">
                                      {param.required ? (
                                        <span className="text-rose-600 font-bold">Yes</span>
                                      ) : (
                                        <span className="text-slate-400">No</span>
                                      )}
                                    </td>
                                    <td className="p-2 text-slate-600">{param.description || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Request Body */}
                      {ep.requestBody && (ep.requestBody.schemaDescription || ep.requestBody.exampleJson) && (
                        <div className="space-y-1.5">
                          <span className="font-semibold text-slate-700 block">
                            Request Body ({ep.requestBody.contentType || 'application/json'})
                          </span>
                          {ep.requestBody.schemaDescription && (
                            <p className="text-slate-600 text-[11px]">{ep.requestBody.schemaDescription}</p>
                          )}
                          {ep.requestBody.exampleJson && (
                            <pre className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-[11px] overflow-x-auto">
                              <code>{ep.requestBody.exampleJson}</code>
                            </pre>
                          )}
                        </div>
                      )}

                      {/* Responses */}
                      {ep.responses && ep.responses.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-semibold text-slate-700 block">Responses</span>
                          {ep.responses.map((resp, rIdx) => (
                            <div key={rIdx} className="bg-white border border-slate-200 rounded p-3 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                  resp.statusCode < 300
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  HTTP {resp.statusCode}
                                </span>
                                <span className="font-medium text-slate-800">{resp.description}</span>
                              </div>
                              {resp.exampleJson && (
                                <pre className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
                                  <code>{resp.exampleJson}</code>
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Error Codes */}
                      {ep.errorCodes && ep.errorCodes.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-semibold text-slate-700 block flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Error Codes
                          </span>
                          <div className="divide-y divide-slate-100 border border-slate-200 rounded bg-white">
                            {ep.errorCodes.map((err, eIdx) => (
                              <div key={eIdx} className="p-2.5 flex items-start justify-between gap-3">
                                <div>
                                  <span className="font-mono font-bold text-rose-700 mr-2">{err.code}</span>
                                  <span className="text-slate-700">{err.reason}</span>
                                </div>
                                {err.exampleJson && (
                                  <pre className="font-mono text-[10px] bg-slate-100 p-1 rounded max-w-xs overflow-x-auto">
                                    {err.exampleJson}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* EDIT MODE */
        <div className="space-y-5">
          {/* Top metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Base Path *</label>
              <input
                type="text"
                value={data.basePath}
                onChange={(e) => update({ basePath: e.target.value })}
                placeholder="/api/v1"
                className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">API Version *</label>
              <input
                type="text"
                value={data.version}
                onChange={(e) => update({ version: e.target.value })}
                placeholder="1.0.0"
                className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                API Contract Lifecycle
              </label>
              <select
                value={data.lifecycle}
                onChange={(e) => update({ lifecycle: e.target.value as ApiDesignContent['lifecycle'] })}
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
              >
                <option value="PROPOSED">PROPOSED (Design Only - Not Yet Implemented)</option>
                <option value="DRAFT">DRAFT (Active In-Progress Development)</option>
                <option value="IMPLEMENTED">IMPLEMENTED (Live on Port 8081)</option>
                <option value="DEPRECATED">DEPRECATED (Scheduled for Retirement)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Represents implementation progress. Decoupled from document review status.
              </p>
            </div>
          </div>

          {/* Endpoints Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-800" /> Endpoints Specification ({data.endpoints.length})
              </label>
              <button
                type="button"
                onClick={() => {
                  const newId = `ep-${Date.now()}`;
                  update({
                    endpoints: [
                      ...data.endpoints,
                      {
                        id: newId,
                        method: 'POST',
                        path: '/new-endpoint',
                        summary: 'New Action',
                        description: '',
                        parameters: [],
                        responses: [
                          {
                            statusCode: 201,
                            description: 'Created successfully',
                            exampleJson: '{\n  "success": true\n}',
                          },
                        ],
                        errorCodes: [],
                      },
                    ],
                  });
                  setExpandedEndpoints((prev) => ({ ...prev, [newId]: true }));
                }}
                className="text-[11px] text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Add Endpoint
              </button>
            </div>

            <div className="space-y-4">
              {data.endpoints.map((ep, idx) => {
                const reqJsonCheck = isValidJson(ep.requestBody?.exampleJson);
                return (
                  <div key={ep.id} className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={ep.method}
                        onChange={(e) => {
                          const next = [...data.endpoints];
                          next[idx] = { ...ep, method: e.target.value as ApiEndpointItem['method'] };
                          update({ endpoints: next });
                        }}
                        className="text-xs font-mono font-bold border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>

                      <input
                        type="text"
                        value={ep.path}
                        onChange={(e) => {
                          const next = [...data.endpoints];
                          next[idx] = { ...ep, path: e.target.value };
                          update({ endpoints: next });
                        }}
                        placeholder="/resource/{id}"
                        className="flex-1 font-mono text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                      />

                      {data.endpoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = data.endpoints.filter((_, i) => i !== idx);
                            update({ endpoints: next });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Remove endpoint"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={ep.summary}
                      onChange={(e) => {
                        const next = [...data.endpoints];
                        next[idx] = { ...ep, summary: e.target.value };
                        update({ endpoints: next });
                      }}
                      placeholder="Brief Endpoint Summary (e.g., Create new project document)"
                      className="w-full text-xs font-medium border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                    />

                    <textarea
                      rows={2}
                      value={ep.description}
                      onChange={(e) => {
                        const next = [...data.endpoints];
                        next[idx] = { ...ep, description: e.target.value };
                        update({ endpoints: next });
                      }}
                      placeholder="Full endpoint behavior, permissions required, validation rules..."
                      className="w-full text-xs border border-slate-300 rounded p-2 bg-white text-slate-900"
                    />

                    {/* Request Body & JSON Validation */}
                    {(ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') && (
                      <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                            <FileCode className="w-3 h-3 text-slate-600" /> Request Body (Payload Schema & Example)
                          </span>
                          {ep.requestBody?.exampleJson && reqJsonCheck.isValid && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...data.endpoints];
                                next[idx] = {
                                  ...ep,
                                  requestBody: {
                                    contentType: ep.requestBody?.contentType || 'application/json',
                                    schemaDescription: ep.requestBody?.schemaDescription || '',
                                    exampleJson: formatJson(ep.requestBody?.exampleJson || ''),
                                  },
                                };
                                update({ endpoints: next });
                              }}
                              className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                            >
                              Format JSON
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={ep.requestBody?.schemaDescription || ''}
                          onChange={(e) => {
                            const next = [...data.endpoints];
                            next[idx] = {
                              ...ep,
                              requestBody: {
                                contentType: ep.requestBody?.contentType || 'application/json',
                                schemaDescription: e.target.value,
                                exampleJson: ep.requestBody?.exampleJson || '',
                              },
                            };
                            update({ endpoints: next });
                          }}
                          placeholder="Payload schema description (e.g., Document create payload)"
                          className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                        />

                        <div>
                          <textarea
                            rows={3}
                            value={ep.requestBody?.exampleJson || ''}
                            onChange={(e) => {
                              const next = [...data.endpoints];
                              next[idx] = {
                                ...ep,
                                requestBody: {
                                  contentType: ep.requestBody?.contentType || 'application/json',
                                  schemaDescription: ep.requestBody?.schemaDescription || '',
                                  exampleJson: e.target.value,
                                },
                              };
                              update({ endpoints: next });
                            }}
                            placeholder="JSON Request Body Example (optional - leave empty if none)..."
                            className={`w-full font-mono text-[11px] border rounded p-1.5 bg-slate-900 text-slate-100 focus:outline-none ${
                              !reqJsonCheck.isValid
                                ? 'border-rose-400 ring-1 ring-rose-400'
                                : 'border-slate-300'
                            }`}
                          />
                          {!reqJsonCheck.isValid && (
                            <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>Invalid JSON: {reqJsonCheck.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Responses & JSON Examples */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">
                          Responses & Example Payloads
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...data.endpoints];
                            const responses = ep.responses || [];
                            next[idx] = {
                              ...ep,
                              responses: [
                                ...responses,
                                { statusCode: 200, description: 'Success', exampleJson: '{\n  "status": "ok"\n}' },
                              ],
                            };
                            update({ endpoints: next });
                          }}
                          className="text-[10px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" /> Add Response
                        </button>
                      </div>

                      {ep.responses.map((resp, rIdx) => {
                        const jsonCheck = isValidJson(resp.exampleJson);
                        return (
                          <div key={rIdx} className="bg-white border border-slate-200 rounded p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="number"
                                  value={resp.statusCode}
                                  onChange={(e) => {
                                    const next = [...data.endpoints];
                                    const nextResponses = [...ep.responses];
                                    nextResponses[rIdx] = { ...resp, statusCode: parseInt(e.target.value) || 200 };
                                    next[idx] = { ...ep, responses: nextResponses };
                                    update({ endpoints: next });
                                  }}
                                  className="w-20 font-mono text-xs border border-slate-300 rounded px-1.5 py-0.5"
                                />
                                <input
                                  type="text"
                                  value={resp.description}
                                  onChange={(e) => {
                                    const next = [...data.endpoints];
                                    const nextResponses = [...ep.responses];
                                    nextResponses[rIdx] = { ...resp, description: e.target.value };
                                    next[idx] = { ...ep, responses: nextResponses };
                                    update({ endpoints: next });
                                  }}
                                  placeholder="Description (e.g., OK, Created)"
                                  className="flex-1 text-xs border border-slate-300 rounded px-1.5 py-0.5"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                {resp.exampleJson && jsonCheck.isValid && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...data.endpoints];
                                      const nextResponses = [...ep.responses];
                                      nextResponses[rIdx] = {
                                        ...resp,
                                        exampleJson: formatJson(resp.exampleJson || ''),
                                      };
                                      next[idx] = { ...ep, responses: nextResponses };
                                      update({ endpoints: next });
                                    }}
                                    className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                                  >
                                    Format JSON
                                  </button>
                                )}
                                {ep.responses.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...data.endpoints];
                                      next[idx] = {
                                        ...ep,
                                        responses: ep.responses.filter((_, i) => i !== rIdx),
                                      };
                                      update({ endpoints: next });
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <textarea
                                rows={3}
                                value={resp.exampleJson || ''}
                                onChange={(e) => {
                                  const next = [...data.endpoints];
                                  const nextResponses = [...ep.responses];
                                  nextResponses[rIdx] = { ...resp, exampleJson: e.target.value };
                                  next[idx] = { ...ep, responses: nextResponses };
                                  update({ endpoints: next });
                                }}
                                placeholder="JSON Response Body Example (optional - empty examples are valid)..."
                                className={`w-full font-mono text-[11px] border rounded p-1.5 bg-slate-900 text-slate-100 focus:outline-none ${
                                  !jsonCheck.isValid
                                    ? 'border-rose-400 ring-1 ring-rose-400'
                                    : 'border-slate-300'
                                }`}
                              />
                              {!jsonCheck.isValid && (
                                <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                                  <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Invalid JSON: {jsonCheck.error}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
