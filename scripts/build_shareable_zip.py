"""Build the official, clean, reproducible ml_shared.zip package for submission.

Packages all audited code, preprocessed data tensors, model checkpoints,
evaluation tables, publication figures, test suite, and PDF manuscripts
while excluding large raw telemetry files (1.14 GB), virtual environments (.venv),
and frontend node_modules.
"""
from pathlib import Path
import zipfile
import shutil
import sys
import os

ROOT_DIR = Path(__file__).resolve().parent.parent

EXCLUDE_PATTERNS = [
    "node_modules",
    "__pycache__",
    ".venv",
    ".git",
    ".pytest_cache",
    ".zip",
    "data/raw",
    "data\\raw",
    "SYNTHETIC_",
    ".DS_Store",
    "Thumbs.db",
]

INCLUDE_ROOT_FILES = [
    "1_RESEARCH_PAPER_main.pdf",
    "2_COMPARATIVE_BENCHMARK_REPORT_vs_Baseline.pdf",
    "README_FOR_TEAMMATES.md",
    "README_FOR_EVALUATORS.md",
    "README.md",
    "PROGRESS.md",
    "SUBMISSION_CHECKLIST.md",
    "Makefile",
    "requirements.txt",
    "all_data_combined.csv",
    "merged_dataset.csv",
    "LICENSE",
    "run_demo.py"
]

INCLUDE_DIRS = [
    "configs",
    "data/processed",
    "data/interim",
    "docs",
    "paper",
    "results",
    "scripts",
    "src",
    "tests",
    "demo_app"
]


def should_exclude(file_path: Path) -> bool:
    rel_str = str(file_path.relative_to(ROOT_DIR)).replace("\\", "/")
    for pattern in EXCLUDE_PATTERNS:
        if pattern in rel_str:
            return True
    return False


def collect_files():
    files_to_pack = []

    # Root files
    for rf in INCLUDE_ROOT_FILES:
        p = ROOT_DIR / rf
        if p.exists() and p.is_file():
            files_to_pack.append(p)

    # Directories
    for d in INCLUDE_DIRS:
        dp = ROOT_DIR / d
        if dp.exists() and dp.is_dir():
            for root, _, filenames in os.walk(dp):
                for fn in filenames:
                    fp = Path(root) / fn
                    if not should_exclude(fp):
                        files_to_pack.append(fp)

    return sorted(list(set(files_to_pack)))


def build_zip():
    files = collect_files()
    print(f"Collected {len(files)} files to pack into ml_shared.zip...")

    local_zip = ROOT_DIR / "ml_shared.zip"
    parent_zip = ROOT_DIR.parent / "ml_shared.zip"

    # Temporary write to local zip
    with zipfile.ZipFile(local_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for f in files:
            arcname = str(f.relative_to(ROOT_DIR)).replace("\\", "/")
            zf.write(f, arcname=arcname)
            print(f"  + {arcname}")

    file_size_mb = local_zip.stat().st_size / (1024 * 1024)
    print(f"\nCreated local archive: {local_zip} ({file_size_mb:.2f} MB)")

    # Copy to parent folder as well
    shutil.copy2(local_zip, parent_zip)
    print(f"Updated parent archive: {parent_zip} ({file_size_mb:.2f} MB)")

    # Integrity verification
    with zipfile.ZipFile(local_zip, "r") as zf:
        namelist = zf.namelist()
        print(f"\nVerification: {len(namelist)} entries verified inside zip archive.")
        must_haves = [
            "1_RESEARCH_PAPER_main.pdf",
            "2_COMPARATIVE_BENCHMARK_REPORT_vs_Baseline.pdf",
            "README_FOR_TEAMMATES.md",
            "data/processed/spatiotemporal_grid.npz",
            "results/models/student_best.pt",
            "scripts/predict_custom_location.py",
            "tests/test_leakage.py",
            "demo_app/dist/index.html"
        ]
        all_ok = True
        for mh in must_haves:
            if mh in namelist:
                print(f"  [OK] {mh}")
            else:
                print(f"  [MISSING] {mh}")
                all_ok = False

        if all_ok:
            print("\nAll critical artifacts successfully verified in submission zip!")
        else:
            print("\nWarning: Some critical files were missing.")


if __name__ == "__main__":
    build_zip()
