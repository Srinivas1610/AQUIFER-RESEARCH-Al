import React from 'react';
import { useData } from '../../context/DataContext';
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  MapPin,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';

interface OverviewDashboardTabProps {
  onNavigate: (tab: string) => void;
  onSelectWellForHydrograph: (wellId: string) => void;
}

export const OverviewDashboardTab: React.FC<OverviewDashboardTabProps> = ({
  onNavigate,
  onSelectWellForHydrograph
}) => {
  const { meta, wells } = useData();

  // Top critical districts by depth
  const criticalDistricts = [
    { name: 'Kolar', avgDepth: '34.2 m', risk: 'Critical Over-Exploited', statusColor: 'bg-rose-50 text-rose-700 border border-rose-200' },
    { name: 'Chikkaballapura', avgDepth: '31.8 m', risk: 'Critical Over-Exploited', statusColor: 'bg-rose-50 text-rose-700 border border-rose-200' },
    { name: 'Tumkur', avgDepth: '22.4 m', risk: 'Semi-Critical Depletion', statusColor: 'bg-amber-50 text-amber-700 border border-amber-200' },
    { name: 'Chitradurga', avgDepth: '18.9 m', risk: 'Moderate Stress', statusColor: 'bg-slate-100 text-slate-700 border border-slate-200' },
    { name: 'Udupi / Coastal', avgDepth: '6.4 m', risk: 'Safe High Water Table', statusColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 text-slate-800 overflow-y-auto max-w-7xl mx-auto space-y-6">
      {/* Platform Academic Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Machine Learning Research Project • Semester Capstone</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Spatiotemporal Groundwater Level Prediction for Location-Aware Aquifer Monitoring
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Karnataka, India study area (1,658 monitoring borewells, 2021–2025). Integrates <strong>Temporal GRU Encoders</strong>, <strong>GATv2 Graph Attention Networks</strong>, <strong>DeepMVI Variational Imputation</strong>, and <strong>Split-Conformal Uncertainty Calibration</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => onNavigate('map')}
              className="py-2 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Explore 1,658 Wells Map</span>
            </button>
            <button
              onClick={() => onNavigate('comparison')}
              className="py-2 px-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center space-x-1.5 transition shadow-xs"
            >
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>Benchmark vs Naik (2024)</span>
            </button>
            <button
              onClick={() => onNavigate('papers')}
              className="py-2 px-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200 flex items-center justify-center space-x-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Read 12-Page Paper</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric KPI Cards (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Wells */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Monitoring Network</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">1,658</div>
          <div className="text-[11px] text-slate-500 mt-0.5">31 Karnataka Districts</div>
        </div>

        {/* Time Span */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Time Horizon</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">60 Mos</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Jan 2021 – Dec 2025</div>
        </div>

        {/* Ungauged Query Win */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Ungauged NSE</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">+0.024</div>
          <div className="text-[11px] text-slate-500 mt-0.5">vs Naik -0.059</div>
        </div>

        {/* Monitored Accuracy */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Monitored MAE</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">4.19 m</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">3.40 m with residual skip</div>
        </div>

        {/* Conformal Coverage */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Conformal Coverage</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">96.6%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Nominal: 90% (Bounded)</div>
        </div>

        {/* Distillation Efficiency */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Parameter Reduction</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">-50%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">71k params (~15ms CPU)</div>
        </div>
      </div>

      {/* Main Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Audited Scorecard & Innovation Highlights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Head-to-Head Comparative Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Benchmark Audit vs Naik et al. (2024 Baseline)
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                Audited Findings
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Row 1: Ungauged Generalization */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900 block">1. Ungauged Well Generalization (Cold-Start)</span>
                  <span className="text-slate-500 text-[11px]">Evaluating borewells with zero prior telemetry sequence</span>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Naik et al. (2024)</span>
                    <span className="font-mono text-rose-600 font-semibold">NSE -0.059 (Fails)</span>
                  </div>
                  <div className="text-slate-400 font-semibold">vs</div>
                  <div>
                    <span className="text-[10px] text-blue-600 block font-mono font-semibold">Our Student</span>
                    <span className="font-mono text-emerald-700 font-bold">NSE +0.024 (Superior)</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Distillation Compliance */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900 block">2. Teacher–Student Model Distillation</span>
                  <span className="text-slate-500 text-[11px]">Compression for low-power edge gateways</span>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Naik et al. (2024)</span>
                    <span className="font-mono text-slate-500">None (0%)</span>
                  </div>
                  <div className="text-slate-400 font-semibold">vs</div>
                  <div>
                    <span className="text-[10px] text-blue-600 block font-mono font-semibold">Our Student</span>
                    <span className="font-mono text-slate-900 font-bold">-50% Parameters (71k)</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Uncertainty Quantification */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900 block">3. Split-Conformal Uncertainty Calibration</span>
                  <span className="text-slate-500 text-[11px]">Empirically bounded prediction intervals for water managers</span>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Naik et al. (2024)</span>
                    <span className="font-mono text-slate-500">17.16 m (Static Flat)</span>
                  </div>
                  <div className="text-slate-400 font-semibold">vs</div>
                  <div>
                    <span className="text-[10px] text-blue-600 block font-mono font-semibold">Our Student</span>
                    <span className="font-mono text-blue-700 font-bold">Adaptive 27.57m → 43.62m</span>
                  </div>
                </div>
              </div>

              {/* Row 4: Missingness Robustness */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900 block">4. Telemetry Dropout Resilience</span>
                  <span className="text-slate-500 text-[11px]">Addressing the 40.6% missing records across Karnataka sensors</span>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Naik et al. (2024)</span>
                    <span className="font-mono text-slate-500">Assumes Clean Sequence</span>
                  </div>
                  <div className="text-slate-400 font-semibold">vs</div>
                  <div>
                    <span className="text-[10px] text-blue-600 block font-mono font-semibold">Our Student</span>
                    <span className="font-mono text-emerald-700 font-bold">NSE ≥ 0.801 @ 40% Drop</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Detailed metrics traceable to Table 2 & Table 3 in results.
              </span>
              <button
                onClick={() => onNavigate('comparison')}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
              >
                <span>View Full Leaderboard Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Representative Test Well Fast-Launch Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Representative Test Borewells (2025 Holdout Predictions)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Click to open hydrograph</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Well 1: Abbinahole (Monitored) */}
              <div
                onClick={() => onSelectWellForHydrograph('Abbinahole')}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition">Abbinahole</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 font-semibold">
                      MONITORED
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Chitradurga District • Central Hard-Rock Basin</div>
                  <div className="mt-2 text-slate-600 text-xs leading-relaxed">
                    Accurately predicts seasonal drawdown to 15.76m and rapid monsoon recharge.
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between font-mono text-[11px] text-blue-600">
                  <span>90% PICP: 100%</span>
                  <span className="font-semibold group-hover:translate-x-1 transition">Inspect Hydrograph →</span>
                </div>
              </div>

              {/* Well 2: Aanegere (Ungauged Query) */}
              <div
                onClick={() => onSelectWellForHydrograph('Aanegere')}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition">Aanegere</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-100 text-purple-800 font-semibold">
                      UNGAUGED QUERY
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Chikkamagaluru District • Western Ghats Foothills</div>
                  <div className="mt-2 text-slate-600 text-xs leading-relaxed">
                    Zero historical measurements. Prediction synthesized purely via GATv2 spatial neighbors.
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between font-mono text-[11px] text-purple-700">
                  <span>Adaptive Band: 43.6m</span>
                  <span className="font-semibold group-hover:translate-x-1 transition">Inspect Hydrograph →</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Aquifer Stress Monitor & System Architecture */}
        <div className="space-y-6">
          {/* Karnataka Aquifer Stress Monitor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Karnataka Aquifer Depletion Zones
                </h3>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {criticalDistricts.map((dist, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-900 block">{dist.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${dist.statusColor}`}>
                      {dist.risk}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Mean Depth</span>
                    <span className="font-bold text-slate-800 font-mono">{dist.avgDepth}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => onNavigate('map')}
                className="w-full py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200 flex items-center justify-center space-x-1 transition"
              >
                <span>Filter Map by District</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Model Deployment Blueprint */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm text-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-bold uppercase tracking-wide text-[11px]">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Edge Deployment Specifications</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              The distilled student network achieves <strong>50% parameter reduction</strong> (71k weights) and executes an inference pass in <strong>~15 ms</strong> on standard CPU hardware.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Checkpoint:</span>
                <span className="font-semibold text-slate-800">student_best.pt (&lt;300 KB)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inference Latency:</span>
                <span className="font-semibold text-blue-700">14.8 ms / batch</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Compute Target:</span>
                <span className="font-semibold text-slate-800">CPU-only (No GPU required)</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              Deployable directly on solar-powered rural taluk monitoring gateways.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
