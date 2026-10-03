import React, { useState } from 'react';
import UrlInput from './components/UrlInput';
import RecoveryProgress from './components/RecoveryProgress';
import RecoverySummary from './components/RecoverySummary';
import { recoverWebsite } from './services/recoveryApi';

function App() {
  const [status, setStatus] = useState('idle'); // idle, recovering, completed, error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRecover = async (url) => {
    setStatus('recovering');
    setErrorMessage('');
    setResult(null);

    try {
      const data = await recoverWebsite(url);
      setResult(data);
      setStatus('completed');
    } catch (error) {
      setErrorMessage(error.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8 py-10">
        <header>
          <h1 className="text-5xl font-extrabold text-blue-600 tracking-tight">SiteScoop AI</h1>
          <p className="mt-4 text-xl text-gray-600">Recover. Understand. Improve.</p>
        </header>

        <main className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mt-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 text-left">Target Website</h2>
            
            <UrlInput onRecover={handleRecover} isLoading={status === 'recovering'} />

            {errorMessage && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg text-left">
                <strong>Error:</strong> {errorMessage}
              </div>
            )}

            <RecoveryProgress status={status} />
            {result && <RecoverySummary result={result} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
