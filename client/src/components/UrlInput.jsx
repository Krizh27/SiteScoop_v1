import React, { useState } from 'react';
import { Globe, ArrowRight, Loader2 } from 'lucide-react';

const UrlInput = ({ onRecover, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url && !isLoading) {
      onRecover(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center bg-white border border-border rounded-xl shadow-clean hover:border-zinc-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all p-1.5">
        <div className="pl-3 pr-2 text-ink-muted">
          <Globe size={18} />
        </div>
        <input 
          type="url" 
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-transparent px-2 py-2 text-sm text-ink placeholder-zinc-400 outline-none font-sans"
          disabled={isLoading}
          required
        />
        <button 
          type="submit"
          disabled={isLoading || !url}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-ink hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Recovering...</span>
            </>
          ) : (
            <>
              <span>Recover</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default UrlInput;
