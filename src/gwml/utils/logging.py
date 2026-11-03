"""Logging configuration."""
import logging
import sys
from pathlib import Path
from datetime import datetime


def setup_logging(log_dir: str | Path = "results/logs", level: int = logging.INFO) -> logging.Logger:
    """Configure project-wide logging to file and stdout."""
    log_dir = Path(log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"run_{timestamp}.log"

    logger = logging.getLogger("gwml")
    logger.setLevel(level)

    # Clear existing handlers
    logger.handlers.clear()

    # File handler
    fh = logging.FileHandler(log_file, encoding='utf-8')
    fh.setLevel(level)
    fh.setFormatter(logging.Formatter(
        '%(asctime)s | %(name)s | %(levelname)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    ))
    logger.addHandler(fh)

    # Stdout handler
    sh = logging.StreamHandler(sys.stdout)
    sh.setLevel(level)
    sh.setFormatter(logging.Formatter('%(levelname)s | %(message)s'))
    logger.addHandler(sh)

    logger.info(f"Logging initialized. Log file: {log_file}")
    return logger
