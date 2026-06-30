import express from "express";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Map WMO codes to labels & styles
const WMO_MAP = {
  0: { label: "Sunny", warning: null },
  1: { label: "Partly Cloudy", warning: null },
  2: { label: "Partly Cloudy", warning: null },
  3: { label: "Overcast", warning: null },
  45: { label: "Foggy", warning: "Reduced visibility due to fog. Travel carefully!" },
  48: { label: "Foggy", warning: "Reduced visibility due to fog. Travel carefully!" },
  51: { label: "Light Drizzle", warning: null },
  53: { label: "Drizzle", warning: null },
  55: { label: "Heavy Drizzle", warning: "Drizzle expected. Keep a rain jacket handy." },
  61: { label: "Light Rain", warning: null },
  63: { label: "Rainy", warning: "Rain predicted. Carry an umbrella!" },
  65: { label: "Heavy Rain", warning: "Heavy rain alert! Expect outdoor disruptions." },
  71: { label: "Light Snow", warning: "Light snowfall expected. Stay warm!" },
  73: { label: "Snowy", warning: "Snowfall expected. Check road conditions." },
  75: { label: "Heavy Snow", warning: "Heavy snow warning! Stay indoors if possible." },
  80: { label: "Rain Showers", warning: "Showers expected. Keep an umbrella ready." },
  81: { label: "Rain Showers", warning: "Showers expected. Keep an umbrella ready." },
  82: { label: "Violent Showers", warning: "Torrential downpours expected. Avoid travel!" },
  95: { label: "Thunderstorm", warning: "Thunderstorms expected. Take shelter!" },
  96: { label: "Thunderstorm", warning: "Thunderstorms expected. Take shelter!" },
  99: { label: "Severe Storm", warning: "Severe thunderstorm warning! Avoid travel." },
};

const getWeatherLabel = (code) => {
  return WMO_MAP[code] || { label: "Partly Cloudy", warning: null };
};

const getDayName = (dateStr) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(dateStr);
  return days[d.getDay()];
};

router.get("/", protect, async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ success: false, message: "City query parameter is required" });
    }

    // 1. Geocode lookup
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoResponse = await fetch(geocodeUrl);
    if (!geoResponse.ok) {
      throw new Error("Geocoding service unavailable");
    }
    let geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      // Fallback: if no results, try splitting by space/comma and using the first token
      const parts = city.split(/[\s,]+/);
      if (parts.length > 1) {
        const fallbackCity = parts[0];
        const fallbackGeocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(fallbackCity)}&count=1&language=en&format=json`;
        const fbResponse = await fetch(fallbackGeocodeUrl);
        if (fbResponse.ok) {
          const fbData = await fbResponse.json();
          if (fbData.results && fbData.results.length > 0) {
            geoData = fbData;
          }
        }
      }
    }

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ success: false, message: `City '${city}' not found` });
    }

    const { latitude, longitude, name } = geoData.results[0];

    // 2. Weather forecast
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      throw new Error("Weather forecast service unavailable");
    }
    const forecastData = await forecastResponse.json();

    const current = forecastData.current_weather;
    const daily = forecastData.daily;

    const currentWeatherMap = getWeatherLabel(current.weathercode);
    
    // Create 3-day forecast (including today, tomorrow, and day after)
    const forecast = [];
    if (daily && daily.time) {
      const limit = Math.min(3, daily.time.length);
      for (let i = 0; i < limit; i++) {
        forecast.push({
          day: i === 0 ? "Today" : getDayName(daily.time[i]),
          tempMax: `${Math.round(daily.temperature_2m_max[i])}°C`,
          tempMin: `${Math.round(daily.temperature_2m_min[i])}°C`,
          label: getWeatherLabel(daily.weathercode[i]).label,
          code: daily.weathercode[i]
        });
      }
    }

    // Determine warnings
    let warning = currentWeatherMap.warning;
    if (current.temp > 38) {
      warning = "Extreme heat warning! Keep hydrated and limit outdoor activity.";
    } else if (current.temp < 0) {
      warning = "Sub-zero temperatures alert! Stay warm and protect against frost.";
    }

    res.json({
      success: true,
      city: name,
      latitude,
      longitude,
      current: {
        temp: `${Math.round(current.temperature)}°C`,
        label: currentWeatherMap.label,
        code: current.weathercode,
        windspeed: `${current.windspeed} km/h`
      },
      forecast,
      warning
    });
  } catch (error) {
    console.error("Weather API Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch weather data" });
  }
});

export default router;
