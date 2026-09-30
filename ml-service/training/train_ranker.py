"""Train the gradient-boosted ranker and persist it.

Usage
-----
    cd ml-service
    python -m training.train_ranker                 # 12k synthetic rows
    python -m training.train_ranker --rows 50000    # more data
    python -m training.train_ranker --report-only   # metrics, no artifact

The script prints a side-by-side comparison against the linear weighted-factor
baseline, which is the number that actually justifies shipping a learned model.
Replace `synthetic_dataset()` with a loader over real labelled outcomes (e.g.
which applicants were shortlisted) and the rest of the pipeline is unchanged.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

# Allow `python ml-service/training/train_ranker.py` as well as `-m training.train_ranker`.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import config  # noqa: E402
from app.log import LOGGER  # noqa: E402
from app.models.gradient_boosted import save_artifact, train_ranker  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Train the GramSkill AI ranker.")
    parser.add_argument("--rows", type=int, default=12_000, help="synthetic training rows")
    parser.add_argument("--seed", type=int, default=7, help="random seed")
    parser.add_argument("--report-only", action="store_true", help="do not persist the artifact")
    parser.add_argument("--json", action="store_true", help="print metrics as JSON")
    args = parser.parse_args()

    # ASCII-only output: Windows consoles default to cp1252 and mangle anything else.
    print(f"Training with {args.rows:,} rows (seed={args.seed}) ...")
    model, metrics, backend = train_ranker(n_samples=args.rows, seed=args.seed)

    if args.json:
        print(json.dumps({"backend": backend, "metrics": metrics}, indent=2))
    else:
        print(f"backend                 : {backend}")
        print(f"features                : {len(config.FEATURE_NAMES)}")
        print(f"holdout R2              : {metrics['holdoutR2']}")
        print(f"holdout MAE             : {metrics['holdoutMae']}")
        print(f"linear baseline R2      : {metrics['linearBaselineR2']}")
        print(f"linear baseline MAE     : {metrics['linearBaselineMae']}")
        # Lower MAE is better, so the improvement is baseline - ranker.
        improvement = metrics["linearBaselineMae"] - metrics["holdoutMae"]
        print(f"MAE improvement         : {improvement:+.4f} (positive = ranker is better)")

    if args.report_only:
        print("--report-only: artifact not written.")
        return 0

    path = save_artifact(model, backend)
    if path:
        print(f"artifact saved          : {path}")
    else:
        LOGGER.warning("artifact could not be written — the service will retrain on boot")
    print("Restart the service to pick up the new artifact.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
