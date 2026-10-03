import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import FileTree from './FileTree';
import FileViewer from './FileViewer';
import RecoveryReport from './RecoveryReport';
import { getFileTree } from '../../services/workspaceApi';
import { ArrowLeft, FileText, Info } from 'lucide-react';

const ProjectExplorer = () => {
  const { projectId } = useParams();
  const [tree, setTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showReport, setShowReport] = useState(true);

  useEffect(() => {
    getFileTree(projectId).then(setTree).catch(console.error);
  }, [projectId]);

  const handleSelectFile = (node) => {
    setSelectedFile(node);
    setShowReport(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="font-bold text-gray-800">Workspace Explorer</h1>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">{projectId}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowReport(true)}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${showReport ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Info size={16} />
            Report
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: File Tree */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Files
          </div>
          <div className="flex-1 overflow-hidden">
            <FileTree tree={tree} onSelectFile={handleSelectFile} selectedFile={selectedFile} />
          </div>
        </div>

        {/* Center: Viewer/Report */}
        <div className="flex-1 bg-white border-r border-gray-200 flex flex-col min-w-0">
          {showReport ? (
            <RecoveryReport projectId={projectId} />
          ) : (
            <FileViewer projectId={projectId} fileNode={selectedFile} />
          )}
        </div>

        {/* Right: AI Placeholder */}
        <div className="w-80 bg-gray-50 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <span className="font-semibold text-gray-700">SiteScoop Agent</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            </div>
            <h3 className="font-semibold text-gray-700">AI Agent Disabled</h3>
            <p className="text-sm mt-2 leading-relaxed">
              Autonomous operations are currently disabled in Stage 2.
              <br /><br />
              Coming in Stage 5: The local Gemma model will have access to the workspace tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectExplorer;
