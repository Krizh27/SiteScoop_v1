import React, { useState } from 'react';
import { extractWebsite } from '../services/api.js';

export default function UrlInputSection() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawUrl = url.trim();
    if (!rawUrl) return;

    // Auto-prepend https:// if protocol is omitted
    let formattedUrl = rawUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await extractWebsite(formattedUrl);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Extraction failed. Please verify the URL and ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 md:p-10 shadow-2xl">
      {/* Background glow accent */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        {/* Project Tagline & Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            SiteScoop AI — Website Recovery Engine
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-3">
            SiteScoop AI
          </h1>

          <p className="text-xl sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-400 mb-4">
            Recover. Understand. Improve.
          </p>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Extract publicly accessible frontend resources, reconstruct clean editable codebases,
            and inspect or improve them using local Gemma 4 via Ollama.
          </p>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2 sm:p-2.5 shadow-inner">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1 flex items-center">
                <span className="absolute left-3.5 text-slate-500 font-mono text-sm pointer-events-none">
                  🌐
                </span>
                <input
                  id="target-url-input"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com or any deployed frontend URL..."
                  disabled={loading}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono disabled:opacity-50"
                />
              </div>

              {/* Action Button */}
              <button
                id="scoop-action-btn"
                type="submit"
                disabled={loading || !url.trim()}
                className="sm:w-auto px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span>Scoop Website</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-300 flex items-start gap-3 animate-fadeIn">
            <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="font-semibold text-rose-200">Extraction Error</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Extraction Success & Results View */}
        {result && (
          <div className="rounded-xl border border-emerald-500/30 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4 animate-fadeIn">
            {/* Success Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-emerald-400 text-sm">
                  Extraction Successful!
                </span>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Project: {result.projectId}
              </span>
            </div>

            {/* Extracted Website Title & Metadata */}
            <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-800/80">
              <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Extracted Website Title
              </h2>
              <p className="text-lg font-bold text-white mb-2">
                {result.metadata?.title || result.page?.title || 'Untitled Website'}
              </p>
              {result.metadata?.description && (
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                  {result.metadata.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="text-slate-500">Source:</span>
                <span className="text-indigo-300 truncate max-w-md">{result.sourceUrl}</span>
              </div>
            </div>

            {/* Counts of CSS, JS, and Image Assets */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                Extracted Asset Counts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-center">
                  <div className="text-2xl font-bold text-sky-400">
                    {result.assetCounts?.stylesheets ?? 0}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-1">
                    CSS Stylesheets
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    {result.assetCounts?.scripts ?? 0}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-1">
                    JavaScript Files
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    {result.assetCounts?.images ?? 0}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-1">
                    Images &amp; Icons
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-400">
                    {result.assets?.downloaded ?? result.assetCounts?.downloaded ?? 0}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-1">
                    Total Downloaded
                  </div>
                </div>
              </div>
            </div>

            {/* Staging & Manifest Notice */}
            <div className="text-xs text-slate-400 bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3 flex items-center justify-between">
              <span>
                Files saved to <code className="text-indigo-300 font-mono">workspace/projects/{result.projectId}/</code>
              </span>
              <span className="text-slate-500 text-[11px] font-mono">
                index.html + manifest.json
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
