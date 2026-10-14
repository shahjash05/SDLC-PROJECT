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

    // By default, Mermaid is selected with verified ports
    const contentArea = screen.getByPlaceholderText(/Enter Markdown or Mermaid syntax/i) as HTMLTextAreaElement;
    expect(contentArea.value).toContain('Vite React Client: Port 5173');
    expect(contentArea.value).toContain('Spring Boot 3 API: Port 8081');
    expect(contentArea.value).toContain('PostgreSQL 16: Port 5432');
    expect(contentArea.value).not.toContain('8080');
    expect(contentArea.value).not.toContain('Redis');

    // Switch engine to PlantUML
    const engineSelect = screen.getByDisplayValue('Mermaid.js');
    fireEvent.change(engineSelect, { target: { value: 'PLANTUML' } });

    // Should automatically switch content to valid PlantUML template with verified ports
    expect(contentArea.value).toContain('@startuml');
    expect(contentArea.value).toContain('@enduml');
    expect(contentArea.value).toContain('Web Browser (Port 5173)');
    expect(contentArea.value).toContain('Application Server (Port 8081)');
    expect(contentArea.value).toContain('Database Server (Port 5432)');
    expect(contentArea.value).not.toContain('8080');
    expect(contentArea.value).not.toContain('Redis');
  });
});

