import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Lightbulb, TrendingUp, Layers, Zap } from 'lucide-react';

export const Slide16Limitations: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Scientific Humility & Honest Boundaries
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Limitations & Future Research Directions
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Transparently documenting operational constraints, theoretical boundary conditions, and promising future engineering extensions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-amber-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">1. Non-Exchangeability of Conformal Intervals</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Conformal prediction theorems assume data points are exchangeable. In environmental time series, pronounced summer-to-monsoon seasonality and spatial autocorrelation formally violate exchangeability.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-amber-300 font-mono">
            We report empirical coverage honestly without claiming unconditional finite-sample guarantees.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-teal-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">2. Unmetered Tube-Well Pumping</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Agricultural groundwater extraction in peninsular India is completely unmetered at the field level. Crop water demand and irrigation pumping are major anthropogenic drivers not directly observable in DWLR telemetry.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-teal-300 font-mono">
            Future Work: Incorporate agricultural electrical feeder power consumption as an extraction proxy.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-cyan-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">3. Vertical Aquifer Stratification</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our 2D surface graph models horizontal spatial attention. However, Deccan hydrogeology has dual-layer vertical dynamics: an upper weathered regolith (5–20 m) overlying deep fractured granitic bedrock (20–100 m).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-cyan-300 font-mono">
            Future Work: Integrate 3D lithological borehole logs and drilling lithology attributes.
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Documented in: paper/PAPER.md (Section 8) & docs/DECISIONS.md</span>
        <span className="text-teal-400">Scientific Integrity: Acknowledging limits strengthens research validity</span>
      </div>
    </div>
  );
};
