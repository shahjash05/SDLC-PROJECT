import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FolderGit2,
  Bug,
  CheckSquare,
  FileCheck2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getAllProjects } from '../../api/projects';
import { getProjectReleaseReadiness } from '../../api/testing';
import type {
  ProjectSummary,
  ReleaseReadinessSummary,
  ReadinessCriterion,
} from '../../types/entities';

interface ReleaseReadinessViewProps {
  selectedProjectId?: string;
  propProjects?: ProjectSummary[];
}

export const ReleaseReadinessView: React.FC<ReleaseReadinessViewProps> = ({
  selectedProjectId: initialProjectId,
  propProjects,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>(propProjects || []);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || (propProjects && propProjects.length > 0 ? propProjects[0].id : '')
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ReleaseReadinessSummary | null>(null);

  // Sync projects from props if they update
  useEffect(() => {
    if (propProjects && propProjects.length > 0) {
      setProjects(propProjects);
      if (!selectedProjectId) {
        setSelectedProjectId(propProjects[0].id);
      }
    } else {
      getAllProjects()
        .then((data) => {
          setProjects(data);
          if (data.length > 0 && !selectedProjectId) {
            setSelectedProjectId(data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [propProjects, selectedProjectId]);

  // Fetch release readiness data
  const loadReadinessData = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProjectReleaseReadiness(selectedProjectId);
      setReadiness(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load release readiness evaluation');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadReadinessData();
  }, [loadReadinessData]);

  const passedCriteriaCount = readiness?.criteria.filter((c) => c.status === 'PASSED').length ?? 0;
  const totalCriteriaCount = readiness?.criteria.length ?? 0;

  return (
    <div className="space-y-6" data-testid="release-readiness-view">
      {/* Header and Project Controls */}
      <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-semibold text-slate-900">
              Release Readiness &amp; Quality Gates
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time quality gate assessment, test execution health, unresolved defect blockers, and requirement coverage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="text-xs bg-transparent border-none text-slate-800 font-medium focus:outline-none cursor-pointer"
                aria-label="Select Project for Release Readiness"
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
            onClick={loadReadinessData}
            disabled={loading || !selectedProjectId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors disabled:opacity-50"
            title="Refresh Release Readiness Assessment"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-md p-4 text-xs text-rose-700 flex items-start gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <span className="font-semibold">Evaluation Error: </span>
            {error}
          </div>
          <button
            onClick={loadReadinessData}
            className="text-xs underline font-medium hover:text-rose-900 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !readiness && (
        <div className="bg-white border border-slate-200 rounded-md p-12 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
          Evaluating project release readiness criteria and test metrics...
        </div>
      )}

      {readiness && (
        <>
          {/* Executive Release Readiness Banner */}
          <div
            className={`border rounded-lg p-5 transition-all ${
              readiness.status === 'READY'
                ? 'bg-emerald-50/70 border-emerald-300'
                : readiness.status === 'BLOCKED'
                ? 'bg-rose-50/70 border-rose-300'
                : 'bg-amber-50/70 border-amber-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-md shrink-0 ${
                    readiness.status === 'READY'
                      ? 'bg-emerald-600 text-white'
                      : readiness.status === 'BLOCKED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {readiness.status === 'READY' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : readiness.status === 'BLOCKED' ? (
                    <AlertOctagon className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      data-testid="readiness-status-badge"
                      className={`text-xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded border ${
                        readiness.status === 'READY'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : readiness.status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {readiness.status === 'READY'
                        ? 'RELEASE READY'
                        : readiness.status === 'BLOCKED'
                        ? 'RELEASE BLOCKED'
                        : 'NEEDS ATTENTION'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Evaluated {new Date(readiness.evaluatedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 mt-1.5">
                    {readiness.projectName} ({readiness.projectKey}) Quality Gate Assessment
                  </h3>
                  <p className="text-xs text-slate-700 mt-1 max-w-3xl leading-relaxed">
                    {readiness.summary}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-200/60 pt-3 sm:pt-0 shrink-0">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  Quality Gates
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {passedCriteriaCount} / {totalCriteriaCount} Passed
                </span>
              </div>
            </div>
          </div>

          {/* Blockers Alert Banner */}
          {readiness.blockers.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Critical Release Blockers ({readiness.blockers.length})
                </h4>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-xs text-rose-800">
                {readiness.blockers.map((blocker, idx) => (
                  <li key={idx} className="font-medium">
                    {blocker}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-rose-600 mt-2.5 font-normal">
                These critical blockers must be resolved before this release can be approved or deployed.
              </p>
            </div>
          )}

          {/* Warnings Alert Banner */}
          {readiness.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Recommendations &amp; Warnings ({readiness.warnings.length})
                </h4>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-xs text-amber-800">
                {readiness.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Test Execution */}
            <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Test Execution
                  </span>
                  <CheckSquare className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {readiness.testStats.passRate}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Pass Rate</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Authoring:</span>
                  <span className="font-semibold text-slate-800">{readiness.testStats.totalTests} tests</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Passing / Failing:</span>
                  <span className="font-medium">
                    <span className="text-emerald-700 font-semibold">{readiness.testStats.passedTests} passed</span>
                    {' · '}
                    <span className="text-rose-700 font-semibold">{readiness.testStats.failedTests} failed</span>
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Blocked / Unexecuted:</span>
                  <span className="font-medium">
                    <span className="text-amber-700">{readiness.testStats.blockedTests}</span>
                    {' / '}
                    <span className="text-slate-500">{readiness.testStats.neverExecutedTests}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Defect Health */}
            <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Defect Health
                  </span>
                  <Bug className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-2xl font-bold ${
                      readiness.defectStats.unresolvedCritical > 0
                        ? 'text-rose-600'
                        : readiness.defectStats.unresolvedHigh > 0
                        ? 'text-amber-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {readiness.defectStats.unresolvedTotal}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Unresolved Bugs</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Critical Defect Blockers:</span>
                  <span
                    className={`font-bold ${
                      readiness.defectStats.unresolvedCritical > 0 ? 'text-rose-700' : 'text-slate-700'
                    }`}
                  >
                    {readiness.defectStats.unresolvedCritical}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>High-Severity Defects:</span>
                  <span
                    className={`font-semibold ${
                      readiness.defectStats.unresolvedHigh > 0 ? 'text-amber-700' : 'text-slate-700'
                    }`}
                  >
                    {readiness.defectStats.unresolvedHigh}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Medium / Low / Resolved:</span>
                  <span className="text-slate-700">
                    {readiness.defectStats.unresolvedMedium + readiness.defectStats.unresolvedLow} open · {readiness.defectStats.resolvedTotal} closed
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Requirement Coverage */}
            <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Requirement Coverage
                  </span>
                  <FileCheck2 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {readiness.requirementStats.coveragePercentage}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Verified</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Formal Requirements:</span>
                  <span className="font-semibold text-slate-800">
                    {readiness.requirementStats.totalRequirements}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Covered by Tests:</span>
                  <span className="font-semibold text-emerald-700">
                    {readiness.requirementStats.coveredRequirements}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Uncovered Requirements:</span>
                  <span
                    className={`font-semibold ${
                      readiness.requirementStats.uncoveredRequirements > 0
                        ? 'text-amber-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {readiness.requirementStats.uncoveredRequirements}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Quality Gate Gates Passed */}
            <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Quality Gate Rules
                  </span>
                  <Sparkles className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {passedCriteriaCount} / {totalCriteriaCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Passed</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Blocker Gate Violations:</span>
                  <span
                    className={`font-bold ${
                      readiness.blockers.length > 0 ? 'text-rose-700' : 'text-slate-700'
                    }`}
                  >
                    {readiness.blockers.length}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Warnings / Action Items:</span>
                  <span
                    className={`font-semibold ${
                      readiness.warnings.length > 0 ? 'text-amber-700' : 'text-slate-700'
                    }`}
                  >
                    {readiness.warnings.length}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Overall Verdict:</span>
                  <span className="font-bold text-slate-800">{readiness.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Gates Checklist Table */}
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Quality Gates Criteria Checklist
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Strict evaluation criteria governing production release readiness and deployability.
                </p>
              </div>
              <span className="text-xs text-slate-600 font-medium bg-white px-2.5 py-1 rounded border border-slate-200">
                {readiness.criteria.length} Quality Gates Checked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-4 w-12 text-center">Status</th>
                    <th className="py-2.5 px-4">Quality Gate</th>
                    <th className="py-2.5 px-4 w-24">Gate Type</th>
                    <th className="py-2.5 px-4 w-32">Actual Value</th>
                    <th className="py-2.5 px-4 w-32">Target Value</th>
                    <th className="py-2.5 px-4">Evaluation Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readiness.criteria.map((criterion: ReadinessCriterion) => {
                    const isPassed = criterion.status === 'PASSED';
                    const isFailed = criterion.status === 'FAILED';
                    return (
                      <tr
                        key={criterion.id}
                        className={`hover:bg-slate-50/50 transition-colors ${
                          isFailed ? 'bg-rose-50/30' : criterion.status === 'WARNING' ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {isPassed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : isFailed ? (
                            <XCircle className="w-4 h-4 text-rose-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {criterion.name}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              criterion.isBlocker
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {criterion.isBlocker ? 'Blocker' : 'Warning'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {criterion.actualValue}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {criterion.targetValue}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {criterion.summary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
