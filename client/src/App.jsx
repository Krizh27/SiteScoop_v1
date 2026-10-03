import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

function App() {
  const [url, setUrl] = useState('https://example.com');
  const [siteId, setSiteId] = useState(null);
  const [ingestStatus, setIngestStatus] = useState('');
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState(null);

  const handleRecover = async () => {
    try {
      setError(null);
      setSiteId(null);
      setIngestStatus('Recovering site...');
      setAnalysisResult(null);
      setSteps([]);
      
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
      setIngestStatus(`✓ Website recovered\n✓ HTML analyzed\n✓ Assets discovered\nSite ID: ${data.siteId}`);
    } catch (err) {
      setError(err.message);
      setIngestStatus('');
    }
  };

  const handleAnalyze = async () => {
    try {
      setError(null);
      setAnalysisStatus('Analyzing website with Gemma...');
      
      const res = await fetch('http://localhost:5000/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, message: 'Analyze this website for bugs and improvements.' })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze site');
      }

      setAnalysisStatus('✓ Analysis complete');
      setSteps(data.steps || []);
      setAnalysisResult(data.response);
    } catch (err) {
      setError(err.message);
      setAnalysisStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 font-sans p-8">
      <header className="max-w-4xl mx-auto mb-12 text-center border-b border-neutral-800 pb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">SiteScoop AI</h1>
        <p className="text-neutral-400">Recover, inspect and understand any deployed website.</p>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        {/* Input Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
          <label className="block text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Website URL</label>
          <div className="flex gap-4">
            <input 
              type="text" 
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <button 
              onClick={handleRecover}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg"
            >
              Recover Site
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
              ⚠ Error: {error}
            </div>
          )}

          {ingestStatus && (
            <div className="mt-6 p-4 bg-neutral-950 border border-neutral-800 rounded-lg whitespace-pre-line text-sm text-green-400 font-mono">
              {ingestStatus}
            </div>
          )}
        </div>

        {/* Action Section */}
        {siteId && !analysisResult && (
          <div className="text-center">
            <button 
              onClick={handleAnalyze}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg text-lg w-full max-w-md"
            >
              Analyze with Gemma
            </button>
          </div>
        )}

        {/* Analysis Status */}
        {analysisStatus && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Gemma Agent Activity
            </h2>
            <div className="space-y-3 font-mono text-sm text-neutral-400 bg-neutral-950 p-4 rounded-lg border border-neutral-800">
              <div className="text-purple-400">{analysisStatus}</div>
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-neutral-500">[{step.step}]</span>
                  {step.type === 'tool_call' && (
                    <span className="text-blue-400">🔧 Calling {step.toolName}...</span>
                  )}
                  {step.type === 'tool_result' && (
                    <span className="text-green-400">✓ {step.toolName} completed</span>
                  )}
                  {step.type === 'final_response' && (
                    <span className="text-white">📝 Generating final report</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {analysisResult && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Analysis Findings</h2>
            <div className="markdown-body">
              <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
