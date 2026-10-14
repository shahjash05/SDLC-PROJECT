import { useState } from 'react';
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
} from 'lucide-react';
import type {
  DecisionRecordContent,
  AdrOptionItem,
  DocumentStatus,
} from '../../../types/entities';

interface AdrProps {
  content: DecisionRecordContent;
  onChange?: (updated: DecisionRecordContent) => void;
  isEditing?: boolean;
  status?: DocumentStatus;
  onStatusChange?: (status: DocumentStatus) => void;
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
    };
  } catch {
    return {
      ...defaultDecisionRecordContent(),
      context: rawContent,
    };
  }
}

export function AdrEditorAndView({
  content,
  onChange,
  isEditing = false,
  status = 'PROPOSED',
  onStatusChange,
}: AdrProps) {
  const [data, setData] = useState<DecisionRecordContent>(content);

  const update = (patch: Partial<DecisionRecordContent>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.(next);
  };

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

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Status Header Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-800" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Architecture Decision Record (ADR)
            </span>
          </div>
          {getAdrStatusBadge(status)}
        </div>

        {/* Context & Problem Statement */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            1. Context & Background
          </h4>
          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {data.context || 'No context documented.'}
          </p>
        </div>

        {/* Decision Drivers */}
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

        {/* Options Considered */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Considered Options ({data.optionsConsidered.length})
            </h4>
          </div>
          <div className="divide-y divide-slate-100 p-2 space-y-2">
            {data.optionsConsidered.map((opt, idx) => (
              <div key={idx} className="bg-slate-50/60 border border-slate-200 rounded p-3 text-xs space-y-1.5">
                <span className="font-semibold text-slate-900 block">{opt.option}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="text-emerald-700 flex items-start gap-1">
                    <ThumbsUp className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span><strong>Pros:</strong> {opt.pros || 'None listed'}</span>
                  </div>
                  <div className="text-rose-700 flex items-start gap-1">
                    <ThumbsDown className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span><strong>Cons:</strong> {opt.cons || 'None listed'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Outcome & Rationale */}
        <div className="bg-blue-50/50 border border-blue-200 rounded-md p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
            4. Decision Outcome & Rationale
          </h4>
          <div className="text-xs text-slate-900 font-medium">
            <strong>Decision:</strong> {data.decision || 'No formal decision stated yet.'}
          </div>
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
            <strong>Rationale:</strong> {data.rationale || 'No rationale documented.'}
          </p>
        </div>

        {/* Consequences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Positive Consequences
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-800">
              {data.consequences.positive.filter(Boolean).length > 0 ? (
                data.consequences.positive.filter(Boolean).map((p, i) => <li key={i}>{p}</li>)
              ) : (
                <li className="text-slate-400 italic">None specified</li>
              )}
            </ul>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Negative / Trade-off Consequences
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-800">
              {data.consequences.negative.filter(Boolean).length > 0 ? (
                data.consequences.negative.filter(Boolean).map((n, i) => <li key={i}>{n}</li>)
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
      {/* Status Picker for ADR */}
      {onStatusChange && (
        <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center justify-between gap-3">
          <label className="text-xs font-semibold text-slate-800">
            ADR Lifecycle Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as DocumentStatus)}
            className="text-xs font-semibold border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
          >
            <option value="PROPOSED">PROPOSED (Under Review)</option>
            <option value="ACCEPTED">ACCEPTED (Approved Decision)</option>
            <option value="REJECTED">REJECTED (Alternative Chosen)</option>
            <option value="SUPERSEDED">SUPERSEDED (Replaced by Newer ADR)</option>
            <option value="DEPRECATED">DEPRECATED (Obsolete)</option>
          </select>
        </div>
      )}

      {/* Context */}
      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          1. Context & Architectural Forces *
        </label>
        <textarea
          rows={3}
          value={data.context}
          onChange={(e) => update({ context: e.target.value })}
          placeholder="Describe the technical or business problem, environmental constraints, and architectural forces..."
          className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-900"
        />
      </div>

      {/* Decision Drivers */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-800">2. Decision Drivers</label>
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
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Options Considered */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-800">3. Options Considered</label>
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
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
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

      {/* Decision Outcome & Rationale */}
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
            className="w-full text-xs font-semibold border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Rationale & Justification
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

      {/* Consequences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-800">Positive Consequences</label>
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
            <label className="text-xs font-semibold text-slate-800">Trade-offs & Negative Consequences</label>
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
