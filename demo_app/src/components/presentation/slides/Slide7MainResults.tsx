import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, TrendingUp, BarChart3, HelpCircle } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const Slide7MainResults: React.FC = () => {
  const { leaderboardMonitored, leaderboardQuery } = useData();
  const [activeTab, setActiveTab] = useState<'monitored' | 'query'>('query');

  const data = activeTab === 'monitored' ? leaderboardMonitored : leaderboardQuery;

  // Filter top key models for clean slide display
  const displayModels = data.filter(d => 
    d.model.includes('Student') || 
    d.model.includes('Naik') || 
    d.model.includes('Teacher') || 
    d.model.includes('XGBoost') || 
    d.model.includes('Persistence') || 
    d.model.includes('IDW')
  ).slice(0, 6);

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
            Empirical Evaluation (Held-Out 2025 Test Partition)
          </div>
          <div className="flex items-center space-x-1.5 bg-navy-900 p-1 rounded-xl border border-navy-800 text-xs">
            <button
              onClick={() => setActiveTab('query')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                activeTab === 'query'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ungauged Query Wells (The Critical Test)
            </button>
            <button
              onClick={() => setActiveTab('monitored')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                activeTab === 'monitored'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monitored Wells (Gauged)
            </button>
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          {activeTab === 'query' 
            ? 'Ungauged Aquifer Generalization (3,250 Observations)' 
            : 'Temporal Forecasting on Monitored Wells (10,323 Observations)'}
        </h2>
      </div>

      {/* Main Table */}
      <div className="my-auto overflow-hidden rounded-2xl border border-navy-800 bg-navy-900/90 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-navy-950 text-slate-400 border-b border-navy-800 font-mono uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Model Architecture</th>
              <th className="py-3 px-3">Class</th>
              <th className="py-3 px-3 text-right">MAE (m) &darr;</th>
              <th className="py-3 px-3 text-right">RMSE (m) &darr;</th>
              <th className="py-3 px-3 text-right">NSE &uarr;</th>
              <th className="py-3 px-3 text-right">90% Coverage (PICP)</th>
              <th className="py-3 px-3 text-right">Interval Width (MPIW)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60 font-sans">
            {displayModels.map((row, idx) => {
              const isOurs = row.is_proposed;
              const isNaik = row.model.includes('Naik');
              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isOurs
                      ? 'bg-teal-500/10 hover:bg-teal-500/15 font-semibold text-white'
                      : isNaik
                      ? 'bg-amber-500/5 hover:bg-amber-500/10 text-slate-300'
                      : 'hover:bg-navy-800/40 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-4 flex items-center space-x-2">
                    {isOurs && <Trophy className="w-4 h-4 text-teal-400 shrink-0" />}
                    {isNaik && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mr-1" />}
                    <span className={isOurs ? 'text-teal-300 font-bold' : ''}>{row.model}</span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-400 font-mono">{row.model_type}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                    {row.mae.toFixed(3)} m
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {row.rmse.toFixed(3)} m
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        row.nse > 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {row.nse > 0 ? `+${row.nse.toFixed(3)}` : row.nse.toFixed(3)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {row.picp !== null ? (
                      <span className={row.picp >= 90 ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                        {row.picp.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {row.mpiw !== null ? `${row.mpiw.toFixed(2)} m` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Highlights Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="bg-navy-900/60 p-3 rounded-xl border border-teal-500/30 text-xs">
          <span className="text-teal-400 font-bold block mb-1">Key Victory: Positive Generalization</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Our Distilled Student achieves <strong className="text-teal-300">NSE = +0.024</strong> on ungauged wells, while Naik et al. failed with <strong className="text-rose-400">NSE = -0.059</strong>.
          </p>
        </div>

        <div className="bg-navy-900/60 p-3 rounded-xl border border-navy-800 text-xs">
          <span className="text-cyan-400 font-bold block mb-1">Adaptive Epistemic Uncertainty</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Prediction interval width correctly widens from <strong>27.57 m</strong> (monitored) to <strong>43.62 m</strong> (query) with valid <strong>91.4% empirical coverage</strong>.
          </p>
        </div>

        <div className="bg-navy-900/60 p-3 rounded-xl border border-navy-800 text-xs">
          <span className="text-purple-400 font-bold block mb-1">Dual-Mode Residual Advancement</span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            When equipped with residual anchoring, monitored MAE drops to <strong className="text-purple-300">3.396 m</strong> while preserving positive skill on ungauged aquifers.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Metrics from: results/tables/student_performance.csv & baselines_performance.csv</span>
        <span className="text-teal-400">Evaluation: Real 2025 Held-Out Statewide Karnataka Targets</span>
      </div>
    </div>
  );
};
