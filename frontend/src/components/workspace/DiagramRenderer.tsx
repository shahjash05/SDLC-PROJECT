import { useState, useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';
import plantumlEncoder from 'plantuml-encoder';
import {
  Layers,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Server,
  Sparkles,
} from 'lucide-react';
import type { DiagramSyntax } from '../../types/entities';

interface DiagramRendererProps {
  syntax?: DiagramSyntax;
  content: string;
  title?: string;
}

// Initialize Mermaid once with a clean light theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
});

const DEFAULT_PLANTUML_SERVER =
  import.meta.env.VITE_PLANTUML_SERVER_URL || 'http://localhost:8085';
const FALLBACK_PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';

export function DiagramRenderer({ syntax = 'MERMAID', content, title }: DiagramRendererProps) {
  const [activeTab, setActiveTab] = useState<'diagram' | 'source'>('diagram');
  const [copied, setCopied] = useState(false);

  // Mermaid render state
  const [mermaidSvg, setMermaidSvg] = useState<string | null>(null);
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const [renderingMermaid, setRenderingMermaid] = useState(false);

  // PlantUML render state
  const [plantumlUrl, setPlantumlUrl] = useState<string>('');
  const [plantumlFallback, setPlantumlFallback] = useState(false);
  const [plantumlError, setPlantumlError] = useState<string | null>(null);
  const [plantumlLoading, setPlantumlLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, '_');

  // Handle Copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Render Mermaid
  useEffect(() => {
    if (syntax !== 'MERMAID') {
      setMermaidSvg(null);
      setMermaidError(null);
      return;
    }

    if (!content || !content.trim()) {
      setMermaidSvg(null);
      setMermaidError('Diagram content is empty');
      return;
    }

    let isMounted = true;
    setRenderingMermaid(true);
    setMermaidError(null);

    const renderId = `mermaid_svg_${uniqueId}_${Date.now()}`;
    mermaid
      .render(renderId, content)
      .then(({ svg }) => {
        if (isMounted) {
          setMermaidSvg(svg);
          setMermaidError(null);
          setRenderingMermaid(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setMermaidSvg(null);
          const errorMsg =
            err instanceof Error ? err.message : 'Invalid Mermaid syntax or parse error';
          setMermaidError(errorMsg);
          setRenderingMermaid(false);
        }
      });

    return () => {
      isMounted = false;
      // Clean up any error element injected by mermaid
      const el = document.getElementById(renderId);
      if (el) el.remove();
    };
  }, [content, syntax, uniqueId]);

  // Render PlantUML
  useEffect(() => {
    if (syntax !== 'PLANTUML') {
      setPlantumlUrl('');
      setPlantumlError(null);
      return;
    }

    if (!content || !content.trim()) {
      setPlantumlUrl('');
      setPlantumlError('Diagram content is empty');
      return;
    }

    setPlantumlLoading(true);
    setPlantumlError(null);
    setPlantumlFallback(false);

    try {
      const encoded = plantumlEncoder.encode(content);
      const server = DEFAULT_PLANTUML_SERVER.replace(/\/+$/, '');
      const url = `${server}/svg/${encoded}`;
      setPlantumlUrl(url);
    } catch (err) {
      setPlantumlError(err instanceof Error ? err.message : 'Failed to encode PlantUML syntax');
      setPlantumlLoading(false);
    }
  }, [content, syntax]);

  const handlePlantumlImageError = () => {
    // If the primary self-hosted server failed to load, try fallback
    if (!plantumlFallback) {
      try {
        const encoded = plantumlEncoder.encode(content);
        const fallbackServer = FALLBACK_PLANTUML_SERVER.replace(/\/+$/, '');
        const fallbackUrl = `${fallbackServer}/svg/${encoded}`;
        setPlantumlFallback(true);
        setPlantumlUrl(fallbackUrl);
        return;
      } catch {
        // fallback encoding error
      }
    }
    setPlantumlLoading(false);
    setPlantumlError('Failed to render PlantUML diagram from self-hosted or fallback server.');
  };

  const handlePlantumlImageLoad = () => {
    setPlantumlLoading(false);
    setPlantumlError(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-semibold text-slate-800">
            {syntax === 'PLANTUML' ? 'PlantUML Diagram' : 'Mermaid Diagram'}
          </span>
          {syntax === 'PLANTUML' && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                plantumlFallback
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
              title={
                plantumlFallback
                  ? 'Loaded via PlantUML Public Cloud Fallback'
                  : `Loaded via Self-Hosted PlantUML Server (${DEFAULT_PLANTUML_SERVER})`
              }
            >
              <Server className="w-2.5 h-2.5" />
              {plantumlFallback ? 'PlantUML Cloud' : 'Self-Hosted (8085)'}
            </span>
          )}
          {syntax === 'MERMAID' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-2.5 h-2.5" />
              Client-Side SVG Engine
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="bg-white border border-slate-200 rounded p-0.5 flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('diagram')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'diagram'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visual Diagram
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('source')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'source'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Source Code
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
            title="Copy diagram source"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {syntax === 'PLANTUML' && plantumlUrl && (
            <a
              href={plantumlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
              title="Open SVG in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4">
        {activeTab === 'diagram' ? (
          <div>
            {/* MERMAID VISUAL DIAGRAM */}
            {syntax === 'MERMAID' && (
              <div>
                {renderingMermaid && (
                  <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    Rendering Mermaid diagram...
                  </div>
                )}

                {mermaidError && (
                  <div className="bg-rose-50 border border-rose-200 rounded p-4 text-xs text-rose-700 space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      Mermaid Diagram Syntax Error
                    </div>
                    <p className="font-mono text-[11px] whitespace-pre-wrap">{mermaidError}</p>
                    <p className="text-[11px] text-rose-600">
                      Switch to the &apos;Source Code&apos; tab to review and correct the syntax.
                    </p>
                  </div>
                )}

                {!renderingMermaid && !mermaidError && mermaidSvg && (
                  <div
                    ref={containerRef}
                    className="p-4 bg-slate-50/50 border border-slate-100 rounded flex items-center justify-center overflow-x-auto min-h-[220px]"
                    dangerouslySetInnerHTML={{ __html: mermaidSvg }}
                  />
                )}
              </div>
            )}

            {/* PLANTUML VISUAL DIAGRAM */}
            {syntax === 'PLANTUML' && (
              <div>
                {plantumlLoading && (
                  <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    Generating PlantUML diagram SVG...
                  </div>
                )}

                {plantumlError && (
                  <div className="bg-rose-50 border border-rose-200 rounded p-4 text-xs text-rose-700 space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      PlantUML Rendering Error
                    </div>
                    <p className="text-[11px]">{plantumlError}</p>
                    <p className="text-[11px] text-rose-600">
                      Ensure the PlantUML server is running at {DEFAULT_PLANTUML_SERVER} or internet access is available for fallback.
                    </p>
                  </div>
                )}

                {plantumlUrl && (
                  <div className="p-4 bg-slate-50/50 border border-slate-100 rounded flex items-center justify-center overflow-x-auto min-h-[220px]">
                    <img
                      src={plantumlUrl}
                      alt={title || 'PlantUML Architecture Diagram'}
                      data-testid="plantuml-svg-img"
                      onLoad={handlePlantumlImageLoad}
                      onError={handlePlantumlImageError}
                      className={`max-w-full h-auto object-contain mx-auto transition-opacity duration-200 ${
                        plantumlLoading ? 'opacity-50' : 'opacity-100'
                      }`}
                    />
                  </div>
                )}
              </div>
            )}

            {syntax === 'NONE' && (
              <div className="bg-slate-50 border border-slate-200 rounded p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap">
                {content}
              </div>
            )}
          </div>
        ) : (
          /* SOURCE CODE TAB */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-mono">Language / Syntax: {syntax}</span>
              <span>{content.split('\n').length} lines</span>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-md font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              <code>{content}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
