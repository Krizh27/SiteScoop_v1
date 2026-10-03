import React, { useState } from 'react';
import FindingCard from './FindingCard';

const FindingList = ({ findings = [], onSelectFile }) => {
  const [filterSeverity, setFilterSeverity] = useState('all');

  if (!findings || findings.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-xs text-gray-500">
        No inspection findings recorded. Run an inspection to detect potential issues or recovery limitations.
      </div>
    );
  }

  const filtered = filterSeverity === 'all'
    ? findings
    : findings.filter(f => f.severity === filterSeverity);

  return (
    <div className="space-y-3">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs border-b border-gray-200 pb-2">
        <span className="text-gray-400 text-[11px] font-medium mr-1">Filter:</span>
        {['all', 'error', 'warning', 'info'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`capitalize px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              filterSeverity === sev
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Cards list */}
      <div className="space-y-3">
        {filtered.map((finding) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    </div>
  );
};

export default FindingList;
