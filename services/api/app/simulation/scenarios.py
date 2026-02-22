"""
Pre-built simulation scenarios.

Each scenario is a list of steps: { delay_ticks, mutations, name? }
Mutations are applied to WorldState attributes.
"""

SCENARIOS = {
    "normal_operations": {
        "description": "Steady-state normal operations — no faults injected.",
        "steps": [
            {
                "name": "normal_operations",
                "delay_ticks": 0,
                "mutations": {
                    "force_leak": False,
                    "force_valve_fault": False,
                    "force_camera_offline": False,
                    "shutdown_active": False,
                    "leak_lambda": 0.008,
                    "weather_factor": 1.0,
                },
            },
        ],
    },
    "cascade_failure": {
        "description": "Leak triggers pressure drop, valve fault, then incident cascade.",
        "steps": [
            {
                "name": "cascade_failure",
                "delay_ticks": 0,
                "mutations": {"leak_lambda": 0.5, "force_leak": True},
            },
            {
                "delay_ticks": 3,
                "mutations": {"force_valve_fault": True},
            },
            {
                "delay_ticks": 6,
                "mutations": {"force_camera_offline": True, "weather_factor": 0.4},
            },
            {
                "delay_ticks": 12,
                "mutations": {
                    "force_leak": False,
                    "force_valve_fault": False,
                    "force_camera_offline": False,
                    "leak_lambda": 0.008,
                    "weather_factor": 0.8,
                },
            },
        ],
    },
    "maintenance_window": {
        "description": "Planned maintenance — valves go offline one at a time.",
        "steps": [
            {
                "name": "maintenance_window",
                "delay_ticks": 0,
                "mutations": {"operational_load": 0.3, "force_valve_fault": True},
            },
            {
                "delay_ticks": 10,
                "mutations": {"force_valve_fault": False, "operational_load": 0.5},
            },
            {
                "delay_ticks": 20,
                "mutations": {"operational_load": 0.9},
            },
        ],
    },
    "emergency_shutdown": {
        "description": "Emergency shutdown — all systems ramp down rapidly.",
        "steps": [
            {
                "name": "emergency_shutdown",
                "delay_ticks": 0,
                "mutations": {
                    "shutdown_active": True,
                    "operational_load": 0.05,
                    "force_leak": True,
                    "leak_lambda": 0.8,
                },
            },
            {
                "delay_ticks": 4,
                "mutations": {"force_valve_fault": True, "force_camera_offline": True},
            },
            {
                "delay_ticks": 15,
                "mutations": {
                    "shutdown_active": False,
                    "force_leak": False,
                    "force_valve_fault": False,
                    "force_camera_offline": False,
                    "operational_load": 0.2,
                    "leak_lambda": 0.008,
                },
            },
        ],
    },
    "bad_weather": {
        "description": "Severe weather reduces visibility and increases failure rates.",
        "steps": [
            {
                "name": "bad_weather",
                "delay_ticks": 0,
                "mutations": {"weather_factor": 0.3, "leak_lambda": 0.04},
            },
            {
                "delay_ticks": 20,
                "mutations": {"weather_factor": 0.7, "leak_lambda": 0.015},
            },
            {
                "delay_ticks": 40,
                "mutations": {"weather_factor": 1.0, "leak_lambda": 0.008},
            },
        ],
    },
}


def get_scenario(name: str) -> dict:
    return SCENARIOS.get(name, {})


def list_scenarios() -> list:
    return [
        {"name": k, "description": v["description"]}
        for k, v in SCENARIOS.items()
    ]
