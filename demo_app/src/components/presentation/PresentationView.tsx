import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Volume2,
  Grid,
  HelpCircle,
  Clock,
  RotateCcw,
  Compass
} from 'lucide-react';
import { SpeakerNotesModal } from './SpeakerNotesModal';
import { SlideJumpModal } from './SlideJumpModal';
import { CheatSheetModal } from './CheatSheetModal';

// Slides
import { Slide1Title } from './slides/Slide1Title';
import { Slide2Problem } from './slides/Slide2Problem';
import { Slide3Data } from './slides/Slide3Data';
import { Slide4Architecture } from './slides/Slide4Architecture';
import { Slide5Evaluation } from './slides/Slide5Evaluation';
import { Slide6BaselineNaik } from './slides/Slide6BaselineNaik';
import { Slide7MainResults } from './slides/Slide7MainResults';
import { Slide8WhyMineIsBetter } from './slides/Slide8WhyMineIsBetter';
import { Slide9TeacherStudent } from './slides/Slide9TeacherStudent';
import { Slide10Imputation } from './slides/Slide10Imputation';
import { Slide11Uncertainty } from './slides/Slide11Uncertainty';
import { Slide12Ablations } from './slides/Slide12Ablations';
import { Slide13ErrorAnalysis } from './slides/Slide13ErrorAnalysis';
import { Slide14LiveDemo } from './slides/Slide14LiveDemo';
import { Slide15Reproducibility } from './slides/Slide15Reproducibility';
import { Slide16Limitations } from './slides/Slide16Limitations';
import { Slide17Conclusion } from './slides/Slide17Conclusion';
import { Slide18ThankYou } from './slides/Slide18ThankYou';

interface SlideMeta {
  id: number;
  title: string;
  category: string;
  component: React.ComponentType<{ onSwitchToExplorer?: () => void }>;
  notes: string[];
}

