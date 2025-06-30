import pandas as pd
import numpy as np
import requests
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from datetime import datetime
import http.client
import json

# Function to fetch historical weather data from Meteostat API
def fetch_open_meteo_historical(lat, lon, start_date, end_date):
    url = "https://archive-api.open-meteo.com/v1/era5"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "temperature_2m,relative_humidity_2m",  # Температура и влажност
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()  # Проверка за HTTP грешки
    
    data = response.json()
    # Конвертиране на hourly данни в DataFrame
    hourly_data = data.get("hourly", {})
    if "time" in hourly_data and "temperature_2m" in hourly_data and "relative_humidity_2m" in hourly_data:
        df = pd.DataFrame({
            "timestamp": hourly_data["time"],
            "temperature": hourly_data["temperature_2m"],
            "humidity": hourly_data["relative_humidity_2m"],
        })
        df["timestamp"] = pd.to_datetime(df["timestamp"])  # Превръщане в datetime
        return df
    else:
        raise ValueError("Expected data fields not found in the response")

# Load PM data
file_path = "../../influxDB/Data/drujba/2024/merged_data.json"  # Path to the JSON file
df = pd.read_json(file_path)

# Ensure numeric columns are properly typed
df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce", utc=True)
df["pm10"] = pd.to_numeric(df["pm10"], errors="coerce")
df["pm25"] = pd.to_numeric(df["pm25"], errors="coerce")

# Feature Engineering
df["day"] = df["timestamp"].dt.day
df["hour"] = df["timestamp"].dt.hour
df["day_of_week"] = df["timestamp"].dt.dayofweek
df["rolling_pm10"] = df["pm10"].rolling(window=3, min_periods=1).mean()
df["rolling_pm25"] = df["pm25"].rolling(window=3, min_periods=1).mean()

# Drop rows with missing values after rolling
df = df.dropna()

# Define Features (X) and Targets (y)
features = ["day", "hour", "day_of_week", "rolling_pm10", "rolling_pm25"]
X = df[features]
y_pm10 = df["pm10"]
y_pm25 = df["pm25"]

# Train-Test Split
X_train, X_test, y_pm10_train, y_pm10_test, y_pm25_train, y_pm25_test = train_test_split(
    X, y_pm10, y_pm25, test_size=0.2, random_state=42
)

# Train Linear Regression Models
model_pm10 = LinearRegression()
model_pm25 = LinearRegression()

model_pm10.fit(X_train, y_pm10_train)
model_pm25.fit(X_train, y_pm25_train)

# Evaluate Models
y_pm10_pred = model_pm10.predict(X_test)
y_pm25_pred = model_pm25.predict(X_test)

print("PM10 Model MSE:", mean_squared_error(y_pm10_test, y_pm10_pred))
print("PM25 Model MSE:", mean_squared_error(y_pm25_test, y_pm25_pred))

# Fetch historical weather data
start_date = "2024-12-07"  # Start date for historical data
end_date = "2024-12-09"    # End date for historical data
lat = 42.708  # Replace with your latitude
lon = 23.278  # Replace with your longitude

historical_weather_df = fetch_open_meteo_historical(lat, lon, start_date, end_date)

# Merge weather data with PM10 and PM25 predictions
historical_weather_df["day"] = historical_weather_df["timestamp"].dt.day
historical_weather_df["hour"] = historical_weather_df["timestamp"].dt.hour
historical_weather_df["day_of_week"] = historical_weather_df["timestamp"].dt.dayofweek

# Use the last rolling averages for predictions
historical_weather_df["rolling_pm10"] = df["pm10"].iloc[-3:].mean()
historical_weather_df["rolling_pm25"] = df["pm25"].iloc[-3:].mean()

historical_X = historical_weather_df[features]
historical_weather_df["predicted_pm10"] = model_pm10.predict(historical_X)
historical_weather_df["predicted_pm25"] = model_pm25.predict(historical_X)

# Save Predictions to JSON
output_path = "../results/predicted_pm10_pm25_with_weather_lr.json"
historical_weather_df[["timestamp", "temperature", "humidity", "predicted_pm10", "predicted_pm25"]].to_json(
    output_path, orient="records", date_format="iso"
)
print(f"Predictions with historical weather data saved to {output_path}")
