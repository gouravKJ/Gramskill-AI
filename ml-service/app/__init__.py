"""GramSkill AI — Python ML matching service.

Pipeline (see README.md for the full diagram):

    Profile + Job  ->  Feature extraction  ->  Embedding (optional)
                   ->  Similarity          ->  ML ranking
                   ->  Explainable score

The service is intentionally *swappable*: `app.models.matcher()` returns the best
ranked model available in the current environment, and everything downstream of
it (the FastAPI layer, the Next.js proxy route) only depends on a numeric score
plus its decomposition.
"""

__version__ = "1.0.0"
