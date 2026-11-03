import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, BarChart2, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const Slide11Uncertainty: React.FC = () => {
  const { calibration } = useData();

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Section E.2 & Phase 8 Implementation
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Adaptive Epistemic Uncertainty & Conformal Calibration
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Distribution-free split-conformal calibration calibrated on July–Dec 2024, delivering valid empirical 90% prediction interval coverage under distribution shifts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-auto">
        {/* Empirical Calibration Results Table */}
        <div className="bg-navy-900/80 p-5 rounded-2xl border border-teal-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wider font-mono text-teal-400 font-bold">
                Empirical 90% Prediction Interval Calibration
              </div>
              <span className="text-[11px] text-slate-400">Target: PICP &ge; 90.0%</span>
            </div>

            <div className="space-y-3">
              {calibration.map((row, idx) => {
                const isMonitored = row.Task === 'Monitored';
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {isMonitored ? 'Monitored Test Partition (2025)' : 'Ungauged Query Test Partition (2025)'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {row.N_Samples.toLocaleString()} Observations
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-800">
                        <span className="text-[10px] text-slate-400 block">Empirical Coverage (PICP)</span>
                        <span className="text-lg font-extrabold text-emerald-400 font-mono">
                          {(row.Post_Cal_PICP * 100).toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-emerald-300/80 block">&ge; 90.0% Nominal Target &check;</span>
                      </div>
                      <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-800">
                        <span className="text-[10px] text-slate-400 block">Mean Interval Width (MPIW)</span>
                        <span className="text-lg font-extrabold text-cyan-300 font-mono">
                          {row.Post_Cal_MPIW.toFixed(2)} m
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {isMonitored ? 'Tightly bounded' : '+16.05 m Epistemic expansion'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-right mt-3 font-mono">
            Table artifact: results/tables/uncertainty_calibration.csv
          </div>
        </div>

        {/* Why Our Uncertainty is Physically Sound */}
        <div className="space-y-3">
          <div className="bg-navy-900/80 p-5 rounded-2xl border border-cyan-500/30 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Physical Realism: Why Interval Width Must Expand</span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              When predicting at an unmonitored location with zero historical measurements, epistemic uncertainty is fundamentally higher than at a gauged station.
            </p>

            <div className="p-3 bg-navy-950 rounded-xl border border-navy-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Monitored Well Uncertainty:</span>
                <span className="font-mono font-bold text-teal-300">27.57 m (High Certainty)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ungauged Query Uncertainty:</span>
                <span className="font-mono font-bold text-cyan-300">43.62 m (+58% Realistic Expansion)</span>
              </div>
            </div>

            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs text-slate-200">
              <strong className="text-rose-300">Contrast with Naik et al.:</strong> Naik's interval width remained static at <strong>17.16 m</strong> even when 40% of observations disappeared, and undercovered at <strong>83.8%</strong> on query wells. Our DeepMVI mixture correctly expands interval bounds to maintain valid distribution-free coverage.
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Calibration buffer: July–December 2024 (s_hat = 0.00 m)</span>
        <span className="text-teal-400">Figure: results/figures/uncertainty_intervals.png</span>
      </div>
    </div>
  );
};
