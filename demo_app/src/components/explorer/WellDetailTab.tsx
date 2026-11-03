import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { SampleHydrograph } from '../../types';
import {
  Activity,
  Layers,
  ShieldCheck,
  Calendar,
  AlertCircle,
  TrendingDown,
  Info
} from 'lucide-react';

interface WellDetailTabProps {
  initialWellId?: string;
}

export const WellDetailTab: React.FC<WellDetailTabProps> = ({ initialWellId }) => {
  const { hydrographs, wells } = useData();

  const availableWellIds = useMemo(() => Object.keys(hydrographs), [hydrographs]);

  const [selectedWellId, setSelectedWellId] = useState<string>(
    initialWellId && hydrographs[initialWellId] ? initialWellId : availableWellIds[0] || 'Abbinahole'
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hydrograph: SampleHydrograph | undefined = hydrographs[selectedWellId];
  const wellMetadata = wells.find((w) => w.id === selectedWellId);

  // Compute metrics for this specific well in 2025
  const metrics = useMemo(() => {
    if (!hydrograph || !hydrograph.series.length) return null;
    let sumAbsErr = 0;
    let sumSqErr = 0;
    let insideCount = 0;
    let sumWidth = 0;
    const n = hydrograph.series.length;

    hydrograph.series.forEach((pt) => {
      const err = Math.abs(pt.observed - pt.student_mu);
      sumAbsErr += err;
      sumSqErr += err * err;
      if (pt.observed >= pt.lower_90 && pt.observed <= pt.upper_90) {
        insideCount++;
      }
      sumWidth += Math.abs(pt.upper_90 - pt.lower_90);
    });

    return {
      mae: (sumAbsErr / n).toFixed(2),
      rmse: Math.sqrt(sumSqErr / n).toFixed(2),
      coverage: ((insideCount / n) * 100).toFixed(0),
      avgWidth: (sumWidth / n).toFixed(1)
    };
  }, [hydrograph]);

  if (!hydrograph) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50">
        No hydrograph data available.
      </div>
    );
  }

  // Chart coordinate math
  const chartWidth = 720;
  const chartHeight = 340;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };

  const allDepths = hydrograph.series.flatMap((pt) => [
    pt.observed,
    pt.student_mu,
    pt.lower_90,
    pt.upper_90
  ]);
  const minDepth = Math.max(0, Math.floor(Math.min(...allDepths) - 2));
  const maxDepth = Math.ceil(Math.max(...allDepths) + 3);

  const getX = (idx: number) => {
    const usableWidth = chartWidth - padding.left - padding.right;
    return padding.left + (idx / (hydrograph.series.length - 1)) * usableWidth;
  };

  const getY = (val: number) => {
    const usableHeight = chartHeight - padding.top - padding.bottom;
    return padding.top + ((val - minDepth) / (maxDepth - minDepth)) * usableHeight;
  };

  // Generate SVG paths
  const upperPoints = hydrograph.series.map((pt, i) => `${getX(i)},${getY(pt.upper_90)}`);
  const lowerPoints = hydrograph.series.map((pt, i) => `${getX(i)},${getY(pt.lower_90)}`).reverse();
  const bandPolygonPath = [...upperPoints, ...lowerPoints].join(' ');

  const muLinePath = hydrograph.series
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.student_mu)}`)
    .join(' ');

  const obsLinePath = hydrograph.series
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.observed)}`)
    .join(' ');

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 text-slate-800 overflow-y-auto max-w-7xl mx-auto space-y-4 bg-slate-50">
      {/* Top Header & Well Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider ${
                hydrograph.task === 'monitored'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}
            >
              {hydrograph.task === 'monitored' ? 'Monitored Well (L=12 Lookback)' : 'Ungauged Query Well (Zero History)'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Test Split Evaluation Year (2025)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center space-x-2">
            <span>Well Hydrograph: {selectedWellId}</span>
            {wellMetadata && (
              <span className="text-sm font-normal text-slate-500">
                ({wellMetadata.district} District)
              </span>
            )}
          </h2>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <label className="text-slate-500 font-semibold">Select Test Well:</label>
          <select
            value={selectedWellId}
            onChange={(e) => setSelectedWellId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
          >
            <optgroup label="Monitored Test Wells (Intact History)">
              {availableWellIds
                .filter((id) => hydrographs[id].task === 'monitored')
                .map((id) => (
                  <option key={id} value={id}>
                    {id} ({wells.find((w) => w.id === id)?.district || 'Karnataka'})
                  </option>
                ))}
            </optgroup>
            <optgroup label="Ungauged Query Test Wells (Zero History)">
              {availableWellIds
                .filter((id) => hydrographs[id].task === 'query')
                .map((id) => (
                  <option key={id} value={id}>
                    {id} [UNGAUGED QUERY] ({wells.find((w) => w.id === id)?.district || 'Karnataka'})
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* SVG Hydrograph View */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-emerald-600" />
                <span className="text-slate-700 font-medium">Observed Ground Truth (y)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-blue-600" />
                <span className="text-slate-700 font-medium">Student Prediction (μ)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-2 bg-blue-100 border border-blue-300 rounded-xs" />
                <span className="text-slate-700 font-medium">90% Conformal Band [L, U]</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Y-Axis: Depth below ground (m bgl)
            </div>
          </div>

          {/* SVG Chart */}
          <div className="w-full flex items-center justify-center my-3 relative select-none">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto max-h-[380px]"
            >
              {/* Horizontal Grid lines */}
              {Array.from({ length: 6 }).map((_, i) => {
                const val = minDepth + ((maxDepth - minDepth) / 5) * i;
                const y = getY(val);
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      strokeWidth="0.8"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val.toFixed(1)}m
                    </text>
                  </g>
                );
              })}

              {/* Month X-Axis Ticks */}
              {hydrograph.series.map((pt, i) => {
                const x = getX(i);
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={chartHeight - padding.bottom}
                      stroke="#f1f5f9"
                      strokeWidth="0.8"
                    />
                    <text
                      x={x}
                      y={chartHeight - padding.bottom + 18}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {pt.month.replace('2025-', 'M')}
                    </text>
                  </g>
                );
              })}

              {/* 90% Conformal Prediction Shaded Polygon */}
              <polygon
                points={bandPolygonPath}
                fill={hydrograph.task === 'monitored' ? '#dbeafe' : '#f3e8ff'}
                fillOpacity="0.7"
                stroke={hydrograph.task === 'monitored' ? '#93c5fd' : '#d8b4fe'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Observed Points & Line */}
              <path
                d={obsLinePath}
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Student Mean mu Line */}
              <path
                d={muLinePath}
                fill="none"
                stroke={hydrograph.task === 'monitored' ? '#2563eb' : '#7c3aed'}
                strokeWidth="2.5"
              />

              {/* Data Node Points & Hover Targets */}
              {hydrograph.series.map((pt, i) => {
                const x = getX(i);
                const yObs = getY(pt.observed);
                const yMu = getY(pt.student_mu);
                const isHovered = hoveredIndex === i;

                return (
                  <g key={i}>
                    {/* Hover vertical bar */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={chartHeight - padding.bottom}
                        stroke="#60a5fa"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Observed Point */}
                    <circle
                      cx={x}
                      cy={yObs}
                      r={isHovered ? 5 : 3.5}
                      fill="#059669"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                    />

                    {/* Predicted Point */}
                    <circle
                      cx={x}
                      cy={yMu}
                      r={isHovered ? 5 : 3.5}
                      fill={hydrograph.task === 'monitored' ? '#2563eb' : '#7c3aed'}
                      stroke="#ffffff"
                      strokeWidth="1.2"
                    />

                    {/* Transparent Click / Hover Target */}
                    <rect
                      x={x - 15}
                      y={padding.top}
                      width={30}
                      height={chartHeight - padding.top - padding.bottom}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Popup */}
            {hoveredIndex !== null && (
              <div
                className="absolute z-20 bg-white border border-slate-200 p-3 rounded-xl shadow-md text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(getX(hoveredIndex) / chartWidth) * 100}%`,
                  top: `${(getY(hydrograph.series[hoveredIndex].student_mu) / chartHeight) * 100 - 8}%`
                }}
              >
                <div className="font-mono font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">
                  Month: {hydrograph.series[hoveredIndex].month}
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between space-x-3">
                    <span className="text-emerald-700 font-medium">Observed:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {hydrograph.series[hoveredIndex].observed.toFixed(2)} m
                    </span>
                  </div>
                  <div className="flex justify-between space-x-3">
                    <span className="text-blue-700 font-medium">Student μ:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {hydrograph.series[hoveredIndex].student_mu.toFixed(2)} m
                    </span>
                  </div>
                  <div className="flex justify-between space-x-3">
                    <span className="text-purple-700 font-medium">90% Band:</span>
                    <span className="font-mono text-slate-600">
                      [{hydrograph.series[hoveredIndex].lower_90.toFixed(2)},{' '}
                      {hydrograph.series[hoveredIndex].upper_90.toFixed(2)}] m
                    </span>
                  </div>
                  <div className="flex justify-between space-x-3 pt-1 border-t border-slate-100 text-[10px]">
                    <span className="text-slate-400">Residual |y - μ|:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {Math.abs(
                        hydrograph.series[hoveredIndex].observed -
                          hydrograph.series[hoveredIndex].student_mu
                      ).toFixed(2)}{' '}
                      m
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
            <span>
              Hover over points to inspect exact telemetry depth, student predictions, and conformal intervals.
            </span>
            <span className="text-slate-700 font-mono font-medium">12-Month Holdout Verification</span>
          </div>
        </div>

        {/* Right Metrics Card */}
        <div className="space-y-4">
          {/* Well Stats Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Well Accuracy Metrics (2025)</span>
            </div>

            {metrics && (
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">MAE</div>
                  <div className="text-lg font-bold text-slate-900">{metrics.mae} m</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">RMSE</div>
                  <div className="text-lg font-bold text-slate-900">{metrics.rmse} m</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">90% Coverage</div>
                  <div className="text-lg font-bold text-emerald-700">{metrics.coverage}%</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Mean Width</div>
                  <div className="text-lg font-bold text-slate-900">{metrics.avgWidth} m</div>
                </div>
              </div>
            )}

            <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
              {hydrograph.task === 'monitored' ? (
                <div className="flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Monitored Cohort:</strong> Model leverages the 12-month historical lookback. Conformal prediction interval is sharp (~{metrics?.avgWidth}m) with high empirical reliability.
                  </p>
                </div>
              ) : (
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Ungauged Query Cohort:</strong> Groundwater history is completely hidden. The forecast is driven purely by GATv2 spatial messages and surface climate.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Geological Context */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
            <div className="flex items-center space-x-2 font-bold text-slate-900 uppercase tracking-wide text-[11px]">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Hydrogeological Context</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              In Karnataka granitic and basaltic hard-rock aquifers, water tables reach their deepest levels in May/June prior to monsoon onset, and recharge rapidly between July and October. The model captures this steep cyclical turnaround.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
