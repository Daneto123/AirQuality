# Training data

The forecasting models are trained on historical PM2.5/PM10 readings from public
[Sensor.Community](https://sensor.community/) sensors (SDS011 particulate matter and BME280
temperature/humidity) in Sofia.

This repository keeps one sample dataset, which the models read by default:

- `drujba/2024/data_day_by_day/` – raw daily CSV exports for October–December 2024
- `drujba/2024/merged_data.json` – the same data merged into one JSON file

The full 2022–2024 dataset for the Drujba, Centur and Zapaden Park areas (~600 MB) was removed
to keep the repository small. To rebuild it, download the daily CSV files for the sensors you
need from the [Sensor.Community archive](https://archive.sensor.community/) and run the scripts
in this folder:

| Script | What it does |
| --- | --- |
| `convert_to_json.py` | Converts the daily CSV files in its folder into one JSON file |
| `merged_data_to_json.py` | Merges particulate matter and weather readings by timestamp |
| `merge.py` | Combines all JSON files in its folder into one file |
