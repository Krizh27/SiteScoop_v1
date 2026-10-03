import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">SiteScoop AI</span>
          <span>&bull;</span>
          <span>Open-source website recovery &amp; local development agent</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400">Privacy-First (No paid hosted LLM APIs required)</span>
          <span>&bull;</span>
          <span className="font-mono text-indigo-400">Stage 0 Complete</span>
        </div>
      </div>
    </footer>
  );
}
