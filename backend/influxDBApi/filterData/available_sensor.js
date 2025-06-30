import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// проверява дали сензорът е добавен в системата
export function checkAvailableSensor(pSensorName) {
    try {
        const filePath = path.join(__dirname, 'available_sensors.json');
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const sensors = JSON.parse(rawData);
        
        return sensors.some(sensor => sensor.sensorName == pSensorName);
        
    } catch (error) {
        console.error('Грешка при работа с файла:', error);
        return false;
    }
}