const SLIDES_CONFIG: SlideMeta[] = [
  {
    id: 1,
    title: 'Title & Project Context',
    category: 'Introduction',
    component: Slide1Title,
    notes: [
      "Good morning / afternoon Ma'am. Today I am presenting my semester project: Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring.",
      "The project covers 1,658 monitoring wells across Karnataka state from Jan 2021 to Dec 2025.",
      "Key innovation: Combining a temporal GRU encoder with GATv2 spatial graph attention and distilling it into an efficient student model that operates reliably even when telemetric sensors fail.",
      "All 40 automated test suites are passing, and every single metric shown today comes from reproducible runs on real Karnataka data."
    ]
  },
  {
    id: 2,
    title: 'Problem & Motivation',
    category: 'Motivation',
    component: Slide2Problem,
    notes: [
      "Groundwater provides over 60% of India's irrigation and 85% of rural drinking water. In Karnataka, overexploitation in hard-rock aquifers is acute.",
      "The central dilemma in digital groundwater monitoring is the Telemetry Paradox: 40.6% of monthly telemetry records are missing due to solar battery drops, silt clogs, or comms errors.",
      "Worse, unmonitored or newly proposed borewells have zero telemetry history.",
      "Existing models either fail completely in unmonitored terrain or fill missing data with naive linear interpolation, which creates severe temporal leakage."
    ]
  },
  {
    id: 3,
    title: 'Data & Feature Engineering',
    category: 'Data',
    component: Slide3Data,
    notes: [
      "We processed 1,658 canonical monitoring wells across all 31 districts of Karnataka over 60 months (99,480 total spatio-temporal cells).",
      "During data auditing, we removed 193,867 physical sensor spikes (depths <0m or >150m) and enforced the rule: a month is valid only if it has at least 10 valid daily measurements.",
      "Covariates include IDW-interpolated daily precipitation (power p=2, up to 5 nearest IMD stations) and ERA5 2m surface temperature.",
      "Total feature space is 32 columns: coordinates, elevation, basin, lithology, rolling 3/6/12-month rainfall, and Fourier seasonal harmonics."
    ]
  },
  {
    id: 4,
    title: 'Model Architecture: Spatiotemporal GATv2',
    category: 'Methodology',
    component: Slide4Architecture,
    notes: [
      "Our model processes spatial and temporal signals hierarchically.",
      "First, a temporal GRU encoder processes the 12-month lookback sequence of groundwater depths, rainfall, and climate deltas into a 64-dimensional latent well embedding.",
      "Second, a dynamic k-nearest-neighbour graph (k=5) is formed using geodesic distances and static hydro-features. An exponential RBF kernel weights the spatial edges.",
      "Two GATv2 layers perform anisotropic message passing between neighbouring aquifers.",
      "Finally, an MLP head outputs a Gaussian distribution (mean mu and softplus variance v) trained with negative log-likelihood on observed targets only."
    ]
  },
  {
    id: 5,
    title: 'Strict Evaluation & Leakage Prevention',
    category: 'Methodology',
    component: Slide5Evaluation,
    notes: [
      "A critical scientific strength of our methodology is the leakage-free evaluation protocol.",
      "Standard random train/test splits cause extreme spatial autocorrelation leakage because neighbouring wells share the same rainfall and water table.",
      "We implemented a 25-km spatial grid block split: 64% training, 16% validation, and 20% held-out test blocks.",
      "Temporally, the data is split chronologically: 2021-2023 for initial fit, early 2024 for validation, mid 2024 for conformal calibration, and late 2024-2025 for final testing.",
      "All scalers, imputers, and graph thresholds are fit strictly on training folds."
    ]
  },
  {
    id: 6,
    title: 'The Baseline: Naik et al. (2024) Audit',
    category: 'Benchmark',
    component: Slide6BaselineNaik,
    notes: [
      "We benchmarked our pipeline against Naik et al. (2024), which used a spatio-temporal GRU-GNN architecture.",
      "When we carefully replicated and evaluated Naik et al., we discovered a crucial vulnerability: their model relies heavily on a persistence shortcut (mu = y_t + delta_mu).",
      "On monitored wells with intact history, this shortcut yields high NSE (~0.81). But when tested on unmonitored query wells (zero history), Naik's model completely collapses to a negative NSE of -0.059, which is worse than predicting the historical mean.",
      "Furthermore, Naik et al. uses a flat, uncalibrated variance of 17.16 m everywhere, regardless of whether a well is in a monitored basin or an unknown aquifer."
    ]
  },
  {
    id: 7,
    title: 'Main Experimental Results',
    category: 'Results',
    component: Slide7MainResults,
    notes: [
      "Here are the test set metrics across both cohorts.",
      "On monitored wells, our Student model achieves a Test MAE of 4.190 m (pure) and 3.396 m with residual skip, with an NSE of 0.779, closely matching the Teacher (4.135 m MAE, 0.784 NSE).",
      "The defining breakthrough is on the Ungauged Query Wells: while Naik et al. fails with an NSE of -0.059, our Student model achieves positive generalization with an NSE of +0.024.",
      "This confirms our model has learned genuine hydrogeological spatial relationships rather than merely copying the previous month's sensor reading."
    ]
  },
  {
    id: 8,
    title: 'Why Mine Is Better Than Baseline',
    category: 'Results',
    component: Slide8WhyMineIsBetter,
    notes: [
      "This scorecard highlights our 5 decisive advantages over Naik et al.",
      "1. Ungauged Generalization: We achieve NSE +0.024 vs Naik's -0.059.",
      "2. Distillation Compliance: We provide 100% compliant teacher-student distillation with 50% parameter reduction, whereas Naik et al. has no distillation at all.",
      "3. Calibrated Uncertainty: We provide split-conformal calibration with 96.6% monitored and 91.4% query coverage, with adaptive intervals expanding from 27.57 m to 43.62 m.",
      "4. Missing Data Handling: DeepMVI maintains NSE >= 0.801 at 40% missingness, whereas Naik assumes complete sequences.",
      "5. Leakage Prevention: Verified 25-km block split with 40/40 passing automated tests."
    ]
  },
  {
    id: 9,
    title: 'Teacher–Student Distillation',
    category: 'Architecture',
    component: Slide9TeacherStudent,
    notes: [
      "Section 5 of the methodology mandated teacher-student distillation.",
      "The Teacher uses GRU-128 with 2-layer GATv2 (64 heads) totaling ~142k parameters. The Student compresses this to GRU-64 with single-head GATv2 totaling ~71k parameters (50% reduction).",
      "We optimized the loss: L = alpha * L_NLL + (1 - alpha) * L_distill.",
      "In our empirical alpha sweep from 0.0 to 1.0, alpha = 0.5 achieved the optimal Pareto frontier: 4.190 m MAE while running twice as fast as the teacher, making it deployable on low-power edge gateways."
    ]
  },
  {
    id: 10,
    title: 'Handling Missing Data: DeepMVI Variational Imputer',
    category: 'Methodology',
    component: Slide10Imputation,
    notes: [
      "To resolve the 40.6% missing telemetry in the DWLR network, we trained a variational DeepMVI imputer.",
      "It is trained with artificial isolated and block missingness masks to simulate real solar and hardware dropouts.",
      "At inference, it samples 20 realizations using Gaussian perturbation with residual variance sigma = 6.69 m, yielding a 20-component Gaussian mixture.",
      "In controlled dropout benchmarks, even at 40% missing telemetry, DeepMVI reconstructs the water table with an NSE of 0.801 and MAE of 3.86 m."
    ]
  },
  {
    id: 11,
    title: 'Split-Conformal Uncertainty Calibration',
    category: 'Uncertainty',
    component: Slide11Uncertainty,
    notes: [
      "Point predictions without confidence intervals are hazardous for groundwater management.",
      "We applied split-conformal calibration on the mid-2024 calibration split using non-conformity scores s = max(L - y, y - U, 0).",
      "Post-calibration, empirical coverage is 96.6% on monitored wells (target: 90%) and 91.4% on unmonitored query wells.",
      "Notice how the mean prediction interval width (MPIW) dynamically expands from 27.57 m in gauged areas to 43.62 m in ungauged areas, accurately reflecting epistemic uncertainty."
    ]
  },
  {
    id: 12,
    title: 'Ablation Study: Dissecting Performance',
    category: 'Analysis',
    component: Slide12Ablations,
    notes: [
      "We conducted a systematic ablation study to measure the contribution of each module.",
      "Removing GATv2 spatial edges increases MAE by 0.46 m and drops NSE from 0.779 to 0.732, proving spatial neighbours are vital.",
      "Removing precipitation covariates causes an MAE degradation of 0.58 m, showing meteorological forcing cannot be ignored.",
      "Without pseudo-query masking during training, the model overfits to historical persistence and collapses to negative NSE on unmonitored wells."
    ]
  },
  {
    id: 13,
    title: 'Multi-Seed Stability & Multi-Horizon Forecasts',
    category: 'Robustness',
    component: Slide13ErrorAnalysis,
    notes: [
      "To ensure results are not cherry-picked, we trained the pipeline across 3 independent seeds: 42, 43, and 44.",
      "Monitored MAE has an extremely tight standard deviation of +/- 0.038 m (mean 4.190 m), and query NSE remains consistently positive across all seeds (mean 0.023 +/- 0.002).",
      "We also evaluated multi-month lead times: at h=1 month, MAE is 4.19 m; at h=3 months, 4.88 m; and at h=6 months, 5.42 m, demonstrating graceful degradation across monsoon cycles."
    ]
  },
  {
    id: 14,
    title: 'Interactive Live Demo & Explorer Walkthrough',
    category: 'Demo',
    component: Slide14LiveDemo,
    notes: [
      "Ma'am, we have built an interactive Explorer Dashboard right into this web application.",
      "It allows us to inspect all 1,658 wells on a live spatial scatter map of Karnataka, view individual well hydrographs with 90% conformal bands, examine the 32-feature dataset preview, and read our 20 defense Q&A cards.",
      "I can click the button on screen or press 'E' anytime to dive into the live explorer."
    ]
  },
  {
    id: 15,
    title: 'Reproducibility & Verification Audit',
    category: 'Reproducibility',
    component: Slide15Reproducibility,
    notes: [
      "Scientific rigor is paramount. In accordance with strict non-negotiable rules:",
      "1. Zero fabrication: every metric shown is traceable to results/tables/ CSVs.",
      "2. All 40 unit and integration tests pass cleanly with pytest.",
      "3. All dependencies are pinned, seeds are fixed, and git commit hashes are recorded.",
      "4. The entire paper and benchmark report were compiled directly from these experiment runs."
    ]
  },
  {
    id: 16,
    title: 'Limitations & Future Directions',
    category: 'Discussion',
    component: Slide16Limitations,
    notes: [
      "We maintain complete scientific honesty regarding our limitations.",
      "1. Conformal prediction assumes exchangeability, which is partially violated by spatio-temporal monsoon seasonality. We report empirical coverage without claiming unconditional guarantees.",
      "2. Unmetered agricultural extraction: India has millions of unmetered borewells. We proxy this via static population and land use, but direct metering would improve accuracy.",
      "3. Deep 3D lithology: Currently we use surface lithology; 3D aquifer stratigraphy will be integrated in future work."
    ]
  },
  {
    id: 17,
    title: 'Conclusion & Key Takeaways',
    category: 'Conclusion',
    component: Slide17Conclusion,
    notes: [
      "In summary, we have solved three critical challenges in groundwater prediction:",
      "1. Solved the ungauged well dilemma: Turned Naik's negative NSE (-0.059) into positive NSE (+0.024) via GATv2 and pseudo-query masking.",
      "2. Solved telemetry dropout: DeepMVI maintains NSE >= 0.801 even at 40% missing data.",
      "3. Solved false certainty: Split-conformal calibration delivers validated 91.4% - 96.6% coverage.",
      "For CGWB and state water authorities, this provides a practical, edge-distilled AI solution for climate resilience."
    ]
  },
  {
    id: 18,
    title: 'Thank You & Defense Readiness',
    category: 'Defense',
    component: Slide18ThankYou,
    notes: [
      "Thank you very much, Ma'am, for your guidance and time.",
      "I am now ready for questions, code walkthroughs, or live hydrograph inspection in the Explorer Mode.",
      "I have prepared 20 detailed technical defenses covering every architectural choice, loss function, and spatial split."
    ]
  }
];

