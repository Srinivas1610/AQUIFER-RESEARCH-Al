import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Database, Search, BookOpen, Layers, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { ColumnDefinition } from '../../types';

export const DataExplorerTab: React.FC = () => {
  const { columns, datasetSample, meta } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'sample' | 'dictionary'>('sample');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Filter sample rows
  const filteredSample = useMemo(() => {
    if (!searchQuery.trim()) return datasetSample;
    const q = searchQuery.toLowerCase();
    return datasetSample.filter((row) => {
      return (
        row.station_id?.toLowerCase().includes(q) ||
        row.district?.toLowerCase().includes(q) ||
        row.year_month?.toLowerCase().includes(q) ||
        row.spatial_partition?.toLowerCase().includes(q)
      );
    });
  }, [datasetSample, searchQuery]);

  const totalPages = Math.ceil(filteredSample.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSample.slice(start, start + pageSize);
  }, [filteredSample, currentPage, pageSize]);

  // Filter column dictionary
  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const q = searchQuery.toLowerCase();
    return columns.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [columns, searchQuery]);

  return (
    <div className="h-full flex flex-col p-6 text-slate-800 overflow-y-auto max-w-7xl mx-auto space-y-5 bg-slate-50">
      {/* Header and Subtab Navigation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-700 font-mono text-xs uppercase font-bold tracking-wider">
            <Database className="w-4 h-4" />
            <span>Karnataka Spatiotemporal Groundwater Corpus</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Data Explorer & Feature Dictionary
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            1,658 Wells × 60 Months = 99,480 Spatiotemporal Records (32 Engineered Features)
          </p>
        </div>

        {/* Subtab Toggle Buttons */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => {
              setActiveSubTab('sample');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-md transition font-semibold flex items-center space-x-1.5 ${
              activeSubTab === 'sample'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Dataset Preview (150 Rows)</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('dictionary');
              setSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded-md transition font-semibold flex items-center space-x-1.5 ${
              activeSubTab === 'dictionary'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Feature Dictionary (32 Cols)</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Dataset Sample Preview */}
      {activeSubTab === 'sample' && (
        <div className="space-y-4">
          {/* Controls: Search and Pagination */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by well, district, month..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-500">
                Showing {filteredSample.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filteredSample.length)} of {filteredSample.length} sample records
              </span>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded-md border border-slate-200 ${
                    currentPage === 1
                      ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-blue-700 font-semibold px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-1.5 rounded-md border border-slate-200 ${
                    currentPage === totalPages
                      ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs text-slate-800 border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold font-mono">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">Station ID</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Month</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">District</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Split</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Observed?</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">GWL (m bgl)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Rainfall (mm)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Temp (°C)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Rain 3M (mm)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Rain 6M (mm)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Lag 1M</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Lag 2M</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Cell ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {paginatedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-2 px-3 font-sans font-bold text-slate-900 whitespace-nowrap">
                        {row.station_id}
                      </td>
                      <td className="py-2 px-3 text-blue-700 whitespace-nowrap">{row.year_month}</td>
                      <td className="py-2 px-3 font-sans text-slate-700 whitespace-nowrap">
                        {row.district}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-sans capitalize font-medium ${
                            row.spatial_partition === 'train'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : row.spatial_partition === 'val'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {row.spatial_partition}
                        </span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {row.gwl_observed === 1 ? (
                          <span className="text-emerald-700 font-semibold">1 (Observed)</span>
                        ) : (
                          <span className="text-slate-400">0 (Missing)</span>
                        )}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {row.depth_m_bgl !== null ? (
                          <span className="font-bold text-slate-900">{row.depth_m_bgl.toFixed(2)} m</span>
                        ) : (
                          <span className="text-slate-400 italic">null</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {row.rainfall_mm !== null ? `${row.rainfall_mm.toFixed(1)} mm` : '0.0 mm'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {row.temp_c !== null ? `${row.temp_c.toFixed(1)} °C` : '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {row.rain_cumul_3m_mm !== null ? `${row.rain_cumul_3m_mm.toFixed(1)}` : '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {row.rain_cumul_6m_mm !== null ? `${row.rain_cumul_6m_mm.toFixed(1)}` : '—'}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {row.gwl_lag_1m !== null ? (
                          `${row.gwl_lag_1m.toFixed(2)}`
                        ) : (
                          <span className="text-slate-400">null</span>
                        )}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {row.gwl_lag_2m !== null ? (
                          `${row.gwl_lag_2m.toFixed(2)}`
                        ) : (
                          <span className="text-slate-400">null</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{row.cell_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Feature Dictionary */}
      {activeSubTab === 'dictionary' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search feature by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total Catalog: {filteredColumns.length} Features
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredColumns.map((col, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-blue-700 truncate">
                      {col.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {col.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{col.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
