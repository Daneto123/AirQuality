import pandas as pd
import numpy as np
import requests
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from datetime import timedelta

# Function to fetch weather forecast data
def fetch_weather_data(lat, lon, api_key):
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    response = requests.get(url)
    if response.status_code == 200:
        weather_data = response.json()
        forecast_list = weather_data["list"]
        weather_df = pd.DataFrame([{
            "timestamp": pd.to_datetime(entry["dt"], unit="s"),
            "temperature": entry["main"]["temp"],
            "humidity": entry["main"]["humidity"]
        } for entry in forecast_list])
        return weather_df
    else:
        raise ValueError(f"Failed to fetch weather data: {response.status_code}, {response.text}")

# Load PM data
def nn_prediction():
    file_path = "../../influxDB/Data/drujba/2024/merged_data.json"
    df = pd.read_json(file_path)

    # Data preprocessing
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["pm10"] = pd.to_numeric(df["pm10"], errors="coerce")
    df["pm25"] = pd.to_numeric(df["pm25"], errors="coerce")

    df["day"] = df["timestamp"].dt.day
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["rolling_pm10"] = df["pm10"].rolling(window=3, min_periods=1).mean()
    df["rolling_pm25"] = df["pm25"].rolling(window=3, min_periods=1).mean()

    df = df.dropna()

    # Features and targets
    features = ["day", "hour", "day_of_week", "rolling_pm10", "rolling_pm25"]
    X = df[features]
    y_pm10 = df["pm10"]
    y_pm25 = df["pm25"]

    X_train, X_test, y_pm10_train, y_pm10_test, y_pm25_train, y_pm25_test = train_test_split(
        X, y_pm10, y_pm25, test_size=0.2, random_state=42
    )

    # Train MLPRegressor models
    model_pm10 = MLPRegressor(random_state=42, max_iter=1000)
    model_pm25 = MLPRegressor(random_state=42, max_iter=1000)

    model_pm10.fit(X_train, y_pm10_train)
    model_pm25.fit(X_train, y_pm25_train)

    # Evaluate models
    y_pm10_pred = model_pm10.predict(X_test)
    y_pm25_pred = model_pm25.predict(X_test)

    print("PM10 Model MSE:", mean_squared_error(y_pm10_test, y_pm10_pred))
    print("PM25 Model MSE:", mean_squared_error(y_pm25_test, y_pm25_pred))

    # Fetch weather data
    lat = 42.708
    lon = 23.278
    api_key = "REDACTED_API_KEY"
    weather_df = fetch_weather_data(lat, lon, api_key)

    # Predict future PM levels
    future_dates = weather_df["timestamp"]
    future_df = pd.DataFrame({
        "timestamp": future_dates,
        "day": future_dates.dt.day,
        "hour": future_dates.dt.hour,
        "day_of_week": future_dates.dt.dayofweek,
        "temperature": weather_df["temperature"],
        "humidity": weather_df["humidity"]
    })

    future_df["rolling_pm10"] = df["pm10"].iloc[-3:].mean()
    future_df["rolling_pm25"] = df["pm25"].iloc[-3:].mean()

    future_X = future_df[features]
    future_df["predicted_pm10"] = model_pm10.predict(future_X)
    future_df["predicted_pm25"] = model_pm25.predict(future_X)

    output_path = "../results/predicted_pm10_pm25_with_weather_nn.json"
    future_df[["timestamp", "temperature", "humidity", "predicted_pm10", "predicted_pm25"]].to_json(
        output_path, orient="records", date_format="iso"
    )

    print(f"Predictions saved to {output_path}")
    
    return future_df
    
    
if __name__ == "__main__":
    nn_prediction()
