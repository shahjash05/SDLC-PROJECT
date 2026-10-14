import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  History,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  X,
  FileCode,
  FolderGit2,
  Sparkles,
} from 'lucide-react';
import type {
  ProjectSummary,
  DocumentSummary,
  DocumentDetail,
  DocumentVersion,
  DocumentType,
  DocumentStatus,
  DiagramSyntax,
  CreateDocumentPayload,
  UpdateDocumentPayload,
} from '../../types/entities';
import {
  getDocumentsForProject,
  getDocumentById,
  createDocument,
  updateDocument,
  getDocumentVersions,
  deleteDocument,
} from '../../api/documents';

import { getAllProjects } from '../../api/projects';
import { DiagramRenderer } from './DiagramRenderer';

interface DocumentDiagramViewProps {
  projects?: ProjectSummary[];
  selectedProjectId?: string | null;
  onSelectProject?: (id: string) => void;
}

export const MERMAID_SAMPLE_TEMPLATE = `graph TD
  User([Developer / User]) --> Frontend[Vite React Client: Port 5173]
  Frontend -->|REST API / JWT| Backend[Spring Boot 3 API: Port 8081]
  Backend -->|Spring Security| Auth[JWT Provider & RBAC]
  Backend -->|JDBC / Flyway| Database[(PostgreSQL 16: Port 5432)]`;

export const PLANTUML_SAMPLE_TEMPLATE = `@startuml
skinparam monochrome false
skinparam roundcorner 8
skinparam shadowing false

actor "Developer / User" as user
node "Web Browser (Port 5173)" {
  [Vite React Client] as client
}
node "Application Server (Port 8081)" {
  [Spring Boot 3 API] as backend
  [Spring Security & JWT] as auth
}
database "Database Server (Port 5432)" {
  [PostgreSQL 16] as db
}

user --> client : Interacts via browser
client --> backend : REST API / JSON over HTTP
backend --> auth : Validates JWT & RBAC
backend --> db : JDBC / Flyway Migrations
@enduml`;

