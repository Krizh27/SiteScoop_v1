import React, { useState, useEffect } from 'react';
import { runInspection, getInspectionReport } from '../../services/inspectorApi';
import InspectorSummary from './InspectorSummary';
import FindingList from './FindingList';
import { ShieldAlert, RefreshCw, Play, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const InspectorPanel = ({ projectId, onSelectFile }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focus, setFocus] = useState([]);

  const loadCachedReport = async () => {
    if (!projectId) return;
    try {
      const data = await getInspectionReport(projectId);
      if (data.success) {
        setReport(data);
      }
    } catch {
      // No cached report yet; that's normal
    }
  };

  useEffect(() => {
    setReport(null);
    setError(null);
    loadCachedReport();
  }, [projectId]);

  const handleRunInspection = async () => {
    if (!projectId || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await runInspection(projectId, focus);
      if (result.success) {
        setReport(result);
      } else {
        setError(result.error?.message || 'Inspection failed');
      }
    } catch (err) {
      setError(err.message || 'Inspection request failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleFocus = (area) => {
    setFocus((prev) => 
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const focusOptions = ['recovery', 'assets', 'html', 'javascript', 'dependencies'];

  return (
    <div className="flex flex-col h-full bg-canvas overflow-y-auto p-4 sm:p-5 space-y-4">
      {/* Top Header & Run Action */}
      <div className="bg-white border border-border rounded-xl p-4 sm:p-5 space-y-3.5 shadow-clean">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="font-bold text-ink text-sm">AI Project Inspector</h3>
              <p className="text-[11px] text-ink-muted">Evidence-first detection of broken references, missing assets, and limitations</p>
            </div>
          </div>

          <button
            onClick={handleRunInspection}
            disabled={loading || !projectId}
            className="flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-clean disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Analyzing Project...</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>Run Inspection</span>
              </>
            )}
          </button>
        </div>

        {/* Focus selector */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-ink-muted font-medium text-[11px]">Focus Areas:</span>
          {focusOptions.map((area) => (
            <button
              key={area}
              onClick={() => toggleFocus(area)}
              className={`capitalize text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                focus.includes(area)
                  ? 'bg-brand-50 text-brand-700 border-brand-200 font-semibold'
                  : 'bg-white text-ink-muted border-border hover:bg-subtle'
              }`}
            >
              {area}
            </button>
          ))}
          {focus.length > 0 && (
            <button
              onClick={() => setFocus([])}
              className="text-ink-muted hover:text-ink text-[11px] underline ml-1 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading & Activity Checklist */}
      {loading && (
        <div className="bg-white border border-border rounded-xl p-5 space-y-3 text-xs shadow-clean">
          <div className="font-semibold text-ink flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin text-brand-600" />
            <span>Inspection in progress...</span>
          </div>
          <ul className="space-y-2 text-ink-muted font-mono text-[11px]">
            <li className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={13} /> Recovery report analyzed
            </li>
            <li className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={13} /> Project structure inspected
            </li>
            <li className="flex items-center gap-2 text-brand-600 animate-pulse font-semibold">
              <RefreshCw size={12} className="animate-spin" /> Missing resources checked
            </li>
            <li className="flex items-center gap-2 text-zinc-400">
              <span className="w-3 h-3 rounded-full border border-zinc-300 inline-block"></span> Source files inspected
            </li>
            <li className="flex items-center gap-2 text-zinc-400">
              <span className="w-3 h-3 rounded-full border border-zinc-300 inline-block"></span> Findings generated
            </li>
          </ul>
        </div>
      )}

      {/* Inspection Results */}
      {report && !loading && (
        <div className="space-y-4">
          <InspectorSummary summary={report.summary} analysis={report.analysis} />
          <FindingList findings={report.findings} onSelectFile={onSelectFile} />
        </div>
      )}
    </div>
  );
};

export default InspectorPanel;
