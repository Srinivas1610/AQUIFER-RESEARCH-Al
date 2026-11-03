"""Spatiotemporal Graph Neural Network (GRU + 2x GATv2 + MLP head).

Implements Methodology Section C:
- GRU temporal encoder over historical window.
- Concatenation with static attributes and target seasonal harmonics.
- 2x GATv2 layers (Brody et al., 2021) with edge_dim=1.
  Layer 1: multi-head concatenation + ELU activation.
  Layer 2: multi-head mean aggregation.
- 32-unit ReLU MLP head predicting mean and variance (v = softplus + 1e-4).
- Gaussian Negative Log-Likelihood loss on observed targets only (Eq. 4).
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATv2Conv

class SpatiotemporalGNN(nn.Module):
    def __init__(
        self,
        in_dynamic_dim=4,
        static_dim=4,
        harmonic_dim=2,
        gru_hidden=128,
        gat_heads=4,
        mlp_hidden=32,
        dropout=0.1,
        variance_floor=1e-4
    ):
        super().__init__()
        self.gru_hidden = gru_hidden
        self.gat_heads = gat_heads
        self.variance_floor = variance_floor

        # 1. Temporal GRU encoder
        self.gru = nn.GRU(
            input_size=in_dynamic_dim,
            hidden_size=gru_hidden,
            batch_first=True
        )

        # 2. Node feature projection
        node_in_dim = gru_hidden + static_dim + harmonic_dim
        self.node_proj = nn.Linear(node_in_dim, gru_hidden)

        # 3. Two GATv2 layers with edge features (edge_dim=1)
        # Layer 1: heads concatenated -> out_dim = (gru_hidden // heads) * heads = gru_hidden
        head_dim = max(16, gru_hidden // gat_heads)
        self.gat1 = GATv2Conv(
            in_channels=gru_hidden,
            out_channels=head_dim,
            heads=gat_heads,
            concat=True,
            edge_dim=1,
            dropout=dropout
        )
        gat1_out_dim = head_dim * gat_heads

        # Layer 2: heads averaged (concat=False) -> out_dim = gru_hidden
        self.gat2 = GATv2Conv(
            in_channels=gat1_out_dim,
            out_channels=gru_hidden,
            heads=gat_heads,
            concat=False,
            edge_dim=1,
            dropout=dropout
        )

        self.dropout = nn.Dropout(dropout)

        # 4. MLP Prediction Head (32-unit ReLU -> (mu, raw_v))
        self.head = nn.Sequential(
            nn.Linear(gru_hidden, mlp_hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_hidden, 2)
        )

    def forward(self, x_seq, static_feat, harmonic_feat, edge_index, edge_attr):
        """
        x_seq: (N, L, dynamic_dim)
        static_feat: (N, static_dim)
        harmonic_feat: (N, harmonic_dim)
        edge_index: (2, E)
        edge_attr: (E, 1)
        """
        # GRU encoding
        _, h_n = self.gru(x_seq)
        h_temp = h_n.squeeze(0)  # (N, gru_hidden)

        # Concatenate and project node representation
        x_node = torch.cat([h_temp, static_feat, harmonic_feat], dim=-1)
        h0 = F.relu(self.node_proj(x_node))

        # GATv2 Layer 1 (concat heads + ELU)
        h1 = self.gat1(h0, edge_index, edge_attr=edge_attr)
        h1 = F.elu(h1)
        h1 = self.dropout(h1)

        # GATv2 Layer 2 (mean heads)
        h2 = self.gat2(h1, edge_index, edge_attr=edge_attr)
        h2 = F.elu(h2)
        h2 = self.dropout(h2)

        # Prediction Head
        out = self.head(h2)
        mu = out[:, 0]
        v = F.softplus(out[:, 1]) + self.variance_floor

        return mu, v

def gaussian_nll_loss(y_true, mu, v, mask=None):
    """
    Gaussian negative log-likelihood on observed targets only (Methodology Eq. 4):
    L = 1/|O| * sum_{i in O} [ 0.5 * log(v_i) + (y_i - mu_i)^2 / (2 * v_i) ]
    """
    nll = 0.5 * torch.log(v) + (y_true - mu)**2 / (2.0 * v)
    if mask is not None:
        loss = torch.sum(nll * mask) / torch.clamp(mask.sum(), min=1.0)
    else:
        loss = torch.mean(nll)
    return loss
