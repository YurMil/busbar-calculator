# Example Materials JSON

Development-only example. Replace with approved data before production use.

```json
[
  {
    "id": "cu-etp-example",
    "label": "Copper ETP Example",
    "family": "copper",
    "resistivity20_ohm_m": 1.724e-8,
    "conductivityPercentIACS": 100,
    "temperatureCoefficient_1_per_K": 0.00393,
    "density_kg_m3": 8900,
    "heatCapacity_J_kgK": 385,
    "emissivity": {
      "default": 0.5,
      "oxidized": 0.7,
      "tinned": 0.25,
      "painted": 0.9
    },
    "allowableContinuousTemp_C": 105,
    "allowableStress_MPa": 120,
    "shortCircuit": {
      "k_A_sqrt_s_per_mm2": 143,
      "initialTemp_C": 30,
      "finalTemp_C": 250,
      "sourceRef": "Example only; verify with project standard"
    },
    "metadata": {
      "datasetId": "materials-example-v0",
      "title": "Development material constants",
      "sourceType": "example-only",
      "sourceRef": "Engineering example values",
      "revision": "0.1.0",
      "reviewStatus": "draft",
      "notes": ["Do not use for final design release without approval."]
    }
  }
]
```
