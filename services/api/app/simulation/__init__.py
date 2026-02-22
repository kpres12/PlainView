"""
Plainview Simulation Layer

Provides coherent, temporally consistent simulated data for all domain modules.
Replaces raw random.random() calls with a centralized world-state engine.
"""

from app.simulation.engine import SimulationEngine, sim_engine

__all__ = ["SimulationEngine", "sim_engine"]
