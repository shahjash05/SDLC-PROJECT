import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentDiagramView } from './components/workspace/DocumentDiagramView';
import * as projectApi from './api/projects';
import * as docApi from './api/documents';
import type { DocumentDetail, DocumentSummary, DocumentVersion } from './types/entities';

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
      expect(screen.getByText(/PROPOSED SPECIFICATION/i)).toBeInTheDocument();
      expect(screen.getByText('List project documents')).toBeInTheDocument();
      expect(screen.getByText('GET')).toBeInTheDocument();
      expect(screen.getByText('/api/v1/documents')).toBeInTheDocument();
    });
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
});

