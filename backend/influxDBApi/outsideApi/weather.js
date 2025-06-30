import fetch from "node-fetch";

export async function getWeather(coordinates, hour) {

    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&hourly=temperature_2m,relative_humidity_2m,rain,weather_code&forecast_days=1`;
    
    //try {
      const response = await fetch(weatherUrl);
      const data = await response.json();

      const temperature = data.hourly.temperature_2m[hour];
      const humidity = data.hourly.relative_humidity_2m[hour];

      return { temperature, humidity }
    //} catch (error) {
    //  console.error("Error fetching weather data:", error.message);
    //  throw error;
    //}
}