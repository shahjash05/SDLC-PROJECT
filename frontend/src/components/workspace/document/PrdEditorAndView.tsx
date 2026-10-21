import { useState, useEffect } from 'react';
import {
  ListChecks,
  Plus,
  Trash2,
  Bookmark,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import type {
  ProductRequirementContent,
  FunctionalRequirementItem,
  StorySummary,
  StoryPriority,
  StoryStatus,
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

export function validatePrdContent(content: ProductRequirementContent): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (!content.problemStatement || !content.problemStatement.trim()) {
    return {
      isValid: false,
      errorMessage: 'Problem statement is required for Product Requirements documents.',
    };
  }

  for (let i = 0; i < content.functionalRequirements.length; i++) {
    const fr = content.functionalRequirements[i];
    if (!fr.title || !fr.title.trim()) {
      return {
        isValid: false,
        errorMessage: `Functional requirement #${i + 1} (${fr.id || 'FR'}) must have a title.`,
      };
    }
  }

  return { isValid: true };
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
      functionalRequirements: Array.isArray(parsed.functionalRequirements)
        ? parsed.functionalRequirements
        : defaultPrdContent().functionalRequirements,
      nonFunctionalRequirements: Array.isArray(parsed.nonFunctionalRequirements)
        ? parsed.nonFunctionalRequirements
        : defaultPrdContent().nonFunctionalRequirements,
      acceptanceCriteria: parsed.acceptanceCriteria?.length ? parsed.acceptanceCriteria : [''],
      linkedStoryIds: parsed.linkedStoryIds || [],
    };
  } catch {
    // Legacy markdown or plain-text document:
    // Do NOT generate a blank FR-1 requirement or default items
    return {
      problemStatement: rawContent,
      scope: {
        inScope: [],
        outOfScope: [],
      },
      functionalRequirements: [],
      nonFunctionalRequirements: [],
      acceptanceCriteria: [],
      linkedStoryIds: [],
    };
  }
}

