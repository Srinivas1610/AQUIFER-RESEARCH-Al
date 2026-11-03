import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Activity, Compass, TrendingDown, Layers, MapPin } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const Slide13ErrorAnalysis: React.FC = () => {
  const { multiseed, horizons } = useData();

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Sensitivity, Seasonality & Stability
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Multi-Seed Stability & Lead-Time Horizon Forecasting
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Verifying that performance is statistically invariant across random seeds, and evaluating direct multi-step forecasting degradation over seasonal monsoon transitions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-auto">
        {/* Multi-Seed Statistical Stability */}
        <div className="bg-navy-900/80 p-5 rounded-2xl border border-teal-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Activity className="w-4 h-4" />
              <span>Multi-Seed Evaluation across Seeds [42, 43, 44]</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              To guarantee that empirical results are not artifacts of lucky random initialization, the optimal student was trained across three independent seeds:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
                <span className="text-[10px] text-slate-400 block font-mono">Monitored Test MAE</span>
                <span className="text-lg font-bold text-teal-300 font-mono">4.363 &plusmn; 0.211 m</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">NSE: 0.771 &plusmn; 0.005</span>
              </div>
              <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
                <span className="text-[10px] text-slate-400 block font-mono">Ungauged Query Test MAE</span>
                <span className="text-lg font-bold text-cyan-300 font-mono">11.830 &plusmn; 0.222 m</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">NSE: +0.027 &plusmn; 0.006 &check;</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 pt-3">
              The standard deviation across seeds is less than 0.22 meters, proving high algorithmic convergence and statistical reliability.
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-mono bg-navy-950 p-2.5 rounded-lg border border-navy-800">
            Table artifact: results/tables/multiseed_summary.csv
          </div>
        </div>

        {/* Lead-Time Horizons h in {1, 3, 6} */}
        <div className="bg-navy-900/80 p-5 rounded-2xl border border-cyan-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4" />
              <span>Forecasting Degradation Across Lead Times (h = 1, 3, 6 mos)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Direct multi-step forecasting models were trained for lead times of 1, 3, and 6 months across the 2025 test period:
            </p>

            <div className="overflow-hidden rounded-xl border border-navy-800">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-navy-950 text-slate-400 text-[10px] uppercase">
                    <th className="p-2">Horizon h</th>
                    <th className="p-2 text-right">Monitored MAE</th>
                    <th className="p-2 text-right">Monitored NSE</th>
                    <th className="p-2 text-right">Query MAE</th>
                    <th className="p-2 text-right">Query NSE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {horizons.map((h, idx) => (
                    <tr key={idx} className="hover:bg-navy-800/50">
                      <td className="p-2 font-bold text-white">h = {h.horizon_months} month{h.horizon_months > 1 ? 's' : ''}</td>
                      <td className="p-2 text-right text-teal-300 font-bold">{h.monitored_mae.toFixed(3)} m</td>
                      <td className="p-2 text-right text-slate-300">{h.monitored_nse.toFixed(3)}</td>
                      <td className="p-2 text-right text-cyan-300">{h.query_mae.toFixed(3)} m</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">+{h.query_nse.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-400 pt-3">
              Error degrades gracefully over multi-month lead times as atmospheric uncertainty accumulates across seasonal monsoon cycles.
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-mono bg-navy-950 p-2.5 rounded-lg border border-navy-800">
            Figure artifact: results/figures/horizon_performance.png
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Verified against: results/tables/horizon_comparison.csv</span>
        <span className="text-teal-400">Figure: results/figures/spatial_error_map.png</span>
      </div>
    </div>
  );
};
