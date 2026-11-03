import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Shuffle, TrendingUp, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const Slide9TeacherStudent: React.FC = () => {
  const { alphaSweep } = useData();

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Section 5 Methodology Implementation
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Teacher–Student Distillation & &alpha; Sweep Analysis
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Transferring smooth posterior distributions from a K=5 spatially blocked cross-fitted teacher regularizes the compact student and overcomes sensor-specific overfitting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-auto">
        {/* Model Capacity Comparison */}
        <div className="space-y-4">
          <div className="bg-navy-900/80 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-purple-400 font-bold block">
                High-Capacity Teacher Model
              </span>
              <div className="text-lg font-bold text-white mt-0.5">GRU-128 + 2&times; GATv2 (4 Heads)</div>
              <p className="text-xs text-slate-300 mt-1">
                K=5 blocked cross-fitting generates 16,312 out-of-fold soft targets N(&mu;_t, v_t).
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">Test MAE</span>
              <span className="text-lg font-bold text-purple-300 font-mono">4.361 m</span>
              <span className="text-[10px] text-slate-500 block">NSE 0.766</span>
            </div>
          </div>

          <div className="flex justify-center -my-2 text-teal-400">
            <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-xs font-mono font-bold flex items-center space-x-1">
              <span>Distillation Transfer: &alpha; = 0.3</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

          <div className="bg-navy-900/80 p-4 rounded-xl border border-teal-500/40 bg-teal-500/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-teal-400 font-bold block">
                Compact Deployable Student Model
              </span>
              <div className="text-lg font-bold text-white mt-0.5">GRU-64 + 2&times; GATv2 (2 Heads)</div>
              <p className="text-xs text-slate-300 mt-1">
                50% smaller hidden capacity; 20% pseudo-query training enables ungauged inference.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-teal-400 block font-mono font-bold">Test MAE (Outperforms!)</span>
              <span className="text-xl font-extrabold text-teal-300 font-mono">4.190 m</span>
              <span className="text-[10px] text-emerald-400 font-bold block">NSE 0.779</span>
            </div>
          </div>

          <div className="p-3 bg-navy-900/60 rounded-xl border border-navy-800 text-xs text-slate-300">
            <strong className="text-teal-300">The Distillation Regularization Dividend:</strong> The compact student beats the full teacher on held-out test data (4.19m vs 4.36m). The smooth Gaussian teacher targets prevent the student from memorizing sensor-specific high-frequency noise!
          </div>
        </div>

        {/* Alpha Parameter Sweep Table & Curve */}
        <div className="bg-navy-900/80 p-4 rounded-xl border border-teal-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wider font-mono text-teal-400 font-bold">
                Distillation Parameter &alpha; Sweep
              </div>
              <span className="text-[11px] text-slate-400">Tuned on Jan–Jun 2024 Val Window</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-navy-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-navy-950 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="p-2">&alpha; Weight</th>
                    <th className="p-2 text-right">Temp-Val MAE</th>
                    <th className="p-2 text-right">Temp-Val NSE</th>
                    <th className="p-2 text-right">Composite Val MAE</th>
                    <th className="p-2 text-center">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 font-mono">
                  {alphaSweep.map((r, idx) => {
                    const isOptimal = r.alpha === 0.3;
                    return (
                      <tr
                        key={idx}
                        className={isOptimal ? 'bg-teal-500/15 font-bold text-white' : 'text-slate-300'}
                      >
                        <td className="p-2 font-bold flex items-center space-x-1">
                          {isOptimal && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 mr-1 inline" />}
                          <span>&alpha; = {r.alpha.toFixed(1)}</span>
                        </td>
                        <td className="p-2 text-right">{r.temp_val_mae.toFixed(3)} m</td>
                        <td className="p-2 text-right">{r.temp_val_nse.toFixed(3)}</td>
                        <td className="p-2 text-right text-teal-300">{r.composite_val_mae.toFixed(3)} m</td>
                        <td className="p-2 text-center text-[10px]">
                          {isOptimal ? (
                            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                              Optimal &alpha;*
                            </span>
                          ) : r.alpha === 0.0 ? (
                            <span className="text-slate-400">No Distillation</span>
                          ) : (
                            <span className="text-slate-400">Over-Smoothed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-navy-950 rounded-xl border border-navy-800 text-xs text-slate-300 space-y-1">
              <span className="text-teal-400 font-bold block">Empirical Impact of Distillation:</span>
              <p className="text-[11px] text-slate-300">
                Moving from &alpha;=0.0 (no teacher) to &alpha;=0.3 cut composite validation error from <strong>11.246 m to 10.969 m</strong>, and boosted temporal-val NSE from <strong>0.748 to 0.779</strong>.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-right mt-3 font-mono">
            Table artifact: results/tables/student_alpha_sweep.csv
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Teacher Checkpoint: results/models/teacher_final.pt (GRU-128)</span>
        <span className="text-teal-400">Student Checkpoint: results/models/student_best.pt (GRU-64, Best &alpha;=0.3)</span>
      </div>
    </div>
  );
};
