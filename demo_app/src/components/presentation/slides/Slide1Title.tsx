import React from 'react';
import { motion } from 'framer-motion';
import { Award, Database, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const Slide1Title: React.FC = () => {
  const { meta } = useData();

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      {/* Top Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>Semester V • Machine Learning Capstone Research</span>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span className="flex items-center text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" /> 40/40 Tests Passing
          </span>
          <span>•</span>
          <span className="text-teal-400 font-medium">100% Zero-Fabrication Audit</span>
        </div>
      </motion.div>

      {/* Main Title Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="my-auto space-y-6 max-w-5xl"
      >
        <div className="space-y-3">
          <div className="text-teal-400 font-mono text-sm tracking-wider uppercase font-semibold">
            Spatiotemporal Hydrological Deep Learning
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Location-Aware Aquifer Monitoring in Karnataka, India
          </h1>
          <h2 className="text-xl sm:text-2xl text-slate-300 font-medium leading-snug">
            A Teacher–Student Knowledge Distillation Approach with DeepMVI Imputation & Conformal Uncertainty
          </h2>
        </div>

        <p className="text-base text-slate-400 max-w-3xl leading-relaxed">
          An end-to-end reproducible machine learning pipeline solving the unmonitored well cold-start challenge across 1,658 telemetry borewells over a 60-month study period (2021–2025).
        </p>

        {/* Highlight Pills */}
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-navy-900 border border-navy-700/80 text-xs">
            <span className="text-teal-400 font-bold">1,658</span>
            <span className="text-slate-300">Monitoring Wells</span>
          </div>
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-navy-900 border border-navy-700/80 text-xs">
            <span className="text-cyan-400 font-bold">60</span>
            <span className="text-slate-300">Calendar Months (2021–2025)</span>
          </div>
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-navy-900 border border-navy-700/80 text-xs">
            <span className="text-emerald-400 font-bold">NSE +0.024</span>
            <span className="text-slate-300">Ungauged Generalization (vs -0.059 Baseline)</span>
          </div>
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-navy-900 border border-navy-700/80 text-xs">
            <span className="text-purple-400 font-bold">25-km Blocks</span>
            <span className="text-slate-300">Leakage-Free Spatial Split</span>
          </div>
        </div>
      </motion.div>

      {/* Footer Info Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-navy-800"
      >
        <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-800">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">Student Investigator</div>
          <div className="text-sm font-bold text-white mt-0.5">{meta?.author || 'Srini K. R.'}</div>
          <div className="text-xs text-slate-400 mt-0.5">Department of Computer Science & Engineering</div>
        </div>
        <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-800">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">Target Region & Platform</div>
          <div className="text-sm font-bold text-teal-300 mt-0.5">Karnataka, India (31 Districts)</div>
          <div className="text-xs text-slate-400 mt-0.5">National Water Data Portal (NWIC / CGWB)</div>
        </div>
        <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-800">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">Presentation Guides</div>
          <div className="text-sm font-bold text-white mt-0.5">{meta?.guide_name || 'Project Evaluation Faculty'}</div>
          <div className="text-xs text-teal-400/90 mt-0.5">Press 'N' for notes • 'G' for slide menu • '?' for cheat sheet</div>
        </div>
      </motion.div>
    </div>
  );
};
