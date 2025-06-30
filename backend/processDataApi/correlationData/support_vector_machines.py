import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.svm import SVR
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error
from datetime import datetime
import json

# Зареждане на данните от JSON файл
with open('./all_data.json', 'r') as file:
    data = json.load(file)

df = pd.DataFrame(data)

# Преобразуване и почистване на данните
df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
df['pm10'] = pd.to_numeric(df['pm10'], errors='coerce')
df['pm25'] = pd.to_numeric(df['pm25'], errors='coerce')
df.dropna(subset=['timestamp', 'pm10', 'pm25'], inplace=True)

# Преобразуване на timestamp в Unix време (секунди)
df['timestamp_numeric'] = df['timestamp'].astype('int64') // 10**9

# Добавяне на синусоидални трансформации за цикличност
periods = {"12_hours": 12 * 3600, "24_hours": 24 * 3600, "48_hours": 48 * 3600}
for period_name, period_seconds in periods.items():
    df[f"sin_{period_name}"] = np.sin(2 * np.pi * df["timestamp_numeric"] / period_seconds)
    df[f"cos_{period_name}"] = np.cos(2 * np.pi * df["timestamp_numeric"] / period_seconds)

# Подготовка на входните характеристики
features = ["sin_12_hours", "cos_12_hours", "sin_24_hours", "cos_24_hours", "sin_48_hours", "cos_48_hours"]
X = df[features]

# Целеви променливи
y_pm10 = df['pm10']
y_pm25 = df['pm25']

# Разделяне на данните на обучаващ и тестов набор
X_train, X_test, y_pm10_train, y_pm10_test, y_pm25_train, y_pm25_test = train_test_split(X, y_pm10, y_pm25, test_size=0.2, random_state=42)

# Нормализация на данните
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Обучение на SVM модели
svr_pm10 = SVR(kernel='rbf', C=100, gamma=0.1)
svr_pm25 = SVR(kernel='rbf', C=100, gamma=0.1)
svr_pm10.fit(X_train_scaled, y_pm10_train)
svr_pm25.fit(X_train_scaled, y_pm25_train)

# Предсказване и оценка
pred_pm10 = svr_pm10.predict(X_test_scaled)
pred_pm25 = svr_pm25.predict(X_test_scaled)
print("PM10 MSE:", mean_squared_error(y_pm10_test, pred_pm10))
print("PM25 MSE:", mean_squared_error(y_pm25_test, pred_pm25))

# Визуализация на резултатите
plt.figure(figsize=(10, 5))
sns.scatterplot(x=y_pm10_test, y=pred_pm10, alpha=0.5, label='PM10 Predictions')
plt.plot([y_pm10_test.min(), y_pm10_test.max()], [y_pm10_test.min(), y_pm10_test.max()], 'r--')
plt.xlabel("Истински PM10")
plt.ylabel("Предсказан PM10")
plt.title("SVM PM10 Предсказания")
plt.legend()
plt.show()