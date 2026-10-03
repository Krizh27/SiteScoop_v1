import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

const RecoveryProgress = ({ status }) => {
  const stages = [
    'Fetching website',
    'Parsing HTML',
    'Downloading assets',
    'Reconstructing project',
    'Project ready'
  ];

  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (status === 'recovering') {
      setCurrentStageIndex(0);
      const interval = setInterval(() => {
        setCurrentStageIndex((prev) => {
          if (prev < stages.length - 2) return prev + 1;
          return prev;
        });
      }, 1200);
      return () => clearInterval(interval);
    } else if (status === 'completed') {
      setCurrentStageIndex(stages.length - 1);
    } else if (status === 'error') {
      setCurrentStageIndex(0);
    }
  }, [status]);

  if (status === 'idle') return null;

  return (
    <div className="w-full bg-white border border-border rounded-xl p-5 shadow-clean text-left animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          {status === 'recovering' && <Loader2 size={16} className="text-brand-600 animate-spin" />}
          {status === 'completed' && <CheckCircle2 size={16} className="text-emerald-600" />}
          {status === 'error' && <XCircle size={16} className="text-red-600" />}
          <span className="text-xs font-semibold uppercase tracking-wider text-ink">
            {status === 'recovering' ? 'Reconstructing Website...' : status === 'completed' ? 'Recovery Successful' : 'Recovery Failed'}
          </span>
        </div>
        <span className="text-[11px] font-mono text-ink-muted">
          Step {Math.min(currentStageIndex + 1, stages.length)} of {stages.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {stages.map((stage, index) => {
          const isDone = index < currentStageIndex || status === 'completed';
          const isCurrent = index === currentStageIndex && status === 'recovering';
          const isPending = index > currentStageIndex && status !== 'completed';

          return (
            <div key={stage} className="flex items-center gap-3 text-xs transition-all">
              <div className="flex items-center justify-center w-5 h-5 rounded-full shrink-0">
                {isDone ? (
                  <CheckCircle2 size={15} className="text-emerald-600" />
                ) : isCurrent ? (
                  <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-zinc-300" />
                )}
              </div>
              <span className={`font-medium ${
                isDone ? 'text-ink font-medium' : isCurrent ? 'text-brand-700 font-semibold' : 'text-zinc-400'
              }`}>
                {stage}
              </span>
            </div>
          );
        })}

        {status === 'error' && (
          <div className="text-xs text-red-600 font-medium pt-2 flex items-center gap-1.5">
            <XCircle size={14} />
            <span>Could not extract resources from target URL. Please verify the link.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoveryProgress;
