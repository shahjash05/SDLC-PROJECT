import { useState } from 'react';
import {
  ListChecks,
  Plus,
  Trash2,
  Bookmark,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
  Link as LinkIcon,
} from 'lucide-react';
import type {
  ProductRequirementContent,
  FunctionalRequirementItem,
  StorySummary,
} from '../../../types/entities';

interface PrdProps {
  content: ProductRequirementContent;
  onChange?: (updated: ProductRequirementContent) => void;
  isEditing?: boolean;
  availableStories?: StorySummary[];
}

export function defaultPrdContent(): ProductRequirementContent {
  return {
    problemStatement: '',
    scope: {
      inScope: [''],
      outOfScope: [''],
    },
    functionalRequirements: [
      {
        id: 'FR-1',
        title: '',
        description: '',
        priority: 'HIGH',
      },
    ],
    nonFunctionalRequirements: [
      {
        category: 'Performance',
        requirement: '',
      },
    ],
    acceptanceCriteria: [''],
    linkedStoryIds: [],
  };
}

export function parsePrdContent(rawContent?: string): ProductRequirementContent {
  if (!rawContent || !rawContent.trim()) {
    return defaultPrdContent();
  }
  try {
    const parsed = JSON.parse(rawContent) as Partial<ProductRequirementContent>;
    return {
      problemStatement: parsed.problemStatement || '',
      scope: {
        inScope: parsed.scope?.inScope?.length ? parsed.scope.inScope : [''],
        outOfScope: parsed.scope?.outOfScope?.length ? parsed.scope.outOfScope : [''],
      },
      functionalRequirements: parsed.functionalRequirements?.length
        ? parsed.functionalRequirements
        : defaultPrdContent().functionalRequirements,
      nonFunctionalRequirements: parsed.nonFunctionalRequirements?.length
        ? parsed.nonFunctionalRequirements
        : defaultPrdContent().nonFunctionalRequirements,
      acceptanceCriteria: parsed.acceptanceCriteria?.length ? parsed.acceptanceCriteria : [''],
      linkedStoryIds: parsed.linkedStoryIds || [],
    };
  } catch {
    // If legacy markdown or plain text was stored
    return {
      ...defaultPrdContent(),
      problemStatement: rawContent,
    };
  }
}

