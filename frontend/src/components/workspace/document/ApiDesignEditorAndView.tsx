import { useState } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import type {
  ApiDesignContent,
  ApiEndpointItem,
} from '../../../types/entities';

interface ApiDesignProps {
  content: ApiDesignContent;
  onChange?: (updated: ApiDesignContent) => void;
  isEditing?: boolean;
}

export function defaultApiDesignContent(): ApiDesignContent {
  return {
    basePath: '/api/v1',
    version: '1.0.0',
    lifecycle: 'PROPOSED',
    endpoints: [
      {
        id: 'ep-1',
        method: 'GET',
        path: '/example',
        summary: 'Example Resource Retrieval',
        description: 'Proposed endpoint specification for retrieving resources.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Resource UUID identifier',
          },
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Resource retrieved successfully',
            exampleJson: '{\n  "success": true,\n  "data": {\n    "id": "123",\n    "name": "Sample"\n  }\n}',
          },
        ],
        errorCodes: [
          {
            code: '404',
            reason: 'Resource not found',
            exampleJson: '{\n  "success": false,\n  "message": "Resource not found"\n}',
          },
        ],
      },
    ],
  };
}

export function parseApiDesignContent(rawContent?: string): ApiDesignContent {
  if (!rawContent || !rawContent.trim()) {
    return defaultApiDesignContent();
  }
  try {
    const parsed = JSON.parse(rawContent) as Partial<ApiDesignContent>;
    return {
      basePath: parsed.basePath || '/api/v1',
      version: parsed.version || '1.0.0',
      lifecycle: parsed.lifecycle || 'PROPOSED',
      endpoints: parsed.endpoints?.length ? parsed.endpoints : defaultApiDesignContent().endpoints,
    };
  } catch {
    return {
      ...defaultApiDesignContent(),
      endpoints: [
        {
          id: 'ep-legacy',
          method: 'GET',
          path: '/raw-spec',
          summary: 'Imported Raw Specification',
          description: rawContent,
          parameters: [],
          responses: [
            {
              statusCode: 200,
              description: 'Success',
              exampleJson: '{}',
            },
          ],
          errorCodes: [],
        },
      ],
    };
  }
}

