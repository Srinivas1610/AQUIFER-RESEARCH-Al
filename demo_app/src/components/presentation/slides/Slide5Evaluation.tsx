import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, Grid, AlertCircle, ArrowRight } from 'lucide-react';

export const Slide5Evaluation: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Scientific Rigor
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Leakage-Free 25-km Spatial & Chronological Splits
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Standard random well splitting creates severe optimistic bias due to spatial autocorrelation. We implemented whole-cell block partitioning and strict forward chronological validation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-auto">
        {/* Spatial 25-km Block Split */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-teal-500/30 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
              <Grid className="w-4 h-4" />
              <span>Spatial 25-km Grid Block Split (EPSG:32643)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Wells were projected into UTM Zone 43N meters and assigned to 25-km cells: <code className="text-teal-300">(&lfloor;x/25000&rfloor;, &lfloor;y/25000&rfloor;)</code>. The 278 occupied cells were shuffled with seed 42 and assigned intact:
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="bg-navy-950 p-3 rounded-xl border border-navy-800 text-center">
                <span className="text-[11px] text-slate-400 block font-medium">Training</span>
                <span className="text-lg font-bold text-teal-400">1,061 wells</span>
                <span className="text-[10px] text-slate-500 block">64.0% (183 cells)</span>
              </div>
              <div className="bg-navy-950 p-3 rounded-xl border border-navy-800 text-center">
                <span className="text-[11px] text-slate-400 block font-medium">Spatial-Val</span>
                <span className="text-lg font-bold text-cyan-400">265 wells</span>
                <span className="text-[10px] text-slate-500 block">16.0% (32 cells)</span>
              </div>
              <div className="bg-navy-950 p-3 rounded-xl border border-navy-800 text-center">
                <span className="text-[11px] text-slate-400 block font-medium">Held-Out Test</span>
                <span className="text-lg font-bold text-purple-400">332 wells</span>
                <span className="text-[10px] text-slate-500 block">20.0% (63 cells)</span>
              </div>
            </div>

            <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20 text-xs text-slate-300">
              <strong className="text-teal-300">Zero Spatial Leakage:</strong> No grid cell appears in multiple partitions. Query wells receive graph messages from training wells but transmit zero messages outward.
            </div>
          </div>
        </motion.div>

        {/* Chronological Temporal Progression */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-purple-500/30 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Strict Chronological Progression (Table 2 Protocol)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              No future observations ever leak into past representations. The 60-month study period follows strict non-overlapping temporal windows:
            </p>

            <div className="space-y-2 pt-1 font-mono text-xs">
              <div className="p-2.5 bg-navy-950 rounded-lg border border-navy-800 flex items-center justify-between">
                <div>
                  <span className="text-teal-400 font-bold">1. Initial Fit:</span>
                  <span className="text-slate-300 ml-2">2021-01 to 2023-12 (36 months)</span>
                </div>
                <span className="text-[10px] text-slate-500">Train Wells Only</span>
              </div>
              <div className="p-2.5 bg-navy-950 rounded-lg border border-navy-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">2. Model Selection:</span>
                  <span className="text-slate-300 ml-2">2024-01 to 2024-06 (6 months)</span>
                </div>
                <span className="text-[10px] text-slate-500">&alpha; Sweep Tuning</span>
              </div>
              <div className="p-2.5 bg-navy-950 rounded-lg border border-navy-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold">3. Calibration:</span>
                  <span className="text-slate-300 ml-2">2024-07 to 2024-12 (6 months)</span>
                </div>
                <span className="text-[10px] text-slate-500">Conformal Buffer</span>
              </div>
              <div className="p-2.5 bg-navy-950 rounded-lg border border-purple-500/40 flex items-center justify-between bg-purple-500/10">
                <div>
                  <span className="text-purple-300 font-bold">4. Final Test:</span>
                  <span className="text-white ml-2">2025-01 to 2025-12 (12 months)</span>
                </div>
                <span className="text-[10px] text-purple-300 font-bold">10,323 Targets</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Verified by automated tests: tests/test_splits.py & tests/test_leakage.py</span>
        <span className="text-teal-400">Saved Manifest: results/manifests/spatial_split_manifest.csv</span>
      </div>
    </div>
  );
};
