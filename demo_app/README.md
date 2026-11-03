# Karnataka Groundwater ML — Presentation App & Interactive Explorer

A polished, presentation-ready, offline-first web application designed for defending the semester capstone machine learning research project: **"Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring in Karnataka, India"**.

---

## 🌟 Quickstart: How to Run the App

### Option A: The One-Command Python Launcher (Recommended)
From the root project directory (`ML PROJECT\ml`), simply run:

```powershell
python run_demo.py
# or if using make:
make demo
```

This launches a lightweight local HTTP server (using Python's built-in standard library) and automatically opens your default web browser to `http://localhost:8000/`.

---

### Option B: Standalone Static Offline Mode (Zero Setup / Emergency)
Because the production bundle was built with relative assets (`base: './'`), the application runs **100% offline without any server**:

1. Navigate to `demo_app/dist/`
2. Double-click `index.html` to open it directly in Chrome, Edge, Firefox, or Safari.
3. Everything works seamlessly: maps, hydrographs, leaderboard, calibration curves, PDF downloads, and defense Q&A.

---

### Option C: Developer Mode (Live Hot Reloading)
If you wish to edit components and see live changes:

```powershell
cd demo_app
npm install
npm run dev
```

Then visit the local Vite URL (e.g., `http://localhost:5173/`).

To rebuild the offline production bundle:
```powershell
npm run build
```

---

## 🎯 App Structure & Modes

The application features **two unified modes**:

### 1. Presentation Mode (Default)
Designed for live projection or screen sharing with faculty guides:
- **18 Professional Full-Screen Slides** structured in publication narrative order.
- **Embedded Rehearsal Timer:** 15-minute countdown timer with start/pause/reset controls.
- **Hidden Speaker Notes (Press `N`):** Instant talking points and exact numbers for every slide.
- **Slide Jump Grid (Press `G`):** 18-slide visual selector to jump anywhere instantly.
- **Defense Cheat Sheet (Press `?`):** Quick-reference card with key dataset numbers, parameters, and benchmark scores.
- **Fullscreen Mode (Press `F`):** Distraction-free presentation view.
- **Live Transition to Explorer (Press `E`):** Jump directly into interactive dashboards.

#### Keyboard Shortcuts:
| Key | Action |
|---|---|
| `→` / `Space` / `PageDown` | Next Slide |
| `←` / `Backspace` / `PageUp` | Previous Slide |
| `N` | Toggle Speaker Notes Drawer |
| `G` | Toggle Slide Grid Jump Menu |
| `?` | Toggle Defense Key Numbers Cheat Sheet |
| `F` | Toggle Fullscreen |
| `E` | Switch to Interactive Explorer Mode |
| `P` | Switch back from Explorer to Slides |
| `Esc` | Close any active modal dialog |

---

### 2. Explorer Mode (Interactive Scientific Dashboards)
Accessible by clicking **"Explorer"** or pressing `E`:

1. **🗺️ Karnataka Well Network Map:**
   - Scatter map projecting all 1,658 monitoring borewells across Karnataka.
   - Filter by District (all 31 districts), Spatial Split (Train, Val, Test), or Well Search.
   - Color code by Spatial 25-km Partition, Mean Water Depth, or Test Set Absolute Error (MAE).
   - Click any well node to inspect UTM coordinates, observed month count, depth, and one-click jump to its hydrograph.

2. **📈 Interactive Well Hydrograph:**
   - Detailed month-by-month time series across the 2025 holdout year.
   - Plots Ground Truth telemetry, Student Model Prediction $\mu$, and shaded 90% Conformal Prediction Bounds $[L, U]$.
   - Toggle between Monitored test wells (L=12) and Ungauged Query test wells (zero telemetry history).
   - Dynamic hover tooltips displaying exact observed depth, predicted $\mu$, residual error $|y - \mu|$, and variance.

3. **🏆 Benchmark Leaderboard & Ablations:**
   - Head-to-head comparison against Naik et al. (2024), Persistence, Seasonal Naive, Environmental Ridge, RF, and XGBoost.
   - Filter between Monitored Wells and Ungauged Query Wells.
   - Includes full 7-configuration Ablation Table and 11-step Distillation Loss Weight ($\alpha$) sweep.

4. **🛡️ Uncertainty Calibration Deep Dive:**
   - Pre-conformal vs. Post-conformal empirical coverage comparison against nominal 90% target (96.6% monitored, 91.4% query).
   - Prediction interval width adaptation analysis (27.57 m in gauged areas vs. 43.62 m in ungauged basins).
   - Theoretical discussion on environmental non-exchangeability.

5. **📊 Data Preview & 32-Feature Dictionary:**
   - Paginated, searchable preview of 150 representative rows from `merged_dataset.csv`.
   - Comprehensive interactive dictionary explaining all 32 engineered features, datatypes, and physical units.

6. **📑 Research Papers & Figures Gallery:**
   - Download and inline links for `1_RESEARCH_PAPER_main.pdf` (12 pages) and `2_COMPARATIVE_BENCHMARK_REPORT_vs_Naik.pdf` (5 pages).
   - Interactive high-resolution zoom gallery of all 7 publication figures.

7. **❓ Questions Ma'am Might Ask (20 Technical Defenses):**
   - 20 collapsible accordion defense cards covering Architecture, Data, Leakage, Uncertainty, and Policy.
   - Search filter to instantly look up answers during viva questioning.

---

## 🔬 Zero-Fabrication Scientific Guarantee

In strict accordance with the master methodology rules:
- **Every metric and number in this app is 100% traceable** to audited files in `results/tables/*.csv`, `results/predictions/*.parquet`, and `DATA_AUDIT.md`.
- **Zero synthetic data** appears anywhere in the paper, benchmark report, or presentation app.
- **No spatial or temporal leakage:** Evaluation strictly isolates 25-km geographic grid cells and preserves chronological order.
- **All 40 unit and integration tests are passing** (`pytest tests/ -v`).

---

## 📁 Repository Integration

```
ml/
├── run_demo.py                 # Instant offline browser launcher
├── Makefile                    # Includes 'make demo' target
├── scripts/
│   └── export_demo_data.py     # Pre-computes raw artifacts into lightweight JSONs
└── demo_app/
    ├── package.json            # Pinned dependencies
    ├── vite.config.ts          # Configured with base: './' for offline static launch
    ├── SPEAKER_SCRIPT.md       # Slide-by-slide verbal presenter script
    ├── public/
    │   ├── data/*.json         # Compact precomputed data (<600 KB total)
    │   ├── docs/*.pdf          # 12-page Research Paper & 5-page Benchmark Report
    │   └── figures/*.png       # 7 High-resolution publication figures
    ├── src/
    │   ├── components/
    │   │   ├── presentation/   # PresentationView & 18 Slide Components
    │   │   └── explorer/       # ExplorerView & 7 Interactive Tabs
    │   ├── context/            # DataContext.tsx for offline state
    │   └── types.ts            # TypeScript interfaces
    └── dist/                   # Compiled static production bundle (ready to double-click)
```