export function ApiDesignEditorAndView({ content, onChange, isEditing = false }: ApiDesignProps) {
  const [data, setData] = useState<ApiDesignContent>(content);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    'ep-1': true,
  });

  const update = (patch: Partial<ApiDesignContent>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.(next);
  };

  const toggleEndpoint = (id: string) => {
    setExpandedEndpoints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getMethodBadge = (method: ApiEndpointItem['method']) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'POST':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PUT':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Distinction Banner: Proposed API vs Live Implemented Backend */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-md p-3.5 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] bg-amber-200/70 text-amber-800 px-1.5 py-0.5 rounded">
              {data.lifecycle} SPECIFICATION
            </span>
            <span className="font-medium">
              Base Path: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">{data.basePath}</code>
            </span>
            <span className="text-amber-700">v{data.version}</span>
          </div>
          <p className="text-[11px] text-amber-800">
            <strong>Architecture Notice:</strong> The specifications below describe designed or proposed contract endpoints. They are tracked for architecture review and are distinct from existing, live backend endpoints.
          </p>
        </div>
      </div>

      {!isEditing ? (
        /* VIEW MODE */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Defined Endpoints: {data.endpoints.length}</span>
            <span>API Version: {data.version}</span>
          </div>

          <div className="space-y-3">
            {data.endpoints.map((ep, idx) => {
              const isExpanded = expandedEndpoints[ep.id] ?? (idx === 0);
              return (
                <div key={ep.id} className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
                  {/* Endpoint Header Bar */}
                  <div
                    onClick={() => toggleEndpoint(ep.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getMethodBadge(ep.method)}`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {data.basePath}{ep.path.startsWith('/') ? ep.path : `/${ep.path}`}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-600 font-medium">{ep.summary}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/30 text-xs">
                      {ep.description && (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-0.5">Description</span>
                          <p className="text-slate-600">{ep.description}</p>
                        </div>
                      )}

                      {/* Parameters */}
                      {ep.parameters && ep.parameters.length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-1.5">Request Parameters</span>
                          <div className="border border-slate-200 rounded bg-white overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                                <tr>
                                  <th className="p-2">Name</th>
                                  <th className="p-2">Location</th>
                                  <th className="p-2">Type</th>
                                  <th className="p-2">Required</th>
                                  <th className="p-2">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {ep.parameters.map((param, pIdx) => (
                                  <tr key={pIdx}>
                                    <td className="p-2 font-mono font-medium text-slate-900">{param.name}</td>
                                    <td className="p-2 text-slate-600">{param.in}</td>
                                    <td className="p-2 font-mono text-slate-600">{param.type}</td>
                                    <td className="p-2">
                                      {param.required ? (
                                        <span className="text-rose-600 font-bold">Yes</span>
                                      ) : (
                                        <span className="text-slate-400">No</span>
                                      )}
                                    </td>
                                    <td className="p-2 text-slate-600">{param.description || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Request Body */}
                      {ep.requestBody && ep.requestBody.schemaDescription && (
                        <div className="space-y-1.5">
                          <span className="font-semibold text-slate-700 block">
                            Request Body ({ep.requestBody.contentType || 'application/json'})
                          </span>
                          <p className="text-slate-600 text-[11px]">{ep.requestBody.schemaDescription}</p>
                          {ep.requestBody.exampleJson && (
                            <pre className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-[11px] overflow-x-auto">
                              <code>{ep.requestBody.exampleJson}</code>
                            </pre>
                          )}
                        </div>
                      )}

                      {/* Responses */}
                      {ep.responses && ep.responses.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-semibold text-slate-700 block">Responses</span>
                          {ep.responses.map((resp, rIdx) => (
                            <div key={rIdx} className="bg-white border border-slate-200 rounded p-3 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                  resp.statusCode < 300
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  HTTP {resp.statusCode}
                                </span>
                                <span className="font-medium text-slate-800">{resp.description}</span>
                              </div>
                              {resp.exampleJson && (
                                <pre className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
                                  <code>{resp.exampleJson}</code>
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Error Codes */}
                      {ep.errorCodes && ep.errorCodes.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-semibold text-slate-700 block flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Error Codes
                          </span>
                          <div className="divide-y divide-slate-100 border border-slate-200 rounded bg-white">
                            {ep.errorCodes.map((err, eIdx) => (
                              <div key={eIdx} className="p-2.5 flex items-start justify-between gap-3">
                                <div>
                                  <span className="font-mono font-bold text-rose-700 mr-2">{err.code}</span>
                                  <span className="text-slate-700">{err.reason}</span>
                                </div>
                                {err.exampleJson && (
                                  <pre className="font-mono text-[10px] bg-slate-100 p-1 rounded max-w-xs overflow-x-auto">
                                    {err.exampleJson}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* EDIT MODE */
        <div className="space-y-5">
          {/* Top metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Base Path</label>
              <input
                type="text"
                value={data.basePath}
                onChange={(e) => update({ basePath: e.target.value })}
                placeholder="/api/v1"
                className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">API Version</label>
              <input
                type="text"
                value={data.version}
                onChange={(e) => update({ version: e.target.value })}
                placeholder="1.0.0"
                className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Lifecycle Status</label>
              <select
                value={data.lifecycle}
                onChange={(e) => update({ lifecycle: e.target.value as ApiDesignContent['lifecycle'] })}
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900"
              >
                <option value="PROPOSED">PROPOSED (Design Only)</option>
                <option value="DRAFT">DRAFT</option>
                <option value="IMPLEMENTED">IMPLEMENTED</option>
                <option value="DEPRECATED">DEPRECATED</option>
              </select>
            </div>
          </div>

          {/* Endpoints Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-800" /> Endpoints Specification
              </label>
              <button
                type="button"
                onClick={() => {
                  const newId = `ep-${Date.now()}`;
                  update({
                    endpoints: [
                      ...data.endpoints,
                      {
                        id: newId,
                        method: 'POST',
                        path: '/new-endpoint',
                        summary: 'New Action',
                        description: '',
                        parameters: [],
                        responses: [
                          {
                            statusCode: 201,
                            description: 'Created successfully',
                            exampleJson: '{\n  "success": true\n}',
                          },
                        ],
                        errorCodes: [],
                      },
                    ],
                  });
                  setExpandedEndpoints((prev) => ({ ...prev, [newId]: true }));
                }}
                className="text-[11px] text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Add Endpoint
              </button>
            </div>

            <div className="space-y-4">
              {data.endpoints.map((ep, idx) => (
                <div key={ep.id} className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={ep.method}
                      onChange={(e) => {
                        const next = [...data.endpoints];
                        next[idx] = { ...ep, method: e.target.value as ApiEndpointItem['method'] };
                        update({ endpoints: next });
                      }}
                      className="text-xs font-mono font-bold border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>

                    <input
                      type="text"
                      value={ep.path}
                      onChange={(e) => {
                        const next = [...data.endpoints];
                        next[idx] = { ...ep, path: e.target.value };
                        update({ endpoints: next });
                      }}
                      placeholder="/resource/{id}"
                      className="flex-1 font-mono text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                    />

                    {data.endpoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = data.endpoints.filter((_, i) => i !== idx);
                          update({ endpoints: next });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={ep.summary}
                    onChange={(e) => {
                      const next = [...data.endpoints];
                      next[idx] = { ...ep, summary: e.target.value };
                      update({ endpoints: next });
                    }}
                    placeholder="Brief Endpoint Summary (e.g., Create new project document)"
                    className="w-full text-xs font-medium border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                  />

                  <textarea
                    rows={2}
                    value={ep.description}
                    onChange={(e) => {
                      const next = [...data.endpoints];
                      next[idx] = { ...ep, description: e.target.value };
                      update({ endpoints: next });
                    }}
                    placeholder="Full endpoint behavior, permissions required, validation rules..."
                    className="w-full text-xs border border-slate-300 rounded p-2 bg-white text-slate-900"
                  />

                  {/* Responses & JSON Examples */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700">Response Examples</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...data.endpoints];
                          const responses = ep.responses || [];
                          next[idx] = {
                            ...ep,
                            responses: [
                              ...responses,
                              { statusCode: 200, description: 'Success', exampleJson: '{\n  "status": "ok"\n}' },
                            ],
                          };
                          update({ endpoints: next });
                        }}
                        className="text-[10px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" /> Add Response
                      </button>
                    </div>

                    {ep.responses.map((resp, rIdx) => (
                      <div key={rIdx} className="bg-white border border-slate-200 rounded p-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={resp.statusCode}
                            onChange={(e) => {
                              const next = [...data.endpoints];
                              const nextResponses = [...ep.responses];
                              nextResponses[rIdx] = { ...resp, statusCode: parseInt(e.target.value) || 200 };
                              next[idx] = { ...ep, responses: nextResponses };
                              update({ endpoints: next });
                            }}
                            className="w-20 font-mono text-xs border border-slate-300 rounded px-1.5 py-0.5"
                          />
                          <input
                            type="text"
                            value={resp.description}
                            onChange={(e) => {
                              const next = [...data.endpoints];
                              const nextResponses = [...ep.responses];
                              nextResponses[rIdx] = { ...resp, description: e.target.value };
                              next[idx] = { ...ep, responses: nextResponses };
                              update({ endpoints: next });
                            }}
                            placeholder="Description (e.g., OK)"
                            className="flex-1 text-xs border border-slate-300 rounded px-1.5 py-0.5"
                          />
                          {ep.responses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...data.endpoints];
                                next[idx] = {
                                  ...ep,
                                  responses: ep.responses.filter((_, i) => i !== rIdx),
                                };
                                update({ endpoints: next });
                              }}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={resp.exampleJson || ''}
                          onChange={(e) => {
                            const next = [...data.endpoints];
                            const nextResponses = [...ep.responses];
                            nextResponses[rIdx] = { ...resp, exampleJson: e.target.value };
                            next[idx] = { ...ep, responses: nextResponses };
                            update({ endpoints: next });
                          }}
                          placeholder="JSON Response Body Example..."
                          className="w-full font-mono text-[11px] border border-slate-300 rounded p-1.5 bg-slate-900 text-slate-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
