import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns
import json

# Зареждане на данните
with open('./all_data.json', 'r') as file:
    data = json.load(file)

df = pd.DataFrame(data)

# Преобразуване на колони в числови
df["temperature"] = pd.to_numeric(df["temperature"], errors='coerce')
df["humidity"] = pd.to_numeric(df["humidity"], errors='coerce')
df["pm10"] = pd.to_numeric(df["pm10"], errors='coerce')
df["pm25"] = pd.to_numeric(df["pm25"], errors='coerce')

# Премахване на липсващи стойности
df = df.dropna(subset=["temperature", "humidity", "pm10", "pm25"])

# Избор на числови колони за PCA
features = ["temperature", "humidity", "pm10", "pm25"]

# Стандартизиране на данните (много важно за PCA)
scaler = StandardScaler()
scaled_data = scaler.fit_transform(df[features])

# Прилагане на PCA
pca = PCA(n_components=2)  # Намаляване до 2 главни компоненти
principal_components = pca.fit_transform(scaled_data)

# Създаване на DataFrame за главните компоненти
pca_df = pd.DataFrame(data=principal_components, columns=["PC1", "PC2"])

# Добавяне на компонентите към оригиналните данни за визуализация
df_pca = pd.concat([df.reset_index(drop=True), pca_df], axis=1)

# Обяснена вариация
explained_variance = pca.explained_variance_ratio_
print(f"Обяснена вариация: PC1 = {explained_variance[0]:.2f}, PC2 = {explained_variance[1]:.2f}")

# Визуализация на резултатите
plt.figure(figsize=(10, 7))
sns.scatterplot(data=df_pca, x="PC1", y="PC2", alpha=0.7, hue="pm10", palette="viridis")
plt.title("PCA: Проекция върху първите две главни компоненти")
plt.xlabel(f"PC1 ({explained_variance[0]*100:.1f}% вариация)")
plt.ylabel(f"PC2 ({explained_variance[1]*100:.1f}% вариация)")
plt.show()
