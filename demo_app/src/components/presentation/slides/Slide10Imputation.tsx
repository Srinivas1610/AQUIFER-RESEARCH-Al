import React from 'react';
import { motion } from 'framer-motion';
import { Gauge, CheckCircle2, AlertTriangle, Layers, Activity } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const Slide10Imputation: React.FC = () => {
  const { reconstruction } = useData();

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Section C.5 & Phase 5 Implementation
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          DeepMVI Neural Imputation & Stress Tests
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          A bidirectional neural imputer trained with artificial isolated and block masks, generating S=20 stochastic completions to overcome pervasive telemetry dropouts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-auto">
        {/* DeepMVI Mechanics */}
        <div className="space-y-4">
          <div className="bg-navy-900/80 p-5 rounded-2xl border border-teal-500/30 space-y-3">
            <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>DeepMVI Architecture & Calibration</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real telemetry suffers from multi-month gaps. DeepMVI trains on training wells with randomized single-step and 1–3 month block masks, learning bidirectional temporal dynamics.
            </p>
            
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
                <span className="text-[10px] text-slate-400 block font-mono">Calibrated Residual Variance</span>
                <span className="text-lg font-bold text-teal-300 font-mono">&sigma;&sup2; = 44.74 m&sup2;</span>
                <span className="text-[10px] text-slate-500 block">&sigma; = 6.69 meters</span>
              </div>
              <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
                <span className="text-[10px] text-slate-400 block font-mono">Inference Sampling</span>
                <span className="text-lg font-bold text-cyan-300 font-mono">S = 20 Samples</span>
                <span className="text-[10px] text-slate-500 block">Observed values kept fixed</span>
              </div>
            </div>

            <div className="p-3 bg-navy-950 rounded-xl border border-navy-800 text-xs text-slate-300">
              <strong className="text-teal-300">Mask Integrity Rule:</strong> Imputed entries never receive an observed target mask and never enter supervised loss functions, preventing artificial label contamination.
            </div>
          </div>
        </div>

        {/* Reconstruction Benchmark Table */}
        <div className="bg-navy-900/80 p-5 rounded-2xl border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wider font-mono text-cyan-400 font-bold">
                Experiment 3: Recovery under Severe Dropout
              </div>
              <span className="text-[11px] text-slate-400">5 Stochastic Realizations Each</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-navy-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-navy-950 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="p-2.5">Masked Dropout</th>
                    <th className="p-2.5 text-right">Recovery MAE</th>
                    <th className="p-2.5 text-right">Recovery RMSE</th>
                    <th className="p-2.5 text-right">Recovery NSE &uarr;</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 font-mono">
                  {reconstruction.map((row, idx) => (
                    <tr key={idx} className="hover:bg-navy-800/50 text-slate-200">
                      <td className="p-2.5 font-bold text-white flex items-center">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2" />
                        {row.missing_pct} Missing
                      </td>
                      <td className="p-2.5 text-right font-medium">
                        {row.mae_mean.toFixed(3)} &plusmn; {row.mae_std.toFixed(3)} m
                      </td>
                      <td className="p-2.5 text-right text-slate-400">
                        {row.rmse_mean.toFixed(3)} &plusmn; {row.rmse_std.toFixed(3)} m
                      </td>
                      <td className="p-2.5 text-right font-bold text-teal-300">
                        {row.nse_mean.toFixed(3)} &plusmn; {row.nse_std.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-xs text-slate-200">
              <strong className="text-cyan-300">Key Finding:</strong> Even when 40% of observations are artificially obscured, DeepMVI maintains <strong>NSE &ge; 0.801</strong>, proving the model reconstructs seasonal aquifer drawdowns and recharge with high fidelity.
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-right mt-2 font-mono">
            Table artifact: results/tables/reconstruction_results.csv
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Checkpoint: results/models/deepmvi_imputer.pt (0.41 MB)</span>
        <span className="text-teal-400">Figure: results/figures/reconstruction_vs_missing_rate.png</span>
      </div>
    </div>
  );
};
