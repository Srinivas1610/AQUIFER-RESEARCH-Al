import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Droplets, MapPin, ZapOff, Activity, Layers } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const Slide2Problem: React.FC = () => {
  const { meta } = useData();

  const observed = meta?.observed_records || 59065;
  const total = meta?.total_records || 99480;
  const missing = meta?.missing_records || (total - observed);
  const missingPct = ((missing / total) * 100).toFixed(1);

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Context & Challenges
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          The Groundwater Crisis & Telemetry Bottlenecks
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Karnataka's Deccan crystalline aquifers supply over 60% of irrigation and 85% of drinking water, yet real-world telemetry networks face three severe scientific bottlenecks.
        </p>
      </div>

      {/* 3 Core Challenges Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-rose-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <ZapOff className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. Pervasive Telemetry Dropouts</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Battery depletion, cellular blackouts, and physical sensor damage cause widespread data gaps. In Karnataka's official telemetry network, <strong className="text-rose-400">{missingPct}% of monthly records are missing</strong> ({missing.toLocaleString()} out of {total.toLocaleString()} well-months).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-slate-400 font-mono">
            Standard imputation or zero-filling biases model representations.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-amber-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. The Ungauged Borewell Dilemma</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Water authorities and farmers frequently require water level predictions at newly planned tube-wells or ungauged taluks where <strong className="text-amber-400">historical sensor time series are zero</strong>.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-slate-400 font-mono">
            Purely autoregressive and recurrent models collapse completely without history.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-navy-900/80 p-5 rounded-2xl border border-teal-500/30 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. Hard-Rock Hydrogeology</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Karnataka is 85% Archaean crystalline shield (granite/gneiss). Specific yield is extremely low (<strong className="text-teal-300">S_y &lt; 0.03</strong>), creating steep spatial gradients and discontinuous fracture flow that defeat naive spatial interpolation.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-slate-400 font-mono">
            Requires spatiotemporal graph learning with dynamic distance attention.
          </div>
        </motion.div>
      </div>

      {/* Real Data Evidence Banner */}
      <div className="bg-navy-900/50 rounded-xl p-4 border border-navy-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <Droplets className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-slate-300">
            <strong>Empirical Evidence from Karnataka DWLR:</strong> 59,065 observed monthly medians (&ge;10 valid days/month) vs 40,415 missing dropouts across 1,658 monitored wells.
          </span>
        </div>
        <div className="flex items-center space-x-2 text-teal-400 font-mono text-[11px] bg-teal-500/10 px-3 py-1 rounded-lg border border-teal-500/20">
          <span>Target Period: Jan 2021 – Dec 2025</span>
        </div>
      </div>
    </div>
  );
};
