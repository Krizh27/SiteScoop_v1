import React from 'react';

const pipelineStages = [
  {
    step: '01',
    title: 'Website Extraction',
    status: 'Planned (Stage 1)',
    statusColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    description: 'Fetches deployed website markup and assets via Cheerio and optional headless Playwright browser rendering.',
    icon: (
      <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    )
  },
  {
    step: '02',
    title: 'Workspace Rebuild',
    status: 'Planned (Stage 2)',
    statusColor: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    description: 'Reconstructs clean, editable local project directories, deduplicates styles, and standardizes file structures.',
    icon: (
      <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    step: '03',
    title: 'Local Gemma 4 AI',
    status: 'Planned (Stage 3)',
    statusColor: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    description: 'Runs local Gemma 4 model inference via Ollama for zero-cost, privacy-first code inspection and debugging.',
    icon: (
      <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    )
  },
  {
    step: '04',
    title: 'Agent Dev Loop',
    status: 'Planned (Stage 4)',
    statusColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    description: 'Autonomous tool-calling loop applying unified code diffs, verifying builds, and generating exportable ZIP bundles.',
    icon: (
      <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    )
  }
];

export default function PipelineCards() {
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Architecture Pipeline
        </h2>
        <span className="text-xs text-slate-500 font-mono">
          Stage 0: Foundation Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineStages.map((stage) => (
          <div
            key={stage.step}
            className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                {stage.icon}
              </div>
              <span className="text-xs font-mono text-slate-500 font-bold">
                {stage.step}
              </span>
            </div>
            
            <h3 className="text-base font-semibold text-white mb-1">
              {stage.title}
            </h3>
            
            <div className="mb-2">
              <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${stage.statusColor}`}>
                {stage.status}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {stage.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
