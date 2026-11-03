import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Terminal, FileCode, CheckSquare, RefreshCw } from 'lucide-react';

export const Slide15Reproducibility: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Scientific Transparency & Integrity
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Reproducibility, Automated Tests & Verification
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Every figure, table, and metric reported in this project is directly traceable to saved computational artifacts produced by executed Python code.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-navy-900/80 p-4 rounded-xl border border-emerald-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">Test Suite</span>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">40 / 40</div>
            <div className="text-xs font-semibold text-emerald-300 mt-1">Passing Unit & Leakage Tests</div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Automated tests in <code className="text-slate-300">tests/</code> cover spatial exclusivity, temporal ordering, graph query node asymmetry, and metric boundaries.
            </p>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 font-mono">pytest tests/ -v</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-navy-900/80 p-4 rounded-xl border border-teal-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-2 text-teal-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">Artifact Audit</span>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">100%</div>
            <div className="text-xs font-semibold text-teal-300 mt-1">Zero-Fabrication Audit</div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Automated traceability script verifies that all 11 summary tables, 3 models, and 7 figures exist and have zero placeholder numbers.
            </p>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 font-mono">scripts/audit_artifacts.py</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-navy-900/80 p-4 rounded-xl border border-cyan-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 mb-2">
              <RefreshCw className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">Fixed Seeds</span>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">[42, 43, 44]</div>
            <div className="text-xs font-semibold text-cyan-300 mt-1">Multi-Seed Reproducibility</div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Random number generation across PyTorch, NumPy, and Scikit-learn is locked for exact reproduction of model weights and spatial splits.
            </p>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 font-mono">src/gwml/utils/seed.py</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-navy-900/80 p-4 rounded-xl border border-purple-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-2 text-purple-400 mb-2">
              <Terminal className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">Automation</span>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">Makefile</div>
            <div className="text-xs font-semibold text-purple-300 mt-1">One-Command Execution</div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Standardized pipeline targets (<code className="text-slate-300">make test</code>, <code className="text-slate-300">make smoke</code>, <code className="text-slate-300">make paper</code>) ensure friction-free reproduction.
            </p>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 font-mono">Makefile & configs/*.yaml</div>
        </motion.div>
      </div>

      {/* Checklist Preview */}
      <div className="bg-navy-900/60 rounded-xl p-3 border border-navy-800 flex items-center justify-between text-xs">
        <span className="text-slate-300">
          <strong>Non-Negotiable Research Standard:</strong> Imputed values are never counted as measured samples and never receive an observed target mask. Scalers fit strictly on pre-2024 training data.
        </span>
        <span className="text-teal-400 font-mono text-[11px] font-bold">SUBMISSION_CHECKLIST.md Verified</span>
      </div>
    </div>
  );
};