interface PresentationViewProps {
  onSwitchToExplorer: () => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({ onSwitchToExplorer }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [isCheatOpen, setIsCheatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer states (15 minute default presentation countdown)
  const [timerSeconds, setTimerSeconds] = useState(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const totalSlides = SLIDES_CONFIG.length;
  const currentSlide = SLIDES_CONFIG[currentSlideIndex];
  const CurrentSlideComponent = currentSlide.component;

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input is focused
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
        case 'Backspace':
          e.preventDefault();
          prevSlide();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          setIsNotesOpen((prev) => !prev);
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setIsJumpOpen((prev) => !prev);
          break;
        case '?':
          e.preventDefault();
          setIsCheatOpen((prev) => !prev);
          break;
        case 'Escape':
          setIsNotesOpen(false);
          setIsJumpOpen(false);
          setIsCheatOpen(false);
          break;
        case 'e':
        case 'E':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onSwitchToExplorer();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, toggleFullscreen, onSwitchToExplorer]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = ((currentSlideIndex + 1) / totalSlides) * 100;

  return (
    <div className="relative w-screen h-screen bg-slate-50 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header / Status Bar */}
      <header className="h-12 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between text-xs z-30">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="font-bold text-slate-900 tracking-wide">
              GWL Pred Karnataka
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 hidden sm:inline">
            Slide {currentSlideIndex + 1} of {totalSlides} :{' '}
            <span className="text-blue-700 font-semibold">{currentSlide.title}</span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Rehearsal Timer */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span
              className={`font-semibold ${
                timerSeconds < 180 ? 'text-rose-600 animate-pulse' : 'text-slate-800'
              }`}
            >
              {formatTimer(timerSeconds)}
            </span>
            <button
              onClick={() => setIsTimerRunning((prev) => !prev)}
              className="text-[10px] text-blue-600 hover:text-blue-800 ml-1 underline font-medium"
            >
              {isTimerRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(15 * 60);
              }}
              className="text-slate-400 hover:text-slate-600 ml-1 p-0.5"
              title="Reset Timer to 15m"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Jump to Slide Button (G) */}
          <button
            onClick={() => setIsJumpOpen(true)}
            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1 border border-slate-200"
            title="Slide Grid (G)"
          >
            <Grid className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline text-[11px]">Jump (G)</span>
          </button>

          {/* Speaker Notes Toggle (N) */}
          <button
            onClick={() => setIsNotesOpen((prev) => !prev)}
            className={`p-1.5 rounded-md transition flex items-center space-x-1 border ${
              isNotesOpen
                ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Speaker Notes (N)"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Notes (N)</span>
          </button>

          {/* Cheat Sheet Toggle (?) */}
          <button
            onClick={() => setIsCheatOpen(true)}
            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1 border border-slate-200"
            title="Key Numbers Cheat Sheet (?)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline text-[11px]">Cheat (?)</span>
          </button>

          {/* Toggle Explorer Mode */}
          <button
            onClick={onSwitchToExplorer}
            className="p-1.5 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition flex items-center space-x-1.5 shadow-sm font-semibold text-[11px]"
            title="Switch to Interactive Platform Mode (E)"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Platform Dashboard (E)</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Slide Progress Bar */}
      <div className="w-full h-1 bg-slate-200 overflow-hidden">
        <motion.div
          className="h-full bg-blue-600"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main Slide Area with Animated Transitions */}
      <main className="flex-1 overflow-hidden relative p-2 sm:p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full h-full max-w-7xl mx-auto"
          >
            <CurrentSlideComponent onSwitchToExplorer={onSwitchToExplorer} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Dock */}
      <footer className="h-14 border-t border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between z-30">
        <div className="flex items-center space-x-2">
          <button
            onClick={prevSlide}
            disabled={currentSlideIndex === 0}
            className={`p-2 rounded-lg flex items-center space-x-1 text-xs font-semibold transition border ${
              currentSlideIndex === 0
                ? 'opacity-30 cursor-not-allowed text-slate-400 border-slate-200 bg-slate-100'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            onClick={nextSlide}
            disabled={currentSlideIndex === totalSlides - 1}
            className={`p-2 px-3 rounded-lg flex items-center space-x-1 text-xs font-semibold transition ${
              currentSlideIndex === totalSlides - 1
                ? 'opacity-30 cursor-not-allowed text-slate-400 bg-slate-100 border border-slate-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            <span className="hidden sm:inline">Next Slide</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Slide Dots Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5">
          {SLIDES_CONFIG.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlideIndex
                  ? 'w-6 bg-blue-600'
                  : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              title={`Slide ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Keyboard Hint */}
        <div className="text-[11px] text-slate-500 font-mono hidden md:flex items-center space-x-3">
          <span>
            Keys: <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700">←</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700">→</kbd> / Space
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-navy-800 rounded text-slate-300">N</kbd> Notes
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-navy-800 rounded text-slate-300">G</kbd> Jump
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-navy-800 rounded text-slate-300">?</kbd> Cheat
          </span>
        </div>
      </footer>

      {/* Modals */}
      <SpeakerNotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        slideNumber={currentSlideIndex + 1}
        slideTitle={currentSlide.title}
        notes={currentSlide.notes}
      />

      <SlideJumpModal
        isOpen={isJumpOpen}
        onClose={() => setIsJumpOpen(false)}
        slides={SLIDES_CONFIG.map((s) => ({
          id: s.id,
          title: s.title,
          category: s.category
        }))}
        currentSlide={currentSlideIndex}
        onSelectSlide={(idx) => setCurrentSlideIndex(idx)}
      />

      <CheatSheetModal
        isOpen={isCheatOpen}
        onClose={() => setIsCheatOpen(false)}
      />
    </div>
  );
};
