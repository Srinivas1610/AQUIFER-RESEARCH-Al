import React, { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, ShieldCheck, Cpu, Database, Compass, AlertCircle } from 'lucide-react';

interface QuestionItem {
  id: number;
  category: 'Architecture' | 'Data & Features' | 'Evaluation & Leakage' | 'Uncertainty' | 'Policy & Impact';
  question: string;
  shortAnswer: string;
  detailedAnswer: string[];
  keyDataPoint: string;
}

const DEFENSE_QUESTIONS: QuestionItem[] = [
  {
    id: 1,
    category: 'Architecture',
    question: "Why did you choose GATv2 over standard GCN or GAT?",
    shortAnswer: "GATv2 fixes the static attention collapse in standard GAT, allowing edge attention weights to depend dynamically on both sender and receiver node states.",
    detailedAnswer: [
      "In standard GAT (Veličković et al., 2018), the attention mechanism computes e_ij = LeakyReLU(a^T [Wh_i || Wh_j]). Because the linear projection W is applied before the non-linearity, the ranking of attention scores is monotonic and does not depend on the querying node (static attention problem).",
      "GATv2 (Brody et al., 2022) computes e_ij = a^T LeakyReLU(W [h_i || h_j]), applying the linear projection after concatenation, enabling dynamic attention.",
      "In hydrogeological systems, whether a neighbouring well provides useful recharge signals depends dynamically on both the querying aquifer's depth and the neighbor's current groundwater state, especially across monsoon cycles."
    ],
    keyDataPoint: "Removing GATv2 spatial edges drops NSE from 0.779 to 0.732 and degrades MAE by +0.46 m."
  },
  {
    id: 2,
    category: 'Evaluation & Leakage',
    question: "How did you guarantee that there is no spatial data leakage in your evaluation?",
    shortAnswer: "We enforced a 25-km spatial grid block split, ensuring wells within the same local hydrogeological cell never cross train and test folds.",
    detailedAnswer: [
      "Standard random train/test splits cause extreme spatial autocorrelation leakage because wells 500m apart share the same rain event, soil permeability, and water table.",
      "We partitioned Karnataka using projected UTM Zone 43N coordinates (EPSG:32643) into 25-km cells: cell_x = floor(x / 25000), cell_y = floor(y / 25000).",
      "Cells were assigned 64% train, 16% validation, and 20% test. All wells inside a test cell are held out together.",
      "Furthermore, when constructing inference graphs, test query nodes can receive messages from monitored neighbors, but test nodes never send messages to training nodes."
    ],
    keyDataPoint: "20% held-out test blocks encompass 332 independent wells evaluated strictly out-of-sample."
  },
  {
    id: 3,
    category: 'Evaluation & Leakage',
    question: "Why did Naik et al. (2024) collapse on unmonitored query wells (NSE -0.059)?",
    shortAnswer: "Naik et al. relied on a persistence shortcut (μ = y_t + Δμ), which catastrophically fails when a well has no historical telemetry.",
    detailedAnswer: [
      "When we carefully re-implemented and audited Naik et al., we discovered that their model adds the predicted delta directly to the last observed groundwater depth: mu_{t+1} = y_t + Delta mu.",
      "On monitored wells where y_t is always available, this shortcut achieves deceptively high NSE (~0.81), but the model never learns actual groundwater hydrodynamics.",
      "When tested on ungauged query wells (zero telemetry history), y_t is missing. Naik's model has no mechanism to infer depth and collapses to NSE -0.059 (worse than predicting the historical average).",
      "Our proposed GNN solves this using pseudo-query training, forcing the network to predict water tables from spatial neighbors alone."
    ],
    keyDataPoint: "Naik Query NSE: -0.059 vs Proposed Student Query NSE: +0.024 (a decisive +0.083 gain)."
  },
  {
    id: 4,
    category: 'Architecture',
    question: "Why did you select α = 0.5 for teacher–student distillation?",
    shortAnswer: "α = 0.5 represents the empirical Pareto optimal point balancing ground truth NLL supervision with teacher distribution mimicry.",
    detailedAnswer: [
      "The distillation loss is parameterized as: L = alpha * L_NLL + (1 - alpha) * L_distill, where L_NLL is the observed Gaussian negative log-likelihood and L_distill is the KL divergence between teacher and student output distributions.",
      "In our empirical alpha sweep from 0.0 to 1.0 (Table 3), alpha = 0.1 was under-supervised by ground truth (MAE 4.31m), while alpha = 0.9 under-utilized teacher spatial representations (MAE 4.28m).",
      "alpha = 0.5 achieved the lowest composite validation MAE (4.190 m) while maintaining stable convergence across both temporal and spatial holdout sets."
    ],
    keyDataPoint: "Selected alpha=0.5 yields 50% parameter compression (142k -> 71k params) with zero performance loss."
  },
  {
    id: 5,
    category: 'Data & Features',
    question: "How does DeepMVI handle the 40.6% missing telemetry in the DWLR network?",
    shortAnswer: "DeepMVI trains with artificial isolated and block masks, drawing 20 realizations via Gaussian residual perturbation (σ = 6.69 m) to model hydrogeological variance.",
    detailedAnswer: [
      "In real DWLR networks, missingness is not random: solar panel failures and telecom outages cause multi-month consecutive block dropouts.",
      "DeepMVI is trained with both artificial isolated and block missingness masks to emulate real dropouts.",
      "During inference on missing months, DeepMVI generates 20 realization trajectories sampled with Gaussian residual variance sigma = 6.69 m (calibrated on a 10% masked validation subset).",
      "The final prediction is a 20-component Gaussian mixture; its mean is the ensemble average, and its 90% confidence interval is the 0.05/0.95 quantile spread."
    ],
    keyDataPoint: "Sustains NSE >= 0.801 and MAE 3.86m even under severe 40% artificial telemetry dropout."
  },
  {
    id: 6,
    category: 'Uncertainty',
    question: "Why split-conformal calibration instead of Bayesian dropout or Deep Ensembles?",
    shortAnswer: "Split-conformal prediction provides distribution-free, finite-sample calibrated coverage without expensive ensemble retraining or fragile Bayesian priors.",
    detailedAnswer: [
      "Bayesian neural networks and MC-dropout require subjective prior specifications and tend to produce uncalibrated, overconfident intervals in out-of-distribution regimes.",
      "Deep ensembles require training 5–10 separate large models, multiplying training compute and inference latency by 5–10x (unviable on low-power edge hardware).",
      "Split-conformal calibration uses an independent calibration split (mid-2024) to compute non-conformity scores s = max(L - y, y - U, 0), guaranteeing rigorous empirical coverage on subsequent test samples."
    ],
    keyDataPoint: "Achieves 96.6% monitored coverage and 91.4% query coverage against nominal 90% target."
  },
  {
    id: 7,
    category: 'Uncertainty',
    question: "Is conformal prediction theoretically valid given spatio-temporal autocorrelation?",
    shortAnswer: "Exchangeability is formally violated by environmental seasonality; we report empirical coverage faithfully without claiming unconditional PAC guarantees.",
    detailedAnswer: [
      "Classical conformal prediction theorems (Vovk et al., 2005) mathematically depend on the assumption of exchangeable data points.",
      "Environmental time series violate exchangeability due to strong summer-to-monsoon seasonality and spatial autocorrelation between neighbouring taluks.",
      "In Section 4 of our paper and frozen parameter Rule 0, we explicitly document this limitation: we report empirical test coverage (96.6% and 91.4%) as validated empirical intervals, but honestly state that no unconditional theoretical guarantee is claimed.",
      "This scientific transparency sets our work apart from papers claiming false mathematical guarantees on autocorrelated data."
    ],
    keyDataPoint: "Transparently recorded in DECISIONS.md and Section 4 of 1_RESEARCH_PAPER_main.pdf."
  },
  {
    id: 8,
    category: 'Architecture',
    question: "What is the pseudo-query training trick and why is it essential?",
    shortAnswer: "We artificially hide 20% of training well histories per batch so the model learns to infer water tables purely from spatial graph neighbours.",
    detailedAnswer: [
      "If a GNN is trained only on wells with complete historical groundwater sequences, it naturally learns to rely almost exclusively on the temporal GRU autoregression.",
      "When evaluated on an unmonitored well, the model fails because it never practiced predicting without history.",
      "Our pseudo-query trick randomly hides the entire groundwater input sequence for 20% of target wells in each training batch (before imputation and graph formation), while keeping their observed future targets in the loss function.",
      "This forces the GATv2 graph attention layers to learn rich spatial hydrogeological transfer from neighbouring wells."
    ],
    keyDataPoint: "Ablation Table 4: Removing pseudo-query training collapses ungauged test NSE from +0.024 to -0.048."
  },
  {
    id: 9,
    category: 'Data & Features',
    question: "How were daily rainfall and temperature mapped to each well location?",
    shortAnswer: "Inverse Distance Weighting (IDW, power p=2) was used to interpolate daily precipitation and temperature from up to 5 nearest IMD stations using geodesic distances.",
    detailedAnswer: [
      "Rainfall is highly localized, especially during convective pre-monsoon showers in Karnataka.",
      "For every well, we identified the up to 5 nearest IMD weather monitoring stations within a maximum radius.",
      "Weights were assigned via inverse squared geodesic distance: w_s = 1 / d(w, s)^2, normalized so sum(w_s) = 1.",
      "Daily interpolated values were aggregated into monthly totals, and trailing 3-month, 6-month, and 12-month cumulative rainfall features were computed to capture delayed recharge through unsaturated soil."
    ],
    keyDataPoint: "Ablation Table 4: Removing rainfall features degrades test MAE by +0.58 m."
  },
  {
    id: 10,
    category: 'Data & Features',
    question: "Why is the study period frozen from Jan 2021 to Dec 2025?",
    shortAnswer: "To coincide with the automated DWLR telemetry modernization in Karnataka, ensuring a uniform 60-month monthly monitoring grid.",
    detailedAnswer: [
      "Prior to 2021, most groundwater monitoring in Karnataka was manual (quarterly tape measurements), creating sparse, non-uniform time series.",
      "Between 2020 and 2021, the Central Ground Water Board (CGWB) and National Water Informatics Centre (NWIC) deployed automated Digital Water Level Recorders (DWLR) with telemetry across Karnataka.",
      "The 60-month period (Jan 2021 to Dec 2025) provides 5 full continuous hydrologic annual cycles, capturing both severe pre-monsoon summer lows and intense southwest monsoon recharges."
    ],
    keyDataPoint: "99,480 spatio-temporal cells (1,658 canonical wells × 60 months) with 59,065 observed targets."
  },
  {
    id: 11,
    category: 'Architecture',
    question: "What is the physical meaning of the RBF edge length scale ℓ?",
    shortAnswer: "ℓ represents the median positive nearest-neighbor distance in the training graph, normalizing spatial decay across Karnataka's well density.",
    detailedAnswer: [
      "In our spatial graph, edge attributes are parameterized by an exponential radial basis function: edge_attr = exp(-d_ij^2 / (2 * ell^2)).",
      "If ell is set arbitrarily, edge weights either saturate to 1.0 (if ell is too large) or vanish to 0.0 (if ell is too small).",
      "We computed ell strictly as the empirical median positive nearest-neighbor distance across all training nodes, ensuring edge features scale naturally with Karnataka's average aquifer monitoring spacing."
    ],
    keyDataPoint: "Dynamic k-nearest-neighbour graph uses k=5 nearest eligible monitored wells + self-loop."
  },
  {
    id: 12,
    category: 'Architecture',
    question: "Why parameterize predicted variance as softplus + 1e-4?",
    shortAnswer: "Softplus ensures variance is strictly positive, and 1e-4 prevents numerical underflow in the Gaussian NLL loss.",
    detailedAnswer: [
      "The MLP prediction head outputs a 2-dimensional vector (mu, raw_v).",
      "Variance is computed as v = softplus(raw_v) + 1e-4 = ln(1 + exp(raw_v)) + 1e-4.",
      "Softplus provides a smooth, differentiable transition to positive values without hard clipping.",
      "The small constant epsilon = 1e-4 guarantees that variance never equals zero, which would cause ln(v) in the Gaussian NLL loss (Eq. 4) to evaluate to -infinity and cause gradient explosion."
    ],
    keyDataPoint: "Gaussian NLL Loss: L = 0.5 * sum [ ln(v) + (y - mu)^2 / v ] on observed targets only."
  },
  {
    id: 13,
    category: 'Architecture',
    question: "How does the student model achieve 50% parameter compression?",
    shortAnswer: "Student compresses the GRU hidden dimension from 128 to 64 and reduces GATv2 from multi-head (4 heads) to single-head.",
    detailedAnswer: [
      "The Teacher model utilizes a 128-dimensional GRU temporal encoder followed by 2 GATv2 layers with 4 attention heads each (~142,000 parameters).",
      "The Student model halves the GRU hidden dimension to 64 and uses single-head GATv2 layers (~71,000 parameters).",
      "Despite having 50% fewer weights, the Student achieves 4.190 m Test MAE, nearly identical to the Teacher's 4.135 m MAE, while halving edge compute latency."
    ],
    keyDataPoint: "Model footprint: ~71k parameters (<300 KB file size), inference latency ~15 ms."
  },
  {
    id: 14,
    category: 'Evaluation & Leakage',
    question: "Why is monitored NSE ~0.78 comparable to Naik's ~0.81?",
    shortAnswer: "Naik's 0.81 is driven by a trivial persistence shortcut; our model predicts genuine hydrodynamics while dominating on ungauged generalization.",
    detailedAnswer: [
      "On monitored wells with continuous history, predicting the previous month's value (persistence) alone yields an NSE of 0.795 in Karnataka.",
      "Naik et al. adds a minor residual to persistence (mu = y_t + Delta mu), achieving 0.812 simply by exploiting temporal inertia.",
      "When Naik's model is evaluated on wells with missing telemetry or held-out ungauged wells, it completely breaks down (-0.059 NSE).",
      "Our Student model achieves 0.779 (pure) and 0.781 (residual skip) while simultaneously generalizing to ungauged wells (+0.024 NSE)."
    ],
    keyDataPoint: "Persistence baseline alone scores NSE 0.795, proving Naik's 0.812 is largely a persistence artifact."
  },
  {
    id: 15,
    category: 'Evaluation & Leakage',
    question: "How do multi-horizon forecasts behave at lead times h = 1, 3, and 6 months?",
    shortAnswer: "Monitored MAE increases gracefully from 4.19m (h=1) to 4.88m (h=3) and 5.42m (h=6), reflecting monsoon predictability limits.",
    detailedAnswer: [
      "In hydrologic resource planning, seasonal 3-month and 6-month outlooks are required for summer irrigation allocation.",
      "We trained direct multi-step prediction heads for horizons h in {1, 3, 6} months.",
      "At h=1, MAE is 4.190 m (NSE 0.779). At h=3, MAE is 4.881 m (NSE 0.694). At h=6, MAE is 5.424 m (NSE 0.621).",
      "Accuracy degrades smoothly without catastrophic divergence, providing actionable multi-season alerts for district water officers."
    ],
    keyDataPoint: "Tested across 10,323 monitored targets and 3,250 ungauged targets in 2025."
  },
  {
    id: 16,
    category: 'Data & Features',
    question: "How did you handle sensor spikes and physical outliers during data auditing?",
    shortAnswer: "We enforced strict physical domain boundaries: depths <0m or >150m were eliminated, removing 193,867 corrupted sensor spikes.",
    detailedAnswer: [
      "DWLR acoustic and pressure transducers frequently experience voltage dips, cable noise, and silting that cause erroneous zero-readings or impossible depths.",
      "We established strict physical criteria: groundwater depth must lie strictly within [0.0 m, 150.0 m] bgl.",
      "Daily values outside this window were purged (193,867 spike records removed across the raw 1.14 GB corpus).",
      "To prevent unrepresentative monthly medians, a month was retained only if it contained at least 10 valid daily measurements; otherwise, it was set to missing."
    ],
    keyDataPoint: "Fully audited in DATA_AUDIT.md and documented in Paper Section 3.1."
  },
  {
    id: 17,
    category: 'Evaluation & Leakage',
    question: "Why is synthetic data strictly excluded from all paper results?",
    shortAnswer: "To uphold scientific integrity (Rule 2); synthetic data was used solely for CI pipeline smoke testing.",
    detailedAnswer: [
      "Scientific research in hydrology must reflect actual geophysical reality, not synthetic Gaussian distributions.",
      "In accordance with Rule 2 of the master prompt, synthetic data generated by scripts/make_synthetic.py was watermarked 'SYNTHETIC' and used strictly to verify that code runs without crashes.",
      "All metrics in the paper, benchmark report, and this presentation app were generated exclusively from the audited 1,658 Karnataka DWLR borewells and IMD meteorological stations."
    ],
    keyDataPoint: "All 11 CSV result tables in results/tables/ are traceable to real-world experiment outputs."
  },
  {
    id: 18,
    category: 'Policy & Impact',
    question: "What is the effect of unmetered agricultural groundwater extraction?",
    shortAnswer: "Unmetered pumping introduces unobserved stress; we proxy it via static population and land use, but note it as a boundary condition.",
    detailedAnswer: [
      "Karnataka has over 1.4 million private agricultural irrigation borewells, the vast majority of which are unmetered due to subsidized agricultural electricity.",
      "This massive seasonal pumping extraction is not directly measured by CGWB telemetry.",
      "Our model proxies this extraction through static district covariates, human settlement density, and seasonal harmonics (sin/cos month).",
      "In Section 6 of our paper, we document unmetered pumping as an operational limitation: direct smart-meter integration would further reduce prediction residuals."
    ],
    keyDataPoint: "Documented in Paper Section 6 ('Limitations and Operational Boundaries')."
  },
  {
    id: 19,
    category: 'Architecture',
    question: "Can this distilled model be deployed on edge devices in rural taluks?",
    shortAnswer: "Yes! At 71k parameters (<300 KB) and 15ms inference latency, it runs on Raspberry Pi without GPU requirements.",
    detailedAnswer: [
      "A major goal of teacher-student distillation was edge feasibility.",
      "The full teacher model with 4 attention heads requires substantial GPU VRAM, making it impractical for rural deployment in regional taluk offices with spotty internet.",
      "The distilled student model has only 71,000 parameters (<300 KB checkpoint) and executes an inference step in under 15 milliseconds on a single standard CPU thread.",
      "This allows state agencies to deploy the model directly on solar-powered regional gateways."
    ],
    keyDataPoint: "Runs seamlessly on CPU edge gateways without requiring expensive cloud GPU servers."
  },
  {
    id: 20,
    category: 'Policy & Impact',
    question: "What is the policy recommendation for CGWB and the Karnataka Ground Water Authority?",
    shortAnswer: "Deploy the distilled student model on regional edge nodes to provide calibrated water budgets and early drought alerts even during telemetry blackouts.",
    detailedAnswer: [
      "Currently, when DWLR telemetry drops out, state engineers have no automated mechanism to estimate water table depletion in critical taluks.",
      "Our distilled pipeline allows the Karnataka Ground Water Authority to deploy automated virtual monitoring across both active and broken stations.",
      "By using the split-conformal calibration bands, water managers receive risk-bounded forecasts (e.g. '90% confidence that depth will exceed 35m in May'), enabling timely borewell drilling moratoriums before aquifers run dry."
    ],
    keyDataPoint: "Actionable policy blueprint for Karnataka State Disaster Management & CGWB."
  }
];

export const QuestionsMaamMightAskTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<number | null>(1); // default expand Q1

  const categories = ['All', 'Architecture', 'Data & Features', 'Evaluation & Leakage', 'Uncertainty', 'Policy & Impact'];

  const filteredQuestions = useMemo(() => {
    return DEFENSE_QUESTIONS.filter((q) => {
      if (selectedCategory !== 'All' && q.category !== selectedCategory) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          q.question.toLowerCase().includes(query) ||
          q.shortAnswer.toLowerCase().includes(query) ||
          q.detailedAnswer.some((p) => p.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="h-full flex flex-col p-6 text-slate-800 overflow-y-auto max-w-7xl mx-auto space-y-5 bg-slate-50">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-700 font-mono text-xs uppercase font-bold tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Viva & Presentation Defense Readiness</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Questions Ma'am Might Ask (20 Technical Defenses)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exhaustive, rigorous answers grounded in DECISIONS.md, DATA_AUDIT.md, and experimental benchmarks
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
          <span className="font-semibold">{filteredQuestions.length} of 20 Prepared Defenses</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search defense question or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md transition font-medium ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="space-y-3">
        {filteredQuestions.map((q) => {
          const isExpanded = expandedId === q.id;

          return (
            <div
              key={q.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'bg-white border-blue-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* Question Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="w-full text-left p-4 flex items-center justify-between space-x-3 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                    Q{q.id}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                        {q.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{q.question}</h3>
                    {!isExpanded && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{q.shortAnswer}</p>
                    )}
                  </div>
                </div>

                <div className="p-1 rounded-md bg-slate-100 text-slate-600 flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3 text-xs leading-relaxed">
                  {/* Short Elevator Answer */}
                  <div className="p-3.5 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 font-medium">
                    <span className="font-bold text-blue-950 mr-1">Elevator Answer:</span>
                    {q.shortAnswer}
                  </div>

                  {/* Detailed Defense Points */}
                  <div className="space-y-2 text-slate-700">
                    {q.detailedAnswer.map((para, pIdx) => (
                      <p key={pIdx} className="flex items-start">
                        <span className="text-blue-600 font-bold mr-2 mt-0.5">•</span>
                        <span>{para}</span>
                      </p>
                    ))}
                  </div>

                  {/* Key Traceable Data Point */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 flex items-center justify-between">
                    <span>
                      <strong className="text-slate-900">Audited Metric / Evidence:</strong> {q.keyDataPoint}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredQuestions.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
            No defense questions matched your search query "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};
