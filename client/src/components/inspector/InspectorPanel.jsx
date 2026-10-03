import React, { useState, useEffect } from 'react';
import { runInspection, getInspectionReport } from '../../services/inspectorApi';
import InspectorSummary from './InspectorSummary';
import FindingList from './FindingList';
import { ShieldAlert, RefreshCw, Play, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

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
    setFocus(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const focusOptions = ['recovery', 'assets', 'html', 'javascript', 'dependencies'];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto p-4 space-y-4">
      {/* Top Header & Run Action */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-blue-600" size={20} />
            <div>
              <h3 className="font-bold text-gray-800 text-sm">AI Project Inspector</h3>
              <p className="text-[11px] text-gray-500">Detect broken references, missing assets, and recovery limitations</p>
            </div>
          </div>
          <button
            onClick={handleRunInspection}
            disabled={loading || !projectId}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Inspecting...</span>
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
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-gray-400 font-medium">Focus Areas:</span>
          {focusOptions.map((area) => (
            <button
              key={area}
              onClick={() => toggleFocus(area)}
              className={`capitalize px-2 py-0.5 rounded border transition-colors ${
                focus.includes(area)
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {area}
            </button>
          ))}
          {focus.length > 0 && (
            <button
              onClick={() => setFocus([])}
              className="text-gray-400 hover:text-gray-600 text-[10px] underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading & Activity Checklist */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2 text-xs">
          <div className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin text-blue-600" />
            <span>Inspection in progress...</span>
          </div>
          <ul className="space-y-1.5 text-gray-600 font-mono text-[11px]">
            <li className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 size={13} /> Recovery report analyzed
            </li>
            <li className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 size={13} /> Project structure inspected
            </li>
            <li className="flex items-center gap-1.5 text-blue-600 animate-pulse">
              <RefreshCw size={12} className="animate-spin" /> Missing resources checked
            </li>
            <li className="flex items-center gap-1.5 text-gray-400">
              <span className="w-3 h-3 rounded-full border border-gray-300 inline-block"></span> Source files inspected
            </li>
            <li className="flex items-center gap-1.5 text-gray-400">
              <span className="w-3 h-3 rounded-full border border-gray-300 inline-block"></span> Findings generated
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
