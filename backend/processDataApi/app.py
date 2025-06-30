import json
import os
import requests
import aiohttp
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import httpx
import logging
from flask import Flask, request, jsonify
from datetime import datetime
from sklearn.preprocessing import MinMaxScaler
from models.linear_prediction_data import lr_prediction
from flask_cors import CORS


app = Flask(__name__)

CORS(app)

models = {}

@app.route('/getPrediction', methods=['GET'])
async def train_models():

    with open('../influxDB/Data/all_data.json', 'r') as f:
        data = json.load(f)
    # data = await fetch_data()

    # print(data)

    # Check if data is empty
    if not data:
        return jsonify({"error": "Data file is empty."}), 400

    # Convert the data to a DataFrame
    df = pd.DataFrame(data)
    df = df.drop(columns=['sensor_id'], errors='ignore')
    df.columns = df.columns.str.strip().str.lower()
    # print("Columns in DataFrame:", df.columns.tolist())

    if df["timestamp"].dtype == "object":
        df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce")

    # Ако `timestamp` вече е datetime, не правим нищо
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        if df["timestamp"].max() > 1e10:  # Ако е над 10 милиарда, значи е в ms
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        else:  # Ако е по-малко, значи е в секунди
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")

    # If the resulting DataFrame is empty, log a message and return error
    if len(df) == 0:
        logging.error("After timestamp conversion and data cleaning, the DataFrame is empty.")
        return jsonify({"error": "No valid data available after timestamp conversion."}), 400

    # Reset index if 'timestamp' is the index
    df = df.reset_index(drop=True)
    
    # Convert relevant columns to numeric
    numeric_columns = ['humidity', 'temperature', 'pm10', 'pm25', 'lat', 'lon', 'pressure']
    df[numeric_columns] = df[numeric_columns].apply(pd.to_numeric, errors='coerce')

    df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].median())

    if df.empty:
        return jsonify({"error": "No valid data after preprocessing."}), 400
    
    models = lr_prediction(df)

    return models

async def fetch_data():
    async with httpx.AsyncClient() as client:
        response = await client.get('http://localhost:3060/metricsLastDayFile')
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error fetching data: {response.status_code}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
