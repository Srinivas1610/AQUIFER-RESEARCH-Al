"""YAML configuration loader with base-config inheritance."""
import copy
from pathlib import Path
from typing import Any, Dict

import yaml


def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively merge override into base, returning a new dict."""
    result = copy.deepcopy(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


def load_config(config_path: str | Path) -> Dict[str, Any]:
    """Load a YAML config, resolving _base_ inheritance."""
    config_path = Path(config_path)
    with open(config_path, 'r') as f:
        cfg = yaml.safe_load(f) or {}

    base_name = cfg.pop('_base_', None)
    if base_name:
        base_path = config_path.parent / base_name
        base_cfg = load_config(base_path)
        cfg = _deep_merge(base_cfg, cfg)

    return cfg
