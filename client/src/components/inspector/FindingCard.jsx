import React from 'react';
import FindingEvidence from './FindingEvidence';
import { AlertTriangle, AlertCircle, Info, FileCode, ArrowRight } from 'lucide-react';

const FindingCard = ({ finding, onSelectFile }) => {
  if (!finding) return null;

  const severityBadge = {
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  }[finding.severity] || 'bg-gray-50 text-gray-700 border-gray-200';

  const severityIcon = {
    error: <AlertCircle size={15} className="text-red-500 shrink-0" />,
    warning: <AlertTriangle size={15} className="text-amber-500 shrink-0" />,
    info: <Info size={15} className="text-blue-500 shrink-0" />
  }[finding.severity] || <Info size={15} className="text-gray-400 shrink-0" />;

  const confidenceBadge = {
    high: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    medium: 'text-amber-700 bg-amber-50 border-amber-200',
    low: 'text-gray-600 bg-gray-50 border-gray-200'
  }[finding.confidence] || 'text-gray-600 bg-gray-50 border-gray-200';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3.5 space-y-2.5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {severityIcon}
          <div>
            <h4 className="font-semibold text-gray-800 text-sm leading-tight">
              {finding.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${severityBadge}`}>
                {finding.severity}
              </span>
              <span className="text-[10px] text-gray-500 uppercase font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                {finding.category}
              </span>
              <span className={`text-[10px] capitalize font-medium px-1.5 py-0.5 rounded border ${confidenceBadge}`}>
                {finding.confidence} confidence
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-700 leading-relaxed font-sans">
        {finding.description}
      </p>

      {/* Confirmed Evidence */}
      <FindingEvidence evidence={finding.evidence} />

      {/* Affected Files */}
      {finding.affectedFiles && finding.affectedFiles.length > 0 && (
        <div className="pt-1">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Affected Files:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {finding.affectedFiles.map((file, idx) => (
              <button
                key={idx}
                onClick={() => onSelectFile && onSelectFile(file)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors"
                title={`Inspect ${file} in viewer`}
              >
                <FileCode size={12} />
                <span>{file}</span>
                <ArrowRight size={10} className="text-blue-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Action */}
      {finding.suggestedAction && (
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded p-2 text-xs text-emerald-900">
          <span className="font-semibold text-emerald-800">Suggested Action: </span>
          <span>{finding.suggestedAction}</span>
        </div>
      )}
    </div>
  );
};

export default FindingCard;
