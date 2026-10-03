import React, { useEffect, useState } from 'react';
import { getFileContent, getAssetUrl } from '../../services/workspaceApi';

const FileViewer = ({ projectId, fileNode, refreshKey }) => {
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fileNode) return;
    
    const loadFile = async () => {
      setLoading(true);
      setError('');
      setFileData(null);
      try {
        const data = await getFileContent(projectId, fileNode.path);
        setFileData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadFile();
  }, [projectId, fileNode, refreshKey]);

  if (!fileNode) {
    return <div className="flex items-center justify-center h-full text-gray-400">Select a file to view its contents</div>;
  }

  if (loading) return <div className="p-4 text-gray-500">Loading file...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!fileData) return null;

  const isImage = fileData.binary && ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(fileData.extension);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 px-4 py-2 flex justify-between items-center bg-gray-50">
        <div className="text-sm font-medium text-gray-700">{fileData.path}</div>
        <div className="text-xs text-gray-500">{(fileData.size / 1024).toFixed(2)} KB</div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {fileData.binary ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {isImage ? (
              <img src={getAssetUrl(projectId, fileData.path)} alt={fileData.name} className="max-w-full max-h-[60vh] border border-gray-200 shadow-sm" />
            ) : (
              <div className="text-gray-500">Binary file. Preview not available.</div>
            )}
            <div className="text-sm font-mono text-gray-600">{fileData.name}</div>
          </div>
        ) : (
          <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all leading-relaxed">
            <code>{fileData.content}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
