import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentDiagramView } from './components/workspace/DocumentDiagramView';
import * as projectApi from './api/projects';
import * as docApi from './api/documents';
import * as reqApi from './api/requirements';
import {
  PrdEditorAndView,
  parsePrdContent,
  validatePrdContent,
} from './components/workspace/document/PrdEditorAndView';
import {
  parseApiDesignContent,
  validateApiDesignContent,
  isValidJson,
  IMPLEMENTED_BACKEND_ENDPOINTS,
} from './components/workspace/document/ApiDesignEditorAndView';
import {
  parseTechnicalSpecContent,
  blankTechnicalSpecContent,
  validateTechnicalSpecContent,
} from './components/workspace/document/TechnicalSpecEditorAndView';
import {
  validateDecisionRecordContent,
  defaultDecisionRecordContent,
} from './components/workspace/document/AdrEditorAndView';
import type {
  DocumentDetail,
  DocumentSummary,
  DocumentVersion,
  StorySummary,
  ProductRequirementContent,
} from './types/entities';

describe('Phase 4: Documents & Architecture Diagrams Components', () => {
  const mockDocSummary: DocumentSummary = {
    id: 'doc-1',
    projectId: 'proj-1',
    projectKey: 'INFRA',
    projectName: 'Platform Infrastructure',
    title: 'Core Microservices Architecture',
    type: 'ARCHITECTURE_DIAGRAM',
    diagramSyntax: 'MERMAID',
    currentVersion: 2,
    status: 'APPROVED',
    createdByUsername: 'leadarchitect',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockVersions: DocumentVersion[] = [
    {
      id: 'ver-2',
      documentId: 'doc-1',
      versionNumber: 2,
      title: 'Core Microservices Architecture',
      content: 'graph TD\n  Client[Web App] --> Gateway[API Gateway]\n  Gateway --> Auth[Auth Service]\n  Gateway --> Core[Core Engine]',
      diagramSyntax: 'MERMAID',
      changeSummary: 'Added Core Engine node to architecture',
      createdByUsername: 'leadarchitect',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ver-1',
      documentId: 'doc-1',
      versionNumber: 1,
      title: 'Initial Architecture Draft',
      content: 'graph TD\n  Client[Web App] --> Gateway[API Gateway]',
      diagramSyntax: 'MERMAID',
      changeSummary: 'Initial document snapshot',
      createdByUsername: 'leadarchitect',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const mockDocDetail: DocumentDetail = {
    ...mockDocSummary,
    content: 'graph TD\n  Client[Web App] --> Gateway[API Gateway]\n  Gateway --> Auth[Auth Service]\n  Gateway --> Core[Core Engine]',
    recentVersions: mockVersions,
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(projectApi, 'getAllProjects').mockResolvedValue([
      {
        id: 'proj-1',
        organizationId: 'org-1',
        organizationName: 'Enterprise Architecture',
        name: 'Platform Infrastructure',
        projectKey: 'INFRA',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
    ]);

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([mockDocSummary]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(mockDocDetail);
    vi.spyOn(docApi, 'getDocumentVersions').mockResolvedValue(mockVersions);
    vi.spyOn(reqApi, 'getStories').mockResolvedValue([]);
  });

  it('renders documents list with project selector and document metadata', async () => {
    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    expect(screen.getByText('Documents & Architecture Diagrams')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Core Microservices Architecture')).toBeInTheDocument();
    });

    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Architecture Diagram')).toBeInTheDocument();
  });

  it('filters documents by document type tab', async () => {
    const techSpecSummary: DocumentSummary = {
      id: 'doc-2',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Authentication Token Lifecycle Specification',
      type: 'TECHNICAL_SPEC',
      diagramSyntax: 'NONE',
      currentVersion: 1,
      status: 'IN_REVIEW',
      createdByUsername: 'secengineer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockImplementation(async (_projId, type) => {
      if (type === 'TECHNICAL_SPEC') {
        return [techSpecSummary];
      }
      return [mockDocSummary, techSpecSummary];
    });

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Core Microservices Architecture')).toBeInTheDocument();
      expect(screen.getByText('Authentication Token Lifecycle Specification')).toBeInTheDocument();
    });

    // Click on "Technical Specs" filter tab
    const specTab = screen.getByRole('button', { name: /^Technical Specs/i });
    fireEvent.click(specTab);

    // Only Tech Spec should be visible, architecture diagram filtered out
    await waitFor(() => {
      expect(screen.queryByText('Core Microservices Architecture')).not.toBeInTheDocument();
      expect(screen.getByText('Authentication Token Lifecycle Specification')).toBeInTheDocument();
    });
  });

  it('opens Create Document modal and submits a new document', async () => {
    const createSpy = vi.spyOn(docApi, 'createDocument').mockResolvedValue({
      ...mockDocDetail,
      id: 'doc-new',
      title: 'Database Sharding Strategy ADR',
      type: 'DECISION_RECORD',
      diagramSyntax: 'NONE',
      currentVersion: 1,
      status: 'DRAFT',
    });

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('New Document / Diagram')).toBeInTheDocument();
    });

    // Click New Document button
    fireEvent.click(screen.getByText('New Document / Diagram'));

    // Modal should be visible
    expect(screen.getByText('New Document or Architecture Diagram')).toBeInTheDocument();

    // Select ADR category matching the mock document type
    const categorySelect = screen.getByDisplayValue('PRDs / Requirements');
    fireEvent.change(categorySelect, { target: { value: 'DECISION_RECORD' } });

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., Microservices Communication Architecture/i), {
      target: { value: 'Database Sharding Strategy ADR' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /^Create Document$/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          title: 'Database Sharding Strategy ADR',
          type: 'DECISION_RECORD',
        })
      );
    });
  });

  it('selects a document, updates content to create version 3 with change summary', async () => {
    const updateSpy = vi.spyOn(docApi, 'updateDocument').mockResolvedValue({
      ...mockDocDetail,
      currentVersion: 3,
      content: 'graph TD\n  Client --> Gateway\n  Gateway --> Auth\n  Gateway --> Cache',
    });

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Core Microservices Architecture')).toBeInTheDocument();
    });

    // Click Edit button on the card
    fireEvent.click(screen.getByTitle('Edit & Revise'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Added authentication service edge routing/i)).toBeInTheDocument();
    });

    // Fill change summary
    const summaryInput = screen.getByPlaceholderText(/Added authentication service edge routing/i);
    fireEvent.change(summaryInput, {
      target: { value: 'Added Redis cache layer' },
    });

    // Click Save as v3
    fireEvent.click(screen.getByRole('button', { name: /Save as v3/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'doc-1',
        expect.objectContaining({
          changeSummary: 'Added Redis cache layer',
        })
      );
    });
  });

  it('opens Version History modal and allows inspecting historical snapshots', async () => {
    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Core Microservices Architecture')).toBeInTheDocument();
    });

    // Click History button on the card
    fireEvent.click(screen.getByTitle('Version History'));

    // History modal should appear
    await waitFor(() => {
      expect(screen.getByText('Version History & Revision Snapshots')).toBeInTheDocument();
      expect(screen.getByText('Added Core Engine node to architecture')).toBeInTheDocument();
      expect(screen.getByText('Initial document snapshot')).toBeInTheDocument();
    });

    // Click "View Snapshot" for the first version
    const viewSnapshotButtons = screen.getAllByRole('button', { name: /View Snapshot/i });
    fireEvent.click(viewSnapshotButtons[1]); // Version 1

    expect(screen.getByText(/Historical Snapshot: v1/i)).toBeInTheDocument();
    expect(screen.getByText('graph TD Client[Web App] --> Gateway[API Gateway]', { exact: false })).toBeInTheDocument();
  });

  it('deletes a document after confirmation', async () => {
    const deleteSpy = vi.spyOn(docApi, 'deleteDocument').mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Core Microservices Architecture')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByTitle('Delete Document'));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('doc-1');
    });
  });

  it('renders PlantUML documents using valid syntax with self-hosted renderer URL', async () => {
    const plantumlDocDetail: DocumentDetail = {
      id: 'doc-puml-1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Database & Service Topology UML',
      type: 'ARCHITECTURE_DIAGRAM',
      content: '@startuml\nactor User\nnode "Web (5173)" as web\nnode "API (8081)" as api\ndatabase "Postgres (5432)" as db\nUser -> web\nweb -> api\napi -> db\n@enduml',
      diagramSyntax: 'PLANTUML',
      currentVersion: 1,
      status: 'APPROVED',
      createdByUsername: 'leadarchitect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    const plantumlDocSummary: DocumentSummary = {
      ...plantumlDocDetail,
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([plantumlDocSummary]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(plantumlDocDetail);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Database & Service Topology UML')).toBeInTheDocument();
    });

    // Click Preview button
    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      expect(screen.getByText('PlantUML Diagram')).toBeInTheDocument();
      expect(screen.getByTestId('plantuml-svg-img')).toBeInTheDocument();
    });

    // Verify PlantUML image is rendered with encoded URL targeting port 8085
    const img = screen.getByTestId('plantuml-svg-img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('http://localhost:8085/svg/');
  });

  it('switches sample templates and engine syntax between PlantUML and Mermaid with verified ports (5173, 8081, 5432)', async () => {
    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('New Document / Diagram')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByText('New Document / Diagram'));

    // Switch Category to Architecture Diagram
    const categorySelect = screen.getByDisplayValue('PRDs / Requirements');
    fireEvent.change(categorySelect, { target: { value: 'ARCHITECTURE_DIAGRAM' } });

    // By default for architecture diagrams, Mermaid is selected with verified ports
    const contentArea = screen.getByDisplayValue(/graph TD/i) as HTMLTextAreaElement;
    expect(contentArea.value).toContain('Vite React Client: Port 5173');
    expect(contentArea.value).toContain('Spring Boot 3 API: Port 8081');
    expect(contentArea.value).toContain('PostgreSQL 16: Port 5432');

    // Switch engine to PlantUML
    const engineSelect = screen.getByDisplayValue('Mermaid.js');
    fireEvent.change(engineSelect, { target: { value: 'PLANTUML' } });

    // Should automatically switch content to valid PlantUML template with verified ports
    expect(contentArea.value).toContain('@startuml');
    expect(contentArea.value).toContain('@enduml');
    expect(contentArea.value).toContain('Web Browser (Port 5173)');
    expect(contentArea.value).toContain('Application Server (Port 8081)');
    expect(contentArea.value).toContain('Database Server (Port 5432)');
  });

  it('renders structured PRD with problem statement, functional requirements, and scope', async () => {
    const prdDetail: DocumentDetail = {
      id: 'doc-prd-1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Authentication & Session PRD',
      type: 'PRODUCT_REQUIREMENTS',
      content: JSON.stringify({
        problemStatement: 'Users need a single unified login across services.',
        scope: { inScope: ['JWT authentication', 'Role assignment'], outOfScope: ['SAML 2.0'] },
        functionalRequirements: [
          { id: 'FR-1', title: 'Login with Email', description: 'Authenticate users via email and password', priority: 'CRITICAL' },
        ],
        nonFunctionalRequirements: [
          { category: 'Security', requirement: 'Passwords hashed with BCrypt (cost 12)' },
        ],
        acceptanceCriteria: ['Valid credentials return JWT token'],
        linkedStoryIds: [],
      }),
      currentVersion: 1,
      status: 'APPROVED',
      createdByUsername: 'productlead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([prdDetail]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(prdDetail);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Authentication & Session PRD')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      expect(screen.getByText(/Users need a single unified login across services/i)).toBeInTheDocument();
      expect(screen.getByText('JWT authentication')).toBeInTheDocument();
      expect(screen.getByText('SAML 2.0')).toBeInTheDocument();
      expect(screen.getByText('Login with Email')).toBeInTheDocument();
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByText(/Passwords hashed with BCrypt/i)).toBeInTheDocument();
    });
  });

  it('validates PRD problem statement and requirement titles with clear inline errors and blocks submission', async () => {
    // 1. Direct helper unit validation
    expect(validatePrdContent({ problemStatement: '', scope: { inScope: [], outOfScope: [] }, functionalRequirements: [], nonFunctionalRequirements: [], acceptanceCriteria: [], linkedStoryIds: [] }).isValid).toBe(false);
    expect(validatePrdContent({ problemStatement: 'Valid', scope: { inScope: [], outOfScope: [] }, functionalRequirements: [{ id: 'FR-1', title: '', description: '', priority: 'HIGH' }], nonFunctionalRequirements: [], acceptanceCriteria: [], linkedStoryIds: [] }).isValid).toBe(false);
    expect(validatePrdContent({ problemStatement: 'Valid', scope: { inScope: [], outOfScope: [] }, functionalRequirements: [{ id: 'FR-1', title: 'Valid Title', description: '', priority: 'HIGH' }], nonFunctionalRequirements: [], acceptanceCriteria: [], linkedStoryIds: [] }).isValid).toBe(true);

    // 2. UI and submission validation
    const createSpy = vi.spyOn(docApi, 'createDocument').mockResolvedValue(mockDocDetail);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('New Document / Diagram')).toBeInTheDocument();
    });

    // Open modal (default category is PRDs / Requirements)
    fireEvent.click(screen.getByText('New Document / Diagram'));

    // Set document title
    const titleInput = screen.getByPlaceholderText(/Microservices Communication Architecture/i);
    fireEvent.change(titleInput, { target: { value: 'Payment Gateway Integration PRD' } });

    // Verify inline validation errors appear initially because problemStatement and FR-1 title are empty
    expect(screen.getByText(/Problem statement is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Requirement title is required/i)).toBeInTheDocument();

    // Attempt to submit with empty problem statement
    fireEvent.click(screen.getByRole('button', { name: /Create Document/i }));

    // Verify submit was blocked and error message is displayed
    expect(createSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Problem statement is required for Product Requirements documents/i)).toBeInTheDocument();

    // Now fill problem statement
    const problemTextarea = screen.getByPlaceholderText(/Describe the user or business problem/i);
    fireEvent.change(problemTextarea, {
      target: { value: 'Customers need multiple secure checkout options including credit cards and PayPal.' },
    });

    // Problem statement inline error should be gone, but FR title inline error remains
    expect(screen.queryByText(/Problem statement is required$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Requirement title is required/i)).toBeInTheDocument();

    // Attempt to submit again
    fireEvent.click(screen.getByRole('button', { name: /Create Document/i }));
    expect(createSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Functional requirement #1 \(FR-1\) must have a title/i)).toBeInTheDocument();

    // Fill functional requirement title
    const frTitleInput = screen.getByPlaceholderText(/Requirement Title \*/i);
    fireEvent.change(frTitleInput, { target: { value: 'Credit Card Tokenization' } });

    // Both inline errors should now be gone
    expect(screen.queryByText(/Requirement title is required/i)).not.toBeInTheDocument();

    // Now submit successfully
    fireEvent.click(screen.getByRole('button', { name: /Create Document/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          title: 'Payment Gateway Integration PRD',
          type: 'PRODUCT_REQUIREMENTS',
        })
      );
    });
  });

  it('renders linked user-story details with priority and status badges in PRD view', async () => {
    const mockStory: StorySummary = {
      id: 'story-alpha-1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      storyNumber: 42,
      storyKey: 'INFRA-42',
      title: 'Setup Stripe webhook handlers and signature verification',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      storyPoints: 5,
      taskCount: 3,
      completedTaskCount: 1,
      createdAt: new Date().toISOString(),
    };

    vi.spyOn(reqApi, 'getStories').mockResolvedValue([mockStory]);

    const prdWithStories: DocumentDetail = {
      id: 'doc-prd-linked-1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Checkout Flow PRD',
      type: 'PRODUCT_REQUIREMENTS',
      content: JSON.stringify({
        problemStatement: 'Modernize checkout with webhooks.',
        scope: { inScope: ['Webhook verification'], outOfScope: [] },
        functionalRequirements: [
          { id: 'FR-1', title: 'Verify Webhook Signatures', description: 'Reject invalid payloads', priority: 'HIGH' },
        ],
        nonFunctionalRequirements: [],
        acceptanceCriteria: ['Valid HMAC passes'],
        linkedStoryIds: ['story-alpha-1'],
      }),
      currentVersion: 1,
      status: 'APPROVED',
      createdByUsername: 'leadpm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([prdWithStories]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(prdWithStories);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Checkout Flow PRD')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      expect(screen.getByText(/Linked User Stories/i)).toBeInTheDocument();
      expect(screen.getByText('INFRA-42')).toBeInTheDocument();
      expect(screen.getByText('Setup Stripe webhook handlers and signature verification')).toBeInTheDocument();
      expect(screen.getByText('URGENT')).toBeInTheDocument();
      expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
      expect(screen.getByText('5 pts')).toBeInTheDocument();
    });
  });

  it('parses legacy raw markdown without generating an empty FR-1 requirement', async () => {
    // 1. Direct parser verification
    const legacyRawText = `# Requirements Specification v0.9\n\nLegacy markdown document prior to structured JSON PRDs.`;
    const parsed = parsePrdContent(legacyRawText);

    expect(parsed.problemStatement).toBe(legacyRawText);
    expect(parsed.functionalRequirements).toEqual([]);
    expect(parsed.nonFunctionalRequirements).toEqual([]);
    expect(parsed.acceptanceCriteria).toEqual([]);

    // 2. Component rendering verification
    const legacyDocDetail: DocumentDetail = {
      id: 'doc-legacy-prd-1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Legacy Product Requirements Draft',
      type: 'PRODUCT_REQUIREMENTS',
      content: legacyRawText,
      currentVersion: 1,
      status: 'DRAFT',
      createdByUsername: 'oldauthor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([legacyDocDetail]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(legacyDocDetail);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Legacy Product Requirements Draft')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      expect(screen.getByText(/Legacy markdown document prior to structured JSON PRDs/i)).toBeInTheDocument();
      // Should show empty state without generating any blank FR-1
      expect(screen.getByText('No functional requirements specified.')).toBeInTheDocument();
      expect(screen.queryByText('FR-1')).not.toBeInTheDocument();
      expect(screen.queryByText('Untitled Requirement')).not.toBeInTheDocument();
    });
  });

  it('renders structured API Design specification with endpoints and notice banner', async () => {
    const apiDetail: DocumentDetail = {
      id: 'doc-api-1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Documents Management REST API',
      type: 'API_DESIGN',
      content: JSON.stringify({
        basePath: '/api/v1',
        version: '1.0.0',
        lifecycle: 'PROPOSED',
        endpoints: [
          {
            id: 'ep-test-1',
            method: 'GET',
            path: '/documents',
            summary: 'List project documents',
            description: 'Returns all documents in project',
            parameters: [
              { name: 'type', in: 'query', type: 'string', required: false, description: 'Filter by document type' },
            ],
            responses: [
              { statusCode: 200, description: 'Documents array', exampleJson: '{"data": []}' },
            ],
            errorCodes: [],
          },
        ],
      }),
      currentVersion: 1,
      status: 'DRAFT',
      createdByUsername: 'apiarchitect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([apiDetail]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(apiDetail);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Documents Management REST API')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      expect(screen.getAllByText(/PROPOSED SPECIFICATION/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('List project documents')).toBeInTheDocument();
      expect(screen.getByText('GET')).toBeInTheDocument();
      expect(screen.getByText('/api/v1/documents')).toBeInTheDocument();
    });
  });

  it('validates API request and response JSON examples with clear inline errors, allowing empty examples', async () => {
    // 1. Direct helper unit validation
    expect(isValidJson('').isValid).toBe(true);
    expect(isValidJson('   ').isValid).toBe(true);
    expect(isValidJson('{"valid": true}').isValid).toBe(true);
    expect(isValidJson('{broken: json').isValid).toBe(false);

    // Direct validateApiDesignContent test
    const validContent = {
      basePath: '/api/v1',
      version: '1.0.0',
      lifecycle: 'PROPOSED' as const,
      endpoints: [
        {
          id: 'ep-1',
          method: 'GET' as const,
          path: '/test',
          summary: 'Test summary',
          description: '',
          parameters: [],
          responses: [
            { statusCode: 200, description: 'OK', exampleJson: '' }, // empty allowed
          ],
          errorCodes: [],
        },
      ],
    };
    expect(validateApiDesignContent(validContent).isValid).toBe(true);

    const invalidContent = {
      ...validContent,
      endpoints: [
        {
          ...validContent.endpoints[0],
          responses: [
            { statusCode: 200, description: 'OK', exampleJson: '{"incomplete": ' },
          ],
        },
      ],
    };
    expect(validateApiDesignContent(invalidContent).isValid).toBe(false);
    expect(validateApiDesignContent(invalidContent).errorMessage).toContain('invalid JSON');

    // 2. UI and submission validation
    const createSpy = vi.spyOn(docApi, 'createDocument').mockResolvedValue(mockDocDetail);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('New Document / Diagram')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Document / Diagram'));

    // Switch Category to API Design Specification
    const categorySelect = screen.getByDisplayValue('PRDs / Requirements');
    fireEvent.change(categorySelect, { target: { value: 'API_DESIGN' } });

    // Enter Document Title
    const titleInput = screen.getByPlaceholderText(/Microservices Communication Architecture/i);
    fireEvent.change(titleInput, { target: { value: 'Audit Events API Design' } });

    // Type invalid JSON into response example textarea
    const exampleTextarea = screen.getByPlaceholderText(/JSON Response Body Example/i);
    fireEvent.change(exampleTextarea, { target: { value: '{\n  "malformed": \n}' } });

    // Verify inline error appears
    expect(screen.getByText(/Invalid JSON:/i)).toBeInTheDocument();

    // Attempt to submit
    fireEvent.click(screen.getByRole('button', { name: /^Create Document$/i }));

    // Verify creation was blocked and error banner shows
    expect(createSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/has invalid JSON:/i)).toBeInTheDocument();

    // Clear the JSON example (empty examples must be allowed)
    fireEvent.change(exampleTextarea, { target: { value: '' } });

    // Inline error should disappear
    expect(screen.queryByText(/^Invalid JSON:/i)).not.toBeInTheDocument();

    // Submit now succeeds with empty example
    fireEvent.click(screen.getByRole('button', { name: /^Create Document$/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          title: 'Audit Events API Design',
          type: 'API_DESIGN',
        })
      );
    });
  });

  it('keeps document review status distinct from API lifecycle status with explicit explanatory indicators', async () => {
    const apiDocApprovedDraft: DocumentDetail = {
      id: 'doc-api-decoupled',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Decoupled Lifecycle API Spec',
      type: 'API_DESIGN',
      content: JSON.stringify({
        basePath: '/api/v1',
        version: '2.0.0',
        lifecycle: 'PROPOSED', // API contract implementation state
        endpoints: [
          {
            id: 'ep-dec-1',
            method: 'POST',
            path: '/events/stream',
            summary: 'Stream event telemetry',
            description: '',
            parameters: [],
            responses: [{ statusCode: 200, description: 'Stream started', exampleJson: '{"active": true}' }],
            errorCodes: [],
          },
        ],
      }),
      currentVersion: 2,
      status: 'APPROVED', // Document review governance status
      createdByUsername: 'architect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([apiDocApprovedDraft]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(apiDocApprovedDraft);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Decoupled Lifecycle API Spec')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      // Document Status (Governance): APPROVED
      expect(screen.getByText('Document Status:')).toBeInTheDocument();
      // API Lifecycle (Implementation): PROPOSED
      expect(screen.getByText('API Lifecycle:')).toBeInTheDocument();
      // Explanatory distinction cards
      expect(screen.getByText(/Tracks engineering implementation progress on backend port 8081/i)).toBeInTheDocument();
      expect(screen.getByText(/Tracks architectural sign-off and approval governance/i)).toBeInTheDocument();
    });
  });

  it('provides read-only quick reference of actual backend API endpoints derived from the codebase', async () => {
    // 1. Direct catalog verification
    expect(IMPLEMENTED_BACKEND_ENDPOINTS.length).toBeGreaterThanOrEqual(40);
    expect(IMPLEMENTED_BACKEND_ENDPOINTS.some((e) => e.path === '/api/v1/auth/login')).toBe(true);
    expect(IMPLEMENTED_BACKEND_ENDPOINTS.some((e) => e.path === '/api/v1/documents/{id}/versions')).toBe(true);
    expect(IMPLEMENTED_BACKEND_ENDPOINTS.some((e) => e.path === '/api/v1/health')).toBe(true);

    const apiDetail: DocumentDetail = {
      id: 'doc-api-ref',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Catalog Reference Verification API',
      type: 'API_DESIGN',
      content: JSON.stringify(parseApiDesignContent()),
      currentVersion: 1,
      status: 'DRAFT',
      createdByUsername: 'architect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([apiDetail]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(apiDetail);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Catalog Reference Verification API')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      expect(screen.getByText(/Backend Endpoints Quick Reference/i)).toBeInTheDocument();
    });

    // Expand the quick reference
    fireEvent.click(screen.getByRole('button', { name: /View Implemented Endpoints/i }));

    // Verify live endpoints list rendered with controller information and LIVE BACKEND badge
    await waitFor(() => {
      expect(screen.getByText('LIVE BACKEND')).toBeInTheDocument();
      expect(screen.getByText('/api/v1/auth/register')).toBeInTheDocument();
      expect(screen.getAllByText('AuthController (Port 8081)').length).toBeGreaterThanOrEqual(1);
    });

    // Filter by search query
    const searchInput = screen.getByPlaceholderText(/Search by path, summary, or method/i);
    fireEvent.change(searchInput, { target: { value: 'sprints' } });

    expect(screen.getAllByText('/api/v1/projects/{projectId}/sprints').length).toBe(2);
    expect(screen.getAllByText('SprintController (Port 8081)').length).toBeGreaterThanOrEqual(1);
  });

  it('renders structured ADR with options considered and decision outcome', async () => {
    const adrDetail: DocumentDetail = {
      id: 'doc-adr-1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'ADR-003 Database Migration Strategy',
      type: 'DECISION_RECORD',
      content: JSON.stringify({
        context: 'Need an automated database schema migration tool for PostgreSQL.',
        problemDrivers: ['Zero manual drift', 'Repeatable CI/CD deployment'],
        optionsConsidered: [
          { option: 'Flyway', pros: 'Simple SQL migrations', cons: 'Strict naming convention' },
          { option: 'Hibernate ddl-auto', pros: 'Automatic generation', cons: 'High risk in production' },
        ],
        decision: 'Adopt Flyway with versioned migration scripts.',
        rationale: 'Flyway provides verifiable, immutable schema transitions.',
        consequences: {
          positive: ['Auditable migration history'],
          negative: ['Migrations cannot be altered once applied'],
        },
      }),
      currentVersion: 1,
      status: 'ACCEPTED',
      createdByUsername: 'leadarchitect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([adrDetail]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(adrDetail);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('ADR-003 Database Migration Strategy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      expect(screen.getByText(/1\. Context & Background/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero manual drift/i)).toBeInTheDocument();
      expect(screen.getByText('Flyway')).toBeInTheDocument();
      expect(screen.getByText(/Adopt Flyway with versioned migration scripts/i)).toBeInTheDocument();
    });
  });

  it('creates a blank technical specification without forcing prefilled technology defaults', async () => {
    // 1. Direct model & validator verification
    const blank = blankTechnicalSpecContent();
    expect(blank.architectureOverview).toBe('');
    expect(blank.technologyChoices).toEqual([]);
    expect(blank.componentResponsibilities).toEqual([]);

    // Validation ensures overview is required
    const invalidValidation = validateTechnicalSpecContent(blank);
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.errorMessage).toContain('Architecture Overview is required');

    // Valid when overview is provided, even with 0 technology choices
    const validBlank = {
      ...blank,
      architectureOverview: 'Event-driven pub-sub telemetry pipeline',
    };
    expect(validateTechnicalSpecContent(validBlank).isValid).toBe(true);

    // Parsing an empty technologyChoices array preserves the empty array without reviving defaults
    const parsedCustom = parseTechnicalSpecContent(
      JSON.stringify({
        architectureOverview: 'Custom Minimalist Spec',
        technologyChoices: [],
        componentResponsibilities: [],
      })
    );
    expect(parsedCustom.technologyChoices).toEqual([]);
    expect(parsedCustom.componentResponsibilities).toEqual([]);

    // 2. UI verification in DocumentDiagramView Create Modal
    const createSpy = vi.spyOn(docApi, 'createDocument').mockResolvedValue({
      id: 'doc-tech-new-1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Blank Architecture Technical Spec',
      type: 'TECHNICAL_SPEC',
      content: JSON.stringify(validBlank),
      currentVersion: 1,
      status: 'DRAFT',
      createdByUsername: 'architect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    });

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Core Microservices Architecture')).toBeInTheDocument();
    });

    // Open create modal
    fireEvent.click(screen.getByRole('button', { name: /New Document \/ Diagram/i }));

    // Select Technical Specification category
    const categorySelect = screen.getByDisplayValue('PRDs / Requirements');
    fireEvent.change(categorySelect, { target: { value: 'TECHNICAL_SPEC' } });

    // Click "Blank Specification" template button
    const blankBtn = screen.getByRole('button', { name: /Blank Specification/i });
    fireEvent.click(blankBtn);

    // Verify technology choices count is 0 and empty placeholder is shown
    expect(screen.getByText(/Technology Choices & Rationale \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/No technology choices specified yet/i)).toBeInTheDocument();

    // Fill title and overview
    const titleInput = screen.getByPlaceholderText(/e\.g\., Microservices Communication Architecture/i);
    fireEvent.change(titleInput, { target: { value: 'Blank Architecture Technical Spec' } });

    const overviewInput = screen.getByPlaceholderText(/High-level architecture description/i);
    fireEvent.change(overviewInput, { target: { value: 'Event-driven pub-sub telemetry pipeline' } });

    // Submit creation
    fireEvent.click(screen.getByRole('button', { name: /Create Document/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          title: 'Blank Architecture Technical Spec',
          type: 'TECHNICAL_SPEC',
          content: expect.stringContaining('"technologyChoices": []'),
        })
      );
    });
  });

  it('renders clickable linked PRDs and navigates to the target document on click', async () => {
    const linkedPrdDetail: DocumentDetail = {
      id: 'doc-prd-checkout',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Payment Gateway Integration PRD',
      type: 'PRODUCT_REQUIREMENTS',
      content: JSON.stringify({
        problemStatement: 'Integrate Stripe and PayPal gateways.',
        scope: { inScope: ['Card processing'], outOfScope: [] },
        functionalRequirements: [
          { id: 'FR-1', title: 'Tokenize Payment Data', description: 'PCI compliance', priority: 'HIGH' },
        ],
        nonFunctionalRequirements: [],
        acceptanceCriteria: ['99.99% gateway uptime'],
        linkedStoryIds: [],
      }),
      currentVersion: 2,
      status: 'APPROVED',
      createdByUsername: 'leadpm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    const techSpecDetail: DocumentDetail = {
      id: 'doc-tech-checkout',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Payment Gateway Technical Spec',
      type: 'TECHNICAL_SPEC',
      content: JSON.stringify({
        architectureOverview: 'Stateless payment proxy routing to Stripe and PayPal with idempotency keys.',
        technologyChoices: [
          { technology: 'Spring Boot 3', role: 'Payment Orchestrator', rationale: 'PCI-DSS proxy' },
        ],
        componentResponsibilities: [],
        databaseDesign: 'PostgreSQL encrypted transaction ledger',
        dataFlow: 'Client -> Tokenizer -> Acquirer Gateway',
        securityConsiderations: 'TLS 1.3, tokenized card data',
        implementationDetails: 'Custom idempotent retry queue',
        linkedDiagramIds: [],
        linkedRequirementIds: ['doc-prd-checkout'],
      }),
      currentVersion: 1,
      status: 'IN_REVIEW',
      createdByUsername: 'leadarchitect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([techSpecDetail, linkedPrdDetail]);
    const getByIdSpy = vi.spyOn(docApi, 'getDocumentById').mockImplementation(async (id: string) => {
      if (id === 'doc-prd-checkout') return linkedPrdDetail;
      return techSpecDetail;
    });

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Payment Gateway Technical Spec')).toBeInTheDocument();
    });

    // Open detail modal for the Technical Spec
    fireEvent.click(screen.getAllByTitle('View & Preview')[0]);

    await waitFor(() => {
      expect(screen.getByText(/Linked Requirements & PRDs \(1\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Payment Gateway Integration PRD/i })).toBeInTheDocument();
    });

    // Click the linked requirement document button to navigate
    fireEvent.click(screen.getByRole('button', { name: /Payment Gateway Integration PRD/i }));

    // Verify navigation fetched the linked PRD and loaded it in the modal
    await waitFor(() => {
      expect(getByIdSpy).toHaveBeenCalledWith('doc-prd-checkout');
      expect(screen.getByText(/Integrate Stripe and PayPal gateways/i)).toBeInTheDocument();
      expect(screen.getByText('Tokenize Payment Data')).toBeInTheDocument();
    });
  });

  it('renders inline previews of linked architecture diagrams with open full diagram navigation', async () => {
    const topologyDiagramDetail: DocumentDetail = {
      id: 'doc-diag-topology',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Microservices Mesh Topology',
      type: 'ARCHITECTURE_DIAGRAM',
      diagramSyntax: 'PLANTUML',
      content: '@startuml\nnode "API Gateway" as gw\nnode "Auth" as auth\ngw -> auth\n@enduml',
      currentVersion: 1,
      status: 'APPROVED',
      createdByUsername: 'leadarchitect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    const techSpecWithDiagram: DocumentDetail = {
      id: 'doc-tech-mesh',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Service Mesh Technical Spec',
      type: 'TECHNICAL_SPEC',
      content: JSON.stringify({
        architectureOverview: 'Service mesh routing with mTLS and distributed tracing.',
        technologyChoices: [
          { technology: 'Istio / Envoy', role: 'Data Plane Proxy', rationale: 'Zero-trust mTLS' },
        ],
        componentResponsibilities: [],
        databaseDesign: '',
        dataFlow: '',
        securityConsiderations: 'SPIFFE identities with strict mTLS',
        implementationDetails: '',
        linkedDiagramIds: ['doc-diag-topology'],
        linkedRequirementIds: [],
      }),
      currentVersion: 1,
      status: 'APPROVED',
      createdByUsername: 'leadarchitect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([techSpecWithDiagram, topologyDiagramDetail]);
    const getByIdSpy = vi.spyOn(docApi, 'getDocumentById').mockImplementation(async (id: string) => {
      if (id === 'doc-diag-topology') return topologyDiagramDetail;
      return techSpecWithDiagram;
    });

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Service Mesh Technical Spec')).toBeInTheDocument();
    });

    // Open detail modal for the Technical Spec
    fireEvent.click(screen.getAllByTitle('View & Preview')[0]);

    await waitFor(() => {
      expect(screen.getByText(/Linked Architecture Diagrams \(1\)/i)).toBeInTheDocument();
      expect(screen.getAllByText('Microservices Mesh Topology').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('PLANTUML').length).toBeGreaterThanOrEqual(1);
      // Inline diagram preview rendered via DiagramRenderer (PlantUML svg img)
      expect(screen.getByTestId('plantuml-svg-img')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Open Full Diagram/i })).toBeInTheDocument();
    });

    // Click "Open Full Diagram" button to navigate
    fireEvent.click(screen.getByRole('button', { name: /Open Full Diagram/i }));

    // Verify navigation fetched the diagram and switched modal to display the full diagram
    await waitFor(() => {
      expect(getByIdSpy).toHaveBeenCalledWith('doc-diag-topology');
      expect(screen.getAllByText('PlantUML Diagram').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('gracefully handles missing or deleted linked documents in view and edit modes', async () => {
    const techSpecWithOrphanLinks: DocumentDetail = {
      id: 'doc-tech-orphans',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Legacy Spec with Deleted References',
      type: 'TECHNICAL_SPEC',
      content: JSON.stringify({
        architectureOverview: 'Legacy spec referencing deleted diagrams and PRDs.',
        technologyChoices: [
          { technology: 'Legacy Monolith', role: 'Core', rationale: 'Legacy platform' },
        ],
        componentResponsibilities: [],
        databaseDesign: '',
        dataFlow: '',
        securityConsiderations: '',
        implementationDetails: '',
        linkedDiagramIds: ['deleted-diag-404-uuid'],
        linkedRequirementIds: ['deleted-prd-404-uuid'],
      }),
      currentVersion: 1,
      status: 'DRAFT',
      createdByUsername: 'retiredengineer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    // Note: Neither deleted-diag-404-uuid nor deleted-prd-404-uuid exist in project documents
    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([techSpecWithOrphanLinks]);
    vi.spyOn(docApi, 'getDocumentById').mockImplementation(async (id: string) => {
      if (id === 'doc-tech-orphans') return techSpecWithOrphanLinks;
      throw new Error('Document not found (404)');
    });

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Legacy Spec with Deleted References')).toBeInTheDocument();
    });

    // 1. Check Preview Mode Fallbacks
    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      // Graceful banner for missing diagram
      expect(screen.getByText(/Linked Diagram Unavailable/i)).toBeInTheDocument();
      expect(screen.getAllByText(/deleted-/i).length).toBeGreaterThanOrEqual(2);
      expect(
        screen.getByText(/This architecture diagram may have been deleted or is not accessible/i)
      ).toBeInTheDocument();

      // Graceful badge for missing requirement
      expect(screen.getByText(/Requirement Unavailable/i)).toBeInTheDocument();
    });

    // 2. Switch to Edit Tab
    fireEvent.click(screen.getByRole('button', { name: /Edit & Create Revision/i }));

    await waitFor(() => {
      expect(screen.getByText(/Linked Diagram Missing \(deleted-\.\.\.\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Linked Requirement Missing \(deleted-\.\.\.\)/i)).toBeInTheDocument();
    });

    // Unlink the missing diagram and missing requirement
    const unlinkButtons = screen.getAllByRole('button', { name: /Unlink/i });
    expect(unlinkButtons.length).toBe(2);

    // Click Unlink on the missing requirement
    fireEvent.click(unlinkButtons[1]);

    // The missing requirement should be cleanly removed from the list
    await waitFor(() => {
      expect(screen.queryByText(/Linked Requirement Missing \(deleted-\.\.\.\)/i)).not.toBeInTheDocument();
    });
  });

  it('validates ADR decision records: prevents self-links, requires superseding ADR, and requires decision for accepted records', () => {
    const baseAdr = defaultDecisionRecordContent();

    // 1. Missing supersededById when marked SUPERSEDED
    const errMissingSuperseded = validateDecisionRecordContent(
      { ...baseAdr, supersededById: '' },
      'SUPERSEDED',
      'adr-current'
    );
    expect(errMissingSuperseded.supersededById).toMatch(/Please select which ADR supersedes/i);

    // 2. Self-supersession is prevented
    const errSelfLink = validateDecisionRecordContent(
      { ...baseAdr, supersededById: 'adr-current' },
      'SUPERSEDED',
      'adr-current'
    );
    expect(errSelfLink.supersededById).toMatch(/An ADR cannot supersede itself/i);

    // 3. Decision required when ACCEPTED
    const errNoDecision = validateDecisionRecordContent(
      { ...baseAdr, decision: '' },
      'ACCEPTED',
      'adr-current'
    );
    expect(errNoDecision.decision).toMatch(/clear decision statement is required/i);

    // 4. Valid superseded ADR
    const validSuperseded = validateDecisionRecordContent(
      { ...baseAdr, supersededById: 'adr-newer-v2' },
      'SUPERSEDED',
      'adr-current'
    );
    expect(Object.keys(validSuperseded).length).toBe(0);
  });

  it('renders standard MADR metadata (authors, deciders, status date) in preview mode', async () => {
    const madrAdr: DocumentDetail = {
      id: 'adr-madr-1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Adopt PostgreSQL for Document Metadata',
      type: 'DECISION_RECORD',
      content: JSON.stringify({
        context: 'We require structured schema validation and relational integrity.',
        problemDrivers: ['ACID transactions', 'Relational consistency'],
        optionsConsidered: [
          { option: 'PostgreSQL', pros: 'Native JSON support, reliable', cons: 'Connection overhead' },
          { option: 'MongoDB', pros: 'Flexible JSON schema', cons: 'Lacks multi-table ACID transactions' },
        ],
        decision: 'Use PostgreSQL 16 as the primary datastore for all project documents.',
        rationale: 'Meets relational requirements and supports JSON columns.',
        consequences: {
          positive: ['Robust migrations via Flyway', 'Referential integrity'],
          negative: ['Need schema migration scripts'],
        },
        authors: ['Alice Architect', 'Bob Engineer'],
        deciders: ['Charlie TechLead', 'Dana PlatformAdmin'],
        statusDate: '2026-10-20',
      }),
      currentVersion: 1,
      status: 'ACCEPTED',
      createdByUsername: 'alice',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([madrAdr]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(madrAdr);

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Adopt PostgreSQL for Document Metadata')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      // MADR Header & Section
      expect(screen.getByText(/Architecture Decision Record \(MADR Format\)/i)).toBeInTheDocument();
      expect(screen.getByText('MADR Decision Metadata')).toBeInTheDocument();

      // Authors
      expect(screen.getByText('Alice Architect')).toBeInTheDocument();
      expect(screen.getByText('Bob Engineer')).toBeInTheDocument();

      // Deciders
      expect(screen.getByText('Charlie TechLead')).toBeInTheDocument();
      expect(screen.getByText('Dana PlatformAdmin')).toBeInTheDocument();

      // Status Date
      expect(screen.getByText('2026-10-20')).toBeInTheDocument();

      // Context and Decision
      expect(screen.getByText(/We require structured schema validation/i)).toBeInTheDocument();
      expect(screen.getByText(/Use PostgreSQL 16 as the primary datastore/i)).toBeInTheDocument();
    });
  });

  it('renders Superseded By selector, prevents self-links, navigates to target ADR, and handles missing linked ADR gracefully', async () => {
    const oldAdr: DocumentDetail = {
      id: 'adr-v1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Legacy Monolithic Routing ADR',
      type: 'DECISION_RECORD',
      content: JSON.stringify({
        context: 'Initial monolithic gateway routing mechanism.',
        problemDrivers: ['Simplicity'],
        optionsConsidered: [],
        decision: 'Use single monolithic router.',
        rationale: 'Simple initial build.',
        consequences: { positive: [], negative: [] },
        authors: ['Legacy Dev'],
        deciders: ['Former Lead'],
        statusDate: '2025-01-15',
        supersededById: 'adr-v2',
      }),
      currentVersion: 1,
      status: 'SUPERSEDED',
      createdByUsername: 'legacy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    const newAdr: DocumentDetail = {
      id: 'adr-v2',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Distributed Envoy Gateway Routing ADR',
      type: 'DECISION_RECORD',
      content: JSON.stringify({
        context: 'Replaced monolithic router with Envoy proxy.',
        problemDrivers: ['High concurrency'],
        optionsConsidered: [],
        decision: 'Deploy Envoy edge proxies.',
        rationale: 'Scales horizontally.',
        consequences: { positive: [], negative: [] },
        authors: ['Alice Architect'],
        deciders: ['Charlie TechLead'],
        statusDate: '2026-10-15',
      }),
      currentVersion: 1,
      status: 'ACCEPTED',
      createdByUsername: 'alice',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    const orphanAdr: DocumentDetail = {
      id: 'adr-orphan',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Orphan ADR with Deleted Target',
      type: 'DECISION_RECORD',
      content: JSON.stringify({
        context: 'Points to deleted record.',
        problemDrivers: [],
        optionsConsidered: [],
        decision: 'Legacy approach.',
        rationale: 'Old.',
        consequences: { positive: [], negative: [] },
        statusDate: '2025-05-10',
        supersededById: 'deleted-adr-999-uuid',
      }),
      currentVersion: 1,
      status: 'SUPERSEDED',
      createdByUsername: 'alice',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([oldAdr, newAdr, orphanAdr]);
    const getDocSpy = vi.spyOn(docApi, 'getDocumentById').mockImplementation(async (id: string) => {
      if (id === 'adr-v1') return oldAdr;
      if (id === 'adr-v2') return newAdr;
      if (id === 'adr-orphan') return orphanAdr;
      throw new Error('Document not found');
    });

    render(<DocumentDiagramView selectedProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Legacy Monolithic Routing ADR')).toBeInTheDocument();
      expect(screen.getByText('Distributed Envoy Gateway Routing ADR')).toBeInTheDocument();
    });

    // 1. View old ADR - check supersession banner and navigation button
    const viewButtons = screen.getAllByTitle('View & Preview');
    fireEvent.click(viewButtons[0]); // Click view on adr-v1

    await waitFor(() => {
      expect(screen.getByText(/Superseded Architecture Decision/i)).toBeInTheDocument();
      expect(
        screen.getByText(/This ADR has been superseded by/i)
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(/Distributed Envoy Gateway Routing ADR/i).length
      ).toBeGreaterThanOrEqual(2);
    });

    // Click "View Superseding ADR"
    const viewSupersedingBtn = screen.getByRole('button', { name: /View Superseding ADR/i });
    fireEvent.click(viewSupersedingBtn);

    await waitFor(() => {
      expect(getDocSpy).toHaveBeenCalledWith('adr-v2');
      expect(
        screen.getByText('Deploy Envoy edge proxies.')
      ).toBeInTheDocument();
    });

    // 2. Switch back to adr-v1 and check Edit Mode Self-Link Prevention
    fireEvent.click(screen.getByTitle('Close'));
    await waitFor(() => {
      expect(screen.getByText('Legacy Monolithic Routing ADR')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByTitle('View & Preview')[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit & Create Revision/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Edit & Create Revision/i }));

    await waitFor(() => {
      // Superseded By selector should be present
      expect(screen.getByLabelText(/Superseded By \(Linked ADR in this Project\)/i)).toBeInTheDocument();
    });

    // Inspect options inside the "Superseded By" selector
    const supersededBySelect = screen.getByLabelText(/Superseded By \(Linked ADR in this Project\)/i) as HTMLSelectElement;
    const optionValues = Array.from(supersededBySelect.options).map((opt) => opt.value);

    // Self-link prevention: adr-v1 MUST NOT be present in its own superseder options!
    expect(optionValues).not.toContain('adr-v1');
    expect(optionValues).toContain('adr-v2');
    expect(optionValues).toContain('adr-orphan');

    // 3. Check Graceful Fallback for missing/deleted linked ADR
    fireEvent.click(screen.getByTitle('Close'));
    await waitFor(() => {
      expect(screen.getByText('Orphan ADR with Deleted Target')).toBeInTheDocument();
    });

    // View orphan ADR
    fireEvent.click(screen.getAllByTitle('View & Preview')[2]);

    await waitFor(() => {
      expect(screen.getByText(/deleted-adr-999-uuid/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Document not found or may have been deleted/i)
      ).toBeInTheDocument();
    });
  });

  it('enforces ADR decision authorization in UI: restricts ACCEPTED and REJECTED to team leaders and admins', async () => {
    const proposedAdr: DocumentDetail = {
      id: 'adr-proposed-1',
      projectId: 'proj-1',
      projectKey: 'INFRA',
      projectName: 'Platform Infrastructure',
      title: 'Event-Driven Messaging Protocol ADR',
      type: 'DECISION_RECORD',
      content: JSON.stringify({
        context: 'Evaluating message brokers.',
        problemDrivers: ['Event ordering', 'Throughput'],
        optionsConsidered: [],
        decision: 'Use Kafka for high throughput.',
        rationale: 'Proven scalability.',
        consequences: { positive: [], negative: [] },
      }),
      currentVersion: 1,
      status: 'PROPOSED',
      createdByUsername: 'dev1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recentVersions: [],
    };

    vi.spyOn(docApi, 'getDocumentsForProject').mockResolvedValue([proposedAdr]);
    vi.spyOn(docApi, 'getDocumentById').mockResolvedValue(proposedAdr);

    // 1. Render as regular Developer (ROLE_DEVELOPER)
    const { unmount } = render(
      <DocumentDiagramView
        selectedProjectId="proj-1"
        currentUserRoles={['ROLE_DEVELOPER']}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Event-Driven Messaging Protocol ADR')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('View & Preview'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit & Create Revision/i })).toBeInTheDocument();
    });

    // Switch to Edit Mode
    fireEvent.click(screen.getByRole('button', { name: /Edit & Create Revision/i }));

    await waitFor(() => {
      // Authorization restriction notice is visible
      expect(screen.getByText(/Decision Authorization Restricted/i)).toBeInTheDocument();
      expect(screen.getByText(/ROLE_TEAM_LEADER/i)).toBeInTheDocument();
      expect(screen.getByText(/ROLE_ADMIN/i)).toBeInTheDocument();
    });

    // Check status selector options
    const lifecycleSelect = screen.getByLabelText(/ADR Lifecycle Status/i) as HTMLSelectElement;
    const acceptedOption = Array.from(lifecycleSelect.options).find((opt) => opt.value === 'ACCEPTED');
    const rejectedOption = Array.from(lifecycleSelect.options).find((opt) => opt.value === 'REJECTED');

    // Both ACCEPTED and REJECTED must be disabled for regular developers
    expect(acceptedOption?.disabled).toBe(true);
    expect(rejectedOption?.disabled).toBe(true);
    expect(acceptedOption?.text).toMatch(/Team Leader \/ Admin required/i);
    expect(rejectedOption?.text).toMatch(/Team Leader \/ Admin required/i);

    unmount();

    // 2. Render as Team Leader (ROLE_TEAM_LEADER)
    render(
      <DocumentDiagramView
        selectedProjectId="proj-1"
        currentUserRoles={['ROLE_TEAM_LEADER']}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Event-Driven Messaging Protocol ADR')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('View & Preview'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit & Create Revision/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Edit & Create Revision/i }));

    await waitFor(() => {
      const leaderLifecycleSelect = screen.getByLabelText(/ADR Lifecycle Status/i) as HTMLSelectElement;
      const leaderAcceptedOption = Array.from(leaderLifecycleSelect.options).find((opt) => opt.value === 'ACCEPTED');
      const leaderRejectedOption = Array.from(leaderLifecycleSelect.options).find((opt) => opt.value === 'REJECTED');

      // Team leaders have authorization to accept or reject
      expect(leaderAcceptedOption?.disabled).toBe(false);
      expect(leaderRejectedOption?.disabled).toBe(false);
    });
  });

  it('handles missing or deleted user stories gracefully in PRD edit mode and allows unlinking', async () => {
    const testPrdContent: ProductRequirementContent = {
      problemStatement: 'Problem statement for orphan story test.',
      scope: { inScope: ['Scope item'], outOfScope: [] },
      functionalRequirements: [{ id: 'FR-1', title: 'Feature', description: '', priority: 'HIGH' }],
      nonFunctionalRequirements: [],
      acceptanceCriteria: ['Pass criteria'],
      linkedStoryIds: ['valid-story-id', 'deleted-story-id-999'],
    };

    const onChangeSpy = vi.fn();
    render(
      <PrdEditorAndView
        content={testPrdContent}
        onChange={onChangeSpy}
        isEditing={true}
        availableStories={[
          {
            id: 'valid-story-id',
            projectId: 'proj-1',
            projectKey: 'SDLC',
            storyNumber: 10,
            storyKey: 'SDLC-10',
            title: 'Valid Story',
            status: 'TODO',
            priority: 'HIGH',
            taskCount: 0,
            completedTaskCount: 0,
            createdAt: new Date().toISOString(),
          },
        ]}
      />
    );

    // Valid story should be displayed with checkbox checked
    expect(screen.getByText('SDLC-10')).toBeInTheDocument();
    expect(screen.getByText('Valid Story')).toBeInTheDocument();

    // Missing story should display an alert banner with Unlink button
    expect(screen.getByText(/Linked Story Missing \(deleted-\.\.\.\)/i)).toBeInTheDocument();

    const unlinkBtn = screen.getByRole('button', { name: /Unlink/i });
    expect(unlinkBtn).toBeInTheDocument();
    fireEvent.click(unlinkBtn);

    // After unlinking, onChange should have been called without the missing story ID
    expect(onChangeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedStoryIds: ['valid-story-id'],
      })
    );
  });
});