export function getStoryPriorityBadge(priority?: StoryPriority) {
  switch (priority) {
    case 'URGENT':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'HIGH':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'MEDIUM':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'LOW':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function getStoryStatusBadge(status?: StoryStatus) {
  switch (status) {
    case 'DONE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'IN_REVIEW':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'TODO':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'BACKLOG':
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

export function PrdEditorAndView({
  content,
  onChange,
  isEditing = false,
  availableStories = [],
}: PrdProps) {
  const [data, setData] = useState<ProductRequirementContent>(content);

  useEffect(() => {
    setData(content);
  }, [content]);

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
          {data.functionalRequirements.length > 0 ? (
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
          ) : (
            <div className="p-4 text-xs text-slate-500 italic">No functional requirements specified.</div>
          )}
        </div>

        {/* Non-Functional Requirements */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Non-Functional Requirements (NFRs)
            </h4>
          </div>
          {data.nonFunctionalRequirements.length > 0 ? (
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
          ) : (
            <div className="p-3 text-xs text-slate-500 italic">No non-functional requirements specified.</div>
          )}
        </div>

        {/* Acceptance Criteria */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-slate-800" /> Acceptance Criteria
          </h4>
          {data.acceptanceCriteria.filter(Boolean).length > 0 ? (
            <div className="space-y-1.5">
              {data.acceptanceCriteria.filter(Boolean).map((ac, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span>{ac}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No acceptance criteria specified.</p>
          )}
        </div>

        {/* Linked User Stories with Priority and Status */}
        {data.linkedStoryIds && data.linkedStoryIds.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-800" /> Linked User Stories ({data.linkedStoryIds.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.linkedStoryIds.map((storyId) => {
                const story = availableStories.find((s) => s.id === storyId);
                if (!story) {
                  return (
                    <div
                      key={storyId}
                      className="flex items-center gap-2 p-2.5 rounded bg-white border border-slate-200 text-xs font-medium text-slate-700"
                    >
                      <span className="font-mono text-slate-400">{storyId.slice(0, 8)}...</span>
                      <span className="text-slate-500 italic">Story unavailable</span>
                    </div>
                  );
                }
                return (
                  <div
                    key={storyId}
                    className="flex items-center justify-between gap-3 p-2.5 rounded bg-white border border-slate-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                        {story.storyKey}
                      </span>
                      <span className="font-medium text-slate-800 truncate" title={story.title}>
                        {story.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getStoryPriorityBadge(story.priority)}`}
                      >
                        {story.priority}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getStoryStatusBadge(story.status)}`}
                      >
                        {story.status}
                      </span>
                      {story.storyPoints != null && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                          {story.storyPoints} pts
                        </span>
                      )}
                    </div>
                  </div>
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
      {/* Problem Statement with inline validation */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-800">
            Problem Statement & Context *
          </label>
          {!data.problemStatement.trim() && (
            <span className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Problem statement is required
            </span>
          )}
        </div>
        <textarea
          rows={3}
          value={data.problemStatement}
          onChange={(e) => update({ problemStatement: e.target.value })}
          placeholder="Describe the user or business problem this requirement document addresses..."
          className={`w-full text-xs border rounded p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-1 ${
            !data.problemStatement.trim()
              ? 'border-rose-400 focus:ring-rose-400'
              : 'border-slate-300 focus:ring-slate-400'
          }`}
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

      {/* Functional Requirements Builder with inline validation */}
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
          {data.functionalRequirements.map((fr, idx) => {
            const hasTitleError = !fr.title.trim();
            return (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                <div className="flex items-start gap-2">
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
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={fr.title}
                      onChange={(e) => {
                        const next = [...data.functionalRequirements];
                        next[idx] = { ...fr, title: e.target.value };
                        update({ functionalRequirements: next });
                      }}
                      placeholder="Requirement Title *"
                      className={`w-full text-xs font-medium border rounded px-2 py-1 bg-white text-slate-900 focus:outline-none focus:ring-1 ${
                        hasTitleError
                          ? 'border-rose-400 focus:ring-rose-400'
                          : 'border-slate-300 focus:ring-slate-400'
                      }`}
                    />
                    {hasTitleError && (
                      <p className="text-[10px] font-medium text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> Requirement title is required
                      </p>
                    )}
                  </div>
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
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.functionalRequirements.filter((_, i) => i !== idx);
                      update({ functionalRequirements: next });
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Delete requirement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
            );
          })}
          {data.functionalRequirements.length === 0 && (
            <div className="text-xs text-slate-500 italic p-3 border border-dashed border-slate-200 rounded text-center">
              No functional requirements added yet. Click &quot;+ Add Functional Requirement&quot; above to add one.
            </div>
          )}
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

      {/* Link Existing User Stories with Priority and Status Badges */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-800">
            Link Project User Stories (Phase 2/3 Integration)
          </label>
          <span className="text-[11px] text-slate-500">
            {data.linkedStoryIds?.length || 0} linked
          </span>
        </div>

        {/* Display any broken/deleted linked story IDs with Unlink option */}
        {data.linkedStoryIds &&
          data.linkedStoryIds
            .filter((id) => !availableStories.some((s) => s.id === id))
            .map((missingId) => (
              <div
                key={missingId}
                className="p-2 border border-dashed border-amber-300 bg-amber-50 rounded flex items-center justify-between text-xs text-amber-900"
              >
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Linked Story Missing ({missingId.slice(0, 8)}...)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = (data.linkedStoryIds || []).filter((id) => id !== missingId);
                    update({ linkedStoryIds: next });
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-800 underline font-medium"
                >
                  Unlink
                </button>
              </div>
            ))}

        {availableStories.length > 0 ? (
          <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded bg-white p-2">
            {availableStories.map((story) => {
              const isChecked = data.linkedStoryIds?.includes(story.id);
              return (
                <label
                  key={story.id}
                  className={`flex items-center justify-between gap-2 text-xs p-1.5 rounded cursor-pointer transition-colors ${
                    isChecked ? 'bg-slate-50 border border-slate-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
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
                    <span className="font-mono text-slate-700 font-bold text-[11px] shrink-0">
                      {story.storyKey}
                    </span>
                    <span className="truncate text-slate-800">{story.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getStoryPriorityBadge(story.priority)}`}
                    >
                      {story.priority}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getStoryStatusBadge(story.status)}`}
                    >
                      {story.status}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No user stories available in this project.</p>
        )}
      </div>
    </div>
  );
}
