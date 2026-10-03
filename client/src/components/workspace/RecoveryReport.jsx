import React, { useEffect, useState } from 'react';
import { getRecoveryReport } from '../../services/workspaceApi';
import { FileText, ExternalLink, Calendar, AlertTriangle, Layers, ShieldCheck } from 'lucide-react';

const RecoveryReport = ({ projectId }) => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    getRecoveryReport(projectId).then(setReport).catch(console.error);
  }, [projectId]);

  if (!report) {
    return (
      <div className="p-8 text-center text-xs text-ink-muted">
        Loading recovery report...
      </div>
    );
  }

  return (
    <div className="p-6 bg-canvas overflow-y-auto h-full space-y-5">
      <div className="bg-white border border-border rounded-xl p-5 shadow-clean space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <FileText size={18} className="text-brand-600" />
          <h2 className="text-base font-bold text-ink">Recovery Report & Metadata</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-canvas border border-border rounded-lg space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Source URL</span>
            <div className="truncate">
              <a 
                href={report.sourceUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-brand-600 hover:underline font-mono inline-flex items-center gap-1"
              >
                <span>{report.sourceUrl}</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          <div className="p-3 bg-canvas border border-border rounded-lg space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Final Extracted URL</span>
            <div className="truncate font-mono text-ink">{report.finalUrl || report.sourceUrl}</div>
          </div>

          <div className="p-3 bg-canvas border border-border rounded-lg space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Timestamp</span>
            <div className="text-ink flex items-center gap-1">
              <Calendar size={12} className="text-ink-muted" />
              <span>{new Date(report.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 bg-canvas border border-border rounded-lg space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Project ID</span>
            <div className="font-mono text-ink">{report.projectId || projectId}</div>
          </div>
        </div>
      </div>

      {/* Recovered File Count Breakdown */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-clean space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Files Reconstructed</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'HTML', count: report.files?.html || 0 },
            { label: 'CSS', count: report.files?.css || 0 },
            { label: 'JS', count: report.files?.javascript || 0 },
            { label: 'Images', count: report.files?.images || 0 },
            { label: 'Fonts', count: report.files?.fonts || 0 },
            { label: 'Other', count: report.files?.other || 0 },
          ].map((item) => (
            <div key={item.label} className="p-2.5 bg-canvas border border-border rounded-lg text-center">
              <div className="text-base font-bold font-mono text-ink">{item.count}</div>
              <div className="text-[10px] text-ink-muted">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Failed Resources */}
      {report.failedResources?.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-clean space-y-3">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle size={15} className="text-amber-600" />
            <span>Unrecovered External Assets ({report.failedResources.length})</span>
          </div>
          <ul className="text-xs font-mono text-amber-900 bg-amber-50/50 p-3 rounded-lg border border-amber-200 space-y-1 max-h-48 overflow-y-auto">
            {report.failedResources.map((f, i) => (
              <li key={i} className="truncate">
                • {f.source} <span className="text-amber-700 italic">({f.error})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Limitations Disclaimer */}
      <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-xl text-xs text-brand-900 space-y-1">
        <div className="font-semibold flex items-center gap-1.5 text-brand-900">
          <ShieldCheck size={14} className="text-brand-700" />
          <span>Scope & Limitations</span>
        </div>
        <p className="text-[11px] leading-relaxed text-brand-800">
          SiteScoop AI recovers publicly accessible frontend resources. It does not clone private backend repositories, server-side APIs, or protected databases.
        </p>
      </div>
    </div>
  );
};

export default RecoveryReport;
