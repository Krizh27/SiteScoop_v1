import React, { useState, useEffect } from 'react';
import { getAIStatus, testAI } from '../../services/aiApi';
import { Cpu, RefreshCw, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const AIDeveloperPanel = () => {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [prompt, setPrompt] = useState('Explain your role in SiteScoop AI in 3 concise bullet points.');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await getAIStatus();
      setStatus(data);
    } catch (err) {
      setStatus({
        success: false,
        ollama: { available: false },
        model: 'Unknown',
        error: { message: err.message }
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTest = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || testing) return;

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testAI(prompt.trim());
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: { message: err.message || 'Request failed' }
      });
    } finally {
      setTesting(false);
    }
  };

  const isConnected = status?.ollama?.available;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="text-blue-600" size={18} />
          <span className="font-semibold text-gray-800 text-sm">Local Gemma AI</span>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loadingStatus}
          title="Refresh AI Status"
          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loadingStatus ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Status Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            AI Subsystem Status
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Ollama:</span>
            {loadingStatus ? (
              <span className="text-xs text-gray-400">Checking...</span>
            ) : isConnected ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 size={12} /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertCircle size={12} /> Offline
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Model:</span>
            <span className="font-mono text-xs text-gray-800 font-medium bg-white px-2 py-0.5 rounded border border-gray-200">
              {status?.model || 'gemma4:e2b'}
            </span>
          </div>

          {!isConnected && !loadingStatus && (
            <p className="text-xs text-amber-600 pt-1 leading-relaxed">
              {status?.error?.message || 'Ollama is offline. Start Ollama and pull the configured model.'}
            </p>
          )}
        </div>

        {/* Developer Test Prompt Form */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={14} className="text-blue-500" />
              Dev Test Prompt
            </label>
            <span className="text-[10px] text-gray-400">POST /api/ai/test</span>
          </div>

          <form onSubmit={handleTest} className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Enter prompt for Gemma..."
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
            />

            <button
              type="submit"
              disabled={testing || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send size={13} />
                  Send Test Prompt
                </>
              )}
            </button>
          </form>

          {/* Test Response Display */}
          {testResult && (
            <div className="mt-3 p-3 rounded-lg border text-xs space-y-2 bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">
                  {testResult.success ? 'Model Response' : 'Error'}
                </span>
                {testResult.model && (
                  <span className="font-mono text-[10px] text-gray-500">{testResult.model}</span>
                )}
              </div>

              {testResult.success ? (
                <div className="text-gray-800 whitespace-pre-wrap font-sans leading-relaxed bg-white p-2.5 rounded border border-gray-100 max-h-60 overflow-y-auto">
                  {testResult.response || testResult.content}
                </div>
              ) : (
                <div className="text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                  <span className="font-semibold">
                    {testResult.error?.code || 'Error'}:
                  </span>{' '}
                  {testResult.error?.message || 'Test failed'}
                </div>
              )}

              {testResult.usage && (
                <div className="text-[10px] text-gray-400 flex gap-3 pt-1">
                  <span>Prompt: {testResult.usage.promptTokens ?? 'N/A'} tokens</span>
                  <span>Completion: {testResult.usage.completionTokens ?? 'N/A'} tokens</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stage Scope Boundary Note */}
        <div className="border-t border-gray-100 pt-3 text-[11px] text-gray-400 leading-normal">
          <p className="font-medium text-gray-500 mb-1">Stage 4 Architecture:</p>
          <p>
            Connected to local Gemma through Ollama model adapter. Tool calling and autonomous loops are disabled until Stage 5.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIDeveloperPanel;
