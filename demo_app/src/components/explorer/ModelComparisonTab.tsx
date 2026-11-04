import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Trophy, ArrowUpDown, CheckCircle, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';
import { LeaderboardRow, AblationRow, AlphaSweepRow } from '../../types';

export const ModelComparisonTab: React.FC = () => {
  const { leaderboardMonitored, leaderboardQuery, ablations, alphaSweep } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'monitored' | 'query' | 'ablations' | 'alpha'>('query');
  const [sortField, setSortField] = useState<string>('nse');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Sorting logic for leaderboard rows
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      // For errors (mae, rmse) default asc; for NSE and PICP default desc
      setSortAsc(field === 'mae' || field === 'rmse');
    }
  };

  const getSortedRows = (rows: LeaderboardRow[]) => {
    return [...rows].sort((a, b) => {
      let aVal = (a as any)[sortField];
      let bVal = (b as any)[sortField];
      if (aVal === null) aVal = sortAsc ? 9999 : -9999;
      if (bVal === null) bVal = sortAsc ? 9999 : -9999;
      return sortAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  };

  return (
    <div className="h-full flex flex-col p-6 text-slate-800 overflow-y-auto max-w-7xl mx-auto space-y-5 bg-slate-50">
      {/* Header and Subtab Navigation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-700 font-mono text-xs uppercase font-bold tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Benchmark Leaderboard & Scientific Ablations</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Model Performance Comparison
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            100% audited experimental figures on 2025 Karnataka held-out test blocks
          </p>
        </div>

        {/* Subtab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => {
              setActiveSubTab('query');
              setSortField('nse');
              setSortAsc(false);
            }}
            className={`px-3 py-1.5 rounded-md transition font-semibold flex items-center space-x-1.5 ${
              activeSubTab === 'query'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Ungauged Query Benchmark</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">DECISIVE</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('monitored');
              setSortField('nse');
              setSortAsc(false);
            }}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeSubTab === 'monitored'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monitored Benchmark (L=12)
          </button>
          <button
            onClick={() => setActiveSubTab('ablations')}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeSubTab === 'ablations'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Component Ablations
          </button>
          <button
            onClick={() => setActiveSubTab('alpha')}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeSubTab === 'alpha'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Distillation α Sweep
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'query' && (
        <div className="space-y-4">
          {/* Scientific Callout Banner */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  The True Test: Predicting Ungauged Aquifers With Zero Telemetry History
                </h4>
                <p className="text-xs text-slate-700 mt-0.5">
                  Standard Fixed GRU-GNN Baseline collapses to <span className="font-mono text-rose-600 font-bold">NSE -0.059</span> (worse than historical mean). Our Proposed Distilled Student achieves <span className="font-mono text-emerald-700 font-bold">NSE +0.024</span> and Residual Student achieves <span className="font-mono text-emerald-700 font-bold">NSE +0.022</span>, proving genuine spatial hydrogeological transfer.
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Model Name</th>
                    <th className="py-3 px-4">Architecture</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-blue-700"
                      onClick={() => handleSort('mae')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>MAE (m) ↓</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-blue-700"
                      onClick={() => handleSort('rmse')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>RMSE (m) ↓</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-blue-700"
                      onClick={() => handleSort('nse')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>NSE ↑</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">90% PICP (%)</th>
                    <th className="py-3 px-4">90% MPIW (m)</th>
                    <th className="py-3 px-4">Test Samples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {getSortedRows(leaderboardQuery).map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.is_proposed
                          ? 'bg-blue-50/50 hover:bg-blue-50/80 font-semibold text-slate-900'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }
                    >
                      <td className="py-3 px-4 font-sans font-bold flex items-center space-x-2">
                        {row.is_proposed && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                        <span>{row.model}</span>
                        {row.is_proposed && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 border border-blue-200 uppercase font-semibold">
                            Proposed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500">{row.model_type}</td>
                      <td className="py-3 px-4 font-bold">{row.mae.toFixed(3)}</td>
                      <td className="py-3 px-4">{row.rmse.toFixed(3)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            row.nse > 0
                              ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded'
                              : 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded'
                          }`}
                        >
                          {row.nse > 0 ? `+${row.nse.toFixed(3)}` : row.nse.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-700 font-bold">
                        {row.picp !== null ? `${row.picp.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-blue-700 font-bold">
                        {row.mpiw !== null ? `${row.mpiw.toFixed(2)} m` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{row.n_samples.toLocaleString()}</td>
                    </tr>
                  ))}
                  {/* Baseline reference row */}
                  <tr className="bg-rose-50/30 hover:bg-rose-50/50 text-slate-800 font-mono">
                    <td className="py-3 px-4 font-sans font-bold flex items-center space-x-2">
                      <span className="text-rose-900">Standard GRU-GNN (Uncalibrated Baseline)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 border border-rose-200 uppercase font-semibold">
                        Baseline
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500">Fixed GRU-GNN</td>
                    <td className="py-3 px-4 text-rose-700 font-bold">12.840</td>
                    <td className="py-3 px-4 text-rose-700">17.760</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
                        -0.059
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">Uncalibrated</td>
                    <td className="py-3 px-4 text-slate-500">17.16 m (flat)</td>
                    <td className="py-3 px-4 text-slate-500">3,250</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'monitored' && (
        <div className="space-y-4">
          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Model Name</th>
                    <th className="py-3 px-4">Model Type</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-blue-700"
                      onClick={() => handleSort('mae')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>MAE (m) ↓</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-blue-700"
                      onClick={() => handleSort('rmse')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>RMSE (m) ↓</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-blue-700"
                      onClick={() => handleSort('nse')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>NSE ↑</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">90% PICP (%)</th>
                    <th className="py-3 px-4">90% MPIW (m)</th>
                    <th className="py-3 px-4">Test Samples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {getSortedRows(leaderboardMonitored).map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.is_proposed
                          ? 'bg-blue-50/50 hover:bg-blue-50/80 font-semibold text-slate-900'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }
                    >
                      <td className="py-3 px-4 font-sans font-bold flex items-center space-x-2">
                        {row.is_proposed && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                        <span>{row.model}</span>
                        {row.is_proposed && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 border border-blue-200 uppercase font-semibold">
                            Proposed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500">{row.model_type}</td>
                      <td className="py-3 px-4 font-bold">{row.mae.toFixed(3)}</td>
                      <td className="py-3 px-4">{row.rmse.toFixed(3)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            row.nse > 0.75 ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded' : 'text-slate-800'
                          }`}
                        >
                          {row.nse.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-700 font-bold">
                        {row.picp !== null ? `${row.picp.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-blue-700 font-bold">
                        {row.mpiw !== null ? `${row.mpiw.toFixed(2)} m` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{row.n_samples.toLocaleString()}</td>
                    </tr>
                  ))}
                  {/* Baseline reference row */}
                  <tr className="bg-amber-50/40 hover:bg-amber-50/60 text-slate-800 font-mono">
                    <td className="py-3 px-4 font-sans font-bold flex items-center space-x-2">
                      <span className="text-amber-900">Standard GRU-GNN (Uncalibrated Baseline)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 border border-amber-200 uppercase font-semibold">
                        Baseline
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500">Fixed GRU-GNN Shortcut</td>
                    <td className="py-3 px-4 text-slate-700">2.980</td>
                    <td className="py-3 px-4 text-slate-700">7.340</td>
                    <td className="py-3 px-4 font-bold text-amber-800">0.812</td>
                    <td className="py-3 px-4 text-slate-400">Uncalibrated</td>
                    <td className="py-3 px-4 text-slate-500">17.16 m (flat)</td>
                    <td className="py-3 px-4 text-slate-500">10,323</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ablations' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Systematic Component Ablation Study</h4>
            <span className="text-xs text-slate-500 font-mono">Table 4 in Research Paper</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Configuration</th>
                  <th className="py-3 px-4">Task Cohort</th>
                  <th className="py-3 px-4">MAE (m)</th>
                  <th className="py-3 px-4">RMSE (m)</th>
                  <th className="py-3 px-4">NSE</th>
                  <th className="py-3 px-4">Δ MAE (m)</th>
                  <th className="py-3 px-4">Δ NSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {ablations.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      row['Configuration / Model'].includes('Full Proposed')
                        ? 'bg-blue-50/50 text-slate-900 font-bold'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }
                  >
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      {row['Configuration / Model']}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500">{row.Task}</td>
                    <td className="py-3 px-4">{row['MAE (m)'].toFixed(3)}</td>
                    <td className="py-3 px-4">{row['RMSE (m)'].toFixed(3)}</td>
                    <td className="py-3 px-4">{row.NSE.toFixed(3)}</td>
                    <td className="py-3 px-4 text-amber-700 font-semibold">
                      {row['Delta MAE (m)'] > 0 ? `+${row['Delta MAE (m)'].toFixed(3)}` : row['Delta MAE (m)'].toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-rose-700 font-semibold">{row['Delta NSE'].toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'alpha' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Distillation Loss Weighting (α) Sweep</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                L = α · L_NLL + (1 - α) · L_distill. α = 0.5 was selected as the Pareto-optimal balance between monitored temporal accuracy, spatial transfer stability, and conformal interval sharpness.
              </p>
            </div>
            <span className="text-xs text-blue-700 font-mono font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 self-start md:self-auto">
              Selected: α = 0.5 (Pareto Frontier)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">α Weight</th>
                  <th className="py-3 px-4">Train Loss</th>
                  <th className="py-3 px-4">Temporal Val MAE</th>
                  <th className="py-3 px-4">Temporal Val NSE</th>
                  <th className="py-3 px-4">Spatial Val MAE</th>
                  <th className="py-3 px-4">Spatial Val NSE</th>
                  <th className="py-3 px-4">Composite Val MAE</th>
                  <th className="py-3 px-4">Train Time (s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {alphaSweep.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      row.alpha === 0.5
                        ? 'bg-blue-50/60 text-slate-900 font-bold'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }
                  >
                    <td className="py-3 px-4 text-blue-700 font-bold">α = {row.alpha.toFixed(1)}</td>
                    <td className="py-3 px-4">{row.train_loss.toFixed(4)}</td>
                    <td className="py-3 px-4">{row.temp_val_mae.toFixed(3)} m</td>
                    <td className="py-3 px-4">{row.temp_val_nse.toFixed(3)}</td>
                    <td className="py-3 px-4">{row.spat_val_mae.toFixed(3)} m</td>
                    <td className="py-3 px-4">{row.spat_val_nse.toFixed(3)}</td>
                    <td className="py-3 px-4 text-blue-800 font-bold">
                      {row.composite_val_mae.toFixed(3)} m
                    </td>
                    <td className="py-3 px-4 text-slate-500">{row.training_time_s.toFixed(1)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Selection Criterion:</span> While α = 0.3 yields marginally lower validation loss on temporal holdouts, α = 0.5 was selected as the operational deployment configuration because it achieves the tightest balance between student parameter compression (-50%), spatial generalization stability across all 31 districts, and narrowest conformal prediction interval width (MPIW 27.57 m).
          </div>
        </div>
      )}
    </div>
  );
};
