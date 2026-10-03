import React, { useState } from 'react';

const UrlInput = ({ onRecover, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url && !isLoading) {
      onRecover(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      <input 
        type="url" 
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        disabled={isLoading}
        required
      />
      <button 
        type="submit"
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || !url}
      >
        {isLoading ? 'Recovering...' : 'Recover Website'}
      </button>
    </form>
  );
};

export default UrlInput;
