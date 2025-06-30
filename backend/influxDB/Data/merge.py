import os
import json

def merge_json_files(output_file):
    """
    Merge all JSON files in the same folder as this script into a single JSON file.

    :param output_file: Path for the output merged JSON file.
    """
    folder_path = os.path.dirname(os.path.abspath(__file__))
    merged_data = []

    # Iterate through all files in the folder
    for filename in os.listdir(folder_path):
        if filename.endswith('.json') and filename != output_file:
            file_path = os.path.join(folder_path, filename)
            
            try:
                # Open and load the JSON file
                with open(file_path, 'r', encoding='utf-8') as json_file:
                    data = json.load(json_file)

                    # Append the content of each file to the list
                    if isinstance(data, list):
                        merged_data.extend(data)
                    else:
                        merged_data.append(data)

            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from file {filename}: {e}")
            except Exception as e:
                print(f"Error processing file {filename}: {e}")

    # Write the merged data to the output file
    try:
        with open(os.path.join(folder_path, output_file), 'w', encoding='utf-8') as output_json_file:
            json.dump(merged_data, output_json_file, indent=4, ensure_ascii=False)
        print(f"Merged JSON data has been saved to {output_file}")
    except Exception as e:
        print(f"Error writing to output file: {e}")

# Example usage
if __name__ == "__main__":
    output_file = input("Enter the name for the output merged JSON file: ").strip()

    merge_json_files(output_file)
