import React from 'react';
import { motion } from 'framer-motion';
import { Database, Filter, CheckCircle2, ShieldAlert, BarChart3, CloudRain } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const Slide3Data: React.FC = () => {
  const { meta, wells } = useData();

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Data Acquisition & Quality Assurance
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Real NWIC Telemetry Ingestion & Sensor Audit
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Ingested 1.14 GB of raw 6-hourly telemetry from the National Water Data Portal (NWDP/NWIC), enforcing strict meteorological and hydrologic quality controls.
        </p>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-navy-900/90 p-4 rounded-xl border border-teal-500/30"
        >
          <div className="text-xs text-slate-400 font-medium">Groundwater Telemetry</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 mt-1">5,747,936</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Raw 6-hourly DWLR records</div>
          <div className="mt-2 text-[10px] text-teal-300 font-mono bg-teal-500/10 py-0.5 px-2 rounded inline-block">
            1,658 Wells Verified
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-navy-900/90 p-4 rounded-xl border border-cyan-500/30"
        >
          <div className="text-xs text-slate-400 font-medium">Rainfall Telemetry</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">683,619</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Hourly records across 686 stns</div>
          <div className="mt-2 text-[10px] text-cyan-300 font-mono bg-cyan-500/10 py-0.5 px-2 rounded inline-block">
            Geodesic IDW (k&le;5, p=2)
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-navy-900/90 p-4 rounded-xl border border-amber-500/30"
        >
          <div className="text-xs text-slate-400 font-medium">Temperature Telemetry</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">2,415,543</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Hourly records across 132 stns</div>
          <div className="mt-2 text-[10px] text-amber-300 font-mono bg-amber-500/10 py-0.5 px-2 rounded inline-block">
            Geodesic IDW (k&le;5, p=2)
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-navy-900/90 p-4 rounded-xl border border-purple-500/30"
        >
          <div className="text-xs text-slate-400 font-medium">Canonical Grid Tensor</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">99,480</div>
          <div className="text-[11px] text-slate-400 mt-0.5">1,658 wells &times; 60 months</div>
          <div className="mt-2 text-[10px] text-purple-300 font-mono bg-purple-500/10 py-0.5 px-2 rounded inline-block">
            32 Engineered Covariates
          </div>
        </motion.div>
      </div>

      {/* Sensor Spike Audit Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-navy-900/70 p-4 rounded-xl border border-navy-800 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Rigorous Sensor Spike Audit (DATA_AUDIT.md)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Raw DWLR sensors occasionally transmit battery drops as extreme non-physical values. We eliminated <strong className="text-rose-400">193,867 non-physical readings</strong> outside the physically feasible envelope of <strong>[0.1, 100.0] m bgl</strong>.
          </p>
          <div className="text-[11px] text-slate-400 font-mono bg-navy-950 p-2 rounded border border-navy-800">
            Rule: Daily median &rarr; Monthly median requiring &ge;10 valid daily medians. Sparse months recorded as NaN (zero interpolation into target labels).
          </div>
        </div>

        <div className="bg-navy-900/70 p-4 rounded-xl border border-navy-800 space-y-2">
          <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            <span>Feature Engineering & Geodesic Distance</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-navy-950 p-2 rounded border border-navy-800">
              <span className="text-slate-400 block text-[10px]">Covariates</span>
              <span className="text-white font-medium">Trailing 3/6/12m Rain, Temp, Harmonics (sin/cos)</span>
            </div>
            <div className="bg-navy-950 p-2 rounded border border-navy-800">
              <span className="text-slate-400 block text-[10px]">Autoregressive Lags</span>
              <span className="text-white font-medium">Lags 1, 2, 3, 6, 12m + 1m/3m Delta Trends</span>
            </div>
            <div className="bg-navy-950 p-2 rounded border border-navy-800">
              <span className="text-slate-400 block text-[10px]">Spatial Coordinates</span>
              <span className="text-white font-medium">EPSG:32643 UTM (m) + Haversine (km)</span>
            </div>
            <div className="bg-navy-950 p-2 rounded border border-navy-800">
              <span className="text-slate-400 block text-[10px]">Core Cohort</span>
              <span className="text-white font-medium">260 Wells (&ge;70% targets in 2021-23)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Audit Confirmation */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Verified against: results/tables/data_inventory.csv</span>
        <span className="text-teal-400 font-semibold">Saved Artifact: data/processed/spatiotemporal_grid.npz (T=60, N=1,658)</span>
      </div>
    </div>
  );
};
