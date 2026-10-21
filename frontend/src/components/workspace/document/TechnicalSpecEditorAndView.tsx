import { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Database,
  Shield,
  Workflow,
  Plus,
  Trash2,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import type {
  TechnicalSpecContent,
  DocumentSummary,
  DocumentDetail,
} from '../../../types/entities';
import { DiagramRenderer } from '../DiagramRenderer';
import { getDocumentById } from '../../../api/documents';

interface TechSpecProps {
  content: TechnicalSpecContent;
  onChange?: (updated: TechnicalSpecContent) => void;
  isEditing?: boolean;
  availableDiagrams?: DocumentSummary[];
  availableRequirements?: DocumentSummary[];
  onNavigateToDocument?: (docId: string) => void;
}

/**
 * Blank Technical Specification content without prefilled opinionated technology choices.
 */
export function blankTechnicalSpecContent(): TechnicalSpecContent {
  return {
    architectureOverview: '',
    technologyChoices: [],
    componentResponsibilities: [],
    databaseDesign: '',
    dataFlow: '',
    securityConsiderations: '',
    implementationDetails: '',
    linkedDiagramIds: [],
    linkedRequirementIds: [],
  };
}

/**
 * Standard reference enterprise architecture template.
 */
export function defaultTechnicalSpecContent(): TechnicalSpecContent {
  return {
    architectureOverview: '',
    technologyChoices: [
      {
        technology: 'Spring Boot 3 / Java 21',
        role: 'REST API, Business Logic, and RBAC Security',
        rationale: 'Robust enterprise platform with strong type safety and mature ecosystem',
      },
      {
        technology: 'PostgreSQL 16',
        role: 'Relational Database with Flyway Migrations',
        rationale: 'ACID compliance, schema versioning, and JSONB capabilities',
      },
      {
        technology: 'React 19 / Vite / Tailwind',
        role: 'Single-Page Application Frontend',
        rationale: 'Fast client-side rendering and component modularity',
      },
    ],
    componentResponsibilities: [
      {
        component: 'API Gateway & Security Filter',
        responsibility: 'Authenticates incoming JWT tokens and injects security context',
      },
      {
        component: 'Document Service',
        responsibility: 'Manages document revisions, version snapshotting, and project isolation',
      },
    ],
    databaseDesign: 'PostgreSQL relational schema managed via immutable Flyway SQL migrations.',
    dataFlow: 'Client sends authenticated HTTP request -> Filter verifies JWT -> Controller delegates to Service -> Repository queries DB -> Flyway ensures schema integrity.',
    securityConsiderations: 'JWT stateless authentication with HMAC-SHA-512 signing, role-based authorization (RBAC), and strict organization-level multi-tenancy isolation.',
    implementationDetails: 'Implemented using standard modular service-repository architecture.',
    linkedDiagramIds: [],
    linkedRequirementIds: [],
  };
}

export function validateTechnicalSpecContent(content: TechnicalSpecContent): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (!content.architectureOverview || !content.architectureOverview.trim()) {
    return {
      isValid: false,
      errorMessage: 'Architecture Overview is required for Technical Specifications.',
    };
  }

  for (let i = 0; i < content.technologyChoices.length; i++) {
    const tc = content.technologyChoices[i];
    if (!tc.technology || !tc.technology.trim()) {
      return {
        isValid: false,
        errorMessage: `Technology Choice #${i + 1} must specify a technology or framework name.`,
      };
    }
  }

  return { isValid: true };
}

export function parseTechnicalSpecContent(rawContent?: string): TechnicalSpecContent {
  if (!rawContent || !rawContent.trim()) {
    return defaultTechnicalSpecContent();
  }
  try {
    const parsed = JSON.parse(rawContent) as Partial<TechnicalSpecContent>;
    return {
      architectureOverview: parsed.architectureOverview || '',
      technologyChoices: Array.isArray(parsed.technologyChoices)
        ? parsed.technologyChoices
        : defaultTechnicalSpecContent().technologyChoices,
      componentResponsibilities: Array.isArray(parsed.componentResponsibilities)
        ? parsed.componentResponsibilities
        : defaultTechnicalSpecContent().componentResponsibilities,
      databaseDesign: parsed.databaseDesign || '',
      dataFlow: parsed.dataFlow || '',
      securityConsiderations: parsed.securityConsiderations || '',
      implementationDetails: parsed.implementationDetails || '',
      linkedDiagramIds: parsed.linkedDiagramIds || [],
      linkedRequirementIds: parsed.linkedRequirementIds || [],
    };
  } catch {
    return {
      ...blankTechnicalSpecContent(),
      architectureOverview: rawContent,
    };
  }
}

