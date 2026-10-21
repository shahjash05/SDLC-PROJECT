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
  HelpCircle,
  XCircle,
  Scale,
  Globe,
  BookOpen,
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
  StorySummary,
  ProductRequirementContent,
  ApiDesignContent,
  TechnicalSpecContent,
  DecisionRecordContent,
} from '../../types/entities';
import {
  getDocumentsForProject,
  getDocumentById,
  createDocument,
  updateDocument,
  getDocumentVersions,
  deleteDocument,
} from '../../api/documents';
import { getStories } from '../../api/requirements';
import { getAllProjects } from '../../api/projects';
import { DiagramRenderer } from './DiagramRenderer';

import {
  PrdEditorAndView,
  parsePrdContent,
  defaultPrdContent,
  validatePrdContent,
} from './document/PrdEditorAndView';
import {
  ApiDesignEditorAndView,
  parseApiDesignContent,
  defaultApiDesignContent,
  validateApiDesignContent,
} from './document/ApiDesignEditorAndView';
import {
  TechnicalSpecEditorAndView,
  parseTechnicalSpecContent,
  defaultTechnicalSpecContent,
  validateTechnicalSpecContent,
} from './document/TechnicalSpecEditorAndView';
import {
  AdrEditorAndView,
  parseDecisionRecordContent,
  defaultDecisionRecordContent,
  validateDecisionRecordContent,
} from './document/AdrEditorAndView';
import { useOptionalAuth } from '../../context/AuthContext';

