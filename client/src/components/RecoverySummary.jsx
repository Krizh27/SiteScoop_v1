import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, AlertTriangle, FileCode, Layers, Image, Type } from 'lucide-react';

const RecoverySummary = ({ result }) => {
  if (!result) return null;

  const resourceTypes = [
    { label: 'HTML', count: result.summary?.html || 0, icon: FileCode, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'CSS', count: result.summary?.css || 0, icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { label: 'JavaScript', count: result.summary?.javascript || 0, icon: FileCode, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Images', count: result.summary?.images || 0, icon: Image, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Fonts', count: result.summary?.fonts || 0, icon: Type, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  ];

  return (
    <div className="w-full bg-white border border-border rounded-xl p-6 shadow-clean text-left space-y-5 animate-in fade-in duration-300">
      {/* Title & Open Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 mb-2">
            <CheckCircle2 size={13} />
            Recovery Complete
          </div>
          <h2 className="text-base font-bold text-ink">Project Reconstructed</h2>
          <p className="text-xs text-ink-muted mt-0.5 truncate max-w-md" title={result.sourceUrl}>
            Source: <span className="font-mono text-ink">{result.sourceUrl}</span>
          </p>
        </div>

        <Link
          to={`/project/${result.projectId}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:shadow-clean-md shrink-0"
        >
          <span>Open Workspace</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Resource Count Cards */}
      <div>
        <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2.5">
          Extracted Frontend Resources
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {resourceTypes.map((res) => {
            const Icon = res.icon;
            return (
              <div key={res.label} className="p-3 bg-canvas border border-border rounded-lg flex flex-col items-center justify-center text-center">
                <Icon size={16} className="text-ink-muted mb-1" />
                <span className="text-lg font-bold text-ink font-mono">{res.count}</span>
                <span className="text-[11px] text-ink-muted">{res.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failed Resources Notice (if any) */}
      {result.failedResources && result.failedResources.length > 0 && (
        <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <AlertTriangle size={14} className="text-amber-600" />
            <span>{result.failedResources.length} Unrecovered Resources</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Some external assets could not be retrieved from the public deployment. The Project Inspector can analyze these failed references.
          </p>
        </div>
      )}

      {/* Recovery Scope Disclaimer */}
      <div className="pt-2 border-t border-border text-[11px] text-ink-muted leading-relaxed">
        <span className="font-medium text-ink">Scope Notice: </span>
        SiteScoop reconstructs publicly accessible frontend files into an editable workspace. It does not clone private backend repositories or inaccessible server databases.
      </div>
    </div>
  );
};

export default RecoverySummary;