export function PrdEditorAndView({
  content,
  onChange,
  isEditing = false,
  availableStories = [],
}: PrdProps) {
  const [data, setData] = useState<ProductRequirementContent>(content);

  const update = (patch: Partial<ProductRequirementContent>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.(next);
  };

  const getPriorityBadge = (priority: FunctionalRequirementItem['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Problem Statement */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-slate-800" /> Problem Statement & Background
          </h4>
          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {data.problemStatement || 'No problem statement provided.'}
          </p>
        </div>

        {/* Scope Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> In Scope
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-800">
              {data.scope.inScope.filter(Boolean).length > 0 ? (
                data.scope.inScope.filter(Boolean).map((item, i) => <li key={i}>{item}</li>)
              ) : (
                <li className="text-slate-400 italic">None specified</li>
              )}
            </ul>
          </div>

          <div className="bg-rose-50/50 border border-rose-200/80 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> Out of Scope
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-800">
              {data.scope.outOfScope.filter(Boolean).length > 0 ? (
                data.scope.outOfScope.filter(Boolean).map((item, i) => <li key={i}>{item}</li>)
              ) : (
                <li className="text-slate-400 italic">None specified</li>
              )}
            </ul>
          </div>
        </div>

        {/* Functional Requirements */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-slate-800" /> Functional Requirements ({data.functionalRequirements.length})
            </h4>
          </div>
          <div className="divide-y divide-slate-100">
            {data.functionalRequirements.map((fr, idx) => (
              <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {fr.id || `FR-${idx + 1}`}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{fr.title || 'Untitled Requirement'}</span>
                  </div>
                  <p className="text-xs text-slate-600 pl-1">{fr.description || 'No description'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(fr.priority)}`}>
                  {fr.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Non-Functional Requirements */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Non-Functional Requirements (NFRs)
            </h4>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {data.nonFunctionalRequirements.map((nfr, idx) => (
              <div key={idx} className="p-2 flex items-center gap-3 text-xs">
                <span className="font-semibold text-slate-800 w-32 flex-shrink-0 bg-slate-100 px-2 py-1 rounded text-center">
                  {nfr.category || 'General'}
                </span>
                <span className="text-slate-700 flex-1">{nfr.requirement || 'Not specified'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acceptance Criteria */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-slate-800" /> Acceptance Criteria
          </h4>
          <div className="space-y-1.5">
            {data.acceptanceCriteria.filter(Boolean).map((ac, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>{ac}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Linked User Stories */}
        {data.linkedStoryIds && data.linkedStoryIds.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-800" /> Linked User Stories ({data.linkedStoryIds.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.linkedStoryIds.map((storyId) => {
                const story = availableStories.find((s) => s.id === storyId);
                return (
                  <span
                    key={storyId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
                  >
                    <span className="font-mono text-slate-500">{story ? story.storyKey : storyId.slice(0, 8)}</span>
                    <span>{story ? story.title : 'User Story'}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // EDITING FORM
  return (
    <div className="space-y-5">
      {/* Problem Statement */}
      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          Problem Statement & Context *
        </label>
        <textarea
          rows={3}
          value={data.problemStatement}
          onChange={(e) => update({ problemStatement: e.target.value })}
          placeholder="Describe the user or business problem this requirement document addresses..."
          className="w-full text-xs border border-slate-300 rounded p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
      </div>

      {/* In-Scope & Out-of-Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-800">In Scope Items</label>
            <button
              type="button"
              onClick={() => update({ scope: { ...data.scope, inScope: [...data.scope.inScope, ''] } })}
              className="text-[11px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
          <div className="space-y-1.5">
            {data.scope.inScope.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...data.scope.inScope];
                    next[idx] = e.target.value;
                    update({ scope: { ...data.scope, inScope: next } });
                  }}
                  placeholder={`In-scope deliverable #${idx + 1}`}
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
                />
                {data.scope.inScope.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.scope.inScope.filter((_, i) => i !== idx);
                      update({ scope: { ...data.scope, inScope: next } });
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
            <label className="text-xs font-semibold text-slate-800">Out of Scope Items</label>
            <button
              type="button"
              onClick={() => update({ scope: { ...data.scope, outOfScope: [...data.scope.outOfScope, ''] } })}
              className="text-[11px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
          <div className="space-y-1.5">
            {data.scope.outOfScope.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...data.scope.outOfScope];
                    next[idx] = e.target.value;
                    update({ scope: { ...data.scope, outOfScope: next } });
                  }}
                  placeholder={`Out-of-scope non-goal #${idx + 1}`}
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
                />
                {data.scope.outOfScope.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.scope.outOfScope.filter((_, i) => i !== idx);
                      update({ scope: { ...data.scope, outOfScope: next } });
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

      {/* Functional Requirements Builder */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-800">Functional Requirements</label>
          <button
            type="button"
            onClick={() => {
              const nextId = `FR-${data.functionalRequirements.length + 1}`;
              update({
                functionalRequirements: [
                  ...data.functionalRequirements,
                  { id: nextId, title: '', description: '', priority: 'HIGH' },
                ],
              });
            }}
            className="text-[11px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
          >
            <Plus className="w-3 h-3" /> Add Functional Requirement
          </button>
        </div>
        <div className="space-y-3">
          {data.functionalRequirements.map((fr, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fr.id}
                  onChange={(e) => {
                    const next = [...data.functionalRequirements];
                    next[idx] = { ...fr, id: e.target.value };
                    update({ functionalRequirements: next });
                  }}
                  placeholder="FR-ID"
                  className="w-20 font-mono text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                />
                <input
                  type="text"
                  value={fr.title}
                  onChange={(e) => {
                    const next = [...data.functionalRequirements];
                    next[idx] = { ...fr, title: e.target.value };
                    update({ functionalRequirements: next });
                  }}
                  placeholder="Requirement Title"
                  className="flex-1 text-xs font-medium border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                />
                <select
                  value={fr.priority}
                  onChange={(e) => {
                    const next = [...data.functionalRequirements];
                    next[idx] = { ...fr, priority: e.target.value as FunctionalRequirementItem['priority'] };
                    update({ functionalRequirements: next });
                  }}
                  className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-800"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
                {data.functionalRequirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.functionalRequirements.filter((_, i) => i !== idx);
                      update({ functionalRequirements: next });
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={fr.description}
                onChange={(e) => {
                  const next = [...data.functionalRequirements];
                  next[idx] = { ...fr, description: e.target.value };
                  update({ functionalRequirements: next });
                }}
                placeholder="Detailed functional specification, business logic, constraints..."
                className="w-full text-xs border border-slate-300 rounded p-2 bg-white text-slate-900"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Non-Functional Requirements */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-800">Non-Functional Requirements</label>
          <button
            type="button"
            onClick={() => {
              update({
                nonFunctionalRequirements: [
                  ...data.nonFunctionalRequirements,
                  { category: 'Security', requirement: '' },
                ],
              });
            }}
            className="text-[11px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
          >
            <Plus className="w-3 h-3" /> Add NFR
          </button>
        </div>
        <div className="space-y-2">
          {data.nonFunctionalRequirements.map((nfr, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={nfr.category}
                onChange={(e) => {
                  const next = [...data.nonFunctionalRequirements];
                  next[idx] = { ...nfr, category: e.target.value };
                  update({ nonFunctionalRequirements: next });
                }}
                placeholder="Category (e.g., Performance, Security)"
                className="w-36 text-xs font-medium border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
              />
              <input
                type="text"
                value={nfr.requirement}
                onChange={(e) => {
                  const next = [...data.nonFunctionalRequirements];
                  next[idx] = { ...nfr, requirement: e.target.value };
                  update({ nonFunctionalRequirements: next });
                }}
                placeholder="Requirement (e.g., p95 response time < 200ms)"
                className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
              />
              {data.nonFunctionalRequirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = data.nonFunctionalRequirements.filter((_, i) => i !== idx);
                    update({ nonFunctionalRequirements: next });
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

      {/* Acceptance Criteria */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-800">Acceptance Criteria</label>
          <button
            type="button"
            onClick={() => update({ acceptanceCriteria: [...data.acceptanceCriteria, ''] })}
            className="text-[11px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Criterion
          </button>
        </div>
        <div className="space-y-1.5">
          {data.acceptanceCriteria.map((ac, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <input
                type="text"
                value={ac}
                onChange={(e) => {
                  const next = [...data.acceptanceCriteria];
                  next[idx] = e.target.value;
                  update({ acceptanceCriteria: next });
                }}
                placeholder={`Acceptance condition #${idx + 1}`}
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
              />
              {data.acceptanceCriteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = data.acceptanceCriteria.filter((_, i) => i !== idx);
                    update({ acceptanceCriteria: next });
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

      {/* Link Existing User Stories */}
      {availableStories.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Link Project User Stories (Phase 2/3 Integration)
          </label>
          <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 rounded bg-white p-2">
            {availableStories.map((story) => {
              const isChecked = data.linkedStoryIds?.includes(story.id);
              return (
                <label key={story.id} className="flex items-center gap-2 text-xs text-slate-800 hover:bg-slate-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const current = data.linkedStoryIds || [];
                      const next = e.target.checked
                        ? [...current, story.id]
                        : current.filter((id) => id !== story.id);
                      update({ linkedStoryIds: next });
                    }}
                    className="rounded text-slate-900"
                  />
                  <span className="font-mono text-slate-500 font-semibold">{story.storyKey}</span>
                  <span className="truncate">{story.title}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