export function DocumentDiagramView({
  projects: propProjects,
  selectedProjectId,
  onSelectProject,
}: DocumentDiagramViewProps) {
  const [internalProjects, setInternalProjects] = useState<ProjectSummary[]>(propProjects || []);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    selectedProjectId || propProjects?.[0]?.id || ''
  );

  useEffect(() => {
    if (propProjects && propProjects.length > 0) {
      setInternalProjects(propProjects);
      if (!activeProjectId) {
        setActiveProjectId(selectedProjectId || propProjects[0].id);
      }
    } else {
      getAllProjects()
        .then((data) => {
          setInternalProjects(data);
          if (data.length > 0 && !activeProjectId) {
            setActiveProjectId(selectedProjectId || data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [propProjects, selectedProjectId, activeProjectId]);

  const projects = internalProjects;

  // Sync with prop if it changes
  useEffect(() => {
    if (selectedProjectId) {
      setActiveProjectId(selectedProjectId);
    } else if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [selectedProjectId, projects, activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Document state
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);

  // Active document for view/edit
  const [activeDocDetail, setActiveDocDetail] = useState<DocumentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<'preview' | 'edit'>('preview');

  // Form states for Create
  const [createTitle, setCreateTitle] = useState('');
  const [createType, setCreateType] = useState<DocumentType>('ARCHITECTURE_DIAGRAM');
  const [createDiagramSyntax, setCreateDiagramSyntax] = useState<DiagramSyntax>('MERMAID');
  const [createContent, setCreateContent] = useState(MERMAID_SAMPLE_TEMPLATE);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states for Edit
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<DocumentType>('TECHNICAL_SPEC');
  const [editDiagramSyntax, setEditDiagramSyntax] = useState<DiagramSyntax>('NONE');
  const [editStatus, setEditStatus] = useState<DocumentStatus>('DRAFT');
  const [editContent, setEditContent] = useState('');
  const [editChangeSummary, setEditChangeSummary] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Version History state
  const [versionList, setVersionList] = useState<DocumentVersion[]>([]);
  const [selectedHistoricalVersion, setSelectedHistoricalVersion] = useState<DocumentVersion | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const typeParam = selectedTypeFilter !== 'ALL' ? (selectedTypeFilter as DocumentType) : undefined;
      const data = await getDocumentsForProject(activeProjectId, typeParam);
      setDocuments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, selectedTypeFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Open detail modal
  const handleOpenDetail = async (docId: string, initialTab: 'preview' | 'edit' = 'preview') => {
    setLoadingDetail(true);
    setDetailTab(initialTab);
    setShowDetailModal(true);
    setEditError(null);
    try {
      const detail = await getDocumentById(docId);
      setActiveDocDetail(detail);
      setEditTitle(detail.title);
      setEditType(detail.type);
      setEditDiagramSyntax(detail.diagramSyntax || 'NONE');
      setEditStatus(detail.status);
      setEditContent(detail.content || '');
      setEditChangeSummary('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch document details');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Version History
  const handleOpenVersions = async (docId: string) => {
    setLoadingVersions(true);
    setShowVersionHistoryModal(true);
    setSelectedHistoricalVersion(null);
    try {
      const versions = await getDocumentVersions(docId);
      setVersionList(versions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch version history');
      setShowVersionHistoryModal(false);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Create Document Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !createTitle.trim()) {
      setCreateError('Document title is required');
      return;
    }

    setSubmittingCreate(true);
    setCreateError(null);
    try {
      const payload: CreateDocumentPayload = {
        title: createTitle.trim(),
        type: createType,
        diagramSyntax: createType === 'ARCHITECTURE_DIAGRAM' ? createDiagramSyntax : undefined,
        content: createContent,
      };
      await createDocument(activeProjectId, payload);
      setShowCreateModal(false);
      setCreateTitle('');
      setCreateContent(createDiagramSyntax === 'PLANTUML' ? PLANTUML_SAMPLE_TEMPLATE : MERMAID_SAMPLE_TEMPLATE);
      loadDocuments();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Update Document Submit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDocDetail || !editTitle.trim()) {
      setEditError('Document title is required');
      return;
    }

    setSubmittingEdit(true);
    setEditError(null);
    try {
      const payload: UpdateDocumentPayload = {
        title: editTitle.trim(),
        type: editType,
        diagramSyntax: editType === 'ARCHITECTURE_DIAGRAM' ? editDiagramSyntax : undefined,
        status: editStatus,
        content: editContent,
        changeSummary: editChangeSummary.trim() || undefined,
      };
      const updated = await updateDocument(activeDocDetail.id, payload);
      setActiveDocDetail(updated);
      setEditChangeSummary('');
      setDetailTab('preview');
      loadDocuments();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update document');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete document "${title}" and all its historical versions?`)) {
      return;
    }
    try {
      await deleteDocument(docId);
      if (activeDocDetail?.id === docId) {
        setShowDetailModal(false);
      }
      loadDocuments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  // Helpers for Badges
  const formatTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'ARCHITECTURE_DIAGRAM':
        return 'Architecture Diagram';
      case 'TECHNICAL_SPEC':
        return 'Technical Spec';
      case 'API_DESIGN':
        return 'API Design';
      case 'DECISION_RECORD':
        return 'ADR / Decision Record';
      case 'PRODUCT_REQUIREMENTS':
        return 'PRD / Requirements';
      default:
        return 'General Document';
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> In Review
          </span>
        );
      case 'DEPRECATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Deprecated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Project Selection */}
      <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">
              Documents & Architecture Diagrams
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Author technical specifications, Mermaid architecture diagrams, and track revision history.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {projects.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="project-select" className="text-xs font-medium text-slate-600">
                Project:
              </label>
              <select
                id="project-select"
                value={activeProjectId}
                onChange={(e) => {
                  setActiveProjectId(e.target.value);
                  onSelectProject?.(e.target.value);
                }}
                className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectKey})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setCreateTitle('');
              setCreateType('ARCHITECTURE_DIAGRAM');
              setCreateDiagramSyntax('MERMAID');
              setCreateContent(MERMAID_SAMPLE_TEMPLATE);
              setCreateError(null);
              setShowCreateModal(true);
            }}
            disabled={!activeProjectId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            New Document / Diagram
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Documents' },
          { id: 'ARCHITECTURE_DIAGRAM', label: 'Architecture Diagrams' },
          { id: 'TECHNICAL_SPEC', label: 'Technical Specs' },
          { id: 'API_DESIGN', label: 'API Design' },
          { id: 'DECISION_RECORD', label: 'ADRs / Decisions' },
          { id: 'PRODUCT_REQUIREMENTS', label: 'PRDs / Requirements' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedTypeFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedTypeFilter === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No projects found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Documents and architecture diagrams attach to projects. Please create an organization and a project first.
          </p>
        </div>
      ) : loading ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No documents found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedTypeFilter !== 'ALL'
              ? `No ${formatTypeLabel(selectedTypeFilter as DocumentType)} found. Create one or clear filter.`
              : 'Create technical specifications and Mermaid architecture diagrams to document system architecture.'}
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between hover:border-slate-300 transition-shadow hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {doc.type === 'ARCHITECTURE_DIAGRAM' ? (
                      <Layers className="w-3 h-3 text-slate-600" />
                    ) : (
                      <FileText className="w-3 h-3 text-slate-600" />
                    )}
                    {formatTypeLabel(doc.type)}
                  </span>
                  {getStatusBadge(doc.status)}
                </div>

                <h4 className="text-sm font-semibold text-slate-900 mb-1.5 line-clamp-1">
                  {doc.title}
                </h4>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-3">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                    v{doc.currentVersion}
                  </span>
                  {doc.diagramSyntax && (
                    <span className="text-slate-400 font-mono">
                      {doc.diagramSyntax}
                    </span>
                  )}
                  <span>•</span>
                  <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(doc.id, 'preview')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    title="View & Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(doc.id, 'edit')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    title="Edit & Revise"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenVersions(doc.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    title="Version History"
                  >
                    <History className="w-3.5 h-3.5" />
                    History
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteDoc(doc.id, doc.title)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE DOCUMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  New Document or Architecture Diagram
                </h3>
                <p className="text-xs text-slate-500">
                  Project: {activeProject?.name} ({activeProject?.projectKey})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-3">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Microservices Communication Architecture"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Type
                  </label>
                  <select
                    value={createType}
                    onChange={(e) => {
                      const val = e.target.value as DocumentType;
                      setCreateType(val);
                      if (val === 'ARCHITECTURE_DIAGRAM') {
                        setCreateDiagramSyntax('MERMAID');
                        if (!createContent || createContent === '' || createContent === PLANTUML_SAMPLE_TEMPLATE) {
                          setCreateContent(MERMAID_SAMPLE_TEMPLATE);
                        }
                      }
                    }}
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="ARCHITECTURE_DIAGRAM">Architecture Diagram</option>
                    <option value="TECHNICAL_SPEC">Technical Specification</option>
                    <option value="API_DESIGN">API Design</option>
                    <option value="DECISION_RECORD">ADR / Architecture Decision</option>
                    <option value="PRODUCT_REQUIREMENTS">PRD / Requirements</option>
                    <option value="GENERAL">General Document</option>
                  </select>
                </div>

                {createType === 'ARCHITECTURE_DIAGRAM' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Diagram Engine / Syntax
                    </label>
                    <select
                      value={createDiagramSyntax}
                      onChange={(e) => {
                        const newSyntax = e.target.value as DiagramSyntax;
                        setCreateDiagramSyntax(newSyntax);
                        if (newSyntax === 'PLANTUML') {
                          if (!createContent || createContent === '' || createContent === MERMAID_SAMPLE_TEMPLATE) {
                            setCreateContent(PLANTUML_SAMPLE_TEMPLATE);
                          }
                        } else if (newSyntax === 'MERMAID') {
                          if (!createContent || createContent === '' || createContent === PLANTUML_SAMPLE_TEMPLATE) {
                            setCreateContent(MERMAID_SAMPLE_TEMPLATE);
                          }
                        }
                      }}
                      className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      <option value="MERMAID">Mermaid.js</option>
                      <option value="PLANTUML">PlantUML</option>
                      <option value="NONE">Plain Text / Markdown</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Content / Diagram Definition *
                  </label>
                  {createType === 'ARCHITECTURE_DIAGRAM' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (createDiagramSyntax === 'PLANTUML') {
                          setCreateContent(PLANTUML_SAMPLE_TEMPLATE);
                        } else {
                          setCreateContent(MERMAID_SAMPLE_TEMPLATE);
                        }
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Load Sample {createDiagramSyntax === 'PLANTUML' ? 'PlantUML Diagram' : 'Mermaid Flowchart'}
                    </button>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  placeholder={
                    createDiagramSyntax === 'PLANTUML'
                      ? 'Enter PlantUML syntax (e.g., @startuml ... @enduml)'
                      : 'Enter Markdown or Mermaid syntax...'
                  }
                  className="w-full text-xs font-mono border border-slate-300 rounded p-3 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-4 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                  {submittingCreate ? 'Saving...' : 'Create Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL & EDITOR MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {loadingDetail ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading document details...
              </div>
            ) : activeDocDetail ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {activeDocDetail.title}
                      </h3>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        v{activeDocDetail.currentVersion}
                      </span>
                      {getStatusBadge(activeDocDetail.status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Type: {formatTypeLabel(activeDocDetail.type)} • Author: @{activeDocDetail.createdByUsername || 'system'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenVersions(activeDocDetail.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      <History className="w-3.5 h-3.5" />
                      Revisions ({activeDocDetail.recentVersions?.length || 1})
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDetailModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Tabs: Preview vs Edit */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setDetailTab('preview')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
                      detailTab === 'preview'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('edit')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
                      detailTab === 'edit'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit & Create Revision
                  </button>
                </div>

                {detailTab === 'preview' ? (
                  <div className="space-y-4">
                    {activeDocDetail.type === 'ARCHITECTURE_DIAGRAM' ? (
                      <DiagramRenderer
                        syntax={activeDocDetail.diagramSyntax || 'MERMAID'}
                        content={activeDocDetail.content || ''}
                        title={activeDocDetail.title}
                      />
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {activeDocDetail.content || 'No content provided.'}
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleUpdateSubmit} className="space-y-4">
                    {editError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-3">
                        {editError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Document Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Review Status
                        </label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as DocumentStatus)}
                          className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="APPROVED">Approved</option>
                          <option value="DEPRECATED">Deprecated</option>
                        </select>
                      </div>

                      {editType === 'ARCHITECTURE_DIAGRAM' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Diagram Engine / Syntax
                          </label>
                          <select
                            value={editDiagramSyntax}
                            onChange={(e) => setEditDiagramSyntax(e.target.value as DiagramSyntax)}
                            className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          >
                            <option value="MERMAID">Mermaid.js</option>
                            <option value="PLANTUML">PlantUML</option>
                            <option value="NONE">Plain Text / Markdown</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Revision Summary / Change Reason (Saved in Version History)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Added authentication service edge routing"
                        value={editChangeSummary}
                        onChange={(e) => setEditChangeSummary(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Document Content / Diagram Syntax
                        </label>
                        {editType === 'ARCHITECTURE_DIAGRAM' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (editDiagramSyntax === 'PLANTUML') {
                                setEditContent(PLANTUML_SAMPLE_TEMPLATE);
                              } else {
                                setEditContent(MERMAID_SAMPLE_TEMPLATE);
                              }
                            }}
                            className="text-[11px] text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" /> Load Sample {editDiagramSyntax === 'PLANTUML' ? 'PlantUML Diagram' : 'Mermaid Flowchart'}
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={10}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder={
                          editDiagramSyntax === 'PLANTUML'
                            ? 'Enter PlantUML syntax (e.g., @startuml ... @enduml)'
                            : 'Enter Markdown or Mermaid syntax...'
                        }
                        className="w-full text-xs font-mono border border-slate-300 rounded p-3 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setDetailTab('preview')}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingEdit}
                        className="px-4 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium rounded transition-colors disabled:opacity-50"
                      >
                        {submittingEdit ? 'Saving Revision...' : `Save as v${activeDocDetail.currentVersion + 1}`}
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {showVersionHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-700" />
                  Version History & Revision Snapshots
                </h3>
                <p className="text-xs text-slate-500">
                  Audit trail of all document changes with immutable historical versions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVersionHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingVersions ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading version history...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
                  {versionList.map((ver) => (
                    <div
                      key={ver.id}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        selectedHistoricalVersion?.id === ver.id ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold bg-slate-900 text-white px-2 py-0.5 rounded">
                            v{ver.versionNumber}
                          </span>
                          <span className="text-xs font-medium text-slate-800">
                            {ver.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            @{ver.createdByUsername || 'author'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {ver.changeSummary || 'No change summary'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(ver.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setSelectedHistoricalVersion(ver)}
                          className="px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-colors"
                        >
                          View Snapshot
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inspect Historical Version Snapshot */}
                {selectedHistoricalVersion && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">
                          Historical Snapshot: v{selectedHistoricalVersion.versionNumber} ({selectedHistoricalVersion.title})
                        </span>
                        {selectedHistoricalVersion.diagramSyntax && (
                          <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            {selectedHistoricalVersion.diagramSyntax}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedHistoricalVersion(null)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Close Snapshot
                      </button>
                    </div>

                    {selectedHistoricalVersion.diagramSyntax && selectedHistoricalVersion.diagramSyntax !== 'NONE' && (
                      <DiagramRenderer
                        syntax={selectedHistoricalVersion.diagramSyntax}
                        content={selectedHistoricalVersion.content}
                        title={selectedHistoricalVersion.title}
                      />
                    )}

                    <div className="bg-white border border-slate-200 rounded p-3 font-mono text-xs text-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {selectedHistoricalVersion.content}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
