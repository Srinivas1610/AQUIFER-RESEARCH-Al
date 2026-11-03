import React, { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Activity,
  Zap,
  Trophy,
  ShieldCheck,
  Database,
  BookOpen,
  HelpCircle,
  Presentation,
  Compass,
  Menu,
  Maximize,
  Minimize,
  ChevronRight
} from 'lucide-react';
import { OverviewDashboardTab } from './OverviewDashboardTab';
import { MapViewTab } from './MapViewTab';
import { WellDetailTab } from './WellDetailTab';
import { StressTestSimulatorTab } from './StressTestSimulatorTab';
import { ModelComparisonTab } from './ModelComparisonTab';
import { CalibrationTab } from './CalibrationTab';
import { DataExplorerTab } from './DataExplorerTab';
import { PapersGalleryTab } from './PapersGalleryTab';
import { QuestionsMaamMightAskTab } from './QuestionsMaamMightAskTab';

interface ExplorerViewProps {
  onSwitchToPresentation?: () => void;
}

type TabType =
  | 'overview'
  | 'map'
  | 'well'
  | 'simulator'
  | 'comparison'
  | 'calibration'
  | 'data'
  | 'papers'
  | 'questions';

export const ExplorerView: React.FC<ExplorerViewProps> = ({ onSwitchToPresentation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedWellId, setSelectedWellId] = useState<string>('Abbinahole');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleSelectWellForHydrograph = (wellId: string) => {
    setSelectedWellId(wellId);
    setActiveTab('well');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard, badge: 'Summary' },
    { id: 'map', label: 'Spatial Well Map', icon: MapPin, badge: '1,658 Wells' },
    { id: 'well', label: 'Hydrograph Engine', icon: Activity, badge: 'Time-Series' },
    { id: 'simulator', label: 'Stress & Telemetry Test', icon: Zap, badge: 'Simulator' },
    { id: 'comparison', label: 'Benchmark & Ablations', icon: Trophy, badge: 'vs Naik' },
    { id: 'calibration', label: 'Uncertainty Calibration', icon: ShieldCheck, badge: '96.6% PICP' },
    { id: 'data', label: 'Dataset & Dictionary', icon: Database, badge: '32 Features' },
    { id: 'papers', label: 'Papers & Figure Gallery', icon: BookOpen, badge: '2 Manuscripts' },
    { id: 'questions', label: "Questions for Ma'am", icon: HelpCircle, badge: '20 Defenses' },
  ];

  return (
    <div className="w-screen h-screen bg-slate-50 flex overflow-hidden select-none text-slate-800 font-sans">
      {/* Platform Minimalist Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-16'
        } bg-slate-100/90 border-r border-slate-200 flex flex-col justify-between transition-all duration-200 z-40 flex-shrink-0`}
      >
        {/* Sidebar Brand Header */}
        <div>
          <div className="h-14 px-3.5 flex items-center justify-between border-b border-slate-200 bg-white">
            {isSidebarOpen ? (
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 flex-shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="font-bold text-slate-900 text-xs tracking-tight block leading-tight">
                    AQUIFER RESEARCH AI
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                    Karnataka GWL Portal
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-700">
                <Compass className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Items List */}
          <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-130px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center rounded-lg transition text-xs py-2 px-2.5 ${
                    isSidebarOpen ? 'justify-between' : 'justify-center'
                  } ${
                    isActive
                      ? 'bg-white text-blue-700 font-bold shadow-xs border border-slate-200 border-l-4 border-l-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
                  }`}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </div>
                  {isSidebarOpen && item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Optional Slide Deck Link */}
            {onSwitchToPresentation && isSidebarOpen && (
              <div className="pt-2 mt-2 border-t border-slate-200">
                <button
                  onClick={onSwitchToPresentation}
                  className="w-full flex items-center justify-between rounded-lg py-1.5 px-2.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition font-sans"
                >
                  <div className="flex items-center space-x-2">
                    <Presentation className="w-3.5 h-3.5 text-slate-400" />
                    <span>Presentation Slides</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar System Status Footer */}
        {isSidebarOpen && (
          <div className="p-3 border-t border-slate-200 bg-white text-[11px] space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-500">
              <span>Checkpoint:</span>
              <span className="text-slate-800 font-medium">student_best.pt</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Test Suite:</span>
              <span className="text-emerald-700 font-bold">40/40 Passing</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Mode:</span>
              <span className="text-blue-700 font-medium">Offline Academic</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-30">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-mono">Portal /</span>
            <span className="font-bold text-slate-900 text-sm">
              {navItems.find((n) => n.id === activeTab)?.label || 'Research Dashboard'}
            </span>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="hidden md:flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
              <span className="text-slate-500">Cohort:</span>
              <span className="text-slate-900 font-bold">1,658 Wells (60 Mos)</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-700 font-medium">Ungauged NSE:</span>
              <span className="text-emerald-800 font-bold">+0.024 (vs -0.059)</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200">
              <span className="text-blue-700 font-medium">Coverage:</span>
              <span className="text-blue-900 font-bold">96.6% PICP</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'overview' && (
            <OverviewDashboardTab
              onNavigate={(tab) => setActiveTab(tab as TabType)}
              onSelectWellForHydrograph={handleSelectWellForHydrograph}
            />
          )}
          {activeTab === 'map' && (
            <MapViewTab onSelectWellForHydrograph={handleSelectWellForHydrograph} />
          )}
          {activeTab === 'well' && <WellDetailTab initialWellId={selectedWellId} />}
          {activeTab === 'simulator' && <StressTestSimulatorTab />}
          {activeTab === 'comparison' && <ModelComparisonTab />}
          {activeTab === 'calibration' && <CalibrationTab />}
          {activeTab === 'data' && <DataExplorerTab />}
          {activeTab === 'papers' && <PapersGalleryTab />}
          {activeTab === 'questions' && <QuestionsMaamMightAskTab />}
        </main>
      </div>
    </div>
  );
};
