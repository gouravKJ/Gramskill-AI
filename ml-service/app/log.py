"""Shared logger for the matching service.

Uses the stdlib `logging` module rather than `print()` for a concrete reason:
when uvicorn runs under `nohup ... > file` (which is how `npm run ml:dev` is
commonly used, and how containers capture output), Python block-buffers stdout
and every diagnostic written with `print()` silently disappears until the
process exits. A `StreamHandler` flushes on every record, so the boot messages —
which model was selected, and its holdout metrics — are always visible.
"""

from __future__ import annotations

import logging
import sys

LOGGER = logging.getLogger("gramskill.ml")

if not LOGGER.handlers:
    _handler = logging.StreamHandler(sys.stdout)
    _handler.setFormatter(logging.Formatter("[ml] %(message)s"))
    LOGGER.addHandler(_handler)
    LOGGER.setLevel(logging.INFO)
    # Uvicorn only configures its own loggers, so don't rely on propagation to
    # the root logger (whose default WARNING level would swallow INFO records).
    LOGGER.propagate = False
