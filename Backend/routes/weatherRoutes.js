import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getCache, setCache, TTL } from "../services/cacheService.js";

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
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ success: false, message: "City query parameter is required" });
  }

  const cacheKey = `weather:${city.toLowerCase().trim()}`;
  
  // 1. Try reading from Redis Cache
  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[Weather Cache] Hit for city: ${city}`);
      return res.json(cachedData);
    }
  } catch (cacheErr) {
    console.warn("[Weather Cache Error] Failed to fetch from Redis:", cacheErr.message);
  }

  // Fallback payload structure in case of total service failure
  const getFallbackPayload = (cityName) => ({
    success: true,
    city: cityName,
    latitude: 0,
    longitude: 0,
    current: {
      temp: "25°C",
      label: "Partly Cloudy",
      code: 2,
      windspeed: "12 km/h"
    },
    forecast: [
      { day: "Today", tempMax: "28°C", tempMin: "20°C", label: "Partly Cloudy", code: 2 },
      { day: "Mon", tempMax: "29°C", tempMin: "21°C", label: "Sunny", code: 0 },
      { day: "Tue", tempMax: "27°C", tempMin: "19°C", label: "Rainy", code: 63 }
    ],
    warning: "Weather forecast service currently degraded (serving simulated forecast)."
  });

  try {
    // 2. Geocode lookup with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoResponse = await fetch(geocodeUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!geoResponse.ok) {
      throw new Error("Geocoding service unavailable");
    }
    let geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
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

    // 3. Weather forecast
    const forecastTimeout = new AbortController();
    const fTimeoutId = setTimeout(() => forecastTimeout.abort(), 5000);

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
    const forecastResponse = await fetch(forecastUrl, { signal: forecastTimeout.signal });
    clearTimeout(fTimeoutId);

    if (!forecastResponse.ok) {
      throw new Error("Weather forecast service unavailable");
    }
    const forecastData = await forecastResponse.json();

    const current = forecastData.current_weather;
    const daily = forecastData.daily;

    const currentWeatherMap = getWeatherLabel(current.weathercode);
    
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

    let warning = currentWeatherMap.warning;
    if (current.temp > 38) {
      warning = "Extreme heat warning! Keep hydrated and limit outdoor activity.";
    } else if (current.temp < 0) {
      warning = "Sub-zero temperatures alert! Stay warm and protect against frost.";
    }

    const resultPayload = {
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
    };

    // Save to Redis Cache (TTL = 2 hours / 7200 seconds)
    await setCache(cacheKey, resultPayload, TTL.WEATHER);

    res.json(resultPayload);
  } catch (error) {
    console.error("Weather API Error: serving graceful fallback. Reason:", error.message);
    // Serve fallback rather than throwing a 500 error
    res.json(getFallbackPayload(city));
  }
});

export default router;
