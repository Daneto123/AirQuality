// Изчисляване на AQI на база концентрация
function calculateAQI(concentration, pollutant) {
    const breakpoints = {
        "PM2.5": [
            { C_low: 0.0, C_high: 12.0, I_low: 0, I_high: 50 },
            { C_low: 12.1, C_high: 35.4, I_low: 51, I_high: 100 },
            { C_low: 35.5, C_high: 55.4, I_low: 101, I_high: 150 },
            { C_low: 55.5, C_high: 150.4, I_low: 151, I_high: 200 },
            { C_low: 150.5, C_high: 250.4, I_low: 201, I_high: 300 },
            { C_low: 250.5, C_high: 500.4, I_low: 301, I_high: 500 }
        ],
        "PM10": [
            { C_low: 0, C_high: 54, I_low: 0, I_high: 50 },
            { C_low: 55, C_high: 154, I_low: 51, I_high: 100 },
            { C_low: 155, C_high: 254, I_low: 101, I_high: 150 },
            { C_low: 255, C_high: 354, I_low: 151, I_high: 200 },
            { C_low: 355, C_high: 424, I_low: 201, I_high: 300 },
            { C_low: 425, C_high: 604, I_low: 301, I_high: 500 }
        ]
    };

    const ranges = breakpoints[pollutant];
    if (!ranges) {
        throw new Error(`Unsupported pollutant: ${pollutant}`);
    }

    for (let range of ranges) {
        if (concentration >= range.C_low && concentration <= range.C_high) {
            const { C_low, C_high, I_low, I_high } = range;
            return ((I_high - I_low) / (C_high - C_low)) * (concentration - C_low) + I_low;
        }
    }

    return null; // Връща null, ако концентрацията е извън границите
}

// Връщане на цвят за AQI категория
function getAQIColor(aqi) {
    if (aqi >= 0 && aqi <= 50) return "green";         // Good
    if (aqi >= 51 && aqi <= 100) return "yellow";      // Moderate
    if (aqi >= 101 && aqi <= 150) return "orange";     // Unhealthy for Sensitive Groups
    if (aqi >= 151 && aqi <= 200) return "red";        // Unhealthy
    if (aqi >= 201 && aqi <= 300) return "purple";     // Very Unhealthy
    if (aqi >= 301 && aqi <= 500) return "maroon";     // Hazardous
    return "gray"; // За стойности извън границите
}

// Обработка на данни за AQI
export function processAQIData(data) {

    console.log(data);
    return data.map(entry => {
        const pm25 = parseFloat(entry.predicted_pm25);
        const pm10 = parseFloat(entry.predicted_pm10);

        // Изчисляване на AQI за PM2.5 и PM10
        const pm25AQI = calculateAQI(pm25, "PM2.5");
        const pm10AQI = calculateAQI(pm10, "PM10");

        // Избиране на максималния AQI
        const overallAQI = Math.max(pm25AQI, pm10AQI);
        const aqiColor = getAQIColor(overallAQI);

        // Добавяне на AQI данни към записа
        return {
            timestamp: entry.timestamp,
            lat: parseFloat(entry.lat),
            lon: parseFloat(entry.lon),
            overallAQI,
            aqiColor
        };
    });
}

// Пример за използване
// (function main() {
//     const inputData = [
//         {
//             "sensor_id": "87807",
//             "lat": "42.708",
//             "lon": "23.278",
//             "timestamp": "2024-10-06T00:00:47",
//             "pm10": "8.15",
//             "pm25": "4.95",
//             "temperature": "14.06",
//             "humidity": "100.00"
//         },
//         {
//             "sensor_id": "87807",
//             "lat": "42.708",
//             "lon": "23.278",
//             "timestamp": "2024-10-06T00:03:12",
//             "pm10": "6.55",
//             "pm25": "4.70",
//             "temperature": "14.02",
//             "humidity": "100.00"
//         },
//         {
//             "sensor_id": "87807",
//             "lat": "42.708",
//             "lon": "23.278",
//             "timestamp": "2024-10-06T00:05:38",
//             "pm10": "7.38",
//             "pm25": "4.40",
//             "temperature": "14.03",
//             "humidity": "100.00"
//         },
//         {
//             "sensor_id": "87807",
//             "lat": "42.708",
//             "lon": "23.278",
//             "timestamp": "2024-10-06T00:08:04",
//             "pm10": "9.80",
//             "pm25": "4.68",
//             "temperature": "14.03",
//             "humidity": "100.00"
//         }
//     ];

//     const processedData = processAQIData(inputData);
//     console.log(JSON.stringify(processedData, null, 2));
// })();