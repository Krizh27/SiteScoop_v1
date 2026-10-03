import React, { useState, useEffect } from 'react';
import {
  fetchProjectFiles,
  fetchFileContent,
  saveFileContent,
  editProjectWithAgent,
  getProjectPreviewUrl
} from '../services/api.js';

export default function AgentStudio({ projectId, websiteTitle }) {
  // File explorer & Editor state
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('index.html');
  const [fileContent, setFileContent] = useState('');
  const [isEditorLoading, setIsEditorLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fileError, setFileError] = useState(null);

  // Tab & Live Preview state
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [iframeKey, setIframeKey] = useState(Date.now());
  const previewUrl = getProjectPreviewUrl(projectId);

  // Agent Harness state
  const [instruction, setInstruction] = useState('');
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [agentError, setAgentError] = useState(null);

  // Load project file tree
  const loadFiles = async (preferredFile) => {
    if (!projectId) return;
    try {
      setFileError(null);
      const res = await fetchProjectFiles(projectId);
      if (res.success && Array.isArray(res.files)) {
        setFiles(res.files);
        const target = preferredFile || (res.files.some(f => f.path === 'index.html') ? 'index.html' : res.files[0]?.path);
        if (target) {
          loadFile(target);
        }
      }
    } catch (err) {
      setFileError(err.message || 'Failed to list project files');
    }
  };

  // Load specific file content
  const loadFile = async (filePath) => {
    if (!projectId || !filePath) return;
    setIsEditorLoading(true);
    setFileError(null);
    setSaveSuccess(false);
    try {
      const res = await fetchFileContent(projectId, filePath);
      setSelectedFile(filePath);
      setFileContent(res.content || '');
    } catch (err) {
      setFileError(`Failed to load "${filePath}": ${err.message}`);
    } finally {
      setIsEditorLoading(false);
    }
  };

  // Save manual edits
  const handleSaveFile = async () => {
    if (!projectId || !selectedFile) return;
    setIsSaving(true);
    setFileError(null);
    setSaveSuccess(false);
    try {
      await saveFileContent(projectId, selectedFile, fileContent);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadFiles(selectedFile);
      // Refresh live preview on port 5050
      setIframeKey(Date.now());
    } catch (err) {
      setFileError(`Failed to save "${selectedFile}": ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Run Autonomous Agent Harness
  const handleRunAgent = async (e) => {
    e?.preventDefault();
    const promptText = instruction.trim();
    if (!projectId || !promptText) return;

    setIsAgentRunning(true);
    setAgentError(null);
    setAgentResult(null);

    try {
      const result = await editProjectWithAgent(projectId, promptText);
      setAgentResult(result);
      // Refresh live preview on port 5050 and reload files
      setIframeKey(Date.now());
      await loadFiles(selectedFile);
      if (result.modifiedFiles?.includes(selectedFile)) {
        await loadFile(selectedFile);
      }
    } catch (err) {
      setAgentError(err.message || 'Agent failed to execute. Verify Ollama is running.');
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (projectId) {
      loadFiles();
    }
  }, [projectId]);

  const presetInstructions = [
    'In index.html, add dark theme CSS styling and a dark mode toggle button',
    'In index.html, add a clean responsive footer with "Recovered by SiteScoop AI"',
    'Modernize the typography and layout styling in index.html'
  ];

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 shadow-2xl overflow-hidden mt-6">
      {/* Top Banner Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-violet-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Autonomous Agent Studio
              <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CRUD Tools Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Gemma can inspect, read, and write project files directly in your sandbox workspace.
            </p>
          </div>
        </div>

        {/* Live Preview Button & Project Tag */}
        <div className="flex items-center gap-2.5">
          <a
            id="open-live-preview-header-btn"
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open changed project live on port 5050 in a new browser tab"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all select-none border border-emerald-400/30"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            <span>Live on Port 5050 ↗</span>
          </a>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span className="text-slate-500">Project:</span>
            <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-indigo-300 truncate max-w-[140px]">
              {projectId}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Left Column: Autonomous Agent Harness Controller (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 space-y-5 bg-slate-950/40">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="agent-instruction-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Agent Instruction
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Multi-turn tool loop</span>
            </div>

            <textarea
              id="agent-instruction-input"
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. In index.html, add dark theme CSS styling and a toggle button..."
              disabled={isAgentRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans disabled:opacity-50 resize-none"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-1.5">Quick Presets:</p>
            <div className="flex flex-col gap-1.5">
              {presetInstructions.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInstruction(preset)}
                  disabled={isAgentRunning}
                  className="text-left text-[11px] text-slate-300 hover:text-indigo-300 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 rounded-lg px-2.5 py-1.5 transition-all truncate"
                >
                  ⚡ {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Run Agent Action Button */}
          <button
            id="run-agent-btn"
            type="button"
            onClick={handleRunAgent}
            disabled={isAgentRunning || !instruction.trim()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 select-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAgentRunning ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
                <span>Gemma is executing CRUD edits...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span>Execute Agent Edit</span>
              </>
            )}
          </button>

          {/* Running Status Note */}
          {isAgentRunning && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3 text-[11px] text-indigo-300 flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>Running local multi-turn CRUD tool loop on CPU (please allow 30–90 seconds)...</span>
            </div>
          )}

          {/* Agent Error Notification */}
          {agentError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex flex-col gap-1.5">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <span className="font-semibold text-rose-200">Agent Execution Notice: </span>
                  {agentError}
                </div>
              </div>
              {agentError.toLowerCase().includes('time') && (
                <p className="text-[11px] text-rose-300/80 pl-6">
                  Tip: Local CPU models generate faster with targeted instructions (e.g. click one of the quick presets above).
                </p>
              )}
            </div>
          )}

          {/* Agent Execution Timeline & Results */}
          {agentResult && (
            <div className="rounded-xl border border-indigo-500/30 bg-slate-900/90 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Completed in {agentResult.turnsExecuted} turn{agentResult.turnsExecuted > 1 ? 's' : ''}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {agentResult.model}
                </span>
              </div>

              {/* Direct Link to Live Preview on Port 5050 */}
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>🌐 View Changed Site Live on Port 5050</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>

              {/* Modified Files Badges */}
              {agentResult.modifiedFiles?.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                    Modified Files:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {agentResult.modifiedFiles.map((file, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setActiveTab('editor');
                          loadFile(file);
                        }}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80 transition-all"
                      >
                        ✓ {file}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Executed Tools Sequence */}
              {agentResult.executedTools?.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                    Tools Executed:
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {agentResult.executedTools.map((t, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] font-mono bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-300 flex items-center justify-between"
                      >
                        <span className="text-indigo-400 font-semibold">
                          #{t.turn} {t.name}()
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {t.args?.filePath || Object.keys(t.args || {}).join(', ') || 'ok'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent Final Summary */}
              {agentResult.summary && (
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-[11px] font-semibold text-slate-400 mb-1">Agent Summary:</p>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {agentResult.summary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Live Preview Tabs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950/70 min-h-[520px]">
          {/* Main Mode Switcher: Code Editor vs. Live Preview (Port 5050) */}
          <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                id="tab-code-editor-btn"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📝 Code Editor</span>
              </button>

              <button
                type="button"
                id="tab-live-preview-btn"
                onClick={() => {
                  setActiveTab('preview');
                  setIframeKey(Date.now());
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Preview (Port 5050)</span>
              </button>
            </div>

            {/* Direct Open in New Tab Button */}
            <a
              id="open-port-5050-btn"
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full-screen on port 5050 in a new browser tab"
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 transition-all shrink-0"
            >
              <span className="font-mono text-emerald-400 font-semibold">:5050</span>
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>

          {activeTab === 'editor' ? (
            <>
              {/* File Explorer Bar */}
              <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                    Files:
                  </span>
                  {files.map((file) => {
                    const isSelected = selectedFile === file.path;
                    return (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => loadFile(file.path)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-semibold shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <span>{file.path.endsWith('.html') ? '📄' : file.path.endsWith('.css') ? '🎨' : '⚡'}</span>
                        <span>{file.path}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => loadFiles(selectedFile)}
                  title="Refresh project files from disk"
                  className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                </button>
              </div>

              {/* Editor Header Info & Save Action */}
              <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-300 font-medium">{selectedFile}</span>
                  {saveSuccess && (
                    <span className="text-[11px] text-emerald-400 font-medium animate-pulse">
                      ✓ Saved to disk &amp; preview updated
                    </span>
                  )}
                </div>

                <button
                  id="save-code-btn"
                  type="button"
                  onClick={handleSaveFile}
                  disabled={isSaving || isEditorLoading}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      <span>Save Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Editor Textarea */}
              <div className="relative flex-1 p-3">
                {isEditorLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10 text-slate-400 text-xs">
                    Loading file content...
                  </div>
                ) : null}

                <textarea
                  id="code-editor-textarea"
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  spellCheck={false}
                  className="w-full h-full min-h-[380px] bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs sm:text-sm font-mono text-emerald-300/90 leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none selection:bg-indigo-600/40"
                />
              </div>

              {fileError && (
                <div className="p-3 bg-rose-950/40 border-t border-rose-500/30 text-rose-300 text-xs">
                  {fileError}
                </div>
              )}
            </>
          ) : (
            /* Live Preview Viewport (Port 5050) */
            <div className="flex-1 flex flex-col">
              {/* Browser Address Bar Mockup */}
              <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-950 border border-slate-800 rounded px-2.5 py-1 font-mono text-[11px] text-slate-300 truncate">
                  <span className="text-emerald-400 font-bold">http://</span>
                  <span className="truncate">localhost:5050/projects/{projectId}/</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIframeKey(Date.now())}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 border border-slate-700 transition-all"
                  >
                    <svg className="w-3 h-3 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    <span>Refresh</span>
                  </button>

                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow transition-all"
                  >
                    <span>Pop Out ↗</span>
                  </a>
                </div>
              </div>

              {/* Interactive Iframe */}
              <div className="relative flex-1 min-h-[460px] bg-white">
                <iframe
                  key={iframeKey}
                  src={previewUrl}
                  title={`Live Preview of ${projectId}`}
                  className="w-full h-full min-h-[460px] border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
