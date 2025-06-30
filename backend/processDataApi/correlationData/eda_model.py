import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import json

# Load the data into a DataFrame
data = []  # Replace with your JSON data or load from a file

with open('./all_data.json', 'r') as file:
    # Load its content
    data = json.load(file)
    
df = pd.DataFrame(data)

# Ensure numeric columns are properly typed
df["temperature"] = pd.to_numeric(df["temperature"], errors='coerce')
df["humidity"] = pd.to_numeric(df["humidity"], errors='coerce')
df["pm10"] = pd.to_numeric(df["pm10"], errors='coerce')
df["pm25"] = pd.to_numeric(df["pm25"], errors='coerce')

if df["timestamp"].dtype == "object":
    df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce")

# Ако `timestamp` вече е datetime, не правим нищо
if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
    if df["timestamp"].max() > 1e10:  # Ако е над 10 милиарда, значи е в ms
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    else:  # Ако е по-малко, значи е в секунди
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")

# df["timestamp_numeric"] = df["timestamp"].map(datetime.timestamp)

# Calculate correlation coefficients for pm10
temperature_pm10_corr = df["temperature"].corr(df["pm10"])
humidity_pm10_corr = df["humidity"].corr(df["pm10"])
timestamp_pm10_corr = df["timestamp"].corr(df["pm10"])

# Calculate correlation coefficients for pm25
temperature_pm25_corr = df["temperature"].corr(df["pm25"])
humidity_pm25_corr = df["humidity"].corr(df["pm25"])
timestamp_pm25_corr = df["timestamp"].corr(df["pm25"])

print(f"Correlation between Temperature and PM10: {temperature_pm10_corr}")
print(f"Correlation between Humidity and PM10: {humidity_pm10_corr}")
print(f"Correlation between Timestamp and PM10: {timestamp_pm10_corr}")

print(f"Correlation between Temperature and PM25: {temperature_pm25_corr}")
print(f"Correlation between Humidity and PM25: {humidity_pm25_corr}")
print(f"Correlation between Timestamp and PM25: {timestamp_pm25_corr}")

# Create scatter plots with regression lines
sns.set(style="whitegrid")

# # Plot: Temperature vs PM10
# plt.figure(figsize=(10, 5))
# sns.regplot(x="temperature", y="pm10", data=df, scatter_kws={'alpha':0.5}, line_kws={"color": "red"})
# plt.title(f"temperature vs pm10 (correlation: {temperature_pm10_corr:.2f})")
# plt.xlabel("temperature")
# plt.ylabel("pm10")
# plt.show()

# # Plot: Humidity vs PM10
# plt.figure(figsize=(10, 5))
# sns.regplot(x="humidity", y="pm10", data=df, scatter_kws={'alpha':0.5}, line_kws={"color": "red"})
# plt.title(f"Humidity vs PM10 (Correlation: {humidity_pm10_corr:.2f})")
# plt.xlabel("Humidity")
# plt.ylabel("PM10")
# plt.show()

# # Plot: Timestamp vs PM10
# plt.figure(figsize=(12, 6))
# sns.scatterplot(x="timestamp", y="pm10", data=df, alpha=0.5)
# plt.title("Timestamp vs PM10")
# plt.xlabel("Timestamp")
# plt.ylabel("PM10")
# plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
# plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
# plt.xticks(rotation=45)
# plt.tight_layout()
# plt.show()

# Plot: Temperature vs PM25
plt.figure(figsize=(10, 5))
sns.regplot(x="temperature", y="pm25", data=df, scatter_kws={'alpha':0.5}, line_kws={"color": "red"})
plt.title(f"Temperature vs PM25 (Correlation: {temperature_pm25_corr:.2f})")
plt.xlabel("Temperature")
plt.ylabel("PM25")
plt.show()

# Plot: Humidity vs PM25
plt.figure(figsize=(10, 5))
sns.regplot(x="humidity", y="pm25", data=df, scatter_kws={'alpha':0.5}, line_kws={"color": "red"})
plt.title(f"Humidity vs PM25 (Correlation: {humidity_pm25_corr:.2f})")
plt.xlabel("Humidity")
plt.ylabel("PM25")
plt.show()

# Plot: Timestamp vs PM25
plt.figure(figsize=(12, 6))
sns.scatterplot(x="timestamp", y="pm25", data=df, alpha=0.5)
plt.title("Timestamp vs PM25")
plt.xlabel("Timestamp")
plt.ylabel("PM25")
plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()