export function TechnicalSpecEditorAndView({
  content,
  onChange,
  isEditing = false,
  availableDiagrams = [],
  availableRequirements = [],
  onNavigateToDocument,
}: TechSpecProps) {
  const [data, setData] = useState<TechnicalSpecContent>(content);

  // Diagram details cache for inline previews
  const [diagramDetails, setDiagramDetails] = useState<Record<string, DocumentDetail>>({});
  const [loadingDiagrams, setLoadingDiagrams] = useState<Record<string, boolean>>({});
  const [failedDiagrams, setFailedDiagrams] = useState<Record<string, boolean>>({});
  const [collapsedPreviews, setCollapsedPreviews] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setData(content);
  }, [content]);

  // Fetch linked diagrams for inline rendering
  useEffect(() => {
    if (!data.linkedDiagramIds || data.linkedDiagramIds.length === 0) return;

    data.linkedDiagramIds.forEach((id) => {
      if (diagramDetails[id] || loadingDiagrams[id] || failedDiagrams[id]) return;

      setLoadingDiagrams((prev) => ({ ...prev, [id]: true }));
      getDocumentById(id)
        .then((doc) => {
          setDiagramDetails((prev) => ({ ...prev, [id]: doc }));
        })
        .catch(() => {
          setFailedDiagrams((prev) => ({ ...prev, [id]: true }));
        })
        .finally(() => {
          setLoadingDiagrams((prev) => ({ ...prev, [id]: false }));
        });
    });
  }, [data.linkedDiagramIds, diagramDetails, loadingDiagrams, failedDiagrams]);

  const update = (patch: Partial<TechnicalSpecContent>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.(next);
  };

  const togglePreview = (id: string) => {
    setCollapsedPreviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Architecture Overview */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-800" /> Architecture Overview
          </h4>
          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {data.architectureOverview || 'No overview provided.'}
          </p>
        </div>

        {/* Technology Choices */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Technology Stack Choices ({data.technologyChoices.length})
            </h4>
          </div>
          {data.technologyChoices.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.technologyChoices.map((tc, idx) => (
                <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="font-semibold text-slate-900">{tc.technology}</div>
                    <div className="text-slate-600 font-medium">Role: {tc.role}</div>
                    {tc.rationale && (
                      <div className="text-slate-500 text-[11px] italic">Rationale: {tc.rationale}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-xs text-slate-500 italic">No technology choices specified.</div>
          )}
        </div>

        {/* Component Responsibilities */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-800" /> Component Responsibilities ({data.componentResponsibilities.length})
            </h4>
          </div>
          {data.componentResponsibilities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.componentResponsibilities.map((cr, idx) => (
                <div key={idx} className="p-3 flex items-start gap-3 text-xs">
                  <span className="font-semibold text-slate-900 w-44 flex-shrink-0 bg-slate-100 px-2 py-1 rounded">
                    {cr.component}
                  </span>
                  <span className="text-slate-700 flex-1">{cr.responsibility}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-xs text-slate-500 italic">No component responsibilities specified.</div>
          )}
        </div>

        {/* Database & Data Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-800" /> Database & Persistence Design
            </h4>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {data.databaseDesign || 'No database design documented.'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-slate-800" /> Data Flow & Sequences
            </h4>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {data.dataFlow || 'No data flow documented.'}
            </p>
          </div>
        </div>

        {/* Security Considerations */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-800" /> Security & Access Controls
          </h4>
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
            {data.securityConsiderations || 'No security considerations documented.'}
          </p>
        </div>

        {/* Implementation Details */}
        {data.implementationDetails && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Implementation Details & Notes
            </h4>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {data.implementationDetails}
            </p>
          </div>
        )}

        {/* Linked Project Architecture Diagrams with Inline Previews */}
        {data.linkedDiagramIds && data.linkedDiagramIds.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-800" /> Linked Architecture Diagrams ({data.linkedDiagramIds.length})
            </h4>
            <div className="space-y-4">
              {data.linkedDiagramIds.map((diagId) => {
                const diagSummary = availableDiagrams.find((d) => d.id === diagId);
                const isFailed = failedDiagrams[diagId] || (!diagSummary && !diagramDetails[diagId]);
                const docDetail = diagramDetails[diagId];
                const isCollapsed = collapsedPreviews[diagId];

                // Missing or deleted linked diagram fallback
                if (isFailed && !docDetail) {
                  return (
                    <div
                      key={diagId}
                      className="p-3 border border-dashed border-amber-300 bg-amber-50/60 rounded-md flex items-center justify-between text-xs text-amber-900"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-semibold">Linked Diagram Unavailable</span>
                          <span className="font-mono text-[11px] text-amber-700 ml-1.5">({diagId.slice(0, 8)}...)</span>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            This architecture diagram may have been deleted or is not accessible in the current project.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                const title = docDetail?.title || diagSummary?.title || 'Architecture Diagram';
                const syntax = docDetail?.diagramSyntax || diagSummary?.diagramSyntax || 'MERMAID';
                const contentStr = docDetail?.content || '';

                return (
                  <div key={diagId} className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50 shadow-2xs">
                    {/* Header Bar */}
                    <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => togglePreview(diagId)}
                          className="text-slate-500 hover:text-slate-800 p-0.5"
                          title={isCollapsed ? 'Expand preview' : 'Collapse preview'}
                        >
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <span className="font-semibold text-slate-900 truncate">{title}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                          {syntax}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => togglePreview(diagId)}
                          className="text-[11px] text-slate-600 hover:text-slate-900"
                        >
                          {isCollapsed ? 'Show Preview' : 'Hide Preview'}
                        </button>
                        {onNavigateToDocument && (
                          <button
                            type="button"
                            onClick={() => onNavigateToDocument(diagId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                            title="Open full diagram in workspace modal"
                          >
                            <span>Open Full Diagram</span>
                            <ExternalLink className="w-3 h-3 text-slate-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Diagram Renderer */}
                    {!isCollapsed && (
                      <div className="p-4 bg-white">
                        {loadingDiagrams[diagId] ? (
                          <div className="p-6 text-center text-xs text-slate-400 italic">
                            Loading architecture diagram preview...
                          </div>
                        ) : contentStr ? (
                          <DiagramRenderer
                            syntax={syntax}
                            content={contentStr}
                            title={title}
                          />
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-500 italic">
                            Diagram content empty or still loading.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Linked PRDs / Requirements (Clickable Navigation) */}
        {data.linkedRequirementIds && data.linkedRequirementIds.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-800" /> Linked Requirements & PRDs ({data.linkedRequirementIds.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.linkedRequirementIds.map((reqId) => {
                const req = availableRequirements.find((r) => r.id === reqId);

                // Missing or deleted linked requirement fallback
                if (!req) {
                  return (
                    <span
                      key={reqId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 border border-dashed border-amber-300 text-xs font-medium text-amber-800"
                      title="This requirement document was not found or has been deleted."
                    >
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Requirement Unavailable ({reqId.slice(0, 8)}...)</span>
                    </span>
                  );
                }

                // Clickable Linked Requirement Button
                return (
                  <button
                    key={reqId}
                    type="button"
                    onClick={() => onNavigateToDocument?.(req.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer group"
                    title={`Open requirement document "${req.title}"`}
                  >
                    <BookOpen className="w-3 h-3 text-blue-600" />
                    <span>{req.title}</span>
                    <ExternalLink className="w-3 h-3 text-blue-400 group-hover:text-blue-600" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // EDIT MODE
  return (
    <div className="space-y-5">
      {/* Template Quick Selection Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="text-xs text-slate-700">
          <span className="font-semibold">Technical Spec Starter:</span> Choose starting with a blank template or standard reference architecture.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              update(blankTechnicalSpecContent());
            }}
            className="px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 transition-colors"
            title="Create blank technical specification with empty fields"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" /> Blank Specification
          </button>
          <button
            type="button"
            onClick={() => {
              update(defaultTechnicalSpecContent());
            }}
            className="px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 transition-colors"
            title="Load reference Spring Boot + React enterprise defaults"
          >
            <Sparkles className="w-3 h-3 text-amber-500" /> Reference Architecture
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">Architecture Overview *</label>
        <textarea
          rows={3}
          value={data.architectureOverview}
          onChange={(e) => update({ architectureOverview: e.target.value })}
          placeholder="High-level architecture description, system boundaries, and design principles..."
          className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-900"
        />
      </div>

      {/* Technology Choices Builder */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-800">
            Technology Choices & Rationale ({data.technologyChoices.length})
          </label>
          <button
            type="button"
            onClick={() => {
              update({
                technologyChoices: [
                  ...data.technologyChoices,
                  { technology: '', role: '', rationale: '' },
                ],
              });
            }}
            className="text-[11px] text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
          >
            <Plus className="w-3 h-3" /> Add Technology Choice
          </button>
        </div>

        {data.technologyChoices.length > 0 ? (
          <div className="space-y-2">
            {data.technologyChoices.map((tc, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tc.technology}
                    onChange={(e) => {
                      const next = [...data.technologyChoices];
                      next[idx] = { ...tc, technology: e.target.value };
                      update({ technologyChoices: next });
                    }}
                    placeholder="Technology / Framework *"
                    className="w-48 text-xs font-semibold border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-900"
                  />
                  <input
                    type="text"
                    value={tc.role}
                    onChange={(e) => {
                      const next = [...data.technologyChoices];
                      next[idx] = { ...tc, role: e.target.value };
                      update({ technologyChoices: next });
                    }}
                    placeholder="Role in System"
                    className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.technologyChoices.filter((_, i) => i !== idx);
                      update({ technologyChoices: next });
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remove technology choice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={tc.rationale}
                  onChange={(e) => {
                    const next = [...data.technologyChoices];
                    next[idx] = { ...tc, rationale: e.target.value };
                    update({ technologyChoices: next });
                  }}
                  placeholder="Rationale / Trade-off justification"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-900"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic p-3 border border-dashed border-slate-200 rounded text-center">
            No technology choices specified yet. Click &quot;+ Add Technology Choice&quot; above to add stack items.
          </div>
        )}
      </div>

      {/* Component Responsibilities */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-800">
            Component Responsibilities ({data.componentResponsibilities.length})
          </label>
          <button
            type="button"
            onClick={() => {
              update({
                componentResponsibilities: [
                  ...data.componentResponsibilities,
                  { component: '', responsibility: '' },
                ],
              });
            }}
            className="text-[11px] text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
          >
            <Plus className="w-3 h-3" /> Add Component
          </button>
        </div>

        {data.componentResponsibilities.length > 0 ? (
          <div className="space-y-2">
            {data.componentResponsibilities.map((cr, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cr.component}
                  onChange={(e) => {
                    const next = [...data.componentResponsibilities];
                    next[idx] = { ...cr, component: e.target.value };
                    update({ componentResponsibilities: next });
                  }}
                  placeholder="Component Name"
                  className="w-48 text-xs font-semibold border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
                />
                <input
                  type="text"
                  value={cr.responsibility}
                  onChange={(e) => {
                    const next = [...data.componentResponsibilities];
                    next[idx] = { ...cr, responsibility: e.target.value };
                    update({ componentResponsibilities: next });
                  }}
                  placeholder="Primary responsibility in the architecture"
                  className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = data.componentResponsibilities.filter((_, i) => i !== idx);
                    update({ componentResponsibilities: next });
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Remove component"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic p-3 border border-dashed border-slate-200 rounded text-center">
            No component responsibilities specified yet. Click &quot;+ Add Component&quot; above.
          </div>
        )}
      </div>

      {/* Database & Data Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">Database Design</label>
          <textarea
            rows={3}
            value={data.databaseDesign}
            onChange={(e) => update({ databaseDesign: e.target.value })}
            placeholder="Entities, relations, indexing, migrations..."
            className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">Data Flow & Sequence</label>
          <textarea
            rows={3}
            value={data.dataFlow}
            onChange={(e) => update({ dataFlow: e.target.value })}
            placeholder="Step-by-step request/data lifecycle..."
            className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-900"
          />
        </div>
      </div>

      {/* Security & Implementation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">Security Considerations</label>
          <textarea
            rows={3}
            value={data.securityConsiderations}
            onChange={(e) => update({ securityConsiderations: e.target.value })}
            placeholder="Authentication, authorization, secrets, input validation..."
            className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">Implementation Details</label>
          <textarea
            rows={3}
            value={data.implementationDetails}
            onChange={(e) => update({ implementationDetails: e.target.value })}
            placeholder="Code packages, services, dependency injections..."
            className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-900"
          />
        </div>
      </div>

      {/* Links to existing diagrams with Graceful Fallbacks */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-800">
            Link Project Architecture Diagrams
          </label>
          <span className="text-[11px] text-slate-500">
            {data.linkedDiagramIds?.length || 0} linked
          </span>
        </div>

        {/* Display any broken/deleted linked diagram IDs with Unlink option */}
        {data.linkedDiagramIds &&
          data.linkedDiagramIds
            .filter((id) => !availableDiagrams.some((d) => d.id === id))
            .map((missingId) => (
              <div
                key={missingId}
                className="p-2 border border-dashed border-amber-300 bg-amber-50 rounded flex items-center justify-between text-xs text-amber-900"
              >
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Linked Diagram Missing ({missingId.slice(0, 8)}...)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = (data.linkedDiagramIds || []).filter((id) => id !== missingId);
                    update({ linkedDiagramIds: next });
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-800 underline font-medium"
                >
                  Unlink
                </button>
              </div>
            ))}

        {availableDiagrams.length > 0 ? (
          <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 rounded bg-white p-2">
            {availableDiagrams.map((diag) => {
              const isChecked = data.linkedDiagramIds?.includes(diag.id);
              return (
                <label key={diag.id} className="flex items-center gap-2 text-xs text-slate-800 hover:bg-slate-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const current = data.linkedDiagramIds || [];
                      const next = e.target.checked
                        ? [...current, diag.id]
                        : current.filter((id) => id !== diag.id);
                      update({ linkedDiagramIds: next });
                    }}
                    className="rounded text-slate-900"
                  />
                  <span className="font-medium text-slate-800">{diag.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">({diag.diagramSyntax || 'MERMAID'})</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No architecture diagrams available in this project.</p>
        )}
      </div>

      {/* Links to existing requirements with Graceful Fallbacks */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-800">
            Link Project Requirements & PRDs
          </label>
          <span className="text-[11px] text-slate-500">
            {data.linkedRequirementIds?.length || 0} linked
          </span>
        </div>

        {/* Display any broken/deleted linked requirement IDs with Unlink option */}
        {data.linkedRequirementIds &&
          data.linkedRequirementIds
            .filter((id) => !availableRequirements.some((r) => r.id === id))
            .map((missingId) => (
              <div
                key={missingId}
                className="p-2 border border-dashed border-amber-300 bg-amber-50 rounded flex items-center justify-between text-xs text-amber-900"
              >
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Linked Requirement Missing ({missingId.slice(0, 8)}...)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = (data.linkedRequirementIds || []).filter((id) => id !== missingId);
                    update({ linkedRequirementIds: next });
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-800 underline font-medium"
                >
                  Unlink
                </button>
              </div>
            ))}

        {availableRequirements.length > 0 ? (
          <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 rounded bg-white p-2">
            {availableRequirements.map((req) => {
              const isChecked = data.linkedRequirementIds?.includes(req.id);
              return (
                <label key={req.id} className="flex items-center gap-2 text-xs text-slate-800 hover:bg-slate-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const current = data.linkedRequirementIds || [];
                      const next = e.target.checked
                        ? [...current, req.id]
                        : current.filter((id) => id !== req.id);
                      update({ linkedRequirementIds: next });
                    }}
                    className="rounded text-slate-900"
                  />
                  <span className="font-medium text-slate-800">{req.title}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No requirement documents available in this project.</p>
        )}
      </div>
    </div>
  );
}
