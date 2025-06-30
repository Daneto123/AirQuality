// Универсална функция за обработка на данни от сензори
export function processSensorData(sensorType, data, min, max, windowSize) {
    
    if (!['MQ2', 'MQ135', 'Sharp GP2Y1010AU0F'].includes(sensorType)) {
        throw new Error(`Unsupported sensor type: ${sensorType}`);
    }

    const filteredData = filterOutOfRange(data, min, max);
    const smoothedData = medianFilter(filteredData, windowSize);
    const processedData = smoothedData.map(value => sensorSpecificProcessing(sensorType, value));

    return processedData;
}

// Филтриране на стойности извън допустимия диапазон
function filterOutOfRange(data, min, max) {
    return data.filter(value => value >= min && value <= max);
}

// Медианен филтър за изглаждане
function medianFilter(data, windowSize) {
    const smoothedData = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = halfWindow; i < data.length - halfWindow; i++) {
        const window = data.slice(i - halfWindow, i + halfWindow + 1);
        window.sort((a, b) => a - b);
        smoothedData.push(window[Math.floor(window.length / 2)]);
    }

    return smoothedData;
}

// Обработка на данни в зависимост от типа на сензора
function sensorSpecificProcessing(sensorType, value) {
    switch (sensorType) {
        case 'MQ2':
            return calculateMQ2(value);
        case 'MQ135':
            return calculateMQ135(value);
        case 'Sharp GP2Y1010AU0F':
            return calculateDustConcentration(value);
        default:
            throw new Error(`Unsupported sensor type: ${sensorType}`);
    }
}

// Изчисляване на концентрация за MQ2
function calculateMQ2(value) {
    const Ro = 10.0; // Калибрирана стойност за чист въздух
    const Rs = value / Ro; // Примерно изчисление на Rs
    const A = 100; // Константа за LPG
    const B = -1.7; // Константа за LPG
    return A * Math.pow(Rs, B); // Връща концентрацията в ppm
}

// Изчисляване на концентрация за MQ135
function calculateMQ135(value) {
    const Ro = 10.0; // Калибрирана стойност за чист въздух
    const Rs = value / Ro; // Примерно изчисление на Rs
    const A = 116.6020682; // Константа за CO2
    const B = -2.769034857; // Константа за CO2
    return A * Math.pow(Rs, B); // Връща концентрацията в ppm
}

// Изчисляване на концентрация за Sharp GP2Y1010AU0F
function calculateDustConcentration(value) {
    const V_ref = 3.3; // Референтно напрежение
    const ADC_max = 65535; // Максимална стойност на ADC
    const V_offset = 0.6; // Офсет от калибрацията
    const K = 0.17; // Коэффициент за концентрация

    const voltage = value * (V_ref / ADC_max); // Преобразуване в напрежение
    return Math.max(0, (voltage - V_offset) * K); // Концентрация в µg/m³
}

// Примерно използване
// (function main() {
//     // Примерни данни от сензор
//     const sensorType = 'MQ2'; // Тип сензор: 'MQ2', 'MQ135', или 'Sharp GP2Y1010AU0F'
//     const sensorData = [300, 1500, 100, 5000, 12000]; // Данни от сензора

//     // Диапазон за допустими стойности
//     const minRange = 200;
//     const maxRange = 10000;

//     // Прозорец за медианния филтър
//     const windowSize = 3;

//     try {
//         // Обработете данните
//         const processedData = processSensorData(sensorType, sensorData, minRange, maxRange, windowSize);
//         console.log(`Processed Data for ${sensorType}:`, processedData);
//     } catch (error) {
//         console.error(error.message);
//     }
// })();