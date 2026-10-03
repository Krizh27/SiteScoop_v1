import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const FindingEvidence = ({ evidence = [] }) => {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="mt-2 space-y-1 bg-gray-50 p-2.5 rounded border border-gray-200">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
        Confirmed Evidence:
      </div>
      <ul className="space-y-1">
        {evidence.map((item, index) => (
          <li key={index} className="text-xs text-gray-700 flex items-start gap-1.5 leading-snug">
            <span className="text-blue-500 font-bold shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FindingEvidence;
