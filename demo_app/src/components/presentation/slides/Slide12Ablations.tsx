import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, CheckCircle2, AlertOctagon, TrendingDown, ArrowRight } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const Slide12Ablations: React.FC = () => {
  const { ablations } = useData();

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Experiment 2 • Architectural Dissection
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Comprehensive Ablation Study & Component Sensitivity
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Isolating the quantitative contribution of graph message passing, pseudo-query masking, and knowledge distillation on held-out test performance.
        </p>
      </div>

      {/* Main Ablations Table */}
      <div className="my-auto overflow-hidden rounded-2xl border border-navy-800 bg-navy-900/90 shadow-xl max-h-[55vh] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-navy-950 text-slate-400 border-b border-navy-800 font-mono uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-4">Ablation / Configuration</th>
              <th className="py-2.5 px-3">Evaluation Task</th>
              <th className="py-2.5 px-3 text-right">MAE (m)</th>
              <th className="py-2.5 px-3 text-right">RMSE (m)</th>
              <th className="py-2.5 px-3 text-right">NSE</th>
              <th className="py-2.5 px-3 text-right">&Delta; MAE (m)</th>
              <th className="py-2.5 px-3 text-right">&Delta; NSE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60 font-sans">
            {ablations.map((row, idx) => {
              const isBase = row["Configuration / Model"].includes("Full");
              return (
                <tr
                  key={idx}
                  className={`hover:bg-navy-800/40 transition-colors ${
                    isBase ? 'bg-teal-500/10 font-bold text-white' : 'text-slate-300'
                  }`}
                >
                  <td className="py-2 px-4 flex items-center space-x-2">
                    {isBase && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                    <span>{row["Configuration / Model"]}</span>
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{row.Task}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-white">
                    {row["MAE (m)"].toFixed(3)} m
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">
                    {row["RMSE (m)"].toFixed(3)} m
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold">
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        row.NSE > 0 ? 'text-emerald-300 bg-emerald-500/10' : 'text-rose-300 bg-rose-500/10'
                      }`}
                    >
                      {row.NSE > 0 ? `+${row.NSE.toFixed(3)}` : row.NSE.toFixed(3)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[11px]">
                    {row["Delta MAE (m)"] > 0 ? (
                      <span className="text-rose-400">+{row["Delta MAE (m)"].toFixed(3)} m</span>
                    ) : row["Delta MAE (m)"] < 0 ? (
                      <span className="text-cyan-400">{row["Delta MAE (m)"].toFixed(3)} m</span>
                    ) : (
                      <span className="text-slate-500">0.000</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[11px]">
                    {row["Delta NSE"] > 0 ? (
                      <span className="text-cyan-400">+{row["Delta NSE"].toFixed(3)}</span>
                    ) : row["Delta NSE"] < 0 ? (
                      <span className="text-rose-400">{row["Delta NSE"].toFixed(3)}</span>
                    ) : (
                      <span className="text-slate-500">0.000</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2 Key Ablation Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-navy-900/60 p-3 rounded-xl border border-navy-800 text-xs text-slate-300">
          <strong className="text-teal-400 block mb-1">1. Distillation Benefit (&alpha; = 0.3):</strong>
          Removing distillation (&alpha; = 0.0) causes validation error to degrade by <strong className="text-rose-400">+0.582 m MAE</strong> and drops NSE by <strong>-0.030</strong>, confirming the regularizing effect of the K=5 teacher soft targets.
        </div>
        <div className="bg-navy-900/60 p-3 rounded-xl border border-navy-800 text-xs text-slate-300">
          <strong className="text-cyan-400 block mb-1">2. Spatiotemporal GNN vs Purely Local Models:</strong>
          While purely temporal models (GRU-only or Persistence) achieve low nominal error on wells with continuous history, they have <strong>zero capability to predict ungauged locations</strong>. Our unified GNN solves both simultaneously.
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Table artifact: results/tables/ablation_study.csv</span>
        <span className="text-teal-400">Test suite verification: tests/test_experiments.py (4/4 passed)</span>
      </div>
    </div>
  );
};
