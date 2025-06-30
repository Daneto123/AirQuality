import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error

# Зареждане на оригиналните и предсказателните файлове
original_file = "histocial_prediction_merged_data.json"
lr_file = "historical_pm10_pm25_with_weather_lr.json"
nn_file = "historical_pm10_pm25_with_weather_nn.json"
rf_file = "historical_pm10_pm25_with_weather_rf.json"

original_data = pd.read_json(original_file)
lr_data = pd.read_json(lr_file)
nn_data = pd.read_json(nn_file)
rf_data = pd.read_json(rf_file)

# Конвертиране на timestamp и осредняване по часове
original_data["timestamp"] = pd.to_datetime(original_data["timestamp"])
original_data.set_index("timestamp", inplace=True)
original_hourly = original_data.resample("h").mean()

# Подготовка на предсказателните данни
lr_data["timestamp"] = pd.to_datetime(lr_data["timestamp"])
nn_data["timestamp"] = pd.to_datetime(nn_data["timestamp"])
rf_data["timestamp"] = pd.to_datetime(rf_data["timestamp"])

lr_data.set_index("timestamp", inplace=True)
nn_data.set_index("timestamp", inplace=True)
rf_data.set_index("timestamp", inplace=True)

# Debug: Печат на обхватите
print("Original data range:", original_hourly.index.min(), "до", original_hourly.index.max())
print("LR data range:", lr_data.index.min(), "до", lr_data.index.max())
print("NN data range:", nn_data.index.min(), "до", nn_data.index.max())
print("RF data range:", rf_data.index.min(), "до", rf_data.index.max())

# Проверка за нужните колони
if "pm10" not in original_hourly.columns or "pm25" not in original_hourly.columns:
    raise ValueError("Оригиналният файл трябва да съдържа колони 'pm10' и 'pm25'")

# Обединяване по timestamp
comparison = original_hourly.join(lr_data, how="inner", rsuffix="_lr").rename(columns={
    "predicted_pm10": "predicted_pm10_lr",
    "predicted_pm25": "predicted_pm25_lr"
})
comparison = comparison.join(nn_data, how="inner", rsuffix="_nn").rename(columns={
    "predicted_pm10": "predicted_pm10_nn",
    "predicted_pm25": "predicted_pm25_nn"
})
comparison = comparison.join(rf_data, how="inner", rsuffix="_rf").rename(columns={
    "predicted_pm10": "predicted_pm10_rf",
    "predicted_pm25": "predicted_pm25_rf"
})

# Проверка дали има данни за сравнение
if comparison.empty:
    print("\n❌ Няма съвпадение между оригиналните и предсказаните данни по timestamp.")
    print("Увери се, че файловете съдържат данни за едни и същи дати/часове.")
else:
    print("\n✅ Намерени съвпадения:", comparison.shape[0], "часа")
    results = {}
    for model in ["lr", "nn", "rf"]:
        mse_pm10 = mean_squared_error(comparison["pm10"], comparison[f"predicted_pm10_{model}"])
        rmse_pm10 = np.sqrt(mse_pm10)
        mae_pm10 = mean_absolute_error(comparison["pm10"], comparison[f"predicted_pm10_{model}"])

        mse_pm25 = mean_squared_error(comparison["pm25"], comparison[f"predicted_pm25_{model}"])
        rmse_pm25 = np.sqrt(mse_pm25)
        mae_pm25 = mean_absolute_error(comparison["pm25"], comparison[f"predicted_pm25_{model}"])

        results[model] = {
            "mse_pm10": mse_pm10,
            "rmse_pm10": rmse_pm10,
            "mae_pm10": mae_pm10,
            "mse_pm25": mse_pm25,
            "rmse_pm25": rmse_pm25,
            "mae_pm25": mae_pm25
        }

    # Отпечатване на резултатите
    for model, metrics in results.items():
        print(f"\n📊 Results for {model.upper()} Model:")
        print(f"  PM10 - MSE: {metrics['mse_pm10']:.4f}, RMSE: {metrics['rmse_pm10']:.4f}, MAE: {metrics['mae_pm10']:.4f}")
        print(f"  PM25 - MSE: {metrics['mse_pm25']:.4f}, RMSE: {metrics['rmse_pm25']:.4f}, MAE: {metrics['mae_pm25']:.4f}")
