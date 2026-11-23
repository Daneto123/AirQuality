import os
from pathlib import Path

script_dir = Path(__file__).resolve().parent

api_key = os.environ.get("OPENWEATHER_API_KEY")
output_path = script_dir / "../results/daily_predictions.json"
model_pm10_path = script_dir / "../results/model_pm10.joblib"
model_pm25_path = script_dir / "../results/model_pm25.joblib"

def set_api_key(new_key):
    """
    Sets the global API key.
    """
    global api_key
    api_key = new_key

def get_api_key():
    """
    Gets the current global API key.
    """
    if api_key is None:
        raise ValueError("API Key has not been set.")
    return api_key

def get_file_path():
    """
    Gets the current file path.
    """
    if file_path is None:
        raise ValueError("API Key has not been set.")
    return file_path

def get_output_path():
    """
    Gets the current output file path.
    """
    if output_path is None:
        raise ValueError("API Key has not been set.")
    return output_path

def get_model_pm10_path():
    """
    Gets the current model knowledge file output for pm10.
    """
    if model_pm10_path is None:
        raise ValueError("API Key has not been set.")
    return model_pm10_path

def get_model_pm25_path():
    """
    Gets the current model knowledge file output for pm25.
    """
    if model_pm25_path is None:
        raise ValueError("API Key has not been set.")
    return model_pm25_path