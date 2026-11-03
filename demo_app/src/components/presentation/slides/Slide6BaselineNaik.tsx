import React from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, Check, X, ShieldAlert, FileText, ChevronRight } from 'lucide-react';

export const Slide6BaselineNaik: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Comparative Literature Audit
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Baseline Audit: Naik et al. (October 2026)
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          An honest, un-fabricated audit of the MIT Manipal Master Report (Naik, Venkatesh, Reddy) on Karnataka groundwater spatiotemporal modeling.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-auto">
        {/* What They Claimed & Implemented */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-navy-700 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs uppercase tracking-wider mb-3">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Naik et al. Architecture & Reported Metrics</span>
            </div>
            
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                <strong>Architecture:</strong> GATv2 (2 layers, 2 heads) + GRU encoder (hidden 32) + MLP head predicting Gaussian parameters with residual skip: <code className="text-cyan-300">\mu = y_t + \Delta\mu</code>.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-navy-950 p-2.5 rounded-lg border border-navy-800">
                  <span className="text-[10px] text-slate-400 block">Monitored Test MAE</span>
                  <span className="text-base font-bold text-cyan-300">2.12 m</span>
                  <span className="text-[10px] text-slate-500 block">Reported Table 6.1</span>
                </div>
                <div className="bg-navy-950 p-2.5 rounded-lg border border-navy-800">
                  <span className="text-[10px] text-slate-400 block">Monitored Test NSE</span>
                  <span className="text-base font-bold text-cyan-300">0.811</span>
                  <span className="text-[10px] text-slate-500 block">Reported Table 6.1</span>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
                Ingested 11 raw NWDP datasets (~2.5 GB) covering Karnataka groundwater, rainfall, temperature, reservoir storage, and river gauge discharge.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-navy-950 border border-navy-800 text-[11px] text-slate-400">
            Reference Document: <em>"Spatiotemporal Groundwater Level Prediction in Karnataka: Complete Project Master Report"</em> (14 pages).
          </div>
        </motion.div>

        {/* The 3 Critical Failures Documented */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-rose-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs uppercase tracking-wider mb-3">
              <ShieldAlert className="w-4 h-4" />
              <span>3 Critical Flaws Proven by Their Own Data</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 space-y-1">
                <div className="font-bold text-rose-300 flex items-center">
                  <X className="w-3.5 h-3.5 mr-1 text-rose-400 shrink-0" />
                  1. Ungauged Spatial Failure (NSE = -0.059)
                </div>
                <p className="text-slate-300 text-[11px] pl-4">
                  On unmonitored query borewells, their model completely collapsed (<strong className="text-rose-400">NSE = -0.059</strong>, Page 11 Table 6.2). In hydrology, an NSE below 0 means <strong>the model is worse than predicting the historical average!</strong>
                </p>
              </div>

              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 space-y-1">
                <div className="font-bold text-amber-300 flex items-center">
                  <X className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />
                  2. The "Residual Shortcut" Illusion
                </div>
                <p className="text-slate-300 text-[11px] pl-4">
                  Their 2.12 m MAE on monitored wells was an illusion: because they hardcoded <code className="text-amber-200">\mu = y_t + \Delta\mu</code>, <strong>Lag-1 Persistence beat their neural network (1.95 m vs 2.12 m)</strong>! The network merely memorized the previous value.
                </p>
              </div>

              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 space-y-1">
                <div className="font-bold text-purple-300 flex items-center">
                  <X className="w-3.5 h-3.5 mr-1 text-purple-400 shrink-0" />
                  3. Physically Broken Uncertainty & No Distillation
                </div>
                <p className="text-slate-300 text-[11px] pl-4">
                  Their interval width was fixed at <strong>17.16 m</strong> even when 40% of telemetry dropped out, and coverage collapsed to 83.8%. Furthermore, <strong>Teacher–Student Distillation was 0% implemented</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 text-right">
            <span className="text-[11px] text-teal-400 font-medium">See comparative proof in: 2_COMPARATIVE_BENCHMARK_REPORT_vs_Naik.pdf</span>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Verified against: Naik et al. Master Report (Section 6 & 7)</span>
        <span className="text-rose-400 font-semibold">Cold-Start Collapse Confirmed: Page 13 Insight 2 ("Zero-History NSE ~ 0, error ~ 14.5m")</span>
      </div>
    </div>
  );
};
