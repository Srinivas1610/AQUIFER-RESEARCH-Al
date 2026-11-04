import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Zap,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';

export const StressTestSimulatorTab: React.FC = () => {
  const { reconstruction, horizons } = useData();

  const [activeSimulation, setActiveSimulation] = useState<'ungauged' | 'dropout' | 'horizon'>('ungauged');

  // Simulation 1: Ungauged state
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);

  // Simulation 2: Missingness slider index
  const [missingIndex, setMissingIndex] = useState<number>(3); // default 40%

  // Simulation 3: Selected horizon
  const [selectedHorizon, setSelectedHorizon] = useState<number>(1);

  const currentRecon = reconstruction[missingIndex] || reconstruction[3];
  const currentHorizon = horizons.find((h) => h.horizon_months === selectedHorizon) || horizons[0];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 text-slate-800 overflow-y-auto max-w-7xl mx-auto space-y-6 bg-slate-50">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-mono text-xs uppercase font-bold tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Interactive Operational Stress Simulator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Telemetry Failure & Model Robustness Evaluation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate model stability under simulated sensor dropouts, unmonitored cold-starts, and multi-month lead times
          </p>
        </div>

        {/* Experiment Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSimulation('ungauged')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSimulation === 'ungauged'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Ungauged Cold-Start Test
          </button>
          <button
            onClick={() => setActiveSimulation('dropout')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSimulation === 'dropout'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. DeepMVI Dropout Test
          </button>
          <button
            onClick={() => setActiveSimulation('horizon')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSimulation === 'horizon'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Multi-Month Horizon Test
          </button>
        </div>
      </div>

      {/* SIMULATION 1: The Ungauged Cold-Start Aquifer Test */}
      {activeSimulation === 'ungauged' && (
        <div className="space-y-6">
          {/* Interactive Toggle Control */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-slate-500 font-bold block">
                Interactive State Toggle
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Target Borewell Status:{' '}
                <span className={isSensorActive ? 'text-blue-700' : 'text-purple-700'}>
                  {isSensorActive ? 'Monitored Well (L=12 Intact History)' : 'Ungauged Well (Zero Telemetry History)'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle below to compare our GATv2 model against the standard baseline when groundwater sensor history is severed.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setIsSensorActive(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isSensorActive ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gauged (Normal History)
              </button>
              <button
                onClick={() => setIsSensorActive(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  !isSensorActive ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ungauged (Zero History)
              </button>
            </div>
          </div>

          {/* Head-to-Head Visual Contrast */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Baseline Reference Panel */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-sm ${
                isSensorActive
                  ? 'bg-white border-slate-200'
                  : 'bg-rose-50/40 border-rose-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Baseline Model</span>
                    <h4 className="text-sm font-bold text-slate-900">Standard GRU-GNN (Uncalibrated Baseline)</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    isSensorActive ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {isSensorActive ? 'Persistence Shortcut' : 'COLLAPSED'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Nash-Sutcliffe (NSE)</div>
                      <div className={`text-2xl font-bold mt-1 font-mono ${isSensorActive ? 'text-slate-800' : 'text-rose-600'}`}>
                        {isSensorActive ? '0.812' : '-0.059'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isSensorActive ? 'via y_t copy shortcut' : 'Worse than mean'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Test MAE (m)</div>
                      <div className={`text-2xl font-bold mt-1 font-mono ${isSensorActive ? 'text-slate-800' : 'text-rose-600'}`}>
                        {isSensorActive ? '2.98 m' : '12.84 m'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Absolute error</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    {isSensorActive ? (
                      <p>
                        The fixed GRU-GNN baseline operates by copying the previous month's measurement and adding a small residual: <code className="text-slate-900 font-mono font-semibold">μ = y_t + Δμ</code>. While this scores well on monitored wells, it fails to learn actual spatial hydrodynamics.
                      </p>
                    ) : (
                      <p className="text-rose-800">
                        <strong>Failure Mode:</strong> When sensor history is absent, <code className="font-mono font-bold">y_t</code> does not exist. Lacking pseudo-query masking, the fixed baseline collapses to an NSE of <code className="font-mono font-bold text-rose-700">-0.059</code>.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
                Interval Width: 17.16 m (flat, uncalibrated)
              </div>
            </div>

            {/* Proposed Distilled GNN Panel */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-sm ${
                !isSensorActive
                  ? 'bg-purple-50/40 border-purple-300'
                  : 'bg-white border-blue-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 block font-semibold">Proposed System</span>
                    <h4 className="text-sm font-bold text-slate-900">Distilled Student GNN (Proposed)</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {isSensorActive ? 'High Accuracy' : 'POSITIVE GENERALIZATION'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Nash-Sutcliffe (NSE)</div>
                      <div className="text-2xl font-bold mt-1 font-mono text-emerald-700">
                        {isSensorActive ? '0.779' : '+0.024'}
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                        {isSensorActive ? 'Physically sound' : 'Positive Spatial Transfer'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Test MAE (m)</div>
                      <div className="text-2xl font-bold mt-1 font-mono text-slate-900">
                        {isSensorActive ? '4.19 m' : '12.16 m'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isSensorActive ? '3.40m with residual' : 'Outperforms baseline by 0.68m'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    {isSensorActive ? (
                      <p>
                        Encodes 12-month temporal patterns via GRU-64 and refines predictions with 2-layer GATv2 spatial neighbor message passing (<strong>0.779 NSE</strong>).
                      </p>
                    ) : (
                      <p className="text-purple-900">
                        <strong>Spatial Inference:</strong> Trained with <strong>pseudo-query masking (20% history hidden)</strong>, our model infers groundwater depth strictly from neighbouring wells and surface climate forcing, securing <strong>NSE +0.024</strong>.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-700 font-mono flex items-center justify-between">
                <span>90% Conformal Coverage:</span>
                <span className="font-bold text-blue-700">{isSensorActive ? '96.6% (27.57m width)' : '91.4% (43.62m adaptive width)'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATION 2: DeepMVI Dropout Stress Test */}
      {activeSimulation === 'dropout' && (
        <div className="space-y-6">
          {/* Missing Rate Slider Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono uppercase text-blue-600 font-bold block">
                  Synthetic Telemetry Dropout Evaluation
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Controlled Artificial Missingness Rate:{' '}
                  <span className="text-blue-700 font-mono">{currentRecon.missing_pct} Telemetry Loss</span>
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                5 Monte Carlo Realizations × 20 Gaussian Samples
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-2 pt-2">
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={missingIndex}
                onChange={(e) => setMissingIndex(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-xs font-mono text-slate-500">
                <span className={missingIndex === 0 ? 'text-blue-700 font-bold' : ''}>10% Dropout</span>
                <span className={missingIndex === 1 ? 'text-blue-700 font-bold' : ''}>20% Dropout</span>
                <span className={missingIndex === 2 ? 'text-blue-700 font-bold' : ''}>30% Dropout</span>
                <span className={missingIndex === 3 ? 'text-blue-700 font-bold' : ''}>40% Real-World Dropout</span>
              </div>
            </div>
          </div>

          {/* Metrics Display for Selected Missing Rate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase">Reconstruction NSE</div>
                <div className="text-3xl font-bold text-emerald-700 mt-1 font-mono">
                  {currentRecon.nse_mean.toFixed(3)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ± {currentRecon.nse_std.toFixed(3)} across 5 folds
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-medium font-mono">
                Maintains &gt;0.80 NSE even under 40% telemetry loss.
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase">Mean Absolute Error</div>
                <div className="text-3xl font-bold text-slate-900 mt-1 font-mono">
                  {currentRecon.mae_mean.toFixed(3)} m
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ± {currentRecon.mae_std.toFixed(3)} m standard error
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                Baseline zero-fill degrades to &gt;8.5 m MAE
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase">Root Mean Squared Error</div>
                <div className="text-3xl font-bold text-slate-900 mt-1 font-mono">
                  {currentRecon.rmse_mean.toFixed(3)} m
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ± {currentRecon.rmse_std.toFixed(3)} m standard error
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-blue-700 font-medium font-mono">
                Residual variance σ = 6.69 m calibrated on validation set
              </div>
            </div>
          </div>

          {/* DeepMVI Mechanism Explanation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs text-slate-600 leading-relaxed space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>DeepMVI Methodology: Variational Gaussian Mixtures</span>
            </h4>
            <p>
              Rather than filling missing telemetry months with arbitrary zeros or naive linear interpolation (which leaks post-observation trends into model inputs), DeepMVI samples <strong>20 realizations</strong> via Gaussian perturbation. The final imputed history is the expectation of a 20-component Gaussian mixture, preserving physical hydrological variance without leakage.
            </p>
          </div>
        </div>
      )}

      {/* SIMULATION 3: Multi-Month Horizon Test */}
      {activeSimulation === 'horizon' && (
        <div className="space-y-6">
          {/* Horizon Buttons */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono uppercase text-blue-600 font-bold block">
                  Forecasting Lead-Time Horizon
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Direct Multi-Step Lead Time:{' '}
                  <span className="text-blue-700 font-mono">{selectedHorizon} Month Ahead</span>
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Evaluated on 13,573 Test Predictions (2025)</span>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              {[1, 3, 6].map((h) => (
                <button
                  key={h}
                  onClick={() => setSelectedHorizon(h)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-2 ${
                    selectedHorizon === h
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>h = {h} {h === 1 ? 'Month' : 'Months'}</span>
                  {h === 1 && <span className="text-[10px] bg-blue-700 text-white px-1.5 py-0.2 rounded font-mono">PRIMARY</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Horizon Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monitored Cohort Horizon */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase">Monitored Cohort (h={selectedHorizon})</span>
                <span className="text-xs text-slate-500 font-mono">10,323 Targets</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">MAE</div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{currentHorizon.monitored_mae.toFixed(2)} m</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">RMSE</div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{currentHorizon.monitored_rmse.toFixed(2)} m</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">NSE</div>
                  <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">{currentHorizon.monitored_nse.toFixed(3)}</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-1">
                Accuracy degrades smoothly as the forecasting horizon extends across subsequent monsoon cycles.
              </p>
            </div>

            {/* Ungauged Query Horizon */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-purple-800 uppercase">Ungauged Query Cohort (h={selectedHorizon})</span>
                <span className="text-xs text-slate-500 font-mono">3,250 Targets</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">MAE</div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{currentHorizon.query_mae.toFixed(2)} m</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">RMSE</div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{currentHorizon.query_rmse.toFixed(2)} m</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">NSE</div>
                  <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">+{currentHorizon.query_nse.toFixed(3)}</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-1">
                NSE remains consistently positive across all lead times without requiring historical sequence access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
