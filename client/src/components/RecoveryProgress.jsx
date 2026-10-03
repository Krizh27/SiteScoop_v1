import React, { useState, useEffect } from 'react';

const RecoveryProgress = ({ status }) => {
  const stages = [
    'Fetching website...',
    'Parsing HTML...',
    'Discovering resources...',
    'Downloading assets...',
    'Building project...',
    'Recovery complete'
  ];

  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (status === 'recovering') {
      // Simulate progress stages since we don't have websocket events yet
      const interval = setInterval(() => {
        setCurrentStageIndex((prev) => {
          if (prev < stages.length - 2) return prev + 1;
          return prev;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (status === 'completed') {
      setCurrentStageIndex(stages.length - 1);
    } else if (status === 'error') {
      setCurrentStageIndex(0);
    }
  }, [status]);

  if (status === 'idle') return null;

  return (
    <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Recovery Status</h3>
      <div className="flex flex-col gap-2">
        {stages.map((stage, index) => {
          let stageColor = 'text-gray-400';
          if (index < currentStageIndex) stageColor = 'text-green-600';
          else if (index === currentStageIndex && status !== 'error') stageColor = 'text-blue-600 font-medium animate-pulse';

          return (
            <div key={stage} className={`text-sm ${stageColor}`}>
              {index < currentStageIndex && '✓ '}
              {index === currentStageIndex && status === 'recovering' && '↻ '}
              {stage}
            </div>
          );
        })}
        {status === 'error' && (
          <div className="text-sm text-red-600 font-medium mt-2">
            ✗ Recovery failed
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoveryProgress;
