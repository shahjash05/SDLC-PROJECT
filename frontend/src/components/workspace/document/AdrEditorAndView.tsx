import { useState, useEffect } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  History,
  ThumbsUp,
  ThumbsDown,
  Users,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  ExternalLink,
  Unlink,
} from 'lucide-react';
import type {
  DecisionRecordContent,
  DocumentStatus,
  DocumentSummary,
} from '../../../types/entities';

export interface AdrProps {
  content: DecisionRecordContent;
  onChange?: (updated: DecisionRecordContent) => void;
  isEditing?: boolean;
  status?: DocumentStatus;
  onStatusChange?: (status: DocumentStatus) => void;
  availableAdrs?: DocumentSummary[];
  currentDocumentId?: string;
  onNavigateToDocument?: (docId: string) => void;
  userCanDecide?: boolean;
  validationErrors?: Record<string, string>;
}

export function defaultDecisionRecordContent(): DecisionRecordContent {
  return {
    context: '',
    problemDrivers: [''],
    optionsConsidered: [
      {
        option: 'Option A (Selected Approach)',
        pros: 'High performance, aligns with existing platform standards',
        cons: 'Initial setup complexity',
      },
      {
        option: 'Option B (Alternative Approach)',
        pros: 'Simple to prototype',
        cons: 'Does not scale or maintain schema history',
      },
    ],
    decision: '',
    rationale: '',
    consequences: {
      positive: [''],
      negative: [''],
    },
    authors: [],
    deciders: [],
    statusDate: new Date().toISOString().slice(0, 10),
    supersededById: '',
  };
}

export function parseDecisionRecordContent(rawContent?: string): DecisionRecordContent {
  if (!rawContent || !rawContent.trim()) {
    return defaultDecisionRecordContent();
  }
  try {
    const parsed = JSON.parse(rawContent) as Partial<DecisionRecordContent>;
    return {
      context: parsed.context || '',
      problemDrivers: parsed.problemDrivers?.length ? parsed.problemDrivers : [''],
      optionsConsidered: parsed.optionsConsidered?.length
        ? parsed.optionsConsidered
        : defaultDecisionRecordContent().optionsConsidered,
      decision: parsed.decision || '',
      rationale: parsed.rationale || '',
      consequences: {
        positive: parsed.consequences?.positive?.length ? parsed.consequences.positive : [''],
        negative: parsed.consequences?.negative?.length ? parsed.consequences.negative : [''],
      },
      authors: Array.isArray(parsed.authors)
        ? parsed.authors.filter(Boolean)
        : [],
      deciders: Array.isArray(parsed.deciders)
        ? parsed.deciders.filter(Boolean)
        : [],
      statusDate: parsed.statusDate || '',
      supersededById: parsed.supersededById || '',
    };
  } catch {
    return {
      ...defaultDecisionRecordContent(),
      context: rawContent,
    };
  }
}

export function validateDecisionRecordContent(
  content: DecisionRecordContent,
  status: DocumentStatus = 'PROPOSED',
  currentDocId?: string
): Record<string, string> {
  const errors: Record<string, string> = {};


  if (
    (status === 'ACCEPTED' || status === 'REJECTED') &&
    (!content.decision || !content.decision.trim())
  ) {
    errors.decision = `A clear decision statement is required when marking an ADR as ${status}.`;
  }

  if (status === 'SUPERSEDED') {
    if (!content.supersededById || !content.supersededById.trim()) {
      errors.supersededById = 'Please select which ADR supersedes this decision record.';
    } else if (currentDocId && content.supersededById === currentDocId) {
      errors.supersededById = 'An ADR cannot supersede itself. Please select a different ADR.';
    }
  }

  return errors;
}

