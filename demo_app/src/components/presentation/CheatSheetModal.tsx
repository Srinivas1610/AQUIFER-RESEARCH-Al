import React from 'react';
import { X, HelpCircle, CheckCircle, Award } from 'lucide-react';

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-blue-700" />
            <h3 className="text-lg font-bold text-slate-900">Presentation Key Numbers & Defense Cheat Sheet</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-800">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Total Wells</div>
              <div className="text-xl font-bold text-blue-700">1,658</div>
              <div className="text-[11px] text-slate-500">Karnataka State (31 Dist)</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Time Window</div>
              <div className="text-xl font-bold text-slate-900">60 Months</div>
              <div className="text-[11px] text-slate-500">Jan 2021 – Dec 2025</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Observed Targets</div>
              <div className="text-xl font-bold text-emerald-700">59,065</div>
              <div className="text-[11px] text-slate-500">59.4% (40.6% missing)</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Spatial Split</div>
              <div className="text-xl font-bold text-purple-700">25-km Blocks</div>
              <div className="text-[11px] text-slate-500">64% Train / 16% Val / 20% Test</div>
            </div>
          </div>

          {/* Core Answers */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Top 4 Key Talking Points for Ma'am</h4>
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>1. Why did Naik et al. fail on ungauged wells?</span>
              </div>
              <p className="text-xs text-slate-600 pl-6">
                Naik et al. obtained an <strong className="text-rose-600">NSE of -0.059</strong> (worse than regional average) because their model lacked soft target regularisation and relied on previous measurements. Our Teacher-Student Distillation achieved <strong className="text-emerald-700 font-bold">positive NSE (+0.024)</strong> on zero-history wells.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>2. Why does Naik's monitored MAE look lower (2.12m)?</span>
              </div>
              <p className="text-xs text-slate-600 pl-6">
                Naik hardcoded a residual shortcut: <code className="text-blue-700 font-mono font-semibold">mu = y_t + Delta mu</code>. In their test set, Persistence alone achieved 1.95m—meaning <strong>persistence was beating their neural network!</strong> When we add dual-mode skip, our MAE is 3.39m with true generalization.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>3. Why is our uncertainty calibration superior?</span>
              </div>
              <p className="text-xs text-slate-600 pl-6">
                Naik's 90% interval width remained static at 17.16m even when 40% of telemetry was missing! Our <strong>DeepMVI mixture dynamically expands from 27.57m (monitored) to 43.62m (ungauged query)</strong>, guaranteeing genuine &ge;90% coverage.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>4. How do you guarantee zero data leakage?</span>
              </div>
              <p className="text-xs text-slate-600 pl-6">
                25-km spatial grid cells ensure zero cell overlap between train/val/test partitions. Imputers and scalers were fit strictly on 2021-2023. Query wells receive graph messages but send none. Verified by 40/40 green pytest tests.
              </p>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-wrap gap-4 justify-between">
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-xs">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-xs">→</kbd> Navigate Slides</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-xs">N</kbd> Toggle Speaker Notes</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-xs">G</kbd> Slide Jump Grid</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-xs">F</kbd> Fullscreen</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-xs">?</kbd> Cheat Sheet</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 shadow-xs">Esc</kbd> Close Overlays</div>
          </div>
        </div>
      </div>
    </div>
  );
};
