import React from 'react';
import { useData } from './context/DataContext';
import { ExplorerView } from './components/explorer/ExplorerView';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { isLoading, error } = useData();

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900">Loading Research Data & Spatial Partitions...</h2>
            <p className="text-xs text-slate-500 mt-1">
              Loading 1,658 Karnataka borewells and audited benchmark matrices
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-4">
        <div className="max-w-md bg-white border border-rose-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Data Load Notification</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center space-x-2 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Application</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <ExplorerView />
    </div>
  );
};
