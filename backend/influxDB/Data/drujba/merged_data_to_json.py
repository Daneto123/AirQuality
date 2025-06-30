import os
import csv
import json

def process_and_merge_files(directory_path, output_json_file):
    sbs011_data = []
    timestamps_sbs011 = set()

    # Step 1: Process _sbs011 files
    sbs011_files = sorted([f for f in os.listdir(directory_path) if '_sds011' in f])
    print("Detected _sbs011 files:", sbs011_files)

    for sbs011_file in sbs011_files:
        sbs011_path = os.path.join(directory_path, sbs011_file)
        with open(sbs011_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file, delimiter=';')
            for row in csv_reader:
                sbs011_data.append(row)
                timestamps_sbs011.add(row['timestamp'])
    
    print("Timestamps in _sbs011 files:", timestamps_sbs011)

    # Step 2: Process _bme280 files
    bme280_files = sorted([f for f in os.listdir(directory_path) if '_bme280' in f])
    print("Detected _bme280 files:", bme280_files)

    bme280_data = {}
    for bme280_file in bme280_files:
        bme280_path = os.path.join(directory_path, bme280_file)
        with open(bme280_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file, delimiter=';')
            for row in csv_reader:
                timestamp = row['timestamp']
                if timestamp in timestamps_sbs011:
                    print(f"Match found: {timestamp}")
                    bme280_data[timestamp] = {
                        'temperature': row['temperature'],
                        'humidity': row['humidity']
                    }

    # Step 3: Merge data
    for entry in sbs011_data:
        timestamp = entry['timestamp']
        if timestamp in bme280_data:
            entry.update(bme280_data[timestamp])
    
    # Step 4: Save to JSON
    print("Final merged data:", sbs011_data)
    with open(output_json_file, mode='w', encoding='utf-8') as json_file:
        json.dump(sbs011_data, json_file, indent=4)

    print(f"Data merged and saved to {output_json_file}.")

# Specify the directory containing the files
directory_path = './'  # Replace with the actual path
output_json_file = 'merged_data.json'

# Run the processing function
process_and_merge_files(directory_path, output_json_file)
