import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Cpu, Network, ShieldCheck, Shuffle, Binary, Gauge, Info } from 'lucide-react';

interface StageInfo {
  id: string;
  name: string;
  shortDesc: string;
  details: string[];
  formula?: string;
  icon: any;
  color: string;
}

export const Slide4Architecture: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<string>('distillation');

  const stages: StageInfo[] = [
    {
      id: 'ingestion',
      name: '1. Ingestion & Audit',
      shortDesc: 'Quality controls on 5.75M rows',
      details: [
        'Ingested 6-hourly DWLR data, hourly rainfall, and temperature.',
        'Spike filter removed 193,867 readings outside [0.1, 100.0] m bgl.',
        'Daily median -> Monthly median requiring >=10 valid days per month.'
      ],
      icon: Binary,
      color: 'border-slate-500 text-slate-300'
    },
    {
      id: 'graph',
      name: '2. Dynamic GATv2 Graph',
      shortDesc: 'Geodesic exponential edge decay',
      details: [
        'Directed graph where each well connects to k=5 nearest monitored senders.',
        'Edge weight: w_ij = exp(-d_ij^2 / (2 * l^2)) with median length scale l = 6.47 km.',
        'Query wells receive spatial messages but send zero outbound messages (asymmetric).'
      ],
      formula: 'w_{ij} = \\exp\\left(-\\frac{d_{ij}^2}{2\\ell^2}\\right), \\quad \\ell = 6.47\\text{ km}',
      icon: Network,
      color: 'border-cyan-500 text-cyan-400'
    },
    {
      id: 'teacher',
      name: '3. Teacher Cross-Fitting',
      shortDesc: 'K=5 blocked out-of-fold fit',
      details: [
        'High-capacity teacher: GRU-128 + 2x GATv2 (4 heads) + 32 MLP.',
        'Trained across K=5 spatially blocked disjoint folds on 2021-2023 training data.',
        'Generates 16,312 unbiased out-of-fold soft predictive distributions N(mu_t, v_t).'
      ],
      icon: Cpu,
      color: 'border-purple-500 text-purple-400'
    },
    {
      id: 'distillation',
      name: '4. Student Distillation',
      shortDesc: 'Pseudo-query + KL divergence',
      details: [
        'Compact student: GRU-64 + 2 GATv2 heads + 32 MLP head.',
        '20% of training wells randomly masked as pseudo-queries (groundwater history hidden).',
        'Composite loss: L = (1 - alpha) * L_NLL + alpha * D_KL(Teacher || Student). Optimal alpha = 0.3.'
      ],
      formula: '\\mathcal{L} = (1 - \\alpha)\\mathcal{L}_{\\text{NLL}}(y, \\mu_s, v_s) + \\alpha D_{\\text{KL}}(\\mathcal{N}(\\mu_t, v_t) \\parallel \\mathcal{N}(\\mu_s, v_s))',
      icon: Shuffle,
      color: 'border-teal-400 text-teal-300 ring-2 ring-teal-400/30'
    },
    {
      id: 'imputer',
      name: '5. DeepMVI Imputer',
      shortDesc: 'Bidirectional neural sampling',
      details: [
        'Trained with artificial isolated and block masks on training wells.',
        'Generates S=20 stochastic completions with residual variance sigma^2 = 44.74 m^2.',
        'Law of Total Variance mixture captures epistemic and missingness uncertainty.'
      ],
      formula: 'v_{\\text{mix}} = \\frac{1}{S}\\sum_{s=1}^S v_s + \\frac{1}{S}\\sum_{s=1}^S (\\mu_s - \\mu_{\\text{mix}})^2',
      icon: Gauge,
      color: 'border-amber-400 text-amber-300'
    },
    {
      id: 'calibration',
      name: '6. Conformal Calibration',
      shortDesc: 'Split-conformal prediction',
      details: [
        'Fit on dedicated 6-month buffer (July-December 2024).',
        'Non-conformity score: s_i = max(L_i - y_i, y_i - U_i, 0).',
        'Expands intervals to [L_i - s_hat, U_i + s_hat], achieving valid >=90% empirical coverage.'
      ],
      icon: ShieldCheck,
      color: 'border-emerald-400 text-emerald-300'
    }
  ];

  const activeStage = stages.find(s => s.id === selectedStage) || stages[3];

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          System Architecture
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          End-to-End Spatiotemporal Distillation Pipeline
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Click on any architectural component below to inspect its mathematical formulation, parameter settings, and operational mechanics.
        </p>
      </div>

      {/* Interactive Horizontal Pipeline */}
      <div className="my-auto space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isSelected = stage.id === selectedStage;
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-navy-800 border-teal-400 shadow-lg shadow-teal-500/10 scale-[1.02]'
                    : 'bg-navy-900/60 border-navy-800 hover:border-slate-600 hover:bg-navy-800/60'
                }`}
              >
                <div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stage.color} bg-navy-950`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-white leading-tight">{stage.name}</div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 line-clamp-1">{stage.shortDesc}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-navy-900/90 rounded-2xl p-5 border border-teal-500/30 grid grid-cols-1 md:grid-cols-3 gap-6 items-center"
          >
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                  {activeStage.name}
                </span>
                <span className="text-xs text-slate-400">Component Specifications</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {activeStage.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-teal-400 font-bold mr-2">&bull;</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-navy-950/90 p-4 rounded-xl border border-navy-800 space-y-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-teal-400" />
                <span>Mathematical Formulation</span>
              </div>
              <div className="font-mono text-xs text-teal-300 bg-navy-900 p-2.5 rounded-lg border border-navy-800 overflow-x-auto">
                {activeStage.formula || 'Supervised Gaussian NLL Loss on observed targets'}
              </div>
              <div className="text-[10px] text-slate-400">
                100% Zero-leakage implementation verified by tests/test_leakage.py
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Framework implemented in: src/gwml/</span>
        <span className="text-teal-400">Checkpoints: results/models/ (student_best.pt, teacher_final.pt, deepmvi_imputer.pt)</span>
      </div>
    </div>
  );
};
