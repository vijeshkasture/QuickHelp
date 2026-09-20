import math
from typing import Optional


def calculate_distance_km(
    lat1: Optional[float],
    lon1: Optional[float],
    lat2: Optional[float],
    lon2: Optional[float]
) -> float:
    """
    Calculate the great circle distance between two points on the Earth's surface
    using the Haversine formula.

    Args:
        lat1: Latitude of the first point in decimal degrees.
        lon1: Longitude of the first point in decimal degrees.
        lat2: Latitude of the second point in decimal degrees.
        lon2: Longitude of the second point in decimal degrees.

    Returns:
        Distance in kilometers as a float rounded to 2 decimal places.
        If any coordinate is None or invalid, returns infinity (99999.0).
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 99999.0

    # Earth radius in kilometers
    EARTH_RADIUS_KM = 6371.0

    # Convert coordinates from decimal degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = EARTH_RADIUS_KM * c
    return round(distance, 2)
