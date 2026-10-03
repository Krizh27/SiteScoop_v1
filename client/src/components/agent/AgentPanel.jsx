import React, { useState, useRef, useEffect } from 'react';
import { runAgent, applyChange, revertChange, getChange } from '../../services/agentApi';
import DiffModal from './DiffModal';
import {
  Sparkles,
  ArrowUp,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  Check,
  Undo2,
  Eye,
  Wrench,
  Search,
  MessageSquare
} from 'lucide-react';

const formatToolLabel = (toolName, input) => {
  if (toolName === 'list_project_files') return 'Read project files';
  if (toolName === 'read_file') {
    return input?.path ? `Inspected ${input.path}` : 'Read project source file';
  }
  if (toolName === 'search_project') return 'Searched codebase';
  if (toolName === 'get_recovery_report') return 'Checked recovery report';
  if (toolName === 'analyze_dependencies') return 'Analyzed package dependencies';
  if (toolName === 'propose_edit') return 'Prepared proposed edit';
  if (toolName === 'get_diff') return 'Generated code diff';
  return toolName;
};

const AgentPanel = ({ projectId, onEditApplied, onSelectFile, onTriggerInspect }) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);

  // Active proposed change & diff modal
  const [activeChange, setActiveChange] = useState(null);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, running, activeChange]);

  const handleSend = async (textToSend) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || running || !projectId) return;

    setInputPrompt('');
    setAppliedNotice(null);

    // Append user message
    const userMsg = { sender: 'user', text: prompt, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setRunning(true);

    try {
      const res = await runAgent(projectId, prompt);

      // If change proposed, fetch complete change & diff
      let proposedChangeData = null;
      if (res?.change?.changeId) {
        const fullChangeRes = await getChange(res.change.changeId);
        proposedChangeData = fullChangeRes?.success ? fullChangeRes.change : res.change;
        setActiveChange(proposedChangeData);
      }

      const agentMsg = {
        sender: 'agent',
        text: res.answer || res.question || (res.success ? 'Inspection completed.' : 'Execution failed.'),
        status: res.status,
        toolCalls: res.toolCalls || [],
        change: proposedChangeData,
        error: res.error,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `Failed to complete request: ${err.message}`,
          status: 'failed',
          timestamp: new Date()
        }
      ]);
    } finally {
      setRunning(false);
    }
  };

  const handleApplyFix = async (changeId) => {
    if (!changeId || applying) return;
    setApplying(true);

    try {
      const res = await applyChange(changeId);
      if (res.success) {
        setAppliedNotice({
          status: 'applied',
          path: activeChange?.path || 'file',
          message: `${activeChange?.path || 'File'} updated successfully.`
        });
        if (activeChange) {
          setActiveChange({ ...activeChange, status: 'applied' });
        }
        setIsDiffOpen(false);
        if (onEditApplied) {
          onEditApplied(activeChange || { changeId });
        }
      } else {
        alert(`Apply error: ${res.error?.message || 'Failed'}`);
      }
    } catch (err) {
      alert(`Error applying change: ${err.message}`);
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
        setAppliedNotice({
          status: 'reverted',
          path: activeChange?.path || 'file',
          message: `${activeChange?.path || 'File'} reverted to original content.`
        });
        if (activeChange) {
          setActiveChange({ ...activeChange, status: 'reverted' });
        }
        if (onEditApplied) {
          onEditApplied(activeChange || { changeId });
        }
      } else {
        alert(`Revert error: ${res.error?.message || 'Failed'}`);
      }
    } catch (err) {
      alert(`Error reverting: ${err.message}`);
    } finally {
      setReverting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-border select-none">
      {/* Header — Stage 5 Specification */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-canvas shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700">
            <Sparkles size={14} />
          </div>
          <div>
            <span className="font-bold text-ink text-xs block">SiteScoop Agent</span>
            <span className="text-[10px] text-ink-muted flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Gemma 4 E2B • Ready
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-ink-muted bg-white px-2 py-0.5 rounded border border-border">
          Read-Only Tools
        </span>
      </div>

      {/* Main Conversation & Activity Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {/* Empty State — Stage 5 */}
        {messages.length === 0 && !running && (
          <div className="py-8 px-2 text-center space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 mx-auto flex items-center justify-center text-brand-600 shadow-clean">
              <Sparkles size={20} />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Ask SiteScoop about this project
              </h4>
              <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
                Inspect the recovered project, find concrete issues, and prepare safe changes for your review.
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
              <button
                onClick={() => handleSend('Inspect this project and find one concrete frontend issue I can safely fix.')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-clean transition-all"
              >
                <Search size={13} />
                <span>Inspect Project</span>
              </button>

              <button
                onClick={() => handleSend('Fix that issue by proposing a responsive viewport meta tag in index.html.')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-subtle hover:bg-zinc-200 text-ink rounded-lg text-xs font-medium transition-colors"
              >
                <Wrench size={13} className="text-ink-muted" />
                <span>Prepare Fix for index.html</span>
              </button>
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, i) => (
          <div key={i} className="space-y-3">
            {/* User Bubble */}
            {msg.sender === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-zinc-900 text-white text-xs py-2 px-3.5 rounded-2xl rounded-tr-xs shadow-xs leading-relaxed font-sans">
                  {msg.text}
                </div>
              </div>
            ) : (
              /* Agent Message Container */
              <div className="space-y-2.5">
                {/* Stage 3: Tool Activity Checklist */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="bg-canvas border border-border rounded-xl p-3 space-y-1.5">
                    <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench size={11} className="text-brand-600" />
                      <span>Controlled Tools Executed ({msg.toolCalls.length})</span>
                    </div>
                    <div className="space-y-1 pt-0.5">
                      {msg.toolCalls.map((tc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-ink">
                          <Check size={13} className="text-emerald-600 shrink-0" />
                          <span className="font-medium text-[11px]">
                            {formatToolLabel(tc.tool, tc.input)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agent Text Response */}
                <div className="bg-subtle/80 border border-border/70 rounded-xl p-3.5 text-xs text-ink leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Live Running State */}
        {running && (
          <div className="p-3.5 bg-brand-50/50 border border-brand-100 rounded-xl text-xs space-y-2 text-brand-900">
            <div className="flex items-center gap-2 font-semibold">
              <RotateCw size={13} className="animate-spin text-brand-600" />
              <span>Gemma analyzing project evidence...</span>
            </div>
            <p className="text-[11px] text-brand-800 leading-relaxed">
              Evaluating recovered HTML, dependencies, and resources through validated tools.
            </p>
          </div>
        )}

        {/* Stage 7: AI Proposed Edit Card */}
        {activeChange && (
          <div className="bg-white border-2 border-brand-200 rounded-xl p-4 shadow-clean space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileCode size={14} className="text-brand-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800">
                  Proposed Change
                </span>
              </div>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase ${
                activeChange.status === 'applied'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {activeChange.status === 'applied' ? 'Applied' : 'Waiting Approval'}
              </span>
            </div>

            <div>
              <div 
                onClick={() => onSelectFile && onSelectFile(activeChange.path)}
                className="font-mono text-xs font-semibold text-brand-700 hover:underline cursor-pointer"
                title="View in editor"
              >
                {activeChange.path}
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                {activeChange.reason || 'Add responsive viewport metadata.'}
              </p>
            </div>

            {/* Explicit Notice Required by Stage 7 */}
            <div className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200/80 rounded-md px-2.5 py-1 font-medium">
              Proposed — waiting for your approval
            </div>

            {/* Diff Preview Snippet */}
            <div className="p-2.5 bg-zinc-950 rounded-lg font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed border border-zinc-800">
              <div className="text-zinc-500">// Proposed insertion:</div>
              <div>+ &lt;meta name="viewport"</div>
              <div>+ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;content="width=device-width, initial-scale=1.0"&gt;</div>
            </div>

            {/* Applied Notice */}
            {appliedNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-0.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>✓ Change applied</span>
                </div>
                <div className="text-[11px] text-emerald-700">{appliedNotice.message}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsDiffOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-ink bg-subtle hover:bg-zinc-200 rounded-lg transition-colors"
              >
                <Eye size={13} />
                <span>View Diff</span>
              </button>

              {activeChange.status !== 'applied' ? (
                <button
                  onClick={() => handleApplyFix(activeChange.changeId)}
                  disabled={applying}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-clean disabled:opacity-50"
                >
                  <Check size={13} />
                  <span>{applying ? 'Applying...' : 'Apply Fix'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleRevert(activeChange.changeId)}
                  disabled={reverting}
                  className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium text-ink-muted hover:text-ink bg-subtle hover:bg-zinc-200 rounded-lg transition-colors"
                  title="Undo and restore original file content"
                >
                  <Undo2 size={13} />
                  <span>{reverting ? 'Reverting...' : 'Undo'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Safety Policy Boundary Footnote */}
      <div className="px-4 py-2 bg-canvas border-t border-border/80 text-[10px] text-ink-muted flex items-center justify-between">
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-600" />
          <span>Sandboxed AI: Cannot write files without human approval.</span>
        </span>
      </div>

      {/* Chat / Prompt Input — Stage 5 Specification */}
      <div className="p-3 bg-white border-t border-border shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center bg-canvas border border-border rounded-xl focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all p-1"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask about this project..."
            disabled={running}
            className="flex-1 bg-transparent px-3 py-2 text-xs text-ink placeholder-zinc-400 outline-none font-sans"
          />

          <button
            type="submit"
            disabled={running || !inputPrompt.trim()}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-ink hover:bg-zinc-800 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            title="Send prompt"
          >
            <ArrowUp size={14} />
          </button>
        </form>
      </div>

      {/* Diff Review Modal */}
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
