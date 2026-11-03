"""Shared test fixtures."""
import sys
from pathlib import Path
import pytest

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))


@pytest.fixture
def project_root():
    return Path(__file__).parent.parent


@pytest.fixture
def config_dir(project_root):
    return project_root / 'configs'
