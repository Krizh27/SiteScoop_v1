import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

const InspectorSummary = ({ summary, analysis }) => {
  if (!summary) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
        <span>Inspection Summary</span>
        <span className="font-mono text-gray-700 font-bold">{summary.findingCount} Findings</span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <div className="bg-white p-2 rounded border border-red-100 flex flex-col items-center">
          <div className="flex items-center gap-1 text-red-600 font-bold text-base">
            <AlertCircle size={14} />
            <span>{summary.errorCount}</span>
          </div>
          <span className="text-[10px] text-gray-500 uppercase font-medium">Errors</span>
        </div>

        <div className="bg-white p-2 rounded border border-amber-100 flex flex-col items-center">
          <div className="flex items-center gap-1 text-amber-600 font-bold text-base">
            <AlertTriangle size={14} />
            <span>{summary.warningCount}</span>
          </div>
          <span className="text-[10px] text-gray-500 uppercase font-medium">Warnings</span>
        </div>

        <div className="bg-white p-2 rounded border border-blue-100 flex flex-col items-center">
          <div className="flex items-center gap-1 text-blue-600 font-bold text-base">
            <Info size={14} />
            <span>{summary.infoCount}</span>
          </div>
          <span className="text-[10px] text-gray-500 uppercase font-medium">Info</span>
        </div>
      </div>

      {analysis && (
        <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-200">
          <span>Deterministic Checks: {analysis.deterministicChecks}</span>
          <span>Agent Steps: {analysis.agentSteps}</span>
        </div>
      )}
    </div>
  );
};

export default InspectorSummary;
