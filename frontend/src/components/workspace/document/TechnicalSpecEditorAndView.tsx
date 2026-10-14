import { useState } from 'react';
import {
  Cpu,
  Layers,
  Database,
  Shield,
  Workflow,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import type {
  TechnicalSpecContent,
  TechChoiceItem,
  ComponentResponsibilityItem,
  DocumentSummary,
} from '../../../types/entities';
import { DiagramRenderer } from '../DiagramRenderer';

interface TechSpecProps {
  content: TechnicalSpecContent;
  onChange?: (updated: TechnicalSpecContent) => void;
  isEditing?: boolean;
  availableDiagrams?: DocumentSummary[];
  availableRequirements?: DocumentSummary[];
}

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

export function parseTechnicalSpecContent(rawContent?: string): TechnicalSpecContent {
  if (!rawContent || !rawContent.trim()) {
    return defaultTechnicalSpecContent();
  }
  try {
    const parsed = JSON.parse(rawContent) as Partial<TechnicalSpecContent>;
    return {
      architectureOverview: parsed.architectureOverview || '',
      technologyChoices: parsed.technologyChoices?.length
        ? parsed.technologyChoices
        : defaultTechnicalSpecContent().technologyChoices,
      componentResponsibilities: parsed.componentResponsibilities?.length
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
      ...defaultTechnicalSpecContent(),
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
}: TechSpecProps) {
  const [data, setData] = useState<TechnicalSpecContent>(content);

  const update = (patch: Partial<TechnicalSpecContent>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.(next);
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
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Technology Stack Choices ({data.technologyChoices.length})
            </h4>
          </div>
          <div className="divide-y divide-slate-100">
            {data.technologyChoices.map((tc, idx) => (
              <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                <div className="space-y-1 flex-1">
                  <div className="font-semibold text-slate-900">{tc.technology}</div>
                  <div className="text-slate-600 font-medium">Role: {tc.role}</div>
                  <div className="text-slate-500 text-[11px] italic">Rationale: {tc.rationale}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Component Responsibilities */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-800" /> Component Responsibilities
            </h4>
          </div>
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

        {/* Linked Project Architecture Diagrams */}
        {data.linkedDiagramIds && data.linkedDiagramIds.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-800" /> Linked Architecture Diagrams ({data.linkedDiagramIds.length})
            </h4>
            <div className="space-y-4">
              {data.linkedDiagramIds.map((diagId) => {
                const diag = availableDiagrams.find((d) => d.id === diagId);
                return (
                  <div key={diagId} className="border border-slate-200 rounded p-3 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-slate-900">{diag ? diag.title : diagId}</span>
                      <span className="text-[11px] font-mono text-slate-500">{diag?.diagramSyntax || 'MERMAID'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Linked PRDs / Requirements */}
        {data.linkedRequirementIds && data.linkedRequirementIds.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-800" /> Linked Requirements & PRDs ({data.linkedRequirementIds.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.linkedRequirementIds.map((reqId) => {
                const req = availableRequirements.find((r) => r.id === reqId);
                return (
                  <span
                    key={reqId}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    <span>{req ? req.title : reqId}</span>
                  </span>
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
          <label className="text-xs font-semibold text-slate-800">Technology Choices & Rationale</label>
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
                  placeholder="Technology / Framework"
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
                {data.technologyChoices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.technologyChoices.filter((_, i) => i !== idx);
                      update({ technologyChoices: next });
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
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
      </div>

      {/* Component Responsibilities */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-800">Component Responsibilities</label>
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
              {data.componentResponsibilities.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = data.componentResponsibilities.filter((_, i) => i !== idx);
                    update({ componentResponsibilities: next });
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
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

      {/* Links to existing diagrams */}
      {availableDiagrams.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Link Project Architecture Diagrams
          </label>
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
        </div>
      )}

      {/* Links to existing requirements */}
      {availableRequirements.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Link Project Requirements & PRDs
          </label>
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
        </div>
      )}
    </div>
  );
}
