import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Image, ZoomIn, X, BookOpen, CheckCircle } from 'lucide-react';

interface FigureItem {
  id: string;
  filename: string;
  title: string;
  figureNumber: string;
  caption: string;
}

const PUBLICATION_FIGURES: FigureItem[] = [
  {
    id: 'fig1',
    filename: 'spatial_split_map.png',
    figureNumber: 'Figure 1',
    title: 'Study Area & 25-km Spatial Block Split',
    caption:
      'Spatial distribution of 1,658 canonical monitoring borewells across Karnataka. Wells are partitioned into 25-km spatial grid cells (64% train, 16% validation, 20% held-out test) to strictly prevent spatial autocorrelation leakage.'
  },
  {
    id: 'fig2',
    filename: 'hydrographs_comparison.png',
    figureNumber: 'Figure 2',
    title: 'Predicted vs Observed Well Hydrographs',
    caption:
      'Comparison of ground truth telemetry against distilled student model predictions with 90% conformal bands on representative held-out test wells across both monitored and ungauged cohorts.'
  },
  {
    id: 'fig3',
    filename: 'student_alpha_sweep.png',
    figureNumber: 'Figure 3',
    title: 'Teacher-Student Distillation Loss Weighting (α)',
    caption:
      'Empirical evaluation of the loss weighting parameter α in L = α L_NLL + (1-α) L_distill across temporal and spatial validation splits. The optimal composite validation trade-off occurs at α = 0.5.'
  },
  {
    id: 'fig4',
    filename: 'reconstruction_vs_missing_rate.png',
    figureNumber: 'Figure 4',
    title: 'DeepMVI Reconstruction vs Missing Rate',
    caption:
      'Imputation error (MAE, RMSE) and Nash–Sutcliffe Efficiency (NSE) under controlled artificial telemetry dropouts from 10% to 40%. The model sustains NSE ≥ 0.801 even at 40% telemetry loss.'
  },
  {
    id: 'fig5',
    filename: 'uncertainty_intervals.png',
    figureNumber: 'Figure 5',
    title: 'Split-Conformal Uncertainty Calibration & Coverage',
    caption:
      'Conformal prediction interval coverage and width dynamics. Demonstrates sharp intervals in gauged areas (27.57 m) and adaptive widening in ungauged areas (43.62 m) to maintain >90% empirical coverage.'
  },
  {
    id: 'fig6',
    filename: 'spatial_error_map.png',
    figureNumber: 'Figure 6',
    title: 'Spatial Error Distribution Across Karnataka Basins',
    caption:
      'Geographical distribution of absolute prediction errors across Karnataka river basins. Error hotspots correspond to deep over-exploited hard-rock aquifers in central-eastern districts.'
  },
  {
    id: 'fig7',
    filename: 'horizon_performance.png',
    figureNumber: 'Figure 7',
    title: 'Multi-Horizon Forecast Lead Time Degradation',
    caption:
      'Direct multi-step forecasting evaluation at horizons h = 1, 3, and 6 months. Demonstrates graceful accuracy degradation across monsoon transition cycles.'
  }
];

export const PapersGalleryTab: React.FC = () => {
  const [zoomedFigure, setZoomedFigure] = useState<FigureItem | null>(null);

  return (
    <div className="h-full flex flex-col p-6 text-slate-800 overflow-y-auto max-w-7xl mx-auto space-y-6 bg-slate-50">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-700 font-mono text-xs uppercase font-bold tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Academic Deliverables & Visual Artifacts</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Research Papers & Publication Figures
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full submission-ready manuscript, comparative benchmark report, and 7 high-resolution figures
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>All Artifacts Traceable & Compiled</span>
        </div>
      </div>

      {/* 2 Main PDF Deliverables */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-700" />
          <span>Compiled Research Manuscripts (PDF)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Paper */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 uppercase font-bold">
                  Main Research Paper
                </span>
                <span className="text-xs text-slate-500 font-mono">12 Pages • 3.2 MB</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Complete journal-format manuscript: mathematical formulation of the GATv2 spatiotemporal architecture, DeepMVI variational imputer, split-conformal calibration theorems, and Karnataka study area analysis.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href="./docs/1_RESEARCH_PAPER_main.pdf"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Manuscript PDF</span>
              </a>
              <a
                href="./docs/1_RESEARCH_PAPER_main.pdf"
                download="1_RESEARCH_PAPER_main.pdf"
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Comparative Benchmark Report */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-purple-300 transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 uppercase font-bold">
                  Comparative Benchmark Report
                </span>
                <span className="text-xs text-slate-500 font-mono">5 Pages • 1.4 MB</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Comparative Benchmark Report: Proposed Distilled GNN vs Naik et al. (2024) Baseline
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Exhaustive head-to-head empirical audit: unmasks Naik's persistence shortcut (mu = y_t + delta_mu), documents Naik's query well collapse (NSE -0.059 vs ours +0.024), and details 50% parameter compression.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href="./docs/2_COMPARATIVE_BENCHMARK_REPORT_vs_Naik.pdf"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Benchmark Report</span>
              </a>
              <a
                href="./docs/2_COMPARATIVE_BENCHMARK_REPORT_vs_Naik.pdf"
                download="2_COMPARATIVE_BENCHMARK_REPORT_vs_Naik.pdf"
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Publication Figures Gallery */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <Image className="w-4 h-4 text-blue-700" />
          <span>Publication Figures Gallery (Click to Zoom)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PUBLICATION_FIGURES.map((fig) => (
            <div
              key={fig.id}
              onClick={() => setZoomedFigure(fig)}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-400 shadow-sm hover:shadow transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={`./figures/${fig.filename}`}
                    alt={fig.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-102 transition duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-bold flex items-center space-x-1 shadow-md border border-slate-200">
                      <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                      <span>Zoom Figure</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-[11px] font-mono text-blue-700 font-bold mb-1">
                    {fig.figureNumber}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">{fig.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {fig.caption}
                  </p>
                </div>
              </div>

              <div className="p-3 px-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{fig.filename}</span>
                <span className="text-blue-600 font-semibold group-hover:underline">Inspect →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedFigure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div>
                <span className="text-xs font-mono text-blue-700 font-bold uppercase mr-2">
                  {zoomedFigure.figureNumber}
                </span>
                <span className="text-base font-bold text-slate-900">{zoomedFigure.title}</span>
              </div>
              <button
                onClick={() => setZoomedFigure(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50">
              <img
                src={`./figures/${zoomedFigure.filename}`}
                alt={zoomedFigure.title}
                className="max-h-[65vh] w-auto object-contain rounded-lg border border-slate-200 bg-white shadow-sm"
              />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900 mr-1">Scientific Caption:</span>
              {zoomedFigure.caption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
