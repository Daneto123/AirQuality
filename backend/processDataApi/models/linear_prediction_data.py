import pandas as pd
import numpy as np
import requests
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from joblib import dump, load
from flask import jsonify
import os
import logging
from .config import get_api_key, get_model_pm10_path, get_model_pm25_path, get_output_path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Function to fetch weather forecast data from OpenWeatherMap API
def fetch_weather_data(lat, lon, api_key):
    # Fetch weather data
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    response = requests.get(url)
    
    if response.status_code == 200:
        weather_data = response.json()
        forecast_list = weather_data["list"]
        
        # Extract data into a DataFrame
        df = pd.DataFrame([
            {
                "timestamp": pd.to_datetime(entry["dt"], unit="s"),
                "temperature": entry["main"]["temp"],
                "humidity": entry["main"]["humidity"]
            } for entry in forecast_list
        ])
        
        # Set the timestamp as the index for interpolation
        df.set_index("timestamp", inplace=True)
        
        # Create a new hourly index
        hourly_index = pd.date_range(start=df.index.min(), periods=5*24, freq="1h")
        
        # Reindex the DataFrame to the hourly index and interpolate
        df_hourly = df.reindex(hourly_index).interpolate(method="time")
        
        # Reset the index with explicit naming
        df_hourly = df_hourly.reset_index(names="timestamp")
        logger.info(f"Processed Weather DataFrame: {df_hourly.head()}")
        return df_hourly
    else:
        raise ValueError(f"Failed to fetch weather data: {response.status_code}, {response.text}")

# Function to preprocess historical PM data
def preprocess_pm_data(df):
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce", utc=True)
    df["pm10"] = pd.to_numeric(df["pm10"], errors="coerce")
    df["pm25"] = pd.to_numeric(df["pm25"], errors="coerce")
    df["day"] = df["timestamp"].dt.day
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["rolling_pm10"] = df["pm10"].rolling(window=3, min_periods=1).mean()
    df["rolling_pm25"] = df["pm25"].rolling(window=3, min_periods=1).mean()

    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce', utc=True)

    if 'timestamp' not in df.columns:
        logger.error("Missing 'timestamp' column.")
        raise ValueError("Missing 'timestamp' column.")

    return df.dropna()

# Function to train and save models
def train_and_save_models(X, y_pm10, y_pm25, model_pm10_path, model_pm25_path):
    if X.shape[0] > 0:
        X_train, X_test, y_pm10_train, y_pm10_test, y_pm25_train, y_pm25_test = train_test_split(
            X, y_pm10, y_pm25, test_size=0.2, random_state=42
        )

        # Train models
        model_pm10 = LinearRegression().fit(X_train, y_pm10_train)
        model_pm25 = LinearRegression().fit(X_train, y_pm25_train)

        # Evaluate the models
        print("PM10 Model MSE:", mean_squared_error(y_pm10_test, model_pm10.predict(X_test)))
        print("PM25 Model MSE:", mean_squared_error(y_pm25_test, model_pm25.predict(X_test)))

        # Save the models
        dump(model_pm10, 'model_pm10.joblib')
        dump(model_pm25, 'model_pm25.joblib')
    else:
        print("Not enough data to proceed with model training.")

# Function to load saved models
def load_models(model_pm10_path, model_pm25_path):
    model_pm10 = load(model_pm10_path)
    model_pm25 = load(model_pm25_path)
    logger.info(f"Models loaded from {model_pm10_path} and {model_pm25_path}")
    return model_pm10, model_pm25

# Function to predict future pollution levels
def daily_prediction(api_key, df, model_pm10, model_pm25, output_path):
    try:
        # Ensure lat/lon are numeric and drop rows with NaN lat/lon
        df[['lat', 'lon']] = df[['lat', 'lon']].apply(pd.to_numeric, errors='coerce')
        df = df.dropna(subset=['lat', 'lon'])

        # Create an empty list to store all predictions
        all_predictions = []

        # Iterate over each unique lat, lon pair
        for lat, lon in df[['lat', 'lon']].drop_duplicates().values:
            logger.info(f"Processing data for lat: {lat}, lon: {lon}")

            # Fetch new weather data for each lat/lon pair
            weather_df = fetch_weather_data(lat, lon, api_key)
            logger.info(f"Weather DataFrame columns: {weather_df.columns}")

            if "timestamp" not in weather_df.columns:
                raise ValueError("Missing 'timestamp' column in weather_df.")

            # Filter the data for this specific lat/lon combination
            df_for_lat_lon = df[(df['lat'] == lat) & (df['lon'] == lon)]

            # Prepare the future DataFrame for predictions
            future_df = pd.DataFrame({
                "timestamp": weather_df["timestamp"],
                "day": weather_df["timestamp"].dt.day,
                "hour": weather_df["timestamp"].dt.hour,
                "day_of_week": weather_df["timestamp"].dt.dayofweek,
                "temperature": weather_df["temperature"],
                "humidity": weather_df["humidity"],
                "rolling_pm10": df_for_lat_lon["pm10"].iloc[-3:].mean(),  # Rolling mean of pm10
                "rolling_pm25": df_for_lat_lon["pm25"].iloc[-3:].mean(),  # Rolling mean of pm25
                "lat": lat,  # Include lat
                "lon": lon   # Include lon
            })

            # Model Predictions
            future_df["predicted_pm10"] = model_pm10.predict(
                future_df[["day", "hour", "day_of_week", "rolling_pm10", "rolling_pm25"]]
            )
            future_df["predicted_pm25"] = model_pm25.predict(
                future_df[["day", "hour", "day_of_week", "rolling_pm10", "rolling_pm25"]]
            )

            # Append predictions including lat/lon
            all_predictions.append(future_df[["timestamp", "temperature", "humidity", "lat", "lon", "predicted_pm10", "predicted_pm25"]])

        # Concatenate all predictions into a single DataFrame
        all_predictions_df = pd.concat(all_predictions, ignore_index=True)

        # Save predictions to JSON
        all_predictions_df.to_json(output_path, orient="records", date_format="iso")
        logger.info(f"Daily predictions saved to {output_path}")
        
        return all_predictions_df

    except Exception as e:
        logger.error(f"Error in daily_prediction: {e}")
        raise ValueError("Error in daily_prediction.")

# Main function
def lr_prediction(df):
    api_key = get_api_key()  # Ensure this environment variable is set
    output_path = get_output_path()
    model_pm10_path = get_model_pm10_path()
    model_pm25_path = get_model_pm25_path()

    # Step 1: Train and save models (Run this only once or when retraining is needed)
    # df_train = preprocess_pm_data(df)
    # X = df_train[["day", "hour", "day_of_week", "rolling_pm10", "rolling_pm25"]]
    # train_and_save_models(X, df_train["pm10"], df_train["pm25"], model_pm10_path, model_pm25_path)

    # Step 2: Load models and make daily predictions
    model_pm10, model_pm25 = load_models(model_pm10_path, model_pm25_path)
    predictions = daily_prediction(api_key, df, model_pm10, model_pm25, output_path)
    # print(predictions)

    response_data = predictions.to_json(orient='records')

    return jsonify(response_data)
