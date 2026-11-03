"""Main pipeline entry point.

Usage:
    python scripts/run_pipeline.py --config configs/smoke.yaml
    python scripts/run_pipeline.py --config configs/base.yaml --phase data
"""
import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from gwml.utils.seed import set_seed
from gwml.utils.config import load_config
from gwml.utils.logging import setup_logging


def run_phase(phase: str, cfg: dict, logger) -> None:
    """Execute a pipeline phase."""
    logger.info(f"=== Phase: {phase} ===")
    start = time.time()
    
    if phase == 'data':
        from gwml.data.audit import run_data_audit
        run_data_audit()
    elif phase == 'features':
        from gwml.data.build_features import build_spatiotemporal_grid
        build_spatiotemporal_grid()
    elif phase == 'splits':
        from gwml.splits.spatial import run_spatial_split
        run_spatial_split()
    elif phase == 'baselines':
        from gwml.models.baselines import run_baselines_pipeline
        run_baselines_pipeline()
    elif phase == 'imputer':
        from gwml.imputation.deepmvi import run_imputer_benchmark
        run_imputer_benchmark()
    elif phase == 'teacher':
        from gwml.training.train_teacher import run_teacher_pipeline
        run_teacher_pipeline()
    elif phase == 'student':
        from gwml.training.train_student import run_student_pipeline
        run_student_pipeline()
    elif phase == 'calibration':
        from gwml.calibration.run_calibration import run_calibration_pipeline
        run_calibration_pipeline()
    elif phase == 'eval':
        from gwml.experiments.run_experiments import main as run_eval_experiments
        run_eval_experiments()
    elif phase == 'paper':
        import subprocess
        subprocess.run([sys.executable, "scripts/compile_paper.py"], check=True)
    else:
        logger.warning(f"Unknown phase: {phase}")
    
    elapsed = time.time() - start
    logger.info(f"Phase {phase} completed in {elapsed:.1f}s")


def main():
    parser = argparse.ArgumentParser(description='Groundwater ML Pipeline')
    parser.add_argument('--config', type=str, required=True, help='Path to YAML config')
    parser.add_argument('--phase', type=str, default='all',
                        choices=['all', 'data', 'features', 'splits', 'baselines',
                                 'imputer', 'teacher', 'student', 'calibration', 'eval', 'paper'],
                        help='Pipeline phase to run')
    args = parser.parse_args()
    
    cfg = load_config(args.config)
    seed = cfg.get('project', {}).get('seed', 42)
    set_seed(seed)
    
    logger = setup_logging()
    logger.info(f"Config loaded from {args.config}")
    logger.info(f"Mode: {cfg.get('mode', 'full')}")
    logger.info(f"Seed: {seed}")
    
    if args.phase == 'all':
        phases = ['data', 'features', 'splits', 'baselines', 'imputer',
                  'teacher', 'student', 'calibration', 'eval']
    else:
        phases = [args.phase]
    
    for phase in phases:
        run_phase(phase, cfg, logger)
    
    logger.info("Pipeline complete.")


if __name__ == '__main__':
    main()
