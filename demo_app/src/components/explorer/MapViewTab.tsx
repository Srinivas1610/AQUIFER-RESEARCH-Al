import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { WellInfo } from '../../types';
import { Search, Filter, MapPin, Eye, Info } from 'lucide-react';

interface MapViewTabProps {
  onSelectWellForHydrograph?: (wellId: string) => void;
}

export const MapViewTab: React.FC<MapViewTabProps> = ({ onSelectWellForHydrograph }) => {
  const { wells } = useData();

  const [selectedWell, setSelectedWell] = useState<WellInfo | null>(null);
  const [colorMode, setColorMode] = useState<'split' | 'depth' | 'error'>('split');
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [splitFilter, setSplitFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique districts
  const districts = useMemo(() => {
    const list = Array.from(new Set(wells.map((w) => w.district))).filter(Boolean).sort();
    return ['All', ...list];
  }, [wells]);

  // Filter wells
  const filteredWells = useMemo(() => {
    return wells.filter((w) => {
      if (districtFilter !== 'All' && w.district !== districtFilter) return false;
      if (splitFilter !== 'All' && w.split !== splitFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        if (!w.id.toLowerCase().includes(q) && !w.district.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [wells, districtFilter, splitFilter, searchQuery]);

  const mapWidth = 600;
  const mapHeight = 750;
  const minLat = 11.5;
  const maxLat = 18.6;
  const minLon = 74.0;
  const maxLon = 78.7;

  const projectPoint = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * (mapWidth - 80) + 40;
    const y = ((maxLat - lat) / (maxLat - minLat)) * (mapHeight - 80) + 40;
    return { x, y };
  };

  const getWellColor = (well: WellInfo) => {
    if (colorMode === 'split') {
      if (well.split === 'train') return '#2563eb'; // blue-600
      if (well.split === 'val') return '#d97706'; // amber-600
      return '#7c3aed'; // purple-600
    }
    if (colorMode === 'depth') {
      if (well.mean_depth === null) return '#94a3b8';
      if (well.mean_depth < 5) return '#0284c7'; // cyan-600
      if (well.mean_depth < 12) return '#059669'; // emerald-600
      if (well.mean_depth < 25) return '#d97706'; // amber-600
      return '#dc2626'; // rose-600
    }
    if (colorMode === 'error') {
      if (well.test_mae === null) return '#cbd5e1';
      if (well.test_mae < 2.0) return '#16a34a'; // green-600
      if (well.test_mae < 4.0) return '#2563eb'; // blue-600
      if (well.test_mae < 8.0) return '#d97706'; // amber-600
      return '#dc2626'; // red-600
    }
    return '#2563eb';
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 text-slate-800 overflow-hidden bg-slate-50">
      {/* Left Column: Interactive Map Canvas */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between relative overflow-hidden">
        {/* Top Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Karnataka Groundwater Monitoring Network</span>
            </h3>
            <p className="text-xs text-slate-500">
              Visualizing {filteredWells.length} of {wells.length} canonical borewells (25-km cell partitioning)
            </p>
          </div>

          {/* Color Mode Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 text-[11px] px-2 font-medium">Color by:</span>
            <button
              onClick={() => setColorMode('split')}
              className={`px-2.5 py-1 rounded-md transition text-xs font-semibold ${
                colorMode === 'split' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Spatial Split
            </button>
            <button
              onClick={() => setColorMode('depth')}
              className={`px-2.5 py-1 rounded-md transition text-xs font-semibold ${
                colorMode === 'depth' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Water Depth
            </button>
            <button
              onClick={() => setColorMode('error')}
              className={`px-2.5 py-1 rounded-md transition text-xs font-semibold ${
                colorMode === 'error' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Test Error (MAE)
            </button>
          </div>
        </div>

        {/* SVG Map Canvas */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden my-2 bg-slate-50/50 rounded-xl border border-slate-100">
          <svg
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="w-full h-full max-h-[640px] select-none"
          >
            {/* Grid Coordinates */}
            <g opacity="0.6">
              <line x1="40" y1="40" x2="40" y2={mapHeight - 40} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={mapWidth - 40} y1="40" x2={mapWidth - 40} y2={mapHeight - 40} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1="40" y1="40" x2={mapWidth - 40} y2="40" stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1="40" y1={mapHeight - 40} x2={mapWidth - 40} y2={mapHeight - 40} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x="15" y="45" fill="#64748b" fontSize="10" fontFamily="monospace">18.5°N</text>
              <text x="15" y={mapHeight / 2} fill="#64748b" fontSize="10" fontFamily="monospace">15.0°N</text>
              <text x="15" y={mapHeight - 45} fill="#64748b" fontSize="10" fontFamily="monospace">11.5°N</text>
              <text x="45" y={mapHeight - 15} fill="#64748b" fontSize="10" fontFamily="monospace">74.0°E</text>
              <text x={mapWidth / 2} y={mapHeight - 15} fill="#64748b" fontSize="10" fontFamily="monospace">76.3°E</text>
              <text x={mapWidth - 65} y={mapHeight - 15} fill="#64748b" fontSize="10" fontFamily="monospace">78.6°E</text>
            </g>

            {/* Well Scatter Points */}
            <g>
              {filteredWells.map((well) => {
                const { x, y } = projectPoint(well.lat, well.lon);
                const isSelected = selectedWell?.id === well.id;
                const color = getWellColor(well);

                return (
                  <circle
                    key={well.id}
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : 3}
                    fill={color}
                    fillOpacity={isSelected ? 1 : 0.8}
                    stroke={isSelected ? '#0f172a' : '#ffffff'}
                    strokeWidth={isSelected ? 2 : 0.6}
                    className="cursor-pointer transition-all duration-150"
                    onClick={() => setSelectedWell(well)}
                  >
                    <title>{`${well.id} (${well.district}) - ${well.split} split - Mean Depth: ${
                      well.mean_depth ?? 'N/A'
                    }m`}</title>
                  </circle>
                );
              })}
            </g>
          </svg>

          {/* Academic Legend Box */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 text-[11px] shadow-sm space-y-1">
            <div className="font-bold text-slate-800 mb-1">
              {colorMode === 'split' && 'Spatial 25-km Partition'}
              {colorMode === 'depth' && 'Mean Depth (m bgl)'}
              {colorMode === 'error' && 'Test Absolute Error (m)'}
            </div>
            {colorMode === 'split' && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-slate-600">Train (64% Cells)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  <span className="text-slate-600">Validation (16% Cells)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span className="text-slate-600">Held-Out Test (20% Cells)</span>
                </div>
              </>
            )}
            {colorMode === 'depth' && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                  <span className="text-slate-600">&lt; 5 m (Shallow)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="text-slate-600">5 – 12 m (Moderate)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  <span className="text-slate-600">12 – 25 m (Deep)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span className="text-slate-600">&gt; 25 m (Depleted)</span>
                </div>
              </>
            )}
            {colorMode === 'error' && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                  <span className="text-slate-600">&lt; 2 m MAE</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-slate-600">2 – 4 m MAE</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  <span className="text-slate-600">4 – 8 m MAE</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span className="text-slate-600">&gt; 8 m MAE</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom helper */}
        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200 font-mono">
          <span>Click any borewell node on the map to inspect coordinates and telemetry status.</span>
          <span className="text-slate-700">EPSG:32643 UTM Grid</span>
        </div>
      </div>

      {/* Right Column: Filters & Well Details Card */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        {/* Filters Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Map Filter Controls</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search borewell or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* District Dropdown */}
          <div>
            <label className="text-[11px] text-slate-500 block mb-1 font-medium">District (31 Total)</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Spatial Split Filter */}
          <div>
            <label className="text-[11px] text-slate-500 block mb-1 font-medium">25-km Spatial Partition</label>
            <select
              value={splitFilter}
              onChange={(e) => setSplitFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Partitions (1,658 Wells)</option>
              <option value="train">Train Cells (1,061 Wells)</option>
              <option value="val">Validation Cells (265 Wells)</option>
              <option value="test">Held-Out Test Cells (332 Wells)</option>
            </select>
          </div>
        </div>

        {/* Selected Well Inspector */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Well Inspector</span>
            </div>

            {selectedWell ? (
              <div className="space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{selectedWell.id}</h4>
                  <div className="text-xs text-slate-500">
                    District: <span className="text-slate-800 font-semibold">{selectedWell.district}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Spatial Partition:</span>
                    <span
                      className={`font-semibold capitalize px-1.5 py-0.2 rounded text-[10px] ${
                        selectedWell.split === 'train'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : selectedWell.split === 'val'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {selectedWell.split} Cell
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">25-km Cell ID:</span>
                    <span className="font-mono text-slate-800">{selectedWell.cell_id}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Coordinates:</span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {selectedWell.lat.toFixed(4)}°N, {selectedWell.lon.toFixed(4)}°E
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Observed Months:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {selectedWell.obs_months} / 60 ({((selectedWell.obs_months / 60) * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Mean GWL Depth:</span>
                    <span className="font-semibold text-blue-700 font-mono">
                      {selectedWell.mean_depth !== null ? `${selectedWell.mean_depth.toFixed(2)} m` : 'Missing'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Test Error (MAE):</span>
                    <span
                      className={`font-semibold font-mono ${
                        selectedWell.test_mae !== null
                          ? selectedWell.test_mae < 4
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {selectedWell.test_mae !== null ? `${selectedWell.test_mae.toFixed(3)} m` : 'Not in Test'}
                    </span>
                  </div>
                </div>

                {onSelectWellForHydrograph && (
                  <button
                    onClick={() => onSelectWellForHydrograph(selectedWell.id)}
                    className="w-full mt-3 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Hydrograph in Tab</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400 text-xs p-4">
                <MapPin className="w-6 h-6 text-slate-300 mb-2 stroke-1" />
                <p>Click any node on the map to inspect coordinates, depth, and spatial partition.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 font-mono">
            Spatial split respects strict 25-km cell partitioning with zero test leakage.
          </div>
        </div>
      </div>
    </div>
  );
};
