import { useState } from 'react'

function App() {
  const [url, setUrl] = useState('')

  const handleRecover = (e) => {
    e.preventDefault();
    console.log('Recover requested for:', url);
    // Not implemented in Stage 0
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4">
            SiteScoop <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-xl text-slate-400">
            Recover. Understand. Improve.
          </p>
        </div>

        <form onSubmit={handleRecover} className="w-full max-w-md mx-auto space-y-4">
          <div>
            <input 
              type="url" 
              placeholder="Enter deployed website URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
          >
            Recover Website
          </button>
        </form>

        <div className="pt-8 border-t border-slate-800">
          <p className="text-sm text-slate-500">
            Stage 0 Foundation • AI, scraping, and agent functionality not yet implemented.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
