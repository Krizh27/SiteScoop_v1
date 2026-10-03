import React, { useState } from 'react';

export default function UrlInputSection() {
  const [url, setUrl] = useState('');

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 md:p-10 shadow-2xl">
      {/* Background glow accent */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Project Tagline & Heading */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          SiteScoop AI — Stage 0: Project Foundation
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-3">
          SiteScoop AI
        </h1>
        
        <p className="text-xl sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-400 mb-6">
          Recover. Understand. Improve.
        </p>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
          Open-source website recovery and local development agent. Extract publicly accessible frontend
          resources, reconstruct clean editable codebases, and inspect or improve them using local Gemma 4 via Ollama.
        </p>

        {/* URL Input Form */}
        <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2 sm:p-2.5 shadow-inner">
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3.5 text-slate-500 font-mono text-sm pointer-events-none">
                https://
              </span>
              <input
                id="target-url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com or any deployed frontend URL..."
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-22 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
            
            {/* Placeholder/Disabled Action Button */}
            <button
              id="scoop-action-btn"
              type="button"
              disabled
              title="Website extraction is scheduled for Stage 1"
              aria-label="Scoop Website (Planned for Stage 1)"
              className="sm:w-auto px-6 py-3 rounded-lg bg-slate-800 text-slate-400 font-semibold text-sm cursor-not-allowed border border-slate-700/50 flex items-center justify-center gap-2 select-none"
            >
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Scoop Website</span>
            </button>
          </div>
        </div>

        {/* Stage Status Callout */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400/80"></span>
          <span>
            Website extraction and recovery will be implemented in <strong className="text-slate-300">Stage 1</strong>. The button is currently inactive.
          </span>
        </div>
      </div>
    </section>
  );
}
