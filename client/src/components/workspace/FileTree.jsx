import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';

const TreeNode = ({ node, onSelectFile, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedFile?.path === node.path;

  if (node.type === 'directory') {
    return (
      <div className="ml-2">
        <div 
          className="flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-gray-100 rounded text-sm text-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Folder size={14} className="text-blue-500" />
          <span>{node.name}</span>
        </div>
        {isOpen && (
          <div className="ml-2 border-l border-gray-200 pl-1">
            {node.children.map(child => (
              <TreeNode 
                key={child.path} 
                node={child} 
                onSelectFile={onSelectFile} 
                selectedFile={selectedFile} 
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`ml-2 flex items-center gap-1 py-1 px-4 cursor-pointer rounded text-sm ${isSelected ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-gray-100 text-gray-600'}`}
      onClick={() => onSelectFile(node)}
    >
      <File size={14} className="text-gray-400" />
      <span>{node.name}</span>
    </div>
  );
};

const FileTree = ({ tree, onSelectFile, selectedFile }) => {
  if (!tree || tree.length === 0) return <div className="p-4 text-sm text-gray-500">Project is empty.</div>;

  return (
    <div className="py-2 overflow-y-auto h-full">
      {tree.map(node => (
        <TreeNode key={node.path} node={node} onSelectFile={onSelectFile} selectedFile={selectedFile} />
      ))}
    </div>
  );
};

export default FileTree;
