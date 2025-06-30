import os
import csv
import json

def convert_and_concatenate_csvs(directory_path, output_json_file):
    # Get a list of all CSV files in the directory
    csv_files = sorted([f for f in os.listdir(directory_path) if f.endswith('.csv')])
    
    all_data = []  # To store data from all files
    
    # Process each CSV file
    for csv_file in csv_files:
        csv_path = os.path.join(directory_path, csv_file)
        with open(csv_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file, delimiter=';')  # Use ; as the delimiter
            
            # Add the contents of the CSV file to the list
            all_data.extend(row for row in csv_reader)
    
    # Write the combined data to a JSON file
    with open(output_json_file, mode='w', encoding='utf-8') as json_file:
        json.dump(all_data, json_file, indent=4)
    
    print(f"All CSV files in {directory_path} have been combined and saved as {output_json_file}.")

# Specify the directory containing the CSV files and the output JSON file path
directory_path = './'  # Replace with the path to the directory containing your CSV files
output_json_file = 'combined_data.json'  # Replace with the desired JSON file name

# Convert and concatenate the CSV files
convert_and_concatenate_csvs(directory_path, output_json_file)
