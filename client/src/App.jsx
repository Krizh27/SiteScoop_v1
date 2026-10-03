import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Terminal, Globe, ShieldCheck, Zap, Cpu, CheckCircle2, AlertTriangle, FileCode2, Play, Info } from 'lucide-react';

function App() {
  const [url, setUrl] = useState('https://qureshilawchambers.com');
  const [siteId, setSiteId] = useState(null);
  
  // App States: 'landing', 'recovering', 'recovered', 'analyzing', 'complete'
  const [appState, setAppState] = useState('landing');
  
  const [ingestStatus, setIngestStatus] = useState([]);
  const [analysisSteps, setAnalysisSteps] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRecover = async () => {
    try {
      if (!url) return;
      
      setError(null);
      setSiteId(null);
      setAppState('recovering');
      setIngestStatus([
        { msg: 'Fetching HTML', done: true },
        { msg: 'Parsing DOM', done: true },
        { msg: 'Extracting assets', done: true },
        { msg: 'Building workspace', done: false }
      ]);
      setAnalysisResult(null);
      setAnalysisSteps([]);
      
      const res = await fetch('http://localhost:5000/api/sites/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to recover site');
      }

      setSiteId(data.siteId);
      
      setIngestStatus(prev => prev.map(s => ({ ...s, done: true })));
      setTimeout(() => setAppState('recovered'), 800);
      
    } catch (err) {
      setError(err.message);
      setAppState('landing');
    }
  };

  const handleAnalyze = async () => {
    try {
      setError(null);
      setAppState('analyzing');
      setAnalysisSteps([{ text: 'Initializing Gemma Agent...', type: 'info' }]);
      
      const res = await fetch('http://localhost:5000/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, message: 'Analyze this website for bugs and improvements.' })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze site');
      }

      setAnalysisSteps(data.steps || []);
      setAnalysisResult(data.response);
      setAppState('complete');
    } catch (err) {
      setError(err.message);
      setAppState('recovered'); // fallback to recovered so they can retry
    }
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-neutral-300 font-sans selection:bg-violet-900 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-[#1f2229] bg-[#0f1115]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600/20 p-2 rounded-lg border border-violet-500/30">
              <Terminal className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-wide leading-tight">SITESCOOP</h1>
              <p className="text-xs text-neutral-500 font-medium tracking-widest uppercase">AI Website Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-900/50">
            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"></div>
            <span className="text-xs font-semibold text-cyan-400 tracking-wider">Gemma 4 &bull; CONNECTED</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-950/40 border border-red-900/50 rounded-lg flex gap-3 items-start animate-in fade-in slide-in-from-top-4">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">System Error</h3>
              <p className="text-red-300/80 text-sm font-mono break-all">{error}</p>
            </div>
          </div>
        )}

        {/* 1. LANDING & RECOVERY (Shown before analysis starts) */}
        {(appState === 'landing' || appState === 'recovering' || appState === 'recovered') && (
          <div className="max-w-3xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {appState === 'landing' && (
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                  From deployed URL <span className="text-[#1f2229] mx-2">→</span> recoverable code <span className="text-[#1f2229] mx-2">→</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">AI insight</span>
                </h2>
              </div>
            )}

            <div className="bg-[#0f1115] border border-[#1f2229] rounded-2xl p-8 shadow-2xl shadow-black/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-cyan-500 to-violet-600 opacity-20"></div>
              
              <div className="mb-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
                  <Globe className="w-4 h-4" /> Target Website
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    disabled={appState !== 'landing'}
                    className="flex-1 bg-[#08090b] border border-[#1f2229] rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono disabled:opacity-50"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                  {appState === 'landing' && (
                    <button 
                      onClick={handleRecover}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)]"
                    >
                      <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                      SCOOP SITE
                    </button>
                  )}
                </div>
              </div>

              {appState === 'landing' && (
                <div className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-[#1f2229]/50">
                  <div className="flex items-center gap-2 text-sm text-neutral-400"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> No repository required</div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Cheerio-powered recovery</div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Gemma-powered agent analysis</div>
                </div>
              )}

              {(appState === 'recovering' || appState === 'recovered') && (
                <div className="mt-8 bg-[#08090b] border border-[#1f2229] rounded-lg p-6 font-mono text-sm">
                  <h3 className="text-violet-400 font-semibold mb-4 flex items-center gap-2">
                    {appState === 'recovering' ? <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {appState === 'recovering' ? 'RECOVERING WEBSITE' : 'SITE RECOVERED'}
                  </h3>
                  
                  <div className="space-y-3 pl-1">
                    {ingestStatus.map((step, i) => (
                      <div key={i} className={`flex items-center gap-3 ${step.done ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        {step.done ? <span className="text-emerald-500">✓</span> : <span className="animate-spin text-violet-500">◉</span>}
                        {step.msg}
                      </div>
                    ))}
                  </div>

                  {appState === 'recovered' && siteId && (
                    <div className="mt-8 pt-6 border-t border-[#1f2229] animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex flex-wrap gap-4 mb-6">
                        <div className="bg-[#0f1115] px-3 py-1.5 rounded border border-[#1f2229] text-xs text-neutral-400">
                          ID: <span className="text-white">{siteId.split('_').pop()}</span>
                        </div>
                        <div className="bg-[#0f1115] px-3 py-1.5 rounded border border-[#1f2229] text-xs text-neutral-400">
                          WORKSPACE ACTIVE
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleAnalyze}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                      >
                        <Cpu className="w-5 h-5" /> 
                        ANALYZE WITH GEMMA
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. ANALYSIS SCREEN (Two-column layout) */}
        {(appState === 'analyzing' || appState === 'complete') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in zoom-in-95 duration-500">
            
            {/* LEFT COLUMN: AGENT ACTIVITY */}
            <div className="lg:col-span-4 flex flex-col h-[calc(100vh-10rem)] sticky top-24">
              <div className="bg-[#0f1115] border border-[#1f2229] rounded-2xl shadow-xl flex flex-col h-full overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1f2229] bg-[#08090b]/50 flex justify-between items-center">
                  <h3 className="font-semibold text-cyan-400 flex items-center gap-2 text-sm tracking-widest uppercase">
                    <Activity className="w-4 h-4" /> Gemma Agent
                  </h3>
                  {appState === 'analyzing' && <div className="text-xs text-cyan-500/70 animate-pulse">RUNNING</div>}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-3 bg-[#08090b]">
                  {analysisSteps.map((step, idx) => {
                    if (step.type === 'tool_call') {
                      return (
                        <div key={idx} className="flex gap-2 text-neutral-400">
                          <span className="text-neutral-600 shrink-0">[{step.step}]</span>
                          <span className="text-cyan-400 shrink-0">▶</span>
                          <span className="break-all">{step.toolName}({JSON.stringify(step.arguments)})</span>
                        </div>
                      );
                    }
                    if (step.type === 'tool_result') {
                      return (
                        <div key={idx} className="flex gap-2 text-emerald-500 pl-8 opacity-80">
                          <span className="shrink-0">✓</span>
                          <span>Completed</span>
                        </div>
                      );
                    }
                    if (step.type === 'final_response') {
                      return (
                        <div key={idx} className="flex gap-2 text-violet-400 mt-4 border-t border-[#1f2229] pt-4">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Analysis compiled successfully.</span>
                        </div>
                      );
                    }
                    if (step.type === 'info') {
                      return <div key={idx} className="text-neutral-500 italic">{step.text}</div>;
                    }
                    return null;
                  })}
                  {appState === 'analyzing' && (
                    <div className="flex gap-2 text-cyan-500/50 pt-2 pl-8">
                      <span className="animate-spin">◉</span>
                      <span className="animate-pulse">analyzing evidence...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: RESULTS */}
            <div className="lg:col-span-8">
              <div className="bg-[#0f1115] border border-[#1f2229] rounded-2xl shadow-xl p-8 min-h-[calc(100vh-10rem)]">
                <div className="mb-8 border-b border-[#1f2229] pb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <ShieldCheck className="w-7 h-7 text-emerald-500" />
                      Analysis Report
                    </h2>
                    <p className="text-neutral-400 mt-2 flex items-center gap-2">
                      <FileCode2 className="w-4 h-4" /> Evidence-backed analysis
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neutral-500 font-mono mb-1">TARGET</div>
                    <div className="text-sm text-cyan-300 font-mono bg-cyan-950/30 px-3 py-1 rounded border border-cyan-900/50">{url}</div>
                  </div>
                </div>

                {appState === 'analyzing' ? (
                  <div className="flex flex-col items-center justify-center h-64 text-neutral-500 gap-4">
                    <Cpu className="w-12 h-12 text-[#1f2229] animate-pulse" />
                    <p className="font-mono text-sm">Awaiting Gemma response...</p>
                  </div>
                ) : (
                  <div className="markdown-body custom-markdown text-neutral-300">
                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;
