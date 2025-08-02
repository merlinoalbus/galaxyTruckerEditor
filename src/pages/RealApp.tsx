import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RealGameDataProvider, useRealGameData } from '../contexts/RealGameDataContext';
import { Header } from '../components/CampaignEditor/components/Header';
import { Sidebar } from '../components/CampaignEditor/components/Sidebar';
// import { Traduzioni } from '../components/Editors/Traduzioni';
import { CampaignEditor } from '../components/CampaignEditor/CampaignEditor';
import '../App.css';

function AppContent() {
  const { connected, loading, error } = useRealGameData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gt-accent mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Connecting to Galaxy Trucker Editor Server...</h2>
          <p className="text-gray-400">Please wait while we establish connection</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center max-w-lg">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Server Connection Failed</h2>
          <p className="text-gray-400 mb-4">
            {error || 'Could not connect to the Galaxy Trucker Editor server.'}
          </p>
          <div className="bg-gt-primary border border-slate-700 rounded-lg p-4 text-left">
            <h3 className="font-bold text-white mb-2">To start the server:</h3>
            <ol className="text-sm text-gray-300 space-y-1">
              <li>1. Open a terminal in the server directory</li>
              <li>2. Run: <code className="bg-gray-800 px-2 py-1 rounded">npm install</code></li>
              <li>3. Run: <code className="bg-gray-800 px-2 py-1 rounded">npm start</code></li>
              <li>4. Refresh this page</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary mt-4"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<CampaignEditor />} />
              <Route path="/localization" element={<div className="p-6 text-center text-gray-400">Traduzioni temporaneamente disabilitato</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export function RealApp() {
  return (
    <RealGameDataProvider>
      <AppContent />
    </RealGameDataProvider>
  );
}