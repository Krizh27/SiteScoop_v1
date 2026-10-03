import React from 'react';
import { X, Check, FileCode, ShieldCheck } from 'lucide-react';

const DiffModal = ({ isOpen, onClose, change, onApply, applying }) => {
  if (!isOpen || !change) return null;

  const lines = (change.diff || '').split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-modal border border-border w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-canvas">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700">
              <FileCode size={18} />
            </div>
            <div>
              <h3 className="font-bold text-ink text-sm">Review Proposed Code Changes</h3>
              <p className="text-xs text-ink-muted font-mono">{change.path}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink p-1.5 rounded-lg hover:bg-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Reason / Metadata Banner */}
        <div className="px-6 py-3 bg-brand-50/40 border-b border-brand-100 flex items-center justify-between text-xs">
          <div className="text-ink flex items-center gap-1.5">
            <span className="font-semibold text-brand-900">Reason:</span>
            <span className="text-brand-900">{change.reason}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-amber-100 text-amber-900 border border-amber-200">
            Pending Approval
          </span>
        </div>

        {/* Unified Diff View */}
        <div className="flex-1 overflow-auto p-4 bg-[#0F172A] font-mono text-xs text-zinc-300">
          {lines.map((line, idx) => {
            let lineClass = 'text-zinc-400';
            let bgClass = '';
            if (line.startsWith('+') && !line.startsWith('+++')) {
              lineClass = 'text-emerald-400 font-semibold';
              bgClass = 'bg-emerald-950/60 py-0.5 px-1 rounded-xs';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              lineClass = 'text-rose-400 line-through';
              bgClass = 'bg-rose-950/60 py-0.5 px-1 rounded-xs';
            } else if (line.startsWith('@@')) {
              lineClass = 'text-sky-400';
              bgClass = 'bg-sky-950/30';
            }

            return (
              <div key={idx} className={`leading-5 font-mono whitespace-pre px-1.5 ${lineClass} ${bgClass}`}>
                {line}
              </div>
            );
          })}
        </div>

        {/* Footer with Human Approval Boundary */}
        <div className="px-6 py-3.5 border-t border-border bg-canvas flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Human authorization required. No files are written until approved.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-ink-muted hover:text-ink hover:bg-subtle rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            {change.status !== 'applied' && (
              <button
                onClick={() => onApply(change.changeId)}
                disabled={applying}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-clean disabled:opacity-50"
              >
                <Check size={14} />
                {applying ? 'Applying Change...' : 'Apply Fix to Project'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffModal;