interface DocumentDiagramViewProps {
  projects?: ProjectSummary[];
  selectedProjectId?: string | null;
  onSelectProject?: (id: string) => void;
  currentUserRoles?: string[];
  isOrgOwnerOrAdmin?: boolean;
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
  currentUserRoles,
  isOrgOwnerOrAdmin,
}: DocumentDiagramViewProps) {
  const auth = useOptionalAuth();
  const userRoles = currentUserRoles !== undefined ? currentUserRoles : auth?.user?.roles;
  const userCanDecideAdr =
    isOrgOwnerOrAdmin === true ||
    (userRoles !== undefined
      ? userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_TEAM_LEADER')
      : true);
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

  // Available project entities for cross-linking
  const [projectStories, setProjectStories] = useState<StorySummary[]>([]);

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
  const [createType, setCreateType] = useState<DocumentType>('PRODUCT_REQUIREMENTS');
  const [createDiagramSyntax, setCreateDiagramSyntax] = useState<DiagramSyntax>('MERMAID');
  const [createContent, setCreateContent] = useState(MERMAID_SAMPLE_TEMPLATE);
  const [createPrdState, setCreatePrdState] = useState<ProductRequirementContent>(defaultPrdContent());
  const [createApiState, setCreateApiState] = useState<ApiDesignContent>(defaultApiDesignContent());
  const [createTechState, setCreateTechState] = useState<TechnicalSpecContent>(defaultTechnicalSpecContent());
  const [createAdrState, setCreateAdrState] = useState<DecisionRecordContent>(defaultDecisionRecordContent());
  const [createAdrStatus, setCreateAdrStatus] = useState<DocumentStatus>('PROPOSED');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states for Edit
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<DocumentType>('TECHNICAL_SPEC');
  const [editDiagramSyntax, setEditDiagramSyntax] = useState<DiagramSyntax>('NONE');
  const [editStatus, setEditStatus] = useState<DocumentStatus>('DRAFT');
  const [editContent, setEditContent] = useState('');
  const [editChangeSummary, setEditChangeSummary] = useState('');
  const [editPrdState, setEditPrdState] = useState<ProductRequirementContent>(defaultPrdContent());
  const [editApiState, setEditApiState] = useState<ApiDesignContent>(defaultApiDesignContent());
  const [editTechState, setEditTechState] = useState<TechnicalSpecContent>(defaultTechnicalSpecContent());
  const [editAdrState, setEditAdrState] = useState<DecisionRecordContent>(defaultDecisionRecordContent());
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

  // Load project stories for cross-linking
  useEffect(() => {
    if (!activeProjectId) return;
    getStories(activeProjectId)
      .then((stories) => setProjectStories(stories))
      .catch(() => setProjectStories([]));
  }, [activeProjectId]);

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

      // Populate category-specific structured state
      if (detail.type === 'PRODUCT_REQUIREMENTS') {
        setEditPrdState(parsePrdContent(detail.content));
      } else if (detail.type === 'API_DESIGN') {
        setEditApiState(parseApiDesignContent(detail.content));
      } else if (detail.type === 'TECHNICAL_SPEC') {
        setEditTechState(parseTechnicalSpecContent(detail.content));
      } else if (detail.type === 'DECISION_RECORD') {
        setEditAdrState(parseDecisionRecordContent(detail.content));
      }
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

  // Helper to serialize content payload based on type
  const serializeContentForType = (
    type: DocumentType,
    rawContent: string,
    prd: ProductRequirementContent,
    api: ApiDesignContent,
    tech: TechnicalSpecContent,
    adr: DecisionRecordContent
  ): string => {
    switch (type) {
      case 'PRODUCT_REQUIREMENTS':
        return JSON.stringify(prd, null, 2);
      case 'API_DESIGN':
        return JSON.stringify(api, null, 2);
      case 'TECHNICAL_SPEC':
        return JSON.stringify(tech, null, 2);
      case 'DECISION_RECORD':
        return JSON.stringify(adr, null, 2);
      default:
        return rawContent;
    }
  };

  // Create Document Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !createTitle.trim()) {
      setCreateError('Document title is required');
      return;
    }

    if (createType === 'PRODUCT_REQUIREMENTS') {
      const validation = validatePrdContent(createPrdState);
      if (!validation.isValid) {
        setCreateError(validation.errorMessage || 'Invalid Product Requirements content.');
        return;
      }
    }

    if (createType === 'API_DESIGN') {
      const validation = validateApiDesignContent(createApiState);
      if (!validation.isValid) {
        setCreateError(validation.errorMessage || 'Invalid API Design specification.');
        return;
      }
    }

    if (createType === 'TECHNICAL_SPEC') {
      const validation = validateTechnicalSpecContent(createTechState);
      if (!validation.isValid) {
        setCreateError(validation.errorMessage || 'Invalid Technical Specification.');
        return;
      }
    }

    if (createType === 'DECISION_RECORD') {
      const adrErrors = validateDecisionRecordContent(createAdrState, createAdrStatus);
      if (Object.keys(adrErrors).length > 0) {
        setCreateError(Object.values(adrErrors)[0]);
        return;
      }
    }

    setSubmittingCreate(true);
    setCreateError(null);
    try {
      const contentToSave = serializeContentForType(
        createType,
        createContent,
        createPrdState,
        createApiState,
        createTechState,
        createAdrState
      );

      const payload: CreateDocumentPayload = {
        title: createTitle.trim(),
        type: createType,
        diagramSyntax: createType === 'ARCHITECTURE_DIAGRAM' ? createDiagramSyntax : undefined,
        content: contentToSave,
      };
      await createDocument(activeProjectId, payload);
      setShowCreateModal(false);
      setCreateTitle('');
      setCreateContent(createDiagramSyntax === 'PLANTUML' ? PLANTUML_SAMPLE_TEMPLATE : MERMAID_SAMPLE_TEMPLATE);
      setCreatePrdState(defaultPrdContent());
      setCreateApiState(defaultApiDesignContent());
      setCreateTechState(defaultTechnicalSpecContent());
      setCreateAdrState(defaultDecisionRecordContent());
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

    if (editType === 'PRODUCT_REQUIREMENTS') {
      const validation = validatePrdContent(editPrdState);
      if (!validation.isValid) {
        setEditError(validation.errorMessage || 'Invalid Product Requirements content.');
        return;
      }
    }

    if (editType === 'API_DESIGN') {
      const validation = validateApiDesignContent(editApiState);
      if (!validation.isValid) {
        setEditError(validation.errorMessage || 'Invalid API Design specification.');
        return;
      }
    }

    if (editType === 'TECHNICAL_SPEC') {
      const validation = validateTechnicalSpecContent(editTechState);
      if (!validation.isValid) {
        setEditError(validation.errorMessage || 'Invalid Technical Specification.');
        return;
      }
    }

    if (editType === 'DECISION_RECORD') {
      if ((editStatus === 'ACCEPTED' || editStatus === 'REJECTED') && !userCanDecideAdr) {
        setEditError(
          'Only team leaders, admins, or organization owners/admins can accept or reject Architecture Decision Records.'
        );
        return;
      }
      const adrErrors = validateDecisionRecordContent(
        editAdrState,
        editStatus,
        activeDocDetail.id
      );
      if (Object.keys(adrErrors).length > 0) {
        setEditError(Object.values(adrErrors)[0]);
        return;
      }
    }

    setSubmittingEdit(true);
    setEditError(null);
    try {
      const contentToSave = serializeContentForType(
        editType,
        editContent,
        editPrdState,
        editApiState,
        editTechState,
        editAdrState
      );

      const payload: UpdateDocumentPayload = {
        title: editTitle.trim(),
        type: editType,
        diagramSyntax: editType === 'ARCHITECTURE_DIAGRAM' ? editDiagramSyntax : undefined,
        status: editStatus,
        content: contentToSave,
        changeSummary: editChangeSummary.trim() || undefined,
      };
      const updated = await updateDocument(activeDocDetail.id, payload);
      setActiveDocDetail(updated);
      setEditContent(contentToSave);
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

  // Format Type Label
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

  const getTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'ARCHITECTURE_DIAGRAM':
        return <Layers className="w-3.5 h-3.5 text-slate-700" />;
      case 'TECHNICAL_SPEC':
        return <FileCode className="w-3.5 h-3.5 text-slate-700" />;
      case 'API_DESIGN':
        return <Globe className="w-3.5 h-3.5 text-slate-700" />;
      case 'DECISION_RECORD':
        return <Scale className="w-3.5 h-3.5 text-slate-700" />;
      case 'PRODUCT_REQUIREMENTS':
        return <BookOpen className="w-3.5 h-3.5 text-slate-700" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'APPROVED':
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> {status === 'ACCEPTED' ? 'Accepted' : 'Approved'}
          </span>
        );
      case 'PROPOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <HelpCircle className="w-3 h-3" /> Proposed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <History className="w-3 h-3" /> Superseded
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

  // Filter linked documents for technical specs and ADR supersession
  const projectDiagrams = documents.filter((d) => d.type === 'ARCHITECTURE_DIAGRAM');
  const projectRequirements = documents.filter((d) => d.type === 'PRODUCT_REQUIREMENTS');
  const projectAdrs = documents.filter((d) => d.type === 'DECISION_RECORD');

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
            Author PRDs, API design specs, technical specifications, ADR decision records, and Mermaid/PlantUML diagrams.
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
              setCreateType(
                selectedTypeFilter !== 'ALL'
                  ? (selectedTypeFilter as DocumentType)
                  : 'PRODUCT_REQUIREMENTS'
              );
              setCreateDiagramSyntax('MERMAID');
              setCreateContent(MERMAID_SAMPLE_TEMPLATE);
              setCreatePrdState(defaultPrdContent());
              setCreateApiState(defaultApiDesignContent());
              setCreateTechState(defaultTechnicalSpecContent());
              setCreateAdrState(defaultDecisionRecordContent());
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
          { id: 'PRODUCT_REQUIREMENTS', label: 'PRDs / Requirements' },
          { id: 'API_DESIGN', label: 'API Design' },
          { id: 'TECHNICAL_SPEC', label: 'Technical Specs' },
          { id: 'DECISION_RECORD', label: 'ADRs / Decisions' },
          { id: 'ARCHITECTURE_DIAGRAM', label: 'Architecture Diagrams' },
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
            Documents attach to projects. Please create an organization and a project first.
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
              ? `No ${formatTypeLabel(selectedTypeFilter as DocumentType)} found. Create one to begin.`
              : 'Create requirements, API specifications, technical designs, or ADRs to document your architecture.'}
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
              className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between hover:border-slate-300 transition-shadow hover:shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {getTypeIcon(doc.type)}
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
                  {doc.diagramSyntax && doc.type === 'ARCHITECTURE_DIAGRAM' && (
                    <span className="text-slate-400 font-mono">
                      {doc.diagramSyntax}
                    </span>
                  )}
                  <span>•</span>
                  <span>@{doc.createdByUsername || 'user'}</span>
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
                    View
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
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded p-3">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Category *
                  </label>
                  <select
                    value={createType}
                    onChange={(e) => {
                      const val = e.target.value as DocumentType;
                      setCreateType(val);
                      if (val === 'ARCHITECTURE_DIAGRAM') {
                        setCreateDiagramSyntax('MERMAID');
                        setCreateContent(MERMAID_SAMPLE_TEMPLATE);
                      }
                    }}
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="PRODUCT_REQUIREMENTS">PRDs / Requirements</option>
                    <option value="ARCHITECTURE_DIAGRAM">Architecture Diagram</option>
                    <option value="API_DESIGN">API Design Specification</option>
                    <option value="TECHNICAL_SPEC">Technical Specification</option>
                    <option value="DECISION_RECORD">ADR / Architecture Decision</option>
                    <option value="GENERAL">General Document</option>
                  </select>
                </div>

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
              </div>

              {/* Dynamic Category Editor in Create Modal */}
              <div className="border-t border-slate-100 pt-3">
                {createType === 'PRODUCT_REQUIREMENTS' && (
                  <PrdEditorAndView
                    content={createPrdState}
                    onChange={setCreatePrdState}
                    isEditing={true}
                    availableStories={projectStories}
                  />
                )}

                {createType === 'API_DESIGN' && (
                  <ApiDesignEditorAndView
                    content={createApiState}
                    onChange={setCreateApiState}
                    isEditing={true}
                    documentStatus="DRAFT"
                  />
                )}

                {createType === 'TECHNICAL_SPEC' && (
                  <TechnicalSpecEditorAndView
                    content={createTechState}
                    onChange={setCreateTechState}
                    isEditing={true}
                    availableDiagrams={projectDiagrams}
                    availableRequirements={projectRequirements}
                    onNavigateToDocument={handleOpenDetail}
                  />
                )}

                {createType === 'DECISION_RECORD' && (
                  <AdrEditorAndView
                    content={createAdrState}
                    onChange={setCreateAdrState}
                    isEditing={true}
                    status={createAdrStatus}
                    onStatusChange={setCreateAdrStatus}
                    availableAdrs={projectAdrs}
                    userCanDecide={userCanDecideAdr}
                  />
                )}

                {createType === 'ARCHITECTURE_DIAGRAM' && (
                  <div className="space-y-3">
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
                            setCreateContent(PLANTUML_SAMPLE_TEMPLATE);
                          } else {
                            setCreateContent(MERMAID_SAMPLE_TEMPLATE);
                          }
                        }}
                        className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900"
                      >
                        <option value="MERMAID">Mermaid.js</option>
                        <option value="PLANTUML">PlantUML</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Diagram Syntax Definition *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setCreateContent(
                              createDiagramSyntax === 'PLANTUML'
                                ? PLANTUML_SAMPLE_TEMPLATE
                                : MERMAID_SAMPLE_TEMPLATE
                            );
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> Load Sample
                        </button>
                      </div>
                      <textarea
                        rows={8}
                        value={createContent}
                        onChange={(e) => setCreateContent(e.target.value)}
                        className="w-full text-xs font-mono border border-slate-300 rounded p-3 bg-slate-50 text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {createType === 'GENERAL' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Content</label>
                    <textarea
                      rows={8}
                      value={createContent}
                      onChange={(e) => setCreateContent(e.target.value)}
                      placeholder="Enter Markdown or plain text content..."
                      className="w-full text-xs font-mono border border-slate-300 rounded p-3 bg-white text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
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
                      Category: {formatTypeLabel(activeDocDetail.type)} • Author: @{activeDocDetail.createdByUsername || 'user'}
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
                      title="Close"
                      aria-label="Close"
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
                    <Eye className="w-3.5 h-3.5" /> View & Preview
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
                  /* VIEW / PREVIEW TAB */
                  <div className="space-y-4">
                    {activeDocDetail.type === 'ARCHITECTURE_DIAGRAM' && (
                      <DiagramRenderer
                        syntax={activeDocDetail.diagramSyntax || 'MERMAID'}
                        content={activeDocDetail.content || ''}
                        title={activeDocDetail.title}
                      />
                    )}

                    {activeDocDetail.type === 'PRODUCT_REQUIREMENTS' && (
                      <PrdEditorAndView
                        content={parsePrdContent(activeDocDetail.content)}
                        isEditing={false}
                        availableStories={projectStories}
                      />
                    )}

                    {activeDocDetail.type === 'API_DESIGN' && (
                      <ApiDesignEditorAndView
                        content={parseApiDesignContent(activeDocDetail.content)}
                        isEditing={false}
                        documentStatus={activeDocDetail.status}
                      />
                    )}

                    {activeDocDetail.type === 'TECHNICAL_SPEC' && (
                      <TechnicalSpecEditorAndView
                        content={parseTechnicalSpecContent(activeDocDetail.content)}
                        isEditing={false}
                        availableDiagrams={projectDiagrams}
                        availableRequirements={projectRequirements}
                        onNavigateToDocument={handleOpenDetail}
                      />
                    )}

                    {activeDocDetail.type === 'DECISION_RECORD' && (
                      <AdrEditorAndView
                        content={parseDecisionRecordContent(activeDocDetail.content)}
                        status={activeDocDetail.status}
                        isEditing={false}
                        availableAdrs={projectAdrs}
                        currentDocumentId={activeDocDetail.id}
                        onNavigateToDocument={handleOpenDetail}
                        userCanDecide={userCanDecideAdr}
                      />
                    )}

                    {activeDocDetail.type === 'GENERAL' && (
                      <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {activeDocDetail.content || 'No content provided.'}
                      </div>
                    )}
                  </div>
                ) : (
                  /* EDIT & CREATE REVISION TAB */
                  <form onSubmit={handleUpdateSubmit} className="space-y-4">
                    {editError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded p-3">
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
                          Review / Approval Status (Governance)
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
                          {editType === 'DECISION_RECORD' && (
                            <>
                              <option value="PROPOSED">Proposed</option>
                              <option
                                value="ACCEPTED"
                                disabled={!userCanDecideAdr}
                              >
                                Accepted {!userCanDecideAdr ? '— [Team Leader / Admin required]' : ''}
                              </option>
                              <option
                                value="REJECTED"
                                disabled={!userCanDecideAdr}
                              >
                                Rejected {!userCanDecideAdr ? '— [Team Leader / Admin required]' : ''}
                              </option>
                              <option value="SUPERSEDED">Superseded</option>
                            </>
                          )}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Document artifact review status. Separate from individual content lifecycle statuses (such as API contract lifecycle).
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Revision Summary / Change Reason (Stored in Version History) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Added authentication service edge routing"
                        value={editChangeSummary}
                        onChange={(e) => setEditChangeSummary(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>

                    {/* Specialized Category Form */}
                    <div className="border-t border-slate-100 pt-3">
                      {editType === 'PRODUCT_REQUIREMENTS' && (
                        <PrdEditorAndView
                          content={editPrdState}
                          onChange={setEditPrdState}
                          isEditing={true}
                          availableStories={projectStories}
                        />
                      )}

                      {editType === 'API_DESIGN' && (
                        <ApiDesignEditorAndView
                          content={editApiState}
                          onChange={setEditApiState}
                          isEditing={true}
                          documentStatus={editStatus}
                        />
                      )}

                      {editType === 'TECHNICAL_SPEC' && (
                        <TechnicalSpecEditorAndView
                          content={editTechState}
                          onChange={setEditTechState}
                          isEditing={true}
                          availableDiagrams={projectDiagrams}
                          availableRequirements={projectRequirements}
                          onNavigateToDocument={handleOpenDetail}
                        />
                      )}

                      {editType === 'DECISION_RECORD' && (
                        <AdrEditorAndView
                          content={editAdrState}
                          onChange={setEditAdrState}
                          status={editStatus}
                          onStatusChange={setEditStatus}
                          isEditing={true}
                          availableAdrs={projectAdrs}
                          currentDocumentId={activeDocDetail?.id}
                          onNavigateToDocument={handleOpenDetail}
                          userCanDecide={userCanDecideAdr}
                        />
                      )}

                      {editType === 'ARCHITECTURE_DIAGRAM' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Diagram Engine
                            </label>
                            <select
                              value={editDiagramSyntax}
                              onChange={(e) => setEditDiagramSyntax(e.target.value as DiagramSyntax)}
                              className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900"
                            >
                              <option value="MERMAID">Mermaid.js</option>
                              <option value="PLANTUML">PlantUML</option>
                            </select>
                          </div>
                          <div>
                            <textarea
                              rows={10}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full text-xs font-mono border border-slate-300 rounded p-3 bg-slate-50 text-slate-900"
                            />
                          </div>
                        </div>
                      )}

                      {editType === 'GENERAL' && (
                        <textarea
                          rows={10}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full text-xs font-mono border border-slate-300 rounded p-3 bg-white text-slate-900"
                        />
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
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
                          {ver.changeSummary || 'Initial creation'}
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
                        {selectedHistoricalVersion.diagramSyntax && selectedHistoricalVersion.diagramSyntax !== 'NONE' && (
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
                    <div className="bg-white border border-slate-200 rounded p-3 font-mono text-xs text-slate-800 max-h-56 overflow-y-auto whitespace-pre-wrap">
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
