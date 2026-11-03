import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle, FileText, Github, Mail, ShieldCheck, Sparkles, Terminal, User } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const Slide18ThankYou: React.FC = () => {
  const { meta } = useData();

  return (
    <div className="h-full flex flex-col justify-between py-8 px-4 sm:px-12 text-slate-100">
      <div className="text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-mono uppercase tracking-wider mb-3"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Presentation Complete • Open for Defense & Discussion</span>
        </motion.div>

        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Thank You, Ma'am!
        </h2>
        <p className="text-slate-300 text-base mt-2">
          Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto w-full my-auto">
        {/* Presenter Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-navy-700 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Presenter & Research Team</h3>
            <p className="text-xs text-slate-400 mb-3">Department of Computer Science & Engineering</p>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">Author:</span>
                <span className="font-semibold text-white">{meta?.author || 'Srini'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">Semester:</span>
                <span className="font-semibold text-white">{meta?.academic_session || 'Semester V (ML Project)'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">Project Guide:</span>
                <span className="font-semibold text-teal-400">{meta?.guide_name || "Faculty Guide (Ma'am)"}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Institution:</span>
                <span className="font-semibold text-white">{meta?.institution || 'Engineering College'}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-teal-400 font-mono flex items-center justify-between">
            <span>Status: Verified Pipeline</span>
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Artifacts & Reproducibility */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-navy-700 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Generated Deliverables</h3>
            <p className="text-xs text-slate-400 mb-3">100% reproducible artifacts in repo</p>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-navy-950/70 border border-navy-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-slate-300 truncate">1_RESEARCH_PAPER_main.pdf (12 Pages)</span>
              </div>
              <div className="p-2 rounded-lg bg-navy-950/70 border border-navy-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="text-slate-300 truncate">2_COMPARATIVE_BENCHMARK_REPORT.pdf</span>
              </div>
              <div className="p-2 rounded-lg bg-navy-950/70 border border-navy-800 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 truncate">40/40 Automated Pytest Suite Passing</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-cyan-300 font-mono">
            Zero synthetic data used in final paper.
          </div>
        </motion.div>

        {/* Defense Readiness Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-navy-900 via-navy-900 to-teal-950/70 p-5 rounded-2xl border border-teal-500/40 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Defense Readiness</h3>
            <p className="text-xs text-slate-400 mb-3">20 interactive Q&A defenses prepped</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every design decision, spatial split strategy, edge feature formula, distillation loss weighting, and conformal calibration quantile is fully documented in <span className="font-mono text-teal-300">DECISIONS.md</span> and audited in <span className="font-mono text-teal-300">DATA_AUDIT.md</span>.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800">
            <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Ready for Live Code & Hydrograph Exploration</span>
            </span>
          </div>
        </motion.div>
      </div>

      <div className="text-center text-xs text-slate-400">
        Press <kbd className="px-2 py-0.5 bg-navy-800 rounded border border-navy-700 text-teal-300 font-mono font-semibold">E</kbd> or click top button to switch to <strong className="text-white">Explorer Mode</strong> for live interactive map, hydrographs, and defense Q&A.
      </div>
    </div>
  );
};
