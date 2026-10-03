import React, { useState, useEffect } from 'react';
import { runAgent, applyChange, revertChange, getChange } from '../../services/agentApi';
import DiffModal from './DiffModal';
import {
  Bot,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Wrench,
  Check,
  Undo2,
  Eye,
  Sparkles
} from 'lucide-react';

const AgentPanel = ({ projectId, onEditApplied, onSelectFile }) => {
  const [prompt, setPrompt] = useState('Inspect this project and find one concrete frontend issue I can safely fix.');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // Pending change & Diff Modal state
  const [activeChange, setActiveChange] = useState(null);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState(null);

  const handleRun = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || running || !projectId) return;

    setRunning(true);
    setResult(null);
    setApplySuccessMsg(null);

    try {
      const res = await runAgent(projectId, prompt.trim());
      setResult(res);

      // If a change was proposed, fetch full diff
      if (res?.change?.changeId) {
        const fullChangeRes = await getChange(res.change.changeId);
        if (fullChangeRes?.success && fullChangeRes.change) {
          setActiveChange(fullChangeRes.change);
        } else {
          setActiveChange(res.change);
        }
      }
    } catch (err) {
      setResult({
        success: false,
        error: { message: err.message || 'Execution error' }
      });
    } finally {
      setRunning(false);
    }
  };

  const handleApplyFix = async (changeId) => {
    if (!changeId || applying) return;
    setApplying(true);
    setApplySuccessMsg(null);

    try {
      const res = await applyChange(changeId);
      if (res.success) {
        setApplySuccessMsg('✓ Change applied successfully');
        if (activeChange) {
          setActiveChange({ ...activeChange, status: 'applied' });
        }
        setIsDiffOpen(false);
        if (onEditApplied) {
          onEditApplied(activeChange || { changeId });
        }
      } else {
        alert(`Apply failed: ${res.error?.message || 'Error'}`);
      }
    } catch (err) {
      alert(`Apply error: ${err.message}`);
    } finally {
      setApplying(false);
    }
  };

  const handleRevert = async (changeId) => {
    if (!changeId || reverting) return;
    setReverting(true);

    try {
      const res = await revertChange(changeId);
      if (res.success) {
        setApplySuccessMsg('✓ Change reverted to original state');
        if (activeChange) {
          setActiveChange({ ...activeChange, status: 'reverted' });
        }
        if (onEditApplied) {
          onEditApplied(activeChange || { changeId });
        }
      } else {
        alert(`Revert failed: ${res.error?.message || 'Error'}`);
      }
    } catch (err) {
      alert(`Revert error: ${err.message}`);
    } finally {
      setReverting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Bot className="text-blue-600" size={18} />
          <span className="font-semibold text-gray-800 text-sm">SiteScoop AI Agent</span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          gemma4
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Input Form */}
        <form onSubmit={handleRun} className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
            Ask SiteScoop AI
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Ask the AI to inspect, find issues, or propose fixes..."
            className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
          />

          <button
            type="submit"
            disabled={running || !prompt.trim() || !projectId}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {running ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                AI Inspecting & Reasoning...
              </>
            ) : (
              <>
                <Play size={13} />
                Run
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Script Shortcuts */}
        <div className="pt-1">
          <div className="text-[10px] text-gray-400 font-medium mb-1.5 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" /> Demo Actions:
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                setPrompt('Inspect this project and find one concrete frontend issue I can safely fix.');
              }}
              className="text-[11px] bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-left transition-colors"
            >
              1. 🔍 Inspect project for concrete issues
            </button>
            <button
              onClick={() => {
                setPrompt('Fix that issue by proposing the viewport meta tag in index.html.');
              }}
              className="text-[11px] bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-left transition-colors"
            >
              2. 🛠️ Fix that issue (propose edit)
            </button>
          </div>
        </div>

        {/* Tool Activity Checklist */}
        {result?.toolCalls && result.toolCalls.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Wrench size={11} className="text-gray-400" />
              Inspection Activity:
            </div>
            <div className="space-y-1">
              {result.toolCalls.map((tc, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-emerald-700 font-mono">
                  <Check size={13} className="text-emerald-500 shrink-0" />
                  <span>{tc.tool}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Answer */}
        {result?.answer && (
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              AI Assessment:
            </div>
            <div className="text-xs text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
              {result.answer}
            </div>
          </div>
        )}

        {/* Proposed Change Card */}
        {activeChange && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <FileCode size={13} className="text-amber-600" />
                AI Proposed Change
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase ${
                activeChange.status === 'applied'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : activeChange.status === 'reverted'
                  ? 'bg-gray-100 text-gray-700 border border-gray-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {activeChange.status}
              </span>
            </div>

            <div className="text-xs">
              <div
                onClick={() => onSelectFile && onSelectFile(activeChange.path)}
                className="font-mono font-semibold text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                title="Open in editor"
              >
                {activeChange.path}
              </div>
              <p className="text-gray-600 mt-1 text-[11px]">{activeChange.reason}</p>
            </div>

            {applySuccessMsg && (
              <div className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 rounded p-2 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                {applySuccessMsg}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsDiffOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors shadow-xs"
              >
                <Eye size={13} />
                View Diff
              </button>

              {activeChange.status !== 'applied' ? (
                <button
                  onClick={() => handleApplyFix(activeChange.changeId)}
                  disabled={applying}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  <Check size={13} />
                  {applying ? 'Applying...' : 'Apply Fix'}
                </button>
              ) : (
                <button
                  onClick={() => handleRevert(activeChange.changeId)}
                  disabled={reverting}
                  className="flex items-center justify-center gap-1 py-1.5 px-2.5 text-xs font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                  title="Undo and restore original content"
                >
                  <Undo2 size={12} />
                  {reverting ? 'Reverting...' : 'Undo'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {result?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <AlertCircle size={13} />
              {result.error.code || 'Execution Error'}
            </div>
            <p>{result.error.message}</p>
          </div>
        )}
      </div>

      {/* Safety Policy Boundary */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-[11px] text-gray-500 leading-tight">
        <span className="font-semibold text-gray-700">Safety Model: </span>
        Gemma cannot write files directly. It generates proposed diffs; changes only apply upon your approval.
      </div>

      {/* Diff Modal */}
      <DiffModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        change={activeChange}
        onApply={handleApplyFix}
        applying={applying}
      />
    </div>
  );
};

export default AgentPanel;
