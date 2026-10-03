import React, { useEffect, useState } from 'react';
import { getFileContent, getAssetUrl } from '../../services/workspaceApi';
import { Copy, Check, FileCode, Layers, Image as ImageIcon } from 'lucide-react';

const FileViewer = ({ projectId, fileNode, refreshKey }) => {
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    if (!fileData?.content) return;
    navigator.clipboard.writeText(fileData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!fileNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-ink-muted text-xs p-8 text-center space-y-2">
        <FileCode size={32} className="text-zinc-300 mb-1" />
        <p className="font-medium text-ink">No File Selected</p>
        <p className="text-[11px] text-ink-muted max-w-xs">
          Select any file from the explorer on the left to inspect its recovered source code.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-ink-muted">
        Loading source file...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl m-4">
        <p className="font-semibold">Failed to read file:</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  if (!fileData) return null;

  const isImage = fileData.binary && ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(fileData.extension);
  const lines = (fileData.content || '').split('\n');

  return (
    <div className="flex flex-col h-full bg-white select-text">
      {/* File Header / Breadcrumb */}
      <div className="border-b border-border px-4 py-2 flex justify-between items-center bg-white shrink-0">
        <div className="flex items-center gap-2">
          <FileCode size={14} className="text-brand-600" />
          <span className="text-xs font-mono font-medium text-ink">{fileData.path}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-ink-muted">
            {(fileData.size / 1024).toFixed(1)} KB · {lines.length} lines
          </span>

          {!fileData.binary && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink px-2 py-1 rounded hover:bg-subtle transition-colors"
              title="Copy file content"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Code Editor Body */}
      <div className="flex-1 overflow-auto bg-canvas">
        {fileData.binary ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
            {isImage ? (
              <div className="p-4 bg-white rounded-xl border border-border shadow-clean max-w-md">
                <img 
                  src={getAssetUrl(projectId, fileData.path)} 
                  alt={fileData.name} 
                  className="max-w-full max-h-[50vh] object-contain rounded" 
                />
              </div>
            ) : (
              <div className="text-xs text-ink-muted">Binary resource. Direct text preview not supported.</div>
            )}
            <span className="text-xs font-mono text-ink font-medium">{fileData.name}</span>
          </div>
        ) : (
          <div className="flex min-w-full font-mono text-xs leading-relaxed p-2">
            {/* Line numbers column */}
            <div className="select-none text-right pr-4 pl-2 text-zinc-400 font-mono shrink-0 border-r border-border/60">
              {lines.map((_, i) => (
                <div key={i} className="leading-6 text-[11px]">{i + 1}</div>
              ))}
            </div>
            {/* Code content column */}
            <div className="pl-4 flex-1 overflow-x-auto">
              {lines.map((line, i) => (
                <div key={i} className="leading-6 text-[11px] text-ink whitespace-pre font-mono">
                  {line || ' '}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
