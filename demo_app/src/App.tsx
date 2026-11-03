import React, { useState, useEffect } from 'react';
import { useData } from './context/DataContext';
import { PresentationView } from './components/presentation/PresentationView';
import { ExplorerView } from './components/explorer/ExplorerView';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { isLoading, error } = useData();
  const [mode, setMode] = useState<'platform' | 'presentation'>('platform');

  // Global mode toggle shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input is active
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        if (mode === 'presentation' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setMode('platform');
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (mode === 'platform' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setMode('presentation');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

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
      {mode === 'presentation' ? (
        <PresentationView onSwitchToExplorer={() => setMode('platform')} />
      ) : (
        <ExplorerView onSwitchToPresentation={() => setMode('presentation')} />
      )}
    </div>
  );
};
