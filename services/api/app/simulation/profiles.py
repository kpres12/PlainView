"""
Simulation profiles — deterministic curves for environment values.

All functions accept a time-of-day (0–24 hours) and return a float.
"""

import math
import random


def diurnal_temperature(hour: float, base: float = 25.0) -> float:
    """Sinusoidal temperature curve peaking at ~14:00."""
    amplitude = 12.0
    phase = (hour - 14.0) / 24.0 * 2 * math.pi
    return base + amplitude * math.cos(phase)


def diurnal_pressure(hour: float, base: int = 2500000) -> int:
    """Slight pressure variation — higher in morning, lower at night."""
    amplitude = 50000
    phase = (hour - 10.0) / 24.0 * 2 * math.pi
    return int(base + amplitude * math.cos(phase))


def operational_load_curve(hour: float) -> float:
    """
    Operational load: ramps up at 06:00, peaks 10–16, ramps down by 22:00.
    Returns 0.2–1.0.
    """
    if hour < 6:
        return 0.2
    if hour < 10:
        return 0.2 + 0.8 * ((hour - 6) / 4)
    if hour < 16:
        return 1.0
    if hour < 22:
        return 1.0 - 0.8 * ((hour - 16) / 6)
    return 0.2


def poisson_event(lam: float) -> bool:
    """
    Return True with probability  1 - e^{-λ}  (one Poisson arrival per tick).
    Default λ ≈ 0.008 → ~0.8 % chance per tick.
    """
    return random.random() < (1 - math.exp(-lam))


def severity_from_volume(volume_liters: float) -> str:
    if volume_liters > 500:
        return "critical"
    if volume_liters > 100:
        return "major"
    return "minor"
