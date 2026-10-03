import React from 'react';

export default function SystemStatusCard({ healthData, healthLoading, healthError, onRefresh }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
          <h2 className="font-semibold text-sm text-slate-200 uppercase tracking-wider">
            Backend Health Status
          </h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={healthLoading}
          className="text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          {healthLoading ? 'Checking...' : 'Ping GET /api/health'}
        </button>
      </div>

      <div className="bg-slate-950/80 rounded-lg p-3.5 font-mono text-xs border border-slate-800/80 overflow-x-auto">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-500">
          <span>ENDPOINT: /api/health</span>
          <span>HTTP 200 OK</span>
        </div>
        {healthLoading ? (
          <div className="text-slate-400 py-1">Connecting to backend server...</div>
        ) : healthError ? (
          <div className="text-rose-400 py-1">
            Error: {healthError}
            <div className="text-slate-500 text-[11px] mt-1">
              Ensure server is started via <code>npm start</code> or <code>npm run dev</code> in <code>/server</code>.
            </div>
          </div>
        ) : healthData ? (
          <pre className="text-emerald-400 leading-relaxed">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        ) : (
          <div className="text-slate-500">No response data.</div>
        )}
      </div>
    </div>
  );
}
