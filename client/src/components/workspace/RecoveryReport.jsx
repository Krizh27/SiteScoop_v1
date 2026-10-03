import React, { useEffect, useState } from 'react';
import { getRecoveryReport } from '../../services/workspaceApi';

const RecoveryReport = ({ projectId }) => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    getRecoveryReport(projectId).then(setReport).catch(console.error);
  }, [projectId]);

  if (!report) return null;

  return (
    <div className="p-6 bg-white overflow-y-auto h-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Recovery Report</h2>
      
      <div className="mb-6 space-y-2">
        <p><strong className="text-gray-600 uppercase text-xs">Source:</strong> <a href={report.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{report.sourceUrl}</a></p>
        <p><strong className="text-gray-600 uppercase text-xs">Final URL:</strong> {report.finalUrl}</p>
        <p><strong className="text-gray-600 uppercase text-xs">Time:</strong> {new Date(report.timestamp).toLocaleString()}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Files Recovered</h3>
        <ul className="grid grid-cols-2 gap-2 text-sm text-gray-700">
          <li><strong>HTML:</strong> {report.files?.html || 0}</li>
          <li><strong>CSS:</strong> {report.files?.css || 0}</li>
          <li><strong>JavaScript:</strong> {report.files?.javascript || 0}</li>
          <li><strong>Images:</strong> {report.files?.images || 0}</li>
          <li><strong>Fonts:</strong> {report.files?.fonts || 0}</li>
          <li><strong>Other:</strong> {report.files?.other || 0}</li>
        </ul>
      </div>

      {report.failedResources?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3 border-b border-red-200 pb-2">Failed Resources ({report.failedResources.length})</h3>
          <ul className="text-sm text-red-600 list-disc pl-5 space-y-1">
            {report.failedResources.map((f, i) => (
              <li key={i} className="break-all">
                {f.source} - <em>{f.error}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="p-4 bg-yellow-50 text-sm text-yellow-800 rounded border border-yellow-200">
        <strong>Limitations:</strong> SiteScoop AI reconstructs projects from publicly accessible frontend resources. Private source code or dynamically rendered runtime assets may not be captured.
      </div>
    </div>
  );
};

export default RecoveryReport;
