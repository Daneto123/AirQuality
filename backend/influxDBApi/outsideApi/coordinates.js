import fetch from "node-fetch";

export async function getCoordinates(cityName) {
  const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(cityName)}&key=REDACTED_API_KEY`;

  try {
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return { latitude: lat, longitude: lng };
    } else {
      throw new Error(`No results found for city: ${cityName}`);
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error.message);
    throw error;
  }
}
