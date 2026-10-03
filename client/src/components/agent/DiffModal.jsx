import React from 'react';
import { X, Check, FileCode } from 'lucide-react';

const DiffModal = ({ isOpen, onClose, change, onApply, applying }) => {
  if (!isOpen || !change) return null;

  const lines = (change.diff || '').split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <FileCode size={20} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Review Proposed Code Diff</h3>
              <p className="text-xs text-gray-500 font-mono">{change.path}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Reason / Metadata */}
        <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between text-xs">
          <div className="text-blue-900">
            <span className="font-semibold">Reason: </span>
            {change.reason}
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-100 text-amber-800">
            {change.status}
          </span>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-950 font-mono text-xs text-gray-200">
          {lines.map((line, idx) => {
            let lineClass = 'text-gray-400';
            let bgClass = '';
            if (line.startsWith('+') && !line.startsWith('+++')) {
              lineClass = 'text-emerald-400';
              bgClass = 'bg-emerald-950/40';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              lineClass = 'text-red-400';
              bgClass = 'bg-red-950/40';
            } else if (line.startsWith('@@')) {
              lineClass = 'text-cyan-400';
              bgClass = 'bg-cyan-950/20';
            }

            return (
              <div key={idx} className={`px-2 py-0.5 font-mono whitespace-pre ${lineClass} ${bgClass}`}>
                {line}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Human approval required. No files are written until you approve.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            {change.status !== 'applied' && (
              <button
                onClick={() => onApply(change.changeId)}
                disabled={applying}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
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
