import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, Globe, Code2, Sparkles, Wand2, Shield, RefreshCcw, Command, Activity, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [url, setUrl] = useState('https://qureshilawchambers.com');
  const [siteId, setSiteId] = useState(null);
  const [appState, setAppState] = useState('landing');
  const [ingestStatus, setIngestStatus] = useState([]);
  const [analysisSteps, setAnalysisSteps] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [fixResult, setFixResult] = useState(null);
  const [error, setError] = useState(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [analysisSteps]);

  const handleRecover = async () => {
    try {
      if (!url) return;
      setError(null);
      setSiteId(null);
      setAppState('recovering');
      setIngestStatus([{ msg: 'Establishing connection...', done: true }]);
      setAnalysisResult(null);
      setAnalysisSteps([]);

      setTimeout(() => setIngestStatus(s => [...s, { msg: 'Parsing DOM structure', done: true }]), 600);
      setTimeout(() => setIngestStatus(s => [...s, { msg: 'Resolving dependency graphs', done: true }]), 1200);
      
      const res = await fetch('http://localhost:5000/api/sites/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to recover site');

      setSiteId(data.siteId);
      setIngestStatus(s => [...s, { msg: 'Extracting assets', done: true }, { msg: 'Isolating workspace', done: true }]);
      setTimeout(() => setAppState('recovered'), 1000);
    } catch (err) {
      setError(err.message);
      setAppState('landing');
    }
  };

  const handleAnalyze = async () => {
    try {
      setError(null);
      setAppState('analyzing');
      setAnalysisSteps([{ text: 'Connecting to Gemma 4 Intelligence Core...', type: 'info' }]);
      
      const res = await fetch('http://localhost:5000/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, message: 'Analyze this website for bugs and improvements.' })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to analyze site');

      setAnalysisSteps(data.steps || []);
      setAnalysisResult(data.response);
      setAppState('complete');
    } catch (err) {
      setError(err.message);
      setAppState('recovered');
    }
  };

  const handleFix = async () => {
    try {
      setError(null);
      setAppState('fixing');
      setAnalysisSteps([{ text: 'Initializing Auto-Fix Protocol...', type: 'info' }]);
      
      const res = await fetch('http://localhost:5000/api/agent/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, message: 'Fix the issues identified in the report.' })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fix site');

      setAnalysisSteps(data.steps || []);
      setFixResult(data.response);
      setAppState('fixed');
    } catch (err) {
      setError(err.message);
      setAppState('complete');
    }
  };

  const springConfig = { type: "spring", stiffness: 300, damping: 30 };

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-300 font-sans selection:bg-white selection:text-black overflow-x-hidden relative">
      
      {/* Smooth Water Background */}
      <div className="bg-liquid-1"></div>
      <div className="bg-liquid-2"></div>

      {/* Sleek Header */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springConfig}
        className="fixed top-0 w-full z-50 px-6 py-4"
      >
        <div className="max-w-[90rem] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
              <Command className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight text-lg">SiteScoop</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span className="text-xs font-medium text-zinc-400">Gemma 4 Online</span>
          </div>
        </div>
      </motion.nav>

      <main className="max-w-[90rem] mx-auto px-6 pt-32 pb-12 relative z-10">
        
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-12 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-4 items-start backdrop-blur-xl max-w-4xl mx-auto"
            >
              <div className="bg-red-500/20 p-2 rounded-full">
                <RefreshCcw className="w-4 h-4 text-red-400" />
              </div>
              <div className="pt-1">
                <h3 className="text-red-200 font-medium mb-1 text-sm">System Error</h3>
                <p className="text-red-400/80 text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 1: Premium Landing / Recovery */}
        <AnimatePresence mode="wait">
          {(appState === 'landing' || appState === 'recovering' || appState === 'recovered') && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl mx-auto mt-10"
            >
              {appState === 'landing' && (
                <div className="text-center mb-16 z-10 relative">
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-300 mb-8 backdrop-blur-md shadow-xl">
                    <Sparkles className="w-3.5 h-3.5 text-white" /> Intelligence Platform
                  </motion.div>
                  
                  <h1 className="text-5xl md:text-7xl font-semibold text-white mb-6 tracking-tight leading-tight flex flex-wrap justify-center gap-x-4">
                    {["Analyze", "and", "fix", "deployed", "code."].map((word, idx) => (
                      <motion.span 
                        key={idx}
                        initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.2 + idx * 0.1, ...springConfig }}
                        className="inline-block"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </h1>

                  <motion.p 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1 }}
                    className="text-zinc-400 text-lg md:text-xl font-light"
                  >
                    Transform any URL into an isolated workspace and deploy autonomous AI to audit, refactor, and apply fixes in real-time.
                  </motion.p>
                </div>
              )}

              <motion.div 
                layoutId="main-card"
                whileHover={{ y: -15, scale: 1.02, transition: springConfig }}
                className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-3 shadow-2xl relative z-10"
              >
                {/* Wavy Blob Effect Behind Card */}
                <motion.div 
                  animate={{ 
                    borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 60% 30% 70% 40%", "40% 60% 70% 30% / 40% 50% 60% 50%"],
                  }}
                  transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                  className="absolute -inset-4 bg-white/5 blur-3xl -z-10 pointer-events-none"
                />

                <div className="bg-[#111111] rounded-[1.5rem] p-8 lg:p-10 border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row gap-4 mb-2">
                      <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                          <Globe className="w-5 h-5" />
                        </div>
                        <input 
                          type="text" 
                          disabled={appState !== 'landing'}
                          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl pl-12 pr-6 py-5 text-white text-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all disabled:opacity-50 font-light shadow-inner"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>
                      
                      {appState === 'landing' && (
                        <motion.button 
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleRecover}
                          className="bg-white text-black font-medium px-8 py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                        >
                          Recover <ArrowRight className="w-5 h-5" />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {(appState === 'recovering' || appState === 'recovered') && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="mt-8 pt-8 border-t border-white/5"
                      >
                        <div className="space-y-4">
                          {ingestStatus.map((step, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-4 text-sm font-medium">
                              {step.done ? (
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border border-white/20 border-t-white animate-spin"></div>
                              )}
                              <span className={step.done ? 'text-zinc-300' : 'text-zinc-500'}>{step.msg}</span>
                            </motion.div>
                          ))}
                        </div>

                        {appState === 'recovered' && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 flex flex-col items-center">
                            <motion.button 
                              whileHover={{ scale: 1.05, y: -5 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleAnalyze}
                              className="w-full bg-white text-black font-medium px-8 py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                            >
                              <Activity className="w-5 h-5" /> Deploy Analysis
                            </motion.button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 2 & 3: Minimal Layout */}
        <AnimatePresence>
          {(appState === 'analyzing' || appState === 'complete' || appState === 'fixing' || appState === 'fixed') && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]"
            >
              
              {/* LEFT: Sleek Terminal */}
              <div className="lg:col-span-3 flex flex-col h-full">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl flex flex-col h-full overflow-hidden p-2">
                  <div className="bg-[#111111] rounded-2xl flex-1 flex flex-col overflow-hidden border border-white/5">
                    <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Telemetry</span>
                      {(appState === 'analyzing' || appState === 'fixing') && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      )}
                    </div>
                    
                    <div ref={terminalRef} className="flex-1 overflow-y-auto p-5 font-mono text-xs space-y-4 text-zinc-400">
                      {analysisSteps.map((step, idx) => {
                        if (step.type === 'tool_call') {
                          return (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className="flex flex-col gap-1.5 pb-2 border-b border-white/5">
                              <div className="text-zinc-300 font-medium">{step.toolName}</div>
                              <div className="text-zinc-600 truncate">{JSON.stringify(step.arguments)}</div>
                            </motion.div>
                          );
                        }
                        if (step.type === 'final_response') {
                          return (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={idx} className="pt-4 text-white font-medium">
                              Process complete.
                            </motion.div>
                          );
                        }
                        if (step.type === 'info') {
                          return <div key={idx} className="text-zinc-600 italic pb-2">{step.text}</div>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Report / Preview */}
              <div className="lg:col-span-9 h-full">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl h-full flex flex-col p-2">
                  <div className="bg-[#111111] rounded-2xl flex-1 flex flex-col overflow-hidden border border-white/5 relative">
                    
                    <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          {appState === 'fixed' || appState === 'fixing' ? <Globe className="w-4 h-4 text-white" /> : <Shield className="w-4 h-4 text-white" />}
                        </div>
                        <h2 className="text-xl font-medium text-white">
                          {appState === 'fixed' || appState === 'fixing' ? 'Live Deployment' : 'Intelligence Report'}
                        </h2>
                      </div>
                      
                      {appState === 'complete' && (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleFix}
                          className="bg-white text-black font-medium px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
                        >
                          <Wand2 className="w-4 h-4" /> Auto-Fix Issues
                        </motion.button>
                      )}
                      {appState === 'fixed' && (
                        <div className="flex items-center gap-2 text-zinc-400 font-medium text-sm bg-white/5 px-4 py-2 rounded-xl">
                          Deployed Successfully
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto relative bg-[#0a0a0a]">
                      {appState === 'analyzing' ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-4">
                          <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                          <p className="font-mono text-xs uppercase tracking-widest">Synthesizing...</p>
                        </div>
                      ) : appState === 'complete' ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="markdown-body custom-markdown p-8 lg:p-12 max-w-4xl mx-auto">
                          <ReactMarkdown>{analysisResult}</ReactMarkdown>
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative bg-white">
                          {appState === 'fixing' && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                               <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin mb-4"></div>
                               <h3 className="text-black font-medium text-sm tracking-widest uppercase">Applying Fixes...</h3>
                            </div>
                          )}
                          <iframe 
                            src={`http://localhost:5000/preview/${siteId}/index.html`}
                            className="w-full h-full border-none"
                            title="Live Preview"
                          />
                        </motion.div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
