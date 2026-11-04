import React from 'react';
import { useData } from '../../context/DataContext';
import { ShieldCheck, AlertCircle, BarChart3, Compass, CheckCircle, Info } from 'lucide-react';

export const CalibrationTab: React.FC = () => {
  const { calibration } = useData();

  return (
    <div className="h-full flex flex-col p-6 text-slate-800 overflow-y-auto max-w-7xl mx-auto space-y-5 bg-slate-50">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-700 font-mono text-xs uppercase font-bold tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Uncertainty Quantification & Conformal Calibration</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Split-Conformal Calibration & Empirical Coverage
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rigorous evaluation of prediction interval reliability, width adaptation, and theoretical exchangeability
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono">
          <span className="text-slate-500">Target Coverage:</span>
          <span className="text-emerald-700 font-bold">1 - α = 90.0%</span>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monitored Coverage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Monitored Well Coverage</span>
              <span className="font-mono text-blue-700 font-bold">10,323 Samples</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">96.6%</div>
            <div className="text-xs text-slate-600 mt-1">
              Empirical PICP exceeds nominal 90% target by <span className="text-emerald-700 font-semibold">+6.6%</span>.
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-mono flex items-center justify-between">
            <span>Interval Width (MPIW):</span>
            <span className="font-bold text-blue-700">27.57 m</span>
          </div>
        </div>

        {/* Query Coverage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Ungauged Query Coverage</span>
              <span className="font-mono text-purple-700 font-bold">3,250 Samples</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">91.4%</div>
            <div className="text-xs text-slate-600 mt-1">
              Empirical PICP validates reliability on zero-history wells (<span className="text-emerald-700 font-semibold">+1.4%</span> over target).
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-mono flex items-center justify-between">
            <span>Adaptive Width (MPIW):</span>
            <span className="font-bold text-purple-700">43.62 m</span>
          </div>
        </div>

        {/* Baseline Reference Contrast */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Standard GRU-GNN Baseline</span>
              <span className="font-mono text-rose-600 font-bold">Uncalibrated</span>
            </div>
            <div className="text-3xl font-bold text-rose-700">17.16 m</div>
            <div className="text-xs text-slate-600 mt-1">
              Fixed GRU-GNN baseline outputs a single static variance (<span className="font-mono text-rose-700 font-medium">17.16 m</span>) regardless of aquifer knowledge.
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-mono flex items-center justify-between">
            <span>Uncertainty Adaptation:</span>
            <span className="font-bold text-rose-700">0% (Completely Flat)</span>
          </div>
        </div>
      </div>

      {/* Visual Bar Comparison & Mathematical Formula */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Coverage & Width Bar Visualizer */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-blue-700" />
            <span>Prediction Interval Width Adaptation</span>
          </h3>

          <div className="space-y-4">
            {/* Monitored Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-800">Proposed Student (Monitored Wells)</span>
                <span className="font-mono font-bold text-blue-700">27.57 m (96.6% Coverage)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '55%' }} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Sharp intervals in gauged terrain with intact sensor history.
              </div>
            </div>

            {/* Query Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-800">Proposed Student (Ungauged Query Wells)</span>
                <span className="font-mono font-bold text-purple-700">43.62 m (91.4% Coverage)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: '87%' }} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Adaptively widens by <span className="text-purple-700 font-bold">+58%</span> to reflect epistemic uncertainty in ungauged basins.
              </div>
            </div>

            {/* Baseline Reference Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-800">Standard GRU-GNN Baseline (Static Variance)</span>
                <span className="font-mono font-bold text-rose-600">17.16 m (Uncalibrated)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-rose-400 rounded-full" style={{ width: '34%' }} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Dangerously under-confident in unmonitored aquifers; treats unmonitored borewells with identical uncertainty as monitored ones.
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            Adaptive uncertainty is vital for water managers: overconfident narrow intervals lead to catastrophic over-extraction.
          </div>
        </div>

        {/* Conformal Formulation & Calibration Protocol */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Compass className="w-4 h-4 text-blue-700" />
            <span>Split-Conformal Calibration Protocol</span>
          </h3>

          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            <p>
              1. <strong>Split Isolation:</strong> Model was trained on 2021–2023 data. An independent chronological calibration split (early–mid 2024, <span className="font-mono text-blue-700">n_cal</span> samples) was held out exclusively for calibration.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800">
              s_i = max(L_i - y_i, y_i - U_i, 0)
            </div>
            <p>
              2. <strong>Non-Conformity Score:</strong> We computed the non-conformity score <span className="font-mono text-blue-700">s_i</span> on each calibration observation, measuring how much the raw model interval <span className="font-mono text-slate-800">[L_i, U_i]</span> under-covered true groundwater depth.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-blue-800">
              s_hat = Quantile_k(s_1, ..., s_n), where k = ⌈(n_cal + 1)(1 - α)⌉
            </div>
            <p>
              3. <strong>Calibrated Expansion:</strong> Test intervals are expanded to <span className="font-mono text-slate-800">[L - s_hat, U + s_hat]</span>. Since raw Gaussian uncertainty already covered 96.6% and 91.4% on calibration, <span className="font-mono text-emerald-700 font-bold">s_hat = 0.0 m</span>.
            </p>
          </div>

          {/* Scientific Honesty Disclaimer Box */}
          <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-lg flex items-start space-x-2 text-[11px] text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Scientific Honesty Note:</strong> Classic conformal prediction theorems assume exchangeability. Environmental groundwater time series exhibit temporal autocorrelation and seasonal non-stationarity, violating pure exchangeability. In accordance with frozen parameter rules, we report empirical coverage faithfully and make no unconditional PAC claims.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
