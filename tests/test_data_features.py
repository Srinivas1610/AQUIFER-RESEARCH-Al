"""Unit tests for Phase 2: Preprocessing, Aggregation, and Feature Engineering."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

import numpy as np
import pytest
from gwml.data.idw import haversine_distance_matrix, compute_idw_weights, project_coordinates_utm

def test_haversine_distance_known():
    """Verify haversine distance against known geographic distances."""
    # Bangalore (12.9716 N, 77.5946 E) to Mysore (12.2958 N, 76.6394 E) ~ 128 km
    lats1 = np.array([12.9716])
    lons1 = np.array([77.5946])
    lats2 = np.array([12.2958])
    lons2 = np.array([76.6394])
    
    dist = haversine_distance_matrix(lats1, lons1, lats2, lons2)
    assert dist.shape == (1, 1)
    assert 120.0 <= dist[0, 0] <= 140.0

def test_idw_weights_sum_to_one():
    """Verify IDW weights form a partition of unity (sum to 1.0)."""
    # 3 wells, 10 stations
    np.random.seed(42)
    dist = np.random.uniform(5.0, 50.0, size=(3, 10))
    idx, weights = compute_idw_weights(dist, k=5, power=2)
    
    assert weights.shape == (3, 5)
    np.testing.assert_allclose(weights.sum(axis=1), np.ones(3), rtol=1e-5)
    # Weights should be positive
    assert (weights >= 0).all()

def test_idw_colocated_station():
    """Verify co-located station receives weight 1.0 and others 0.0."""
    dist = np.array([[0.0, 10.0, 20.0, 30.0, 40.0]])
    idx, weights = compute_idw_weights(dist, k=5, power=2)
    
    assert weights[0, 0] == 1.0
    np.testing.assert_allclose(weights[0, 1:], np.zeros(4))

def test_utm_projection_karnataka():
    """Verify EPSG:32643 UTM projection produces valid Easting/Northing in meters."""
    # Center of Karnataka: ~14.5 N, 75.8 E
    lats = np.array([14.5])
    lons = np.array([75.8])
    x, y = project_coordinates_utm(lats, lons)
    
    # UTM Zone 43N: Easting around 500,000 m (central meridian 75°E is 500 km)
    # Northing around 1,600,000 m (14.5 deg * 111 km ~ 1600 km)
    assert 400_000 <= x[0] <= 700_000
    assert 1_400_000 <= y[0] <= 1_800_000

def test_spatiotemporal_grid_shapes_and_values():
    """Verify generated spatiotemporal grid satisfies methodology dimensions and masks."""
    grid_path = Path("data/processed/spatiotemporal_grid.npz")
    assert grid_path.exists(), "spatiotemporal_grid.npz must exist"
    
    data = np.load(grid_path)
    assert len(data['study_months']) == 60
    assert len(data['well_ids']) == 1658
    assert data['gw_target'].shape == (60, 1658)
    assert data['gw_observed_mask'].shape == (60, 1658)
    assert data['rainfall'].shape == (60, 1658)
    assert data['temperature'].shape == (60, 1658)
    
    # Check that observed mask matches non-nan targets
    valid_targets = ~np.isnan(data['gw_target'])
    assert (valid_targets == (data['gw_observed_mask'] == 1)).all()
    assert data['gw_observed_mask'].sum() == 59065
