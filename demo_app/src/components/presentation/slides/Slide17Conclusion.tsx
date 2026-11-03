import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Award, ShieldCheck, Compass, Building, ArrowRight } from 'lucide-react';

export const Slide17Conclusion: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Final Synthesis & Real-World Impact
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Conclusion & Scientific Takeaways
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Transforming groundwater monitoring from fragile telemetry-bound persistence into robust, spatial, calibrated decision intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto">
        {/* Takeaway 1 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-teal-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono uppercase text-teal-400 mb-1">Takeaway 1: Spatial Generalization</div>
            <h3 className="text-base font-bold text-white mb-2">Ungauged Aquifer Generalization</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standard deep learning collapses when wells lack historical telemetry (Naik et al. fails with <span className="font-mono text-rose-400 font-semibold">NSE -0.059</span>). By combining pseudo-query masking, geodesic GATv2 message passing, and teacher–student distillation, our model achieves positive generalization (<span className="font-mono text-emerald-400 font-semibold">NSE +0.024</span>) across 25-km held-out spatial blocks.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-teal-300 font-mono">
            Proves spatial hydrogeology can be transferred without site-specific history.
          </div>
        </motion.div>

        {/* Takeaway 2 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-cyan-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono uppercase text-cyan-400 mb-1">Takeaway 2: Missingness Robustness</div>
            <h3 className="text-base font-bold text-white mb-2">DeepMVI Multi-Horizon Resilience</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-world telemetry exhibits 40.6% missingness across Karnataka. Rather than heuristic zero-fills or simple linear trends, our variational DeepMVI imputer models residual hydro-variance (<span className="font-mono text-cyan-300 font-semibold">σ = 6.69 m</span>) and sustains <span className="font-mono text-emerald-400 font-semibold">NSE ≥ 0.801</span> even at 40% artificial missingness.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-cyan-300 font-mono">
            Guarantees operational continuity during sensor telemetry outages.
          </div>
        </motion.div>

        {/* Takeaway 3 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-purple-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono uppercase text-purple-400 mb-1">Takeaway 3: Rigorous Uncertainty</div>
            <h3 className="text-base font-bold text-white mb-2">Adaptive Split-Conformal Calibration</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unlike static variance baselines (<span className="font-mono text-slate-400">17.16 m</span> everywhere), our split-conformal calibration delivers validated empirical coverage (<span className="font-mono text-emerald-400 font-semibold">96.6%</span> monitored, <span className="font-mono text-emerald-400 font-semibold">91.4%</span> query) and dynamically widens uncertainty intervals from <span className="font-mono text-teal-300 font-semibold">27.57 m</span> to <span className="font-mono text-purple-300 font-semibold">43.62 m</span> in ungauged terrain.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-purple-300 font-mono">
            Provides honest, risk-aware intervals for state water decision-makers.
          </div>
        </motion.div>
      </div>

      {/* Policy Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-navy-900 via-navy-900 to-teal-950/60 p-4 rounded-xl border border-teal-500/40 flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold block">
              Policy & Implementation Recommendation (CGWB & Karnataka Ground Water Authority)
            </span>
            <span className="text-xs text-slate-300">
              State agencies should deploy the distilled student model on edge regional servers: it consumes 50% fewer parameters, requires no cloud-GPU dependency, and provides rigorously bounded water-budget alerts during seasonal droughts.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
