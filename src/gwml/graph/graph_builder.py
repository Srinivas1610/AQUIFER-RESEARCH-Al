"""Spatiotemporal Graph construction module using PyTorch Geometric.

Implements Methodology Section C & Section D:
- k=5 nearest eligible monitored wells + self-loop.
- Edge weights: exp(-d^2 / (2 * ell^2)), where ell is median positive neighbour distance.
- Edge features passed to GATv2Conv with edge_dim=1.
- Asymmetric query nodes: receive messages from neighbours but send no messages.
"""
from pathlib import Path
import numpy as np
import torch
from torch_geometric.data import Data
from gwml.data.idw import haversine_distance_matrix

class SpatiotemporalGraphBuilder:
    def __init__(self, well_coords, k_neighbours=5, ell=None):
        """
        well_coords: (N, 2) array of (latitude, longitude)
        k_neighbours: number of nearest neighbours (default 5)
        ell: characteristic length scale in km (if None, estimated from data)
        """
        self.coords = np.array(well_coords)
        self.N = len(self.coords)
        self.k = min(k_neighbours, self.N - 1)
        
        # Compute pairwise distance matrix in km
        self.dist_matrix = haversine_distance_matrix(
            self.coords[:, 0], self.coords[:, 1],
            self.coords[:, 0], self.coords[:, 1]
        )
        
        # Pre-sort neighbours for fast dynamic graph construction
        self.sorted_indices = np.argsort(self.dist_matrix, axis=1)

        # Estimate ell: median positive k-nearest neighbour distance
        if ell is None:
            k_dists = np.take_along_axis(self.dist_matrix, self.sorted_indices[:, 1 : self.k + 1], axis=1)
            self.ell = float(np.median(k_dists))
            if self.ell <= 0:
                self.ell = 25.0
        else:
            self.ell = float(ell)

    def build_graph(self, eligible_senders_mask=None, query_nodes_mask=None):
        """
        Build edge_index and edge_attr.
        eligible_senders_mask: boolean array (N,), True if well can SEND messages.
        query_nodes_mask: boolean array (N,), True if well is a query node (receives only).
        """
        if eligible_senders_mask is None:
            eligible_senders_mask = np.ones(self.N, dtype=bool)

        sources = []
        targets = []
        edge_weights = []

        two_ell_sq = 2.0 * (self.ell ** 2)

        for tgt in range(self.N):
            # Self-loop for all nodes
            sources.append(tgt)
            targets.append(tgt)
            edge_weights.append(1.0)  # exp(0) = 1.0

            # Scan pre-sorted nearest neighbours
            found = 0
            for src in self.sorted_indices[tgt, 1:]:
                if eligible_senders_mask[src]:
                    d = self.dist_matrix[tgt, src]
                    w = np.exp(-(d ** 2) / two_ell_sq)
                    sources.append(src)
                    targets.append(tgt)
                    edge_weights.append(float(w))
                    found += 1
                    if found >= self.k:
                        break

        edge_index = torch.tensor([sources, targets], dtype=torch.long)
        edge_attr = torch.tensor(edge_weights, dtype=torch.float32).unsqueeze(-1)  # (E, 1)

        return edge_index, edge_attr, self.ell