export function AdrEditorAndView({
  content,
  onChange,
  isEditing = false,
  status = 'PROPOSED',
  onStatusChange,
  availableAdrs = [],
  currentDocumentId,
  onNavigateToDocument,
  userCanDecide = true,
  validationErrors = {},
}: AdrProps) {
  const [data, setData] = useState<DecisionRecordContent>(content);
  const [authorsInput, setAuthorsInput] = useState<string>(
    (content.authors || []).join(', ')
  );
  const [decidersInput, setDecidersInput] = useState<string>(
    (content.deciders || []).join(', ')
  );

  useEffect(() => {
    setData(content);
    setAuthorsInput((content.authors || []).join(', '));
    setDecidersInput((content.deciders || []).join(', '));
  }, [content]);

  const update = (patch: Partial<DecisionRecordContent>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.(next);
  };

  const handleStatusChangeInternal = (newStatus: DocumentStatus) => {
    if ((newStatus === 'ACCEPTED' || newStatus === 'REJECTED') && !userCanDecide) {
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const patch: Partial<DecisionRecordContent> = {};
    if (!data.statusDate) {
      patch.statusDate = today;
    }
    if (newStatus !== 'SUPERSEDED' && data.supersededById) {
      // Keep or clear? Keeping supersededById or clearing can be optional, but we retain it unless user unlinks
    }
    if (Object.keys(patch).length > 0) {
      update(patch);
    }
    onStatusChange?.(newStatus);
  };

  const handleAuthorsChange = (raw: string) => {
    setAuthorsInput(raw);
    const parsed = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    update({ authors: parsed });
  };

  const handleDecidersChange = (raw: string) => {
    setDecidersInput(raw);
    const parsed = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    update({ deciders: parsed });
  };

  // Filter available ADRs to prevent self-linking
  const eligibleSupersedingAdrs = availableAdrs.filter(
    (adr) => !currentDocumentId || adr.id !== currentDocumentId
  );

  const supersedingAdr = availableAdrs.find(
    (adr) => adr.id === data.supersededById
  );

  const getAdrStatusBadge = (st: DocumentStatus) => {
    switch (st) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> ACCEPTED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> REJECTED
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-300">
            <History className="w-3.5 h-3.5" /> SUPERSEDED
          </span>
        );
      case 'DEPRECATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <AlertTriangle className="w-3.5 h-3.5" /> DEPRECATED
          </span>
        );
      case 'PROPOSED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5" /> PROPOSED
          </span>
        );
    }
  };

  // VIEW MODE
  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Status Header Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-800" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Architecture Decision Record (MADR Format)
            </span>
          </div>
          {getAdrStatusBadge(status)}
        </div>

        {/* Superseded Notification Banner */}
        {status === 'SUPERSEDED' && (
          <div className="rounded-md border p-4 bg-purple-50/70 border-purple-200 text-purple-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <History className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1">
                    Superseded Architecture Decision
                  </h4>
                  {supersedingAdr ? (
                    <p className="text-xs text-purple-800">
                      This ADR has been superseded by{' '}
                      <span className="font-semibold text-purple-950">
                        {supersedingAdr.title}
                      </span>{' '}
                      (v{supersedingAdr.currentVersion}, status:{' '}
                      <span className="font-medium">{supersedingAdr.status}</span>).
                    </p>
                  ) : data.supersededById ? (
                    <div className="text-xs text-amber-800 bg-amber-50/80 border border-amber-200 rounded p-2 mt-1 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        Linked superseding ADR ID:{' '}
                        <code className="font-mono">{data.supersededById}</code> (Document
                        not found or may have been deleted).
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-purple-700 italic">
                      This ADR is marked SUPERSEDED, but no superseding record has been linked yet.
                    </p>
                  )}
                </div>
              </div>

              {supersedingAdr && onNavigateToDocument && (
                <button
                  type="button"
                  onClick={() => onNavigateToDocument(supersedingAdr.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors shadow-sm flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Superseding ADR
                </button>
              )}
            </div>
          </div>
        )}

        {/* Standard MADR Metadata Section */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            MADR Decision Metadata
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Authors */}
            <div className="bg-slate-50 border border-slate-100 rounded p-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Authors / Contributors
              </span>
              {data.authors && data.authors.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.authors.map((author, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 text-slate-800"
                    >
                      {author}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 italic">None specified</span>
              )}
            </div>

            {/* Deciders */}
            <div className="bg-slate-50 border border-slate-100 rounded p-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Deciders
              </span>
              {data.deciders && data.deciders.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.deciders.map((decider, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      {decider}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 italic">None specified</span>
              )}
            </div>

            {/* Status Change / Decision Date */}
            <div className="bg-slate-50 border border-slate-100 rounded p-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Status Date
              </span>
              <span className="text-slate-800 font-medium">
                {data.statusDate ? data.statusDate : 'Not specified'}
              </span>
            </div>
          </div>
        </div>

        {/* 1. Context & Background */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            1. Context &amp; Background
          </h4>
          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {data.context || 'No context documented.'}
          </p>
        </div>

        {/* 2. Decision Drivers */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            2. Decision Drivers
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-800">
            {data.problemDrivers.filter(Boolean).length > 0 ? (
              data.problemDrivers.filter(Boolean).map((d, i) => <li key={i}>{d}</li>)
            ) : (
              <li className="text-slate-400 italic">No specific decision drivers identified</li>
            )}
          </ul>
        </div>

        {/* 3. Options Considered */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Considered Options ({data.optionsConsidered.length})
            </h4>
          </div>
          <div className="divide-y divide-slate-100 p-2 space-y-2">
            {data.optionsConsidered.map((opt, idx) => (
              <div
                key={idx}
                className="bg-slate-50/60 border border-slate-200 rounded p-3 text-xs space-y-1.5"
              >
                <span className="font-semibold text-slate-900 block">{opt.option}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="text-emerald-700 flex items-start gap-1">
                    <ThumbsUp className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Pros:</strong> {opt.pros || 'None listed'}
                    </span>
                  </div>
                  <div className="text-rose-700 flex items-start gap-1">
                    <ThumbsDown className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Cons:</strong> {opt.cons || 'None listed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Decision Outcome & Rationale */}
        <div className="bg-blue-50/50 border border-blue-200 rounded-md p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
            4. Decision Outcome &amp; Rationale
          </h4>
          <div className="text-xs text-slate-900 font-medium">
            <strong>Decision:</strong> {data.decision || 'No formal decision stated yet.'}
          </div>
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
            <strong>Rationale:</strong> {data.rationale || 'No rationale documented.'}
          </p>
        </div>

        {/* 5. Consequences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Positive Consequences
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-800">
              {data.consequences.positive.filter(Boolean).length > 0 ? (
                data.consequences.positive.filter(Boolean).map((p, i) => (
                  <li key={i}>{p}</li>
                ))
              ) : (
                <li className="text-slate-400 italic">None specified</li>
              )}
            </ul>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Negative / Trade-off
              Consequences
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-800">
              {data.consequences.negative.filter(Boolean).length > 0 ? (
                data.consequences.negative.filter(Boolean).map((n, i) => (
                  <li key={i}>{n}</li>
                ))
              ) : (
                <li className="text-slate-400 italic">None specified</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // EDIT MODE
  return (
    <div className="space-y-5">
      {/* Permission Restriction Banner if user cannot decide */}
      {!userCanDecide && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2.5 text-amber-800 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold text-amber-900">
              Decision Authorization Restricted
            </strong>
            Only Team Leaders (<code>ROLE_TEAM_LEADER</code>), Platform Administrators (
            <code>ROLE_ADMIN</code>), or Organization Owners/Admins can mark an Architecture
            Decision Record as <strong>ACCEPTED</strong> or <strong>REJECTED</strong>. You may
            still propose decisions or mark records as SUPERSEDED or DEPRECATED.
          </div>
        </div>
      )}

      {/* Lifecycle Status & Supersession Picker */}
      {onStatusChange && (
        <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label
                htmlFor="adr-lifecycle-status"
                className="text-xs font-semibold text-slate-800 block"
              >
                ADR Lifecycle Status
              </label>
              <span className="text-[11px] text-slate-500">
                MADR lifecycle stage for this architectural decision.
              </span>
            </div>

            <select
              id="adr-lifecycle-status"
              value={status}
              onChange={(e) =>
                handleStatusChangeInternal(e.target.value as DocumentStatus)
              }
              className="text-xs font-semibold border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
            >
              <option value="PROPOSED">PROPOSED (Under Review)</option>
              <option
                value="ACCEPTED"
                disabled={!userCanDecide}
                className={!userCanDecide ? 'text-slate-400 italic' : ''}
              >
                ACCEPTED (Approved Decision){' '}
                {!userCanDecide ? '— [Team Leader / Admin required]' : ''}
              </option>
              <option
                value="REJECTED"
                disabled={!userCanDecide}
                className={!userCanDecide ? 'text-slate-400 italic' : ''}
              >
                REJECTED (Alternative Chosen){' '}
                {!userCanDecide ? '— [Team Leader / Admin required]' : ''}
              </option>
              <option value="SUPERSEDED">SUPERSEDED (Replaced by Newer ADR)</option>
              <option value="DEPRECATED">DEPRECATED (Obsolete)</option>
            </select>
          </div>

          {/* Superseded By Selector (When Status is SUPERSEDED) */}
          {status === 'SUPERSEDED' && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="adr-superseded-by"
                  className="text-xs font-semibold text-purple-900 flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5 text-purple-700" />
                  Superseded By (Linked ADR in this Project) *
                </label>
                {data.supersededById && (
                  <button
                    type="button"
                    onClick={() => update({ supersededById: '' })}
                    className="text-[11px] text-slate-500 hover:text-rose-600 inline-flex items-center gap-1"
                  >
                    <Unlink className="w-3 h-3" /> Unlink
                  </button>
                )}
              </div>

              <select
                id="adr-superseded-by"
                value={data.supersededById || ''}
                onChange={(e) => update({ supersededById: e.target.value })}
                className={`w-full text-xs border rounded px-3 py-1.5 bg-white text-slate-900 ${
                  validationErrors.supersededById
                    ? 'border-rose-400 ring-1 ring-rose-200'
                    : 'border-purple-300'
                }`}
              >
                <option value="">-- Select Superseding ADR --</option>
                {eligibleSupersedingAdrs.map((adr) => (
                  <option key={adr.id} value={adr.id}>
                    {adr.title} (Status: {adr.status}, v{adr.currentVersion})
                  </option>
                ))}
              </select>

              {validationErrors.supersededById && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {validationErrors.supersededById}
                </p>
              )}

              {/* Graceful fallback if linked ADR is missing from project */}
              {data.supersededById &&
                !availableAdrs.some((adr) => adr.id === data.supersededById) && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>
                        The previously linked ADR (ID:{' '}
                        <code className="font-mono">{data.supersededById}</code>) was not
                        found in this project or has been deleted.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => update({ supersededById: '' })}
                      className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-medium text-[10px]"
                    >
                      Clear Link
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Standard MADR Metadata Editor */}
      <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-600" />
          MADR Metadata
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Authors */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Authors (comma-separated)
            </label>
            <input
              type="text"
              value={authorsInput}
              onChange={(e) => handleAuthorsChange(e.target.value)}
              placeholder="e.g. Alice Developer, Bob Architect"
              className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
            />
          </div>

          {/* Deciders */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Deciders (comma-separated)
            </label>
            <input
              type="text"
              value={decidersInput}
              onChange={(e) => handleDecidersChange(e.target.value)}
              placeholder="e.g. Charlie TeamLead, Dana Admin"
              className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
            />
          </div>

          {/* Decision Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Decision / Status Date
            </label>
            <input
              type="date"
              value={data.statusDate || ''}
              onChange={(e) => update({ statusDate: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* 1. Context */}
      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          1. Context &amp; Architectural Forces *
        </label>
        <textarea
          rows={3}
          value={data.context}
          onChange={(e) => update({ context: e.target.value })}
          placeholder="Describe the technical or business problem, environmental constraints, and architectural forces..."
          className={`w-full text-xs border rounded p-2.5 bg-white text-slate-900 ${
            validationErrors.context
              ? 'border-rose-400 ring-1 ring-rose-200'
              : 'border-slate-300'
          }`}
        />
        {validationErrors.context && (
          <p className="text-[11px] text-rose-600 mt-1 font-medium">
            {validationErrors.context}
          </p>
        )}
      </div>

      {/* 2. Decision Drivers */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-800">
            2. Decision Drivers
          </label>
          <button
            type="button"
            onClick={() => update({ problemDrivers: [...data.problemDrivers, ''] })}
            className="text-[11px] text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Driver
          </button>
        </div>
        <div className="space-y-1.5">
          {data.problemDrivers.map((driver, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <input
                type="text"
                value={driver}
                onChange={(e) => {
                  const next = [...data.problemDrivers];
                  next[idx] = e.target.value;
                  update({ problemDrivers: next });
                }}
                placeholder={`Driver #${idx + 1} (e.g., Sub-millisecond latency, SQL compliance)`}
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
              />
              {data.problemDrivers.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = data.problemDrivers.filter((_, i) => i !== idx);
                    update({ problemDrivers: next });
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Remove Driver"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Options Considered */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-800">
            3. Options Considered
          </label>
          <button
            type="button"
            onClick={() => {
              update({
                optionsConsidered: [
                  ...data.optionsConsidered,
                  { option: '', pros: '', cons: '' },
                ],
              });
            }}
            className="text-[11px] text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
          >
            <Plus className="w-3 h-3" /> Add Option
          </button>
        </div>
        <div className="space-y-2.5">
          {data.optionsConsidered.map((opt, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={opt.option}
                  onChange={(e) => {
                    const next = [...data.optionsConsidered];
                    next[idx] = { ...opt, option: e.target.value };
                    update({ optionsConsidered: next });
                  }}
                  placeholder="Option Name (e.g., Option A: Use PostgreSQL)"
                  className="flex-1 text-xs font-semibold border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-900"
                />
                {data.optionsConsidered.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.optionsConsidered.filter((_, i) => i !== idx);
                      update({ optionsConsidered: next });
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remove Option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={opt.pros}
                  onChange={(e) => {
                    const next = [...data.optionsConsidered];
                    next[idx] = { ...opt, pros: e.target.value };
                    update({ optionsConsidered: next });
                  }}
                  placeholder="Pros / Advantages"
                  className="w-full text-xs border border-emerald-300 rounded px-2 py-1 bg-emerald-50/30 text-slate-900"
                />
                <input
                  type="text"
                  value={opt.cons}
                  onChange={(e) => {
                    const next = [...data.optionsConsidered];
                    next[idx] = { ...opt, cons: e.target.value };
                    update({ optionsConsidered: next });
                  }}
                  placeholder="Cons / Trade-offs"
                  className="w-full text-xs border border-rose-300 rounded px-2 py-1 bg-rose-50/30 text-slate-900"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Decision Outcome & Rationale */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            4. Chosen Decision *
          </label>
          <input
            type="text"
            value={data.decision}
            onChange={(e) => update({ decision: e.target.value })}
            placeholder="State the agreed decision clearly and concisely..."
            className={`w-full text-xs font-semibold border rounded px-2.5 py-1.5 bg-white text-slate-900 ${
              validationErrors.decision
                ? 'border-rose-400 ring-1 ring-rose-200'
                : 'border-slate-300'
            }`}
          />
          {validationErrors.decision && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">
              {validationErrors.decision}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Rationale &amp; Justification
          </label>
          <textarea
            rows={2}
            value={data.rationale}
            onChange={(e) => update({ rationale: e.target.value })}
            placeholder="Why was this option selected over the alternatives?"
            className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-900"
          />
        </div>
      </div>

      {/* 5. Consequences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-800">
              Positive Consequences
            </label>
            <button
              type="button"
              onClick={() =>
                update({
                  consequences: {
                    ...data.consequences,
                    positive: [...data.consequences.positive, ''],
                  },
                })
              }
              className="text-[11px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
          <div className="space-y-1.5">
            {data.consequences.positive.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...data.consequences.positive];
                    next[idx] = e.target.value;
                    update({ consequences: { ...data.consequences, positive: next } });
                  }}
                  placeholder={`Positive outcome #${idx + 1}`}
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
                />
                {data.consequences.positive.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.consequences.positive.filter((_, i) => i !== idx);
                      update({ consequences: { ...data.consequences, positive: next } });
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remove outcome"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-800">
              Trade-offs &amp; Negative Consequences
            </label>
            <button
              type="button"
              onClick={() =>
                update({
                  consequences: {
                    ...data.consequences,
                    negative: [...data.consequences.negative, ''],
                  },
                })
              }
              className="text-[11px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
          <div className="space-y-1.5">
            {data.consequences.negative.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...data.consequences.negative];
                    next[idx] = e.target.value;
                    update({ consequences: { ...data.consequences, negative: next } });
                  }}
                  placeholder={`Negative / trade-off consequence #${idx + 1}`}
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
                />
                {data.consequences.negative.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.consequences.negative.filter((_, i) => i !== idx);
                      update({ consequences: { ...data.consequences, negative: next } });
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remove trade-off"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
