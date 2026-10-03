import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import FileTree from './FileTree';
import FileViewer from './FileViewer';
import RecoveryReport from './RecoveryReport';
import AgentPanel from '../agent/AgentPanel';
import InspectorPanel from '../inspector/InspectorPanel';
import { getFileTree, getRecoveryReport } from '../../services/workspaceApi';
import { getAIStatus } from '../../services/aiApi';
import {
  ArrowLeft,
  FileCode,
  Globe,
  Code2,
  ShieldAlert,
  Info,
  RotateCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';

const ProjectExplorer = () => {
  const { projectId } = useParams();
  const [tree, setTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('viewer'); // 'viewer' | 'preview' | 'inspector' | 'report'
  const [refreshKey, setRefreshKey] = useState(0);

  // Stage 4: Ollama / Gemma AI runtime status
  const [aiStatus, setAiStatus] = useState({ available: false, model: 'Gemma 4 E2B' });

  // Recovery quick stats for left sidebar bottom card
  const [reportSummary, setReportSummary] = useState(null);

  const iframeRef = useRef(null);

  const loadTree = useCallback(() => {
    getFileTree(projectId)
      .then((data) => {
        setTree(data);
        if (!selectedFile && data && data.length > 0) {
          const indexNode = data.find((n) => n.name === 'index.html');
          if (indexNode) {
            setSelectedFile(indexNode);
          } else if (data[0].type === 'file') {
            setSelectedFile(data[0]);
          }
        }
      })
      .catch(console.error);
  }, [projectId, selectedFile]);

  useEffect(() => {
    loadTree();

    // Check Stage 4 AI status
    getAIStatus()
      .then((res) => {
        if (res.success && res.ollama?.available) {
          setAiStatus({
            available: true,
            model: res.model ? res.model.replace(':', ' ').toUpperCase() : 'Gemma 4 E2B'
          });
        } else {
          setAiStatus({ available: false, model: 'Gemma unavailable' });
        }
      })
      .catch(() => {
        setAiStatus({ available: false, model: 'Gemma unavailable' });
      });

    // Load recovery report summary
    getRecoveryReport(projectId)
      .then((rep) => setReportSummary(rep))
      .catch(() => {});
  }, [projectId]);

  const handleSelectFile = (node) => {
    setSelectedFile(node);
    setActiveTab('viewer');
  };

  const handleSelectFileByPath = (filePath) => {
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fileName = cleanPath.split('/').pop();
    setSelectedFile({
      path: cleanPath,
      name: fileName,
      type: 'file'
    });
    setActiveTab('viewer');
  };

  const handleEditApplied = (change) => {
    setRefreshKey((k) => k + 1);
    loadTree();
    if (change?.path) {
      handleSelectFileByPath(change.path);
    }
  };

  const previewUrl = `http://localhost:5000/api/workspace/projects/${projectId}/preview`;

  const handleReloadIframe = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col h-screen bg-canvas overflow-hidden font-sans text-ink selection:bg-purple-100 selection:text-purple-900">
      {/* Header — Stage 2 & 4 Minimal Design */}
      <header className="bg-white border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0 shadow-clean">
        {/* Left: Brand / Back */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-ink hover:text-brand-600 transition-colors"
            title="Return to Dashboard"
          >
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center text-white shadow-xs">
              <span className="text-[10px] font-black tracking-tighter">◉</span>
            </div>
            <span className="font-extrabold text-sm tracking-tight text-ink">SiteScoop AI</span>
          </Link>

          <div className="h-4 w-px bg-border"></div>

          {/* Center-Left: Project Name */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-subtle border border-border text-ink">
              {projectId}
            </span>
            {projectId === 'demo-site' && (
              <span className="text-[10px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200 font-medium">
                Seeded Demo
              </span>
            )}
          </div>
        </div>

        {/* Center: Primary Mode Controls */}
        <div className="flex items-center gap-1.5 bg-subtle p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('viewer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'viewer'
                ? 'bg-white text-ink shadow-clean'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Code2 size={14} />
            <span>Code</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'preview'
                ? 'bg-emerald-600 text-white shadow-clean'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Globe size={14} />
            <span>Preview</span>
          </button>

          <div className="h-3.5 w-px bg-border mx-0.5"></div>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'inspector'
                ? 'bg-brand-600 text-white shadow-clean'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <ShieldAlert size={14} />
            <span>AI Inspection</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'report'
                ? 'bg-white text-ink shadow-clean'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Info size={14} />
            <span>Report</span>
          </button>
        </div>

        {/* Right: Stage 4 Ollama / Gemma AI Runtime Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-canvas border border-border text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                aiStatus.available ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            ></span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="font-semibold text-ink">
                {aiStatus.available ? '● Ollama' : '○ Offline'}
              </span>
              <span className="text-ink-muted">·</span>
              <span className="text-ink-muted">{aiStatus.model}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* ================= LEFT COLUMN: Project & File Tree ================= */}
        <div className="w-64 bg-white border-r border-border flex flex-col shrink-0">
          {/* Project Title Bar */}
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="text-xs font-bold text-ink uppercase tracking-wider">
              Project Files
            </div>
            <button
              onClick={loadTree}
              title="Refresh project files"
              className="text-ink-muted hover:text-ink p-1 rounded hover:bg-subtle transition-colors"
            >
              <RotateCw size={12} />
            </button>
          </div>

          {/* File Tree */}
          <div className="flex-1 overflow-y-auto">
            <FileTree 
              tree={tree} 
              onSelectFile={handleSelectFile} 
              selectedFile={selectedFile} 
            />
          </div>

          {/* Bottom Recovery Summary Mini-Card */}
          {reportSummary && (
            <div className="p-3 border-t border-border bg-canvas text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-ink">Recovery Summary</span>
                <button
                  onClick={() => setActiveTab('report')}
                  className="text-brand-600 hover:underline font-medium text-[10px]"
                >
                  View full
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px]">
                <div className="p-1 bg-white border border-border rounded">
                  <div className="font-bold text-blue-600">{reportSummary.files?.html || 1}</div>
                  <div className="text-[9px] text-ink-muted">HTML</div>
                </div>
                <div className="p-1 bg-white border border-border rounded">
                  <div className="font-bold text-purple-600">{reportSummary.files?.css || 1}</div>
                  <div className="text-[9px] text-ink-muted">CSS</div>
                </div>
                <div className="p-1 bg-white border border-border rounded">
                  <div className="font-bold text-amber-600">{reportSummary.files?.javascript || 1}</div>
                  <div className="text-[9px] text-ink-muted">JS</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= CENTER COLUMN: Code / Preview / Inspector / Report ================= */}
        <div className="flex-1 bg-white border-r border-border flex flex-col min-w-0 overflow-hidden relative">
          {activeTab === 'preview' ? (
            /* Stage 9: Live Preview with browser chrome */
            <div className="flex flex-col h-full bg-canvas">
              {/* Browser Chrome Bar */}
              <div className="px-4 py-2 bg-white border-b border-border flex items-center justify-between gap-3 text-xs shrink-0 shadow-clean">
                {/* Navigation controls: ←  →  ↻ */}
                <div className="flex items-center gap-1 text-ink-muted">
                  <button 
                    onClick={() => iframeRef.current?.contentWindow?.history.back()}
                    className="p-1.5 rounded hover:bg-subtle text-ink-muted hover:text-ink transition-colors"
                    title="Back"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button 
                    onClick={() => iframeRef.current?.contentWindow?.history.forward()}
                    className="p-1.5 rounded hover:bg-subtle text-ink-muted hover:text-ink transition-colors"
                    title="Forward"
                  >
                    <ChevronRight size={15} />
                  </button>
                  <button 
                    onClick={handleReloadIframe}
                    className="p-1.5 rounded hover:bg-subtle text-ink-muted hover:text-ink transition-colors"
                    title="Reload site"
                  >
                    <RotateCw size={13} />
                  </button>
                </div>

                {/* URL Search / Address Pill */}
                <div className="flex-1 max-w-lg mx-auto bg-canvas border border-border rounded-lg px-3 py-1 flex items-center justify-between text-[11px] font-mono text-ink-muted">
                  <span className="truncate">{previewUrl}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                </div>

                {/* Open in new tab link */}
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 px-2 py-1 rounded hover:bg-brand-50 transition-colors font-medium shrink-0"
                >
                  <ExternalLink size={13} />
                  <span>Open tab</span>
                </a>
              </div>

              {/* Sandboxed Preview Iframe */}
              <iframe
                ref={iframeRef}
                key={`preview-${projectId}-${refreshKey}`}
                src={previewUrl}
                title="Recovered Website Preview"
                className="w-full flex-1 border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          ) : activeTab === 'inspector' ? (
            /* Stage 6: AI Project Inspector */
            <InspectorPanel
              projectId={projectId}
              onSelectFile={handleSelectFileByPath}
            />
          ) : activeTab === 'report' ? (
            /* Recovery Report */
            <RecoveryReport projectId={projectId} />
          ) : (
            /* Code Source Viewer */
            <FileViewer
              projectId={projectId}
              fileNode={selectedFile}
              refreshKey={refreshKey}
            />
          )}
        </div>

        {/* ================= RIGHT COLUMN: AI Agent Panel ================= */}
        <div className="w-96 flex flex-col shrink-0">
          <AgentPanel
            projectId={projectId}
            onEditApplied={handleEditApplied}
            onSelectFile={handleSelectFileByPath}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectExplorer;
