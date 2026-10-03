import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, FileText, Image, ChevronRight, ChevronDown } from 'lucide-react';

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['html', 'htm'].includes(ext)) return <FileCode size={14} className="text-orange-500 shrink-0" />;
  if (['css'].includes(ext)) return <FileCode size={14} className="text-blue-500 shrink-0" />;
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return <FileCode size={14} className="text-amber-500 shrink-0" />;
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) return <Image size={14} className="text-emerald-500 shrink-0" />;
  return <FileText size={14} className="text-zinc-400 shrink-0" />;
};

const TreeNode = ({ node, onSelectFile, selectedFile, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedFile?.path === node.path;

  if (node.type === 'directory') {
    return (
      <div className="select-none">
        <div 
          className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-subtle rounded-md text-xs text-ink font-medium transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-ink-muted">
            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
          {isOpen ? (
            <FolderOpen size={14} className="text-amber-500 shrink-0" />
          ) : (
            <Folder size={14} className="text-amber-500 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode 
                key={child.path} 
                node={child} 
                onSelectFile={onSelectFile} 
                selectedFile={selectedFile}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`group flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-md text-xs transition-colors select-none ${
        isSelected 
          ? 'bg-brand-50 text-brand-900 font-semibold border-l-2 border-brand-600' 
          : 'hover:bg-subtle text-ink-muted hover:text-ink font-normal'
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      onClick={() => onSelectFile(node)}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </div>
  );
};

const FileTree = ({ tree, onSelectFile, selectedFile }) => {
  if (!tree || tree.length === 0) {
    return <div className="p-4 text-xs text-ink-muted">No files recovered.</div>;
  }

  return (
    <div className="py-1 px-1.5 overflow-y-auto h-full font-sans">
      {tree.map((node) => (
        <TreeNode 
          key={node.path} 
          node={node} 
          onSelectFile={onSelectFile} 
          selectedFile={selectedFile} 
        />
      ))}
    </div>
  );
};

export default FileTree;
