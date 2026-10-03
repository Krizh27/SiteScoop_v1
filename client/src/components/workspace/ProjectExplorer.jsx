import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import FileTree from './FileTree';
import FileViewer from './FileViewer';
import RecoveryReport from './RecoveryReport';
import AIDeveloperPanel from './AIDeveloperPanel';
import InspectorPanel from '../inspector/InspectorPanel';
import { getFileTree } from '../../services/workspaceApi';
import { ArrowLeft, FileText, Info, ShieldAlert } from 'lucide-react';

const ProjectExplorer = () => {
  const { projectId } = useParams();
  const [tree, setTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('inspector'); // 'viewer' | 'report' | 'inspector'

  useEffect(() => {
    getFileTree(projectId).then(setTree).catch(console.error);
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

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'inspector'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShieldAlert size={15} />
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
            <Info size={15} />
            Recovery Report
          </button>

          {selectedFile && (
            <button 
              onClick={() => setActiveTab('viewer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'viewer'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText size={15} />
              <span>{selectedFile.name}</span>
            </button>
          )}
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

        {/* Center: Viewer / Report / Inspector */}
        <div className="flex-1 bg-white border-r border-gray-200 flex flex-col min-w-0 overflow-hidden">
          {activeTab === 'inspector' ? (
            <InspectorPanel
              projectId={projectId}
              onSelectFile={handleSelectFileByPath}
            />
          ) : activeTab === 'report' ? (
            <RecoveryReport projectId={projectId} />
          ) : (
            <FileViewer projectId={projectId} fileNode={selectedFile} />
          )}
        </div>

        {/* Right: AI Developer Panel */}
        <div className="w-80 flex flex-col shrink-0">
          <AIDeveloperPanel projectId={projectId} />
        </div>
      </div>
    </div>
  );
};

export default ProjectExplorer;
