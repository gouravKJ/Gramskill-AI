"""Location table mirroring `src/lib/data/catalogue.ts`.

The Next.js proxy route forwards `locationId` strings rather than coordinates,
so the service keeps its own copy of the (synthetic) demo geocodes to compute
commuting distance. When you move to a real database, replace this with a query
against your `Location` table — nothing else in the pipeline changes.
"""

from __future__ import annotations

# id -> (name, district, state, lat, lng, is_rural)
LOCATIONS: dict[str, dict[str, object]] = {
    "loc-koraput": {"name": "Koraput (Demo)", "district": "Koraput", "state": "Odisha", "lat": 18.8128, "lng": 82.7105, "is_rural": True},
    "loc-rayagada": {"name": "Rayagada (Demo)", "district": "Rayagada", "state": "Odisha", "lat": 19.1711, "lng": 83.4163, "is_rural": True},
    "loc-kalahandi": {"name": "Bhawanipatna (Demo)", "district": "Kalahandi", "state": "Odisha", "lat": 19.9068, "lng": 83.1665, "is_rural": True},
    "loc-gajapati": {"name": "Paralakhemundi (Demo)", "district": "Gajapati", "state": "Odisha", "lat": 18.7778, "lng": 84.0941, "is_rural": True},
    "loc-kandhamal": {"name": "Phulbani (Demo)", "district": "Kandhamal", "state": "Odisha", "lat": 20.4667, "lng": 84.2333, "is_rural": True},
    "loc-bolangir": {"name": "Bolangir (Demo)", "district": "Bolangir", "state": "Odisha", "lat": 20.7011, "lng": 83.4847, "is_rural": True},
    "loc-malkangiri": {"name": "Malkangiri (Demo)", "district": "Malkangiri", "state": "Odisha", "lat": 18.35, "lng": 81.8833, "is_rural": True},
    "loc-nowrangpur": {"name": "Nabarangpur (Demo)", "district": "Nabarangpur", "state": "Odisha", "lat": 19.2333, "lng": 82.55, "is_rural": True},
    "loc-bhubaneswar": {"name": "Bhubaneswar (Demo)", "district": "Khordha", "state": "Odisha", "lat": 20.2961, "lng": 85.8245, "is_rural": False},
    "loc-sambalpur": {"name": "Sambalpur (Demo)", "district": "Sambalpur", "state": "Odisha", "lat": 21.4669, "lng": 83.9812, "is_rural": False},
    "loc-ranchi": {"name": "Ranchi (Demo)", "district": "Ranchi", "state": "Jharkhand", "lat": 23.3441, "lng": 85.3096, "is_rural": False},
    "loc-remote": {"name": "Work From Home (Demo)", "district": "—", "state": "India", "lat": 20.5937, "lng": 78.9629, "is_rural": False},
}


def location(location_id: str | None) -> dict[str, object] | None:
    """Look up a location, tolerating unknown ids from newer client versions."""
    if not location_id:
        return None
    return LOCATIONS.get(location_id) or {
        "name": "Unknown location",
        "district": "—",
        "state": "—",
        "lat": 20.5937,
        "lng": 78.9629,
        "is_rural": False,
    }
