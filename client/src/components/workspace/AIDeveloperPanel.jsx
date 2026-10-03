import React, { useState, useEffect } from 'react';
import { getAgentStatus, runAgent } from '../../services/agentApi';
import { getAIStatus, testAI } from '../../services/aiApi';
import { Bot, RefreshCw, Send, CheckCircle2, AlertCircle, Play, Wrench, Sparkles, MessageSquare } from 'lucide-react';

const AIDeveloperPanel = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('agent'); // 'agent' | 'raw_model'
  
  // Status state
  const [agentStatus, setAgentStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Agent run state
  const [agentPrompt, setAgentPrompt] = useState('Explain the structure of this recovered website.');
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentResult, setAgentResult] = useState(null);

  // Raw model test state
  const [rawPrompt, setRawPrompt] = useState('Explain your role in SiteScoop AI in 3 concise bullet points.');
  const [testingRaw, setTestingRaw] = useState(false);
  const [rawResult, setRawResult] = useState(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await getAgentStatus();
      setAgentStatus(data);
    } catch (err) {
      setAgentStatus({
        success: false,
        agent: { enabled: false, mode: 'unknown' },
        model: 'Unknown',
        availableTools: 0,
        ollama: { available: false },
        error: { message: err.message }
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [projectId]);

  const handleRunAgent = async (e) => {
    e.preventDefault();
    if (!agentPrompt.trim() || runningAgent || !projectId) return;

    setRunningAgent(true);
    setAgentResult(null);

    try {
      const result = await runAgent(projectId, agentPrompt.trim());
      setAgentResult(result);
    } catch (err) {
      setAgentResult({
        success: false,
        status: 'failed',
        error: { message: err.message || 'Execution error' }
      });
    } finally {
      setRunningAgent(false);
    }
  };

  const handleTestRaw = async (e) => {
    e.preventDefault();
    if (!rawPrompt.trim() || testingRaw) return;

    setTestingRaw(true);
    setRawResult(null);

    try {
      const result = await testAI(rawPrompt.trim());
      setRawResult(result);
    } catch (err) {
      setRawResult({
        success: false,
        error: { message: err.message || 'Request failed' }
      });
    } finally {
      setTestingRaw(false);
    }
  };

  const isOllamaConnected = agentStatus?.ollama?.available;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="text-blue-600" size={18} />
          <span className="font-semibold text-gray-800 text-sm">SiteScoop Agent</span>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loadingStatus}
          title="Refresh Status"
          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loadingStatus ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 text-xs">
        <button
          onClick={() => setActiveTab('agent')}
          className={`flex-1 py-2 px-3 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'agent'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Agent Harness
        </button>
        <button
          onClick={() => setActiveTab('raw_model')}
          className={`flex-1 py-2 px-3 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'raw_model'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Raw Model (Stage 4)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status Mini-Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Ollama Status:</span>
            {loadingStatus ? (
              <span className="text-gray-400">Checking...</span>
            ) : isOllamaConnected ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 size={11} /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertCircle size={11} /> Offline
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Model:</span>
            <span className="font-mono text-gray-800 font-medium bg-white px-1.5 py-0.5 rounded border border-gray-200">
              {agentStatus?.model || 'gemma4:e2b'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Mode:</span>
            <span className="font-medium text-blue-600">Read-Only Safe Tools (6)</span>
          </div>
        </div>

        {/* Tab 1: Agent Harness */}
        {activeTab === 'agent' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Play size={13} className="text-blue-500" />
                Run Agent on Project
              </label>
            </div>

            <form onSubmit={handleRunAgent} className="space-y-2">
              <textarea
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                rows={3}
                placeholder="Ask the agent to inspect files, search, or explain..."
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
              />

              <button
                type="submit"
                disabled={runningAgent || !agentPrompt.trim() || !projectId}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {runningAgent ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Agent Reasoning & Running Tools...
                  </>
                ) : (
                  <>
                    <Play size={13} />
                    Run Agent
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Request Templates */}
            <div className="pt-1">
              <div className="text-[10px] text-gray-400 font-medium mb-1">Quick Demo Requests:</div>
              <div className="flex flex-wrap gap-1">
                {[
                  'Explain the structure of this recovered website.',
                  'Find where the homepage loads JavaScript.',
                  'What dependencies can you identify?',
                  'What resources failed during recovery?'
                ].map((template) => (
                  <button
                    key={template}
                    onClick={() => setAgentPrompt(template)}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors text-left"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Results Display */}
            {agentResult && (
              <div className="mt-3 p-3 rounded-lg border text-xs space-y-3 bg-gray-50 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700 flex items-center gap-1">
                    Status:
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                      agentResult.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : agentResult.status === 'needs_clarification'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {agentResult.status || (agentResult.success ? 'completed' : 'failed')}
                    </span>
                  </span>
                  {typeof agentResult.steps === 'number' && (
                    <span className="text-[10px] text-gray-400">
                      {agentResult.steps} {agentResult.steps === 1 ? 'step' : 'steps'}
                    </span>
                  )}
                </div>

                {/* Activity List: Tool names called */}
                {agentResult.toolCalls && agentResult.toolCalls.length > 0 && (
                  <div className="space-y-1 bg-white p-2 rounded border border-gray-100">
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Wrench size={11} className="text-gray-400" />
                      Tools Executed ({agentResult.toolCalls.length}):
                    </div>
                    <ul className="space-y-1">
                      {agentResult.toolCalls.map((tc, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 font-mono text-[11px] text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span>{tc.tool}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Final Answer / Clarification */}
                {agentResult.answer && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      Final Answer:
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap font-sans leading-relaxed bg-white p-2.5 rounded border border-gray-100 max-h-72 overflow-y-auto">
                      {agentResult.answer}
                    </div>
                  </div>
                )}

                {agentResult.question && (
                  <div className="space-y-1 bg-blue-50 p-2.5 rounded border border-blue-200">
                    <div className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare size={12} />
                      Clarification Needed:
                    </div>
                    <p className="text-blue-900 leading-relaxed font-sans">
                      {agentResult.question}
                    </p>
                  </div>
                )}

                {agentResult.error && (
                  <div className="text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                    <span className="font-semibold">{agentResult.error.code || 'Error'}:</span>{' '}
                    {agentResult.error.message || 'Agent operation failed'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Raw Model Test (Stage 4) */}
        {activeTab === 'raw_model' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={13} className="text-blue-500" />
                Raw Model Generation
              </label>
              <span className="text-[10px] text-gray-400">POST /api/ai/test</span>
            </div>

            <form onSubmit={handleTestRaw} className="space-y-2">
              <textarea
                value={rawPrompt}
                onChange={(e) => setRawPrompt(e.target.value)}
                rows={3}
                placeholder="Enter prompt for raw model..."
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
              />

              <button
                type="submit"
                disabled={testingRaw || !rawPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {testingRaw ? (
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

            {rawResult && (
              <div className="mt-3 p-3 rounded-lg border text-xs space-y-2 bg-gray-50 border-gray-200">
                <span className="font-semibold text-gray-700">
                  {rawResult.success ? 'Model Response' : 'Error'}
                </span>
                {rawResult.success ? (
                  <div className="text-gray-800 whitespace-pre-wrap font-sans leading-relaxed bg-white p-2.5 rounded border border-gray-100 max-h-60 overflow-y-auto">
                    {rawResult.response || rawResult.content}
                  </div>
                ) : (
                  <div className="text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                    <span className="font-semibold">{rawResult.error?.code || 'Error'}:</span>{' '}
                    {rawResult.error?.message || 'Test failed'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Security / Boundary Footer Note */}
        <div className="border-t border-gray-100 pt-3 text-[11px] text-gray-400 leading-normal">
          <p className="font-medium text-gray-500 mb-1">Stage 5 Safety Boundary:</p>
          <p>
            Agent operates strictly read-only. Gemma proposes actions via validated JSON, while Express authorizes and executes safe tools.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIDeveloperPanel;
