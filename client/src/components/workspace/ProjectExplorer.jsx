import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import FileTree from './FileTree';
import FileViewer from './FileViewer';
import RecoveryReport from './RecoveryReport';
import AgentPanel from '../agent/AgentPanel';
import InspectorPanel from '../inspector/InspectorPanel';
import { getFileTree } from '../../services/workspaceApi';
import { ArrowLeft, FileText, Info, ShieldAlert, Globe, Code, ExternalLink, RotateCw } from 'lucide-react';

const ProjectExplorer = () => {
  const { projectId } = useParams();
  const [tree, setTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('viewer'); // 'viewer' | 'preview' | 'inspector' | 'report'
  const [refreshKey, setRefreshKey] = useState(0);

  const loadTree = useCallback(() => {
    getFileTree(projectId)
      .then((data) => {
        setTree(data);
        // Default to index.html if no file selected
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

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="font-bold text-gray-800 text-sm md:text-base">Workspace Explorer</h1>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono font-medium border border-gray-200">
            {projectId}
          </span>
        </div>

        {/* Center / Right Mode Navigation */}
        <div className="flex items-center gap-2">
          {/* Code vs Preview Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('viewer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'viewer'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code size={14} />
              Code
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe size={14} />
              Live Preview
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 mx-1"></div>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'inspector'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShieldAlert size={14} />
            AI Inspection
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'report'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Info size={14} />
            Recovery Report
          </button>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: File Tree */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
            <span>Project Files</span>
            <button
              onClick={loadTree}
              title="Refresh file tree"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCw size={13} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <FileTree tree={tree} onSelectFile={handleSelectFile} selectedFile={selectedFile} />
          </div>
        </div>

        {/* Center Column: Viewer / Preview / Inspector / Report */}
        <div className="flex-1 bg-white border-r border-gray-200 flex flex-col min-w-0 overflow-hidden relative">
          {activeTab === 'preview' ? (
            <div className="flex flex-col h-full bg-gray-900">
              {/* Preview Bar */}
              <div className="px-4 py-2 bg-gray-800 text-gray-200 flex items-center justify-between text-xs border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-mono text-gray-300">Live Preview: index.html</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setRefreshKey((k) => k + 1)}
                    className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
                    title="Reload Preview"
                  >
                    <RotateCw size={13} />
                    <span>Reload</span>
                  </button>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>Open in new tab</span>
                  </a>
                </div>
              </div>

              {/* Preview Iframe */}
              <iframe
                key={`preview-${projectId}-${refreshKey}`}
                src={previewUrl}
                title="Recovered Website Preview"
                className="w-full flex-1 border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          ) : activeTab === 'inspector' ? (
            <InspectorPanel
              projectId={projectId}
              onSelectFile={handleSelectFileByPath}
            />
          ) : activeTab === 'report' ? (
            <RecoveryReport projectId={projectId} />
          ) : (
            <FileViewer
              projectId={projectId}
              fileNode={selectedFile}
              refreshKey={refreshKey}
            />
          )}
        </div>

        {/* Right Column: AI Agent Panel */}
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

