"""Tests for utility modules."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

import numpy as np
import torch

from gwml.utils.seed import set_seed
from gwml.utils.config import load_config


def test_set_seed_deterministic():
    """Verify that setting the same seed produces identical random sequences."""
    set_seed(42)
    a1 = np.random.rand(5)
    t1 = torch.rand(5)

    set_seed(42)
    a2 = np.random.rand(5)
    t2 = torch.rand(5)

    np.testing.assert_array_equal(a1, a2)
    assert torch.equal(t1, t2)


def test_load_base_config(config_dir):
    """Test loading base.yaml."""
    cfg = load_config(config_dir / 'base.yaml')
    assert cfg['project']['seed'] == 42
    assert cfg['spatial_split']['cell_size_m'] == 25000
    assert cfg['training']['max_epochs'] == 200
    assert cfg['model']['variance_floor'] == 1e-4


def test_load_smoke_config_inherits(config_dir):
    """Test that smoke.yaml inherits from base.yaml and overrides correctly."""
    cfg = load_config(config_dir / 'smoke.yaml')
    # Overridden values
    assert cfg['training']['max_epochs'] == 3
    assert cfg['tuning']['n_configs'] == 2
    # Inherited values
    assert cfg['spatial_split']['cell_size_m'] == 25000
    assert cfg['model']['variance_floor'] == 1e-4


def test_different_seeds_different_results():
    """Different seeds should produce different sequences."""
    set_seed(42)
    a1 = np.random.rand(10)
    set_seed(99)
    a2 = np.random.rand(10)
    assert not np.array_equal(a1, a2)
