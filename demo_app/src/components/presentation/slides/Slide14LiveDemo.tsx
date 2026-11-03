import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Play, Map, BarChart3, Database, FileText, HelpCircle, ArrowRight } from 'lucide-react';

interface Slide14LiveDemoProps {
  onSwitchToExplorer?: () => void;
}

export const Slide14LiveDemo: React.FC<Slide14LiveDemoProps> = ({ onSwitchToExplorer }) => {
  return (
    <div className="h-full flex flex-col justify-between py-6 px-4 sm:px-12 text-slate-100">
      <div>
        <div className="text-teal-400 font-mono text-xs tracking-wider uppercase font-semibold">
          Live Interactive Software
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Interactive Aquifer Monitoring Dashboard
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Let us now transition from presentation slides to the live interactive software explorer, allowing live geospatial and temporal inspection of all 1,658 monitoring stations.
        </p>
      </div>

      {/* Main Interactive CTA Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="my-auto bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 p-6 sm:p-8 rounded-3xl border border-teal-500/40 shadow-2xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-semibold">
              <Play className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
              <span>Interactive Demonstration Ready</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Launch Live Model & Geospatial Explorer
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore individual well hydrographs with 90% conformal bands, examine statewide geospatial error maps, toggle baseline models, and inspect the 32-column canonical dataset live on your laptop.
            </p>

            <div className="pt-2">
              <button
                onClick={onSwitchToExplorer}
                className="inline-flex items-center space-x-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
              >
                <span>Launch Interactive Explorer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Feature Pills Grid */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-navy-950/80 p-3.5 rounded-xl border border-navy-800 flex items-center space-x-3">
              <Map className="w-5 h-5 text-teal-400 shrink-0" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Karnataka Map</span>
                <span className="text-[10px] text-slate-400">1,658 Wells Plotted</span>
              </div>
            </div>

            <div className="bg-navy-950/80 p-3.5 rounded-xl border border-navy-800 flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Well Hydrographs</span>
                <span className="text-[10px] text-slate-400">90% Conformal Bands</span>
              </div>
            </div>

            <div className="bg-navy-950/80 p-3.5 rounded-xl border border-navy-800 flex items-center space-x-3">
              <Database className="w-5 h-5 text-purple-400 shrink-0" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Data Dictionary</span>
                <span className="text-[10px] text-slate-400">All 32 Features</span>
              </div>
            </div>

            <div className="bg-navy-950/80 p-3.5 rounded-xl border border-navy-800 flex items-center space-x-3">
              <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Ma'am Q&A Bank</span>
                <span className="text-[10px] text-slate-400">20 Defense Answers</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-navy-800 pt-2">
        <span>Click the button above or toggle 'Explorer' in the top navigation bar</span>
        <span className="text-teal-400 font-mono">Fully Offline Local Execution</span>
      </div>
    </div>
  );
};
