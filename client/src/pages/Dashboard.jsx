import React from 'react';
import Header from '../components/Header.jsx';
import UrlInputSection from '../components/UrlInputSection.jsx';
import SystemStatusCard from '../components/SystemStatusCard.jsx';
import PipelineCards from '../components/PipelineCards.jsx';
import Footer from '../components/Footer.jsx';
import { useHealthCheck } from '../hooks/useHealthCheck.js';

export default function Dashboard() {
  const { data, loading, error, refetch } = useHealthCheck(10000);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100">
      <div>
        <Header healthData={data} healthLoading={loading} healthError={error} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Main Landing / URL Input Placeholder */}
          <UrlInputSection />

          {/* System Health / API Verification Panel */}
          <SystemStatusCard
            healthData={data}
            healthLoading={loading}
            healthError={error}
            onRefresh={refetch}
          />

          {/* Architecture & Future Stages Roadmap */}
          <PipelineCards />
        </main>
      </div>

      <Footer />
    </div>
  );
}
