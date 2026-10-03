import React, { useState } from 'react';
import FindingEvidence from './FindingEvidence';
import { AlertTriangle, AlertCircle, Info, FileCode, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

const FindingCard = ({ finding, onSelectFile }) => {
  const [showEvidence, setShowEvidence] = useState(false);
  if (!finding) return null;

  const severityBadge = {
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  }[finding.severity] || 'bg-canvas text-ink-muted border-border';

  const severityIcon = {
    error: <AlertCircle size={16} className="text-red-600 shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-600 shrink-0" />,
    info: <Info size={16} className="text-blue-600 shrink-0" />
  }[finding.severity] || <Info size={16} className="text-zinc-400 shrink-0" />;

  const confidenceBadge = {
    high: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    medium: 'text-amber-700 bg-amber-50 border-amber-200',
    low: 'text-ink-muted bg-canvas border-border'
  }[finding.confidence] || 'text-ink-muted bg-canvas border-border';

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-3 shadow-clean hover:border-zinc-300 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {severityIcon}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full border ${severityBadge}`}>
                {finding.severity}
              </span>
              <span className="text-[10px] text-ink-muted uppercase font-mono bg-subtle px-1.5 py-0.5 rounded">
                {finding.category}
              </span>
              <span className={`text-[10px] capitalize font-medium px-2 py-0.5 rounded-full border ${confidenceBadge}`}>
                {finding.confidence} confidence
              </span>
            </div>

            <h4 className="font-bold text-ink text-sm leading-snug">
              {finding.title}
            </h4>

            {finding.affectedFiles && finding.affectedFiles.length > 0 && (
              <div className="text-[11px] font-mono text-ink-muted mt-0.5">
                {finding.affectedFiles.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-ink-muted leading-relaxed font-sans">
        {finding.description}
      </p>

      {/* Suggested Action */}
      {finding.suggestedAction && (
        <div className="bg-brand-50/50 border border-brand-100 rounded-lg p-2.5 text-xs text-brand-900">
          <span className="font-semibold text-brand-900">Suggested Action: </span>
          <span>{finding.suggestedAction}</span>
        </div>
      )}

      {/* Toggle Evidence Button */}
      <div className="pt-1">
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <span>{showEvidence ? 'Hide Evidence' : 'View Evidence'}</span>
          {showEvidence ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showEvidence && (
          <div className="mt-2 animate-in fade-in duration-200">
            <FindingEvidence evidence={finding.evidence} />
          </div>
        )}
      </div>

      {/* Affected Files Quick Inspect */}
      {finding.affectedFiles && finding.affectedFiles.length > 0 && (
        <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
          <span className="text-[11px] text-ink-muted font-medium">Inspect in Editor:</span>
          <div className="flex flex-wrap gap-1.5">
            {finding.affectedFiles.map((file, idx) => (
              <button
                key={idx}
                onClick={() => onSelectFile && onSelectFile(file)}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-ink bg-subtle hover:bg-zinc-200 px-2 py-1 rounded transition-colors"
              >
                <FileCode size={12} className="text-ink-muted" />
                <span>{file}</span>
                <ArrowRight size={10} className="text-ink-muted" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FindingCard;
