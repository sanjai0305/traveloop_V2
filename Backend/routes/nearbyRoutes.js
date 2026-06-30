import express from "express";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET nearby places — proxies Google Places Nearby Search
router.get("/", protect, async (req, res) => {
  try {
    const { lat, lng, type = "tourist_attraction" } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "lat and lng required" });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ success: false, message: "Google Maps API key not configured on server" });
    }

    const radius = 2000; // 2km
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${encodeURIComponent(type)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return res.status(502).json({ success: false, message: `Google API error: ${data.status}` });
    }

    // Simplify results
    const places = (data.results || []).slice(0, 20).map((p) => ({
      id: p.place_id,
      name: p.name,
      address: p.vicinity,
      rating: p.rating,
      totalRatings: p.user_ratings_total,
      openNow: p.opening_hours?.open_now,
      types: p.types?.slice(0, 3),
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      photo: p.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photos[0].photo_reference}&key=${apiKey}`
        : null,
    }));

    res.status(200).json({ success: true, places, count: places.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
