# Example Profile Seed JSON

Development-only example derived from the initial project brief style. Replace with approved DIN/vendor tables before production use.

```json
[
  {
    "profileId": "cu_30_10_example",
    "materialId": "cu-etp-example",
    "standard": "DIN_43671",
    "dimensions": {
      "width_mm": 30,
      "thickness_mm": 10
    },
    "properties": {
      "crossSectionArea_mm2": 300,
      "perimeter_mm": 80,
      "massPerMeter_kg_m": 2.67
    },
    "ratings": {
      "currentAc_A": 710,
      "currentDc_A": 750,
      "referenceAmbient_C": 35,
      "referenceTempRise_K": 50,
      "referenceArrangement": "single_bar_free_air_example"
    },
    "metadata": {
      "datasetId": "profiles-example-v0",
      "title": "Development copper busbar profiles",
      "sourceType": "example-only",
      "sourceRef": "Initial specification example; verify before production use",
      "revision": "0.1.0",
      "reviewStatus": "draft",
      "notes": [
        "Not a complete DIN table.",
        "Use only for application development and UI testing."
      ]
    }
  }
]
```
