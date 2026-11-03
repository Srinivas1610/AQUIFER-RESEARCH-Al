import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ProjectMeta,
  ScorecardItem,
  LeaderboardRow,
  AblationRow,
  AlphaSweepRow,
  MultiSeedData,
  HorizonRow,
  ReconstructionRow,
  CalibrationRow,
  WellInfo,
  SampleHydrograph,
  ColumnDefinition
} from '../types';

interface DataContextType {
  meta: ProjectMeta | null;
  scorecard: ScorecardItem[];
  leaderboardMonitored: LeaderboardRow[];
  leaderboardQuery: LeaderboardRow[];
  ablations: AblationRow[];
  alphaSweep: AlphaSweepRow[];
  multiseed: MultiSeedData | null;
  horizons: HorizonRow[];
  reconstruction: ReconstructionRow[];
  calibration: CalibrationRow[];
  wells: WellInfo[];
  hydrographs: Record<string, SampleHydrograph>;
  columns: ColumnDefinition[];
  datasetSample: any[];
  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardItem[]>([]);
  const [leaderboardMonitored, setLeaderboardMonitored] = useState<LeaderboardRow[]>([]);
  const [leaderboardQuery, setLeaderboardQuery] = useState<LeaderboardRow[]>([]);
  const [ablations, setAblations] = useState<AblationRow[]>([]);
  const [alphaSweep, setAlphaSweep] = useState<AlphaSweepRow[]>([]);
  const [multiseed, setMultiseed] = useState<MultiSeedData | null>(null);
  const [horizons, setHorizons] = useState<HorizonRow[]>([]);
  const [reconstruction, setReconstruction] = useState<ReconstructionRow[]>([]);
  const [calibration, setCalibration] = useState<CalibrationRow[]>([]);
  const [wells, setWells] = useState<WellInfo[]>([]);
  const [hydrographs, setHydrographs] = useState<Record<string, SampleHydrograph>>({});
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [datasetSample, setDatasetSample] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const fetchJson = async (filename: string) => {
          // Use relative path so it works offline from any origin / base
          const res = await fetch(`./data/${filename}`);
          if (!res.ok) {
            // Fallback try root data
            const fallbackRes = await fetch(`/data/${filename}`);
            if (!fallbackRes.ok) throw new Error(`Could not load ${filename}`);
            return await fallbackRes.json();
          }
          return await res.json();
        };

        const [
          metaData,
          scoreData,
          monData,
          queryData,
          ablData,
          alphaData,
          seedData,
          horData,
          recData,
          calData,
          wellData,
          hydroData,
          colData,
          sampleData
        ] = await Promise.all([
          fetchJson('project_meta.json'),
          fetchJson('scorecard.json'),
          fetchJson('leaderboard_monitored.json'),
          fetchJson('leaderboard_query.json'),
          fetchJson('ablations.json'),
          fetchJson('alpha_sweep.json'),
          fetchJson('multiseed.json'),
          fetchJson('horizons.json'),
          fetchJson('reconstruction.json'),
          fetchJson('uncertainty_calibration.json'),
          fetchJson('wells.json'),
          fetchJson('sample_hydrographs.json'),
          fetchJson('column_dictionary.json'),
          fetchJson('dataset_sample.json')
        ]);

        setMeta(metaData);
        setScorecard(scoreData);
        setLeaderboardMonitored(monData);
        setLeaderboardQuery(queryData);
        setAblations(ablData);
        setAlphaSweep(alphaData);
        setMultiseed(seedData);
        setHorizons(horData);
        setReconstruction(recData);
        setCalibration(calData);
        setWells(wellData);
        setHydrographs(hydroData);
        setColumns(colData);
        setDatasetSample(sampleData);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Data loading error:", err);
        setError(err.message || "Failed to load precomputed demo data.");
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  return (
    <DataContext.Provider
      value={{
        meta,
        scorecard,
        leaderboardMonitored,
        leaderboardQuery,
        ablations,
        alphaSweep,
        multiseed,
        horizons,
        reconstruction,
        calibration,
        wells,
        hydrographs,
        columns,
        datasetSample,
        isLoading,
        error
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
