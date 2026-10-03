import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import UrlInput from './components/UrlInput';
import RecoveryProgress from './components/RecoveryProgress';
import RecoverySummary from './components/RecoverySummary';
import ProjectList from './components/workspace/ProjectList';
import ProjectExplorer from './components/workspace/ProjectExplorer';
import { recoverWebsite } from './services/recoveryApi';
import { Sparkles, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

function Dashboard() {
  const [status, setStatus] = useState('idle'); // idle, recovering, completed, error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRecover = async (url) => {
    setStatus('recovering');
    setErrorMessage('');
    setResult(null);

    try {
      const data = await recoverWebsite(url);
      setResult(data);
      setStatus('completed');
    } catch (error) {
      setErrorMessage(error.message);
      setStatus('error');
    }
  };

  return (
    <div className="relative min-h-screen bg-canvas flex flex-col items-center justify-start p-4 sm:p-6 md:p-10 font-sans selection:bg-purple-100 selection:text-purple-900 overflow-x-hidden">
      {/* Background Decorative Layer */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* Subtle engineering grid with radial fade mask */}
        <div className="absolute inset-0 bg-grid-subtle radial-fade-mask opacity-85" />
        
        {/* Ambient violet and sky gradient light glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[460px] bg-gradient-to-tr from-brand-300/30 via-violet-300/20 to-sky-300/25 blur-3xl rounded-full" />
        <div className="absolute top-96 -left-28 w-88 h-88 bg-purple-200/25 blur-3xl rounded-full" />
        <div className="absolute top-80 -right-28 w-88 h-88 bg-sky-200/25 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-3xl w-full text-center space-y-8 py-6">
        {/* Brand Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-border shadow-clean text-xs font-semibold text-ink">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
            <span>SiteScoop AI</span>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-muted font-normal">Autonomous Web Recovery</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink tracking-tight">
            Recover. Understand. Improve.
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-lg mx-auto">
            Extract publicly accessible frontend resources, reconstruct an editable project, and inspect code with local Gemma AI.
          </p>
        </header>

        {/* Hero Card */}
        <main className="bg-white/95 backdrop-blur-xs p-6 sm:p-8 rounded-2xl shadow-clean-md border border-border space-y-6 text-left">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">
                Enter Website URL
              </label>
              <Link
                to="/project/demo-site"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>Quick Demo: Open demo-site</span>
                <ArrowRight size={13} />
              </Link>
            </div>
            
            <UrlInput onRecover={handleRecover} isLoading={status === 'recovering'} />
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs space-y-1">
              <span className="font-semibold">Recovery Error:</span> {errorMessage}
            </div>
          )}

          <RecoveryProgress status={status} />
          {result && <RecoverySummary result={result} />}

          <ProjectList />
        </main>

        {/* Minimal Footer Badges */}
        <footer className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <Cpu size={14} className="text-brand-600" />
            <span>Local Gemma 4 Inference</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Read-Only Tool Sandboxing</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/project/:projectId" element={<ProjectExplorer />} />
    </Routes>
  );
}

export default App;
