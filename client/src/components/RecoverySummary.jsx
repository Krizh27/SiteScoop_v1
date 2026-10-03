import React from 'react';

const RecoverySummary = ({ result }) => {
  if (!result) return null;

  return (
    <div className="mt-8 bg-green-50 p-6 rounded-xl border border-green-200 text-left">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Recovery Complete!</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-3 rounded shadow-sm border border-green-100">
          <p className="text-xs text-gray-500 uppercase font-semibold">Project ID</p>
          <p className="text-sm font-mono font-medium text-gray-800 break-all">{result.projectId}</p>
        </div>
        <div className="bg-white p-3 rounded shadow-sm border border-green-100">
          <p className="text-xs text-gray-500 uppercase font-semibold">Source URL</p>
          <p className="text-sm text-gray-800 truncate" title={result.sourceUrl}>{result.sourceUrl}</p>
        </div>
      </div>

      <h3 className="font-semibold text-green-900 mb-2">Recovered Resources</h3>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6 text-center">
        <div className="bg-white py-2 rounded shadow-sm">
          <div className="text-lg font-bold text-blue-600">{result.summary.html || 0}</div>
          <div className="text-xs text-gray-500">HTML</div>
        </div>
        <div className="bg-white py-2 rounded shadow-sm">
          <div className="text-lg font-bold text-pink-600">{result.summary.css || 0}</div>
          <div className="text-xs text-gray-500">CSS</div>
        </div>
        <div className="bg-white py-2 rounded shadow-sm">
          <div className="text-lg font-bold text-yellow-600">{result.summary.javascript || 0}</div>
          <div className="text-xs text-gray-500">JS</div>
        </div>
        <div className="bg-white py-2 rounded shadow-sm">
          <div className="text-lg font-bold text-purple-600">{result.summary.images || 0}</div>
          <div className="text-xs text-gray-500">Images</div>
        </div>
        <div className="bg-white py-2 rounded shadow-sm">
          <div className="text-lg font-bold text-indigo-600">{result.summary.fonts || 0}</div>
          <div className="text-xs text-gray-500">Fonts</div>
        </div>
      </div>

      {result.failedResources && result.failedResources.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 rounded border border-red-100">
          <h3 className="font-semibold text-red-800 mb-2">Failed Resources ({result.failedResources.length})</h3>
          <ul className="text-sm text-red-600 list-disc pl-5 max-h-32 overflow-y-auto">
            {result.failedResources.map((fail, idx) => (
              <li key={idx} className="truncate" title={fail.source}>
                {fail.source} - {fail.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
        <h3 className="font-semibold text-yellow-800">Limitations</h3>
        <p className="text-sm text-yellow-700 mt-1">
          SiteScoop AI reconstructs an editable project from publicly accessible resources. It does not clone private backend source code. 
          Some dynamically generated content or heavily obfuscated assets may be unavailable or reconstructed.
        </p>
      </div>
    </div>
  );
};

export default RecoverySummary;
