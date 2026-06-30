// Backend/routes/exploreRoutes.js — V1.8.1 AI Destination Discovery Engine
// GET /api/explore/discover?query=<destination>

import express from "express";
import rateLimit from "express-rate-limit";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── Rate Limiter: 30 requests per 15 minutes per IP ───────────────────────
const exploreRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: "Too many explore requests. Please slow down.",
  },
});

// ─── 10-minute server-side cache ────────────────────────────────────────────
const _exploreCache = new Map();
const CACHE_TTL_MS  = 10 * 60 * 1000; // 10 minutes

// ─── AI Ranking Score ────────────────────────────────────────────────────────
// Score = (rating × 2) + (log10(reviews + 1) × 1.5) + touristBonus
const TOURIST_TYPES = new Set([
  "tourist_attraction", "amusement_park", "aquarium", "art_gallery",
  "hindu_temple", "church", "mosque", "museum", "natural_feature",
  "park", "stadium", "zoo", "casino", "place_of_worship"
]);

const BANNED_TYPES = new Set([
  "store", "transit_station", "bus_station", "subway_station", "train_station",
  "gas_station", "finance", "bank", "atm", "local_government_office",
  "real_estate_agency", "beauty_salon", "hair_care", "laundry", "car_repair",
  "car_dealer", "car_wash", "parking", "school", "university", "lawyer",
  "insurance_agency", "doctor", "dentist", "hospital", "health",
  "physiotherapist", "veterinary_care", "clothing_store", "department_store",
  "electronics_store", "furniture_store", "home_goods_store", "jewelry_store",
  "shoe_store", "shopping_mall", "supermarket", "grocery_or_supermarket",
  "convenience_store", "bakery", "meal_delivery", "meal_takeaway", "cafe",
  "restaurant", "bar", "liquor_store", "lodging", "hotel", "travel_agency"
]);

const computeScore = (place) => {
  const rating  = Number(place.rating) || 0;
  const reviews = Number(place.user_ratings_total || place.reviewCount) || 0;
  const bonus   = (place.types || []).some(t => TOURIST_TYPES.has(t)) ? 1.5 : 0;
  return (rating * 2) + (Math.log10(reviews + 1) * 1.5) + bonus;
};

// ─── Type → Human Label mapping ─────────────────────────────────────────────
const TYPE_LABELS = {
  tourist_attraction: "Attraction",
  museum:             "Museum",
  park:               "Park",
  amusement_park:     "Amusement Park",
  aquarium:           "Aquarium",
  art_gallery:        "Art Gallery",
  hindu_temple:       "Temple",
  church:             "Church",
  mosque:             "Mosque",
  natural_feature:    "Nature",
  stadium:            "Stadium",
  zoo:                "Zoo",
  casino:             "Casino",
  point_of_interest:  "Landmark",
};

const getTypeLabel = (types = []) => {
  for (const t of types) {
    if (TYPE_LABELS[t]) return TYPE_LABELS[t];
  }
  return "Place";
};

const getPlaceEmoji = (typeLabel = "") => {
  const key = typeLabel.toLowerCase();
  if (key.includes("beach")) return "🏖️";
  if (key.includes("mountain") || key.includes("hill")) return "🏔️";
  if (key.includes("waterfall") || key.includes("river") || key.includes("lake") || key.includes("dam") || key.includes("fountain") || key.includes("bay")) return "💧";
  if (key.includes("temple") || key.includes("shrine")) return "🛕";
  if (key.includes("church")) return "⛪";
  if (key.includes("mosque")) return "🕌";
  if (key.includes("park") || key.includes("garden")) return "🌿";
  if (key.includes("museum") || key.includes("art gallery") || key.includes("heritage")) return "🏛️";
  if (key.includes("fort") || key.includes("castle")) return "🏰";
  if (key.includes("palace") || key.includes("monument") || key.includes("landmark") || key.includes("skyscraper")) return "👑";
  if (key.includes("market") || key.includes("shopping")) return "🛍️";
  if (key.includes("island")) return "🏝️";
  if (key.includes("zoo") || key.includes("wildlife") || key.includes("aquarium")) return "🦁";
  if (key.includes("adventure") || key.includes("theme park") || key.includes("amusement")) return "🎡";
  return "📍";
};

// ─── Curated Fallback — Expanded to 29 destinations, never empty ──────────────
const CURATED_DB = {
  // India
  salem: [
    { name: "Yercaud", rating: 4.5, reviewCount: 14200, type: "Hill Station", vicinity: "Salem, Tamil Nadu", lat: 11.77, lng: 78.21 },
    { name: "Kiliyur Falls", rating: 4.4, reviewCount: 8300, type: "Waterfall", vicinity: "Yercaud, Salem", lat: 11.80, lng: 78.22 },
    { name: "Pagoda Point", rating: 4.3, reviewCount: 6100, type: "Viewpoint", vicinity: "Yercaud, Salem", lat: 11.79, lng: 78.20 },
    { name: "Lady's Seat", rating: 4.2, reviewCount: 5800, type: "Viewpoint", vicinity: "Yercaud, Salem", lat: 11.78, lng: 78.18 },
    { name: "1008 Linga Temple", rating: 4.4, reviewCount: 7200, type: "Temple", vicinity: "Yercaud, Salem", lat: 11.81, lng: 78.23 },
  ],
  yercaud: [
    { name: "Emerald Lake", rating: 4.1, reviewCount: 3400, type: "Lake", vicinity: "Yercaud Hills", lat: 11.77, lng: 78.20 },
    { name: "Kiliyur Falls", rating: 4.4, reviewCount: 8300, type: "Waterfall", vicinity: "Yercaud, Salem", lat: 11.80, lng: 78.22 },
    { name: "Pagoda Point", rating: 4.3, reviewCount: 6100, type: "Viewpoint", vicinity: "Yercaud, Salem", lat: 11.79, lng: 78.20 },
    { name: "Lady's Seat", rating: 4.2, reviewCount: 5800, type: "Viewpoint", vicinity: "Yercaud, Salem", lat: 11.78, lng: 78.18 },
    { name: "Shevaroy Temple", rating: 4.3, reviewCount: 4900, type: "Temple", vicinity: "Yercaud Hills", lat: 11.82, lng: 78.24 },
  ],
  chennai: [
    { name: "Marina Beach", rating: 4.5, reviewCount: 48000, type: "Beach", vicinity: "Marina, Chennai", lat: 13.05, lng: 80.28 },
    { name: "Mahabalipuram", rating: 4.7, reviewCount: 31000, type: "Heritage Site", vicinity: "Mahabalipuram, TN", lat: 12.61, lng: 80.19 },
    { name: "Kapaleeshwarar Temple", rating: 4.6, reviewCount: 22000, type: "Temple", vicinity: "Mylapore, Chennai", lat: 13.03, lng: 80.27 },
    { name: "VGP Marine Kingdom", rating: 4.2, reviewCount: 12000, type: "Aquarium", vicinity: "ECR, Chennai", lat: 12.92, lng: 80.25 },
    { name: "DakshinaChitra", rating: 4.4, reviewCount: 9800, type: "Heritage Museum", vicinity: "ECR, Chennai", lat: 12.85, lng: 80.24 },
  ],
  madurai: [
    { name: "Meenakshi Amman Temple", rating: 4.8, reviewCount: 54000, type: "Temple", vicinity: "Madurai, Tamil Nadu", lat: 9.91, lng: 78.11 },
    { name: "Thirumalai Nayakkar Mahal", rating: 4.3, reviewCount: 11200, type: "Palace", vicinity: "Madurai", lat: 9.91, lng: 78.12 },
    { name: "Gandhi Memorial Museum", rating: 4.4, reviewCount: 5600, type: "Museum", vicinity: "Madurai", lat: 9.92, lng: 78.14 },
    { name: "Alagar Koyil", rating: 4.5, reviewCount: 4300, type: "Temple", vicinity: "Alagar Hills, Madurai", lat: 10.07, lng: 78.21 },
    { name: "Koodal Azhagar Temple", rating: 4.6, reviewCount: 3100, type: "Temple", vicinity: "Madurai", lat: 9.91, lng: 78.10 },
  ],
  coimbatore: [
    { name: "Adiyogi Shiva Statue", rating: 4.8, reviewCount: 34000, type: "Monument", vicinity: "Isha Yoga Center, Coimbatore", lat: 10.97, lng: 76.73 },
    { name: "Marudhamalai Temple", rating: 4.6, reviewCount: 12000, type: "Temple", vicinity: "Marudhamalai, Coimbatore", lat: 11.04, lng: 76.85 },
    { name: "Vydehi Falls", rating: 4.2, reviewCount: 2100, type: "Waterfall", vicinity: "Coimbatore", lat: 10.98, lng: 76.77 },
    { name: "Kovai Kondattam", rating: 4.0, reviewCount: 4500, type: "Amusement Park", vicinity: "Siruvani Road, Coimbatore", lat: 10.95, lng: 76.89 },
    { name: "Gass Forest Museum", rating: 4.3, reviewCount: 1800, type: "Museum", vicinity: "RS Puram, Coimbatore", lat: 11.01, lng: 76.95 },
  ],
  ooty: [
    { name: "Ooty Botanical Gardens", rating: 4.4, reviewCount: 28000, type: "Garden", vicinity: "Ooty, Tamil Nadu", lat: 11.41, lng: 76.71 },
    { name: "Ooty Lake", rating: 4.0, reviewCount: 19500, type: "Lake", vicinity: "Ooty", lat: 11.40, lng: 76.68 },
    { name: "Doddabetta Peak", rating: 4.3, reviewCount: 17200, type: "Mountain", vicinity: "Ooty Hills", lat: 11.40, lng: 76.73 },
    { name: "Rose Garden", rating: 4.2, reviewCount: 14000, type: "Garden", vicinity: "Ooty", lat: 11.40, lng: 76.70 },
    { name: "Nilgiri Mountain Railway", rating: 4.7, reviewCount: 9200, type: "Heritage", vicinity: "Ooty to Mettupalayam", lat: 11.32, lng: 76.82 },
  ],
  kodaikanal: [
    { name: "Kodaikanal Lake", rating: 4.3, reviewCount: 31000, type: "Lake", vicinity: "Kodaikanal, Tamil Nadu", lat: 10.23, lng: 77.48 },
    { name: "Coaker's Walk", rating: 4.2, reviewCount: 14300, type: "Viewpoint", vicinity: "Kodaikanal", lat: 10.23, lng: 77.49 },
    { name: "Bryant Park", rating: 4.1, reviewCount: 9800, type: "Park", vicinity: "Kodaikanal", lat: 10.23, lng: 77.49 },
    { name: "Pillar Rocks", rating: 4.4, reviewCount: 11000, type: "Viewpoint", vicinity: "Kodaikanal", lat: 10.20, lng: 77.52 },
    { name: "Silver Cascade Falls", rating: 4.0, reviewCount: 8500, type: "Waterfall", vicinity: "Kodaikanal Road", lat: 10.25, lng: 77.51 },
  ],
  goa: [
    { name: "Calangute Beach", rating: 4.4, reviewCount: 38000, type: "Beach", vicinity: "North Goa", lat: 15.55, lng: 73.76 },
    { name: "Basilica of Bom Jesus", rating: 4.7, reviewCount: 29000, type: "Church", vicinity: "Old Goa", lat: 15.50, lng: 73.91 },
    { name: "Dudhsagar Falls", rating: 4.7, reviewCount: 24000, type: "Waterfall", vicinity: "Mollem, Goa", lat: 15.31, lng: 74.31 },
    { name: "Fort Aguada", rating: 4.4, reviewCount: 21000, type: "Fort", vicinity: "Candolim, Goa", lat: 15.49, lng: 73.77 },
    { name: "Anjuna Flea Market", rating: 4.2, reviewCount: 14000, type: "Market", vicinity: "Anjuna, Goa", lat: 15.57, lng: 73.74 },
  ],
  jaipur: [
    { name: "Amber Fort", rating: 4.7, reviewCount: 58000, type: "Fort", vicinity: "Amer, Jaipur", lat: 26.98, lng: 75.85 },
    { name: "Hawa Mahal", rating: 4.6, reviewCount: 43000, type: "Palace", vicinity: "Pink City", lat: 26.92, lng: 75.82 },
    { name: "City Palace", rating: 4.6, reviewCount: 36000, type: "Palace", vicinity: "Jaipur", lat: 26.92, lng: 75.82 },
    { name: "Jantar Mantar", rating: 4.5, reviewCount: 22000, type: "Monument", vicinity: "Jaipur", lat: 26.92, lng: 75.82 },
    { name: "Nahargarh Fort", rating: 4.5, reviewCount: 27000, type: "Fort", vicinity: "Jaipur Hills", lat: 26.95, lng: 75.80 },
  ],
  delhi: [
    { name: "Red Fort", rating: 4.5, reviewCount: 62000, type: "Fort", vicinity: "Old Delhi", lat: 28.65, lng: 77.24 },
    { name: "India Gate", rating: 4.7, reviewCount: 84000, type: "Monument", vicinity: "New Delhi", lat: 28.61, lng: 77.23 },
    { name: "Qutub Minar", rating: 4.6, reviewCount: 53000, type: "Monument", vicinity: "Mehrauli", lat: 28.52, lng: 77.19 },
    { name: "Humayun's Tomb", rating: 4.6, reviewCount: 31000, type: "Heritage", vicinity: "Nizamuddin", lat: 28.59, lng: 77.25 },
    { name: "Lotus Temple", rating: 4.6, reviewCount: 47000, type: "Temple", vicinity: "Bahapur", lat: 28.55, lng: 77.26 },
  ],
  mumbai: [
    { name: "Gateway of India", rating: 4.6, reviewCount: 71000, type: "Monument", vicinity: "Colaba, Mumbai", lat: 18.92, lng: 72.83 },
    { name: "Marine Drive", rating: 4.6, reviewCount: 54000, type: "Promenade", vicinity: "South Mumbai", lat: 18.94, lng: 72.82 },
    { name: "Elephanta Caves", rating: 4.4, reviewCount: 31000, type: "Heritage", vicinity: "Elephanta Island", lat: 18.96, lng: 72.93 },
    { name: "Siddhivinayak Temple", rating: 4.6, reviewCount: 44000, type: "Temple", vicinity: "Prabhadevi", lat: 19.01, lng: 72.83 },
    { name: "Juhu Beach", rating: 4.1, reviewCount: 38000, type: "Beach", vicinity: "Juhu, Mumbai", lat: 19.09, lng: 72.83 },
  ],
  kerala: [
    { name: "Alleppey Backwaters", rating: 4.7, reviewCount: 16500, type: "Nature", vicinity: "Alappuzha, Kerala", lat: 9.49, lng: 76.33 },
    { name: "Munnar Tea Gardens", rating: 4.8, reviewCount: 21000, type: "Nature", vicinity: "Munnar, Kerala", lat: 10.08, lng: 77.05 },
    { name: "Athirappilly Waterfalls", rating: 4.6, reviewCount: 14200, type: "Waterfall", vicinity: "Chalakkudy, Kerala", lat: 10.28, lng: 76.56 },
    { name: "Fort Kochi", rating: 4.5, reviewCount: 18000, type: "Heritage", vicinity: "Kochi, Kerala", lat: 9.96, lng: 76.24 },
    { name: "Varkala Beach", rating: 4.6, reviewCount: 9200, type: "Beach", vicinity: "Varkala, Kerala", lat: 8.73, lng: 76.70 },
  ],
  mysore: [
    { name: "Mysore Palace", rating: 4.8, reviewCount: 74000, type: "Palace", vicinity: "Mysuru, Karnataka", lat: 12.30, lng: 76.65 },
    { name: "Chamundi Hill Temple", rating: 4.6, reviewCount: 18400, type: "Temple", vicinity: "Chamundi Hills, Mysuru", lat: 12.27, lng: 76.67 },
    { name: "Brindavan Gardens", rating: 4.2, reviewCount: 27000, type: "Garden", vicinity: "Krishna Raja Sagara, Mysuru", lat: 12.42, lng: 76.57 },
    { name: "Mysore Zoo", rating: 4.5, reviewCount: 32000, type: "Zoo", vicinity: "Indiranagar, Mysuru", lat: 12.30, lng: 76.66 },
    { name: "St. Philomena's Church", rating: 4.5, reviewCount: 9100, type: "Church", vicinity: "Lashkar Mohalla, Mysuru", lat: 12.32, lng: 76.65 },
  ],
  // Japan
  tokyo: [
    { name: "Shibuya Crossing", rating: 4.7, reviewCount: 88000, type: "Landmark", vicinity: "Shibuya, Tokyo", lat: 35.66, lng: 139.70 },
    { name: "Tokyo Tower", rating: 4.7, reviewCount: 63000, type: "Landmark", vicinity: "Minato, Tokyo", lat: 35.65, lng: 139.74 },
    { name: "Mount Fuji", rating: 4.9, reviewCount: 112000, type: "Natural Feature", vicinity: "Fujinomiya, Shizuoka", lat: 35.36, lng: 138.73 },
    { name: "Asakusa & Senso-ji", rating: 4.7, reviewCount: 79000, type: "Temple", vicinity: "Asakusa, Tokyo", lat: 35.71, lng: 139.79 },
    { name: "Ueno Park", rating: 4.5, reviewCount: 38000, type: "Park", vicinity: "Ueno, Tokyo", lat: 35.71, lng: 139.77 },
  ],
  kyoto: [
    { name: "Fushimi Inari Shrine", rating: 4.8, reviewCount: 91000, type: "Shrine", vicinity: "Fushimi, Kyoto", lat: 34.96, lng: 135.77 },
    { name: "Arashiyama Bamboo Grove", rating: 4.7, reviewCount: 68000, type: "Nature", vicinity: "Arashiyama, Kyoto", lat: 35.02, lng: 135.67 },
    { name: "Kinkakuji (Golden Pavilion)", rating: 4.8, reviewCount: 78000, type: "Temple", vicinity: "Kita, Kyoto", lat: 35.03, lng: 135.72 },
    { name: "Gion District", rating: 4.6, reviewCount: 51000, type: "District", vicinity: "Higashiyama", lat: 35.00, lng: 135.77 },
    { name: "Nijo Castle", rating: 4.6, reviewCount: 41000, type: "Castle", vicinity: "Nakagyo, Kyoto", lat: 35.01, lng: 135.74 },
  ],
  osaka: [
    { name: "Osaka Castle", rating: 4.6, reviewCount: 57000, type: "Castle", vicinity: "Chuo, Osaka", lat: 34.69, lng: 135.53 },
    { name: "Dotonbori", rating: 4.6, reviewCount: 72000, type: "District", vicinity: "Namba, Osaka", lat: 34.66, lng: 135.50 },
    { name: "Universal Studios Japan", rating: 4.6, reviewCount: 84000, type: "Theme Park", vicinity: "Sakurajima", lat: 34.66, lng: 135.43 },
    { name: "Shinsaibashi", rating: 4.4, reviewCount: 38000, type: "Shopping", vicinity: "Chuo, Osaka", lat: 34.67, lng: 135.50 },
  ],
  // Thailand
  bangkok: [
    { name: "Grand Palace", rating: 4.6, reviewCount: 84000, type: "Palace", vicinity: "Rattanakosin, Bangkok", lat: 13.75, lng: 100.49 },
    { name: "Wat Pho", rating: 4.6, reviewCount: 61000, type: "Temple", vicinity: "Rattanakosin", lat: 13.75, lng: 100.49 },
    { name: "Chatuchak Market", rating: 4.5, reviewCount: 43000, type: "Market", vicinity: "Chatuchak", lat: 13.79, lng: 100.55 },
    { name: "Jim Thompson House", rating: 4.5, reviewCount: 22000, type: "Museum", vicinity: "Bang Rak", lat: 13.75, lng: 100.52 },
  ],
  phuket: [
    { name: "Phi Phi Islands", rating: 4.8, reviewCount: 66000, type: "Island", vicinity: "Krabi Province", lat: 7.75, lng: 98.78 },
    { name: "Patong Beach", rating: 4.3, reviewCount: 54000, type: "Beach", vicinity: "Patong, Phuket", lat: 7.89, lng: 98.30 },
    { name: "Big Buddha", rating: 4.6, reviewCount: 38000, type: "Monument", vicinity: "Chalong, Phuket", lat: 7.83, lng: 98.30 },
    { name: "Phang Nga Bay", rating: 4.8, reviewCount: 29000, type: "Bay", vicinity: "Phang Nga", lat: 8.27, lng: 98.50 },
  ],
  // Singapore
  singapore: [
    { name: "Gardens by the Bay", rating: 4.7, reviewCount: 88000, type: "Garden", vicinity: "Marina Bay", lat: 1.28, lng: 103.86 },
    { name: "Marina Bay Sands", rating: 4.6, reviewCount: 77000, type: "Landmark", vicinity: "Marina Bay", lat: 1.28, lng: 103.86 },
    { name: "Sentosa Island", rating: 4.5, reviewCount: 59000, type: "Island", vicinity: "Sentosa", lat: 1.25, lng: 103.83 },
    { name: "Singapore Zoo", rating: 4.6, reviewCount: 48000, type: "Zoo", vicinity: "Mandai", lat: 1.40, lng: 103.79 },
  ],
  "marina bay": [
    { name: "Gardens by the Bay", rating: 4.7, reviewCount: 88000, type: "Garden", vicinity: "Marina Bay", lat: 1.28, lng: 103.86 },
    { name: "Marina Bay Sands", rating: 4.6, reviewCount: 77000, type: "Landmark", vicinity: "Marina Bay", lat: 1.28, lng: 103.86 },
    { name: "Singapore Flyer", rating: 4.5, reviewCount: 12000, type: "Landmark", vicinity: "Marina Bay", lat: 1.29, lng: 103.86 },
    { name: "ArtScience Museum", rating: 4.6, reviewCount: 16800, type: "Museum", vicinity: "Marina Bay", lat: 1.28, lng: 103.86 },
  ],
  sentosa: [
    { name: "Sentosa Island", rating: 4.5, reviewCount: 59000, type: "Island", vicinity: "Sentosa", lat: 1.25, lng: 103.83 },
    { name: "Universal Studios Singapore", rating: 4.6, reviewCount: 74000, type: "Theme Park", vicinity: "Sentosa", lat: 1.25, lng: 103.82 },
    { name: "S.E.A. Aquarium", rating: 4.6, reviewCount: 22000, type: "Aquarium", vicinity: "Sentosa", lat: 1.25, lng: 103.82 },
    { name: "Siloso Beach", rating: 4.3, reviewCount: 8200, type: "Beach", vicinity: "Sentosa", lat: 1.25, lng: 103.81 },
  ],
  // Dubai
  dubai: [
    { name: "Burj Khalifa", rating: 4.8, reviewCount: 91000, type: "Skyscraper", vicinity: "Downtown Dubai", lat: 25.19, lng: 55.27 },
    { name: "Palm Jumeirah", rating: 4.7, reviewCount: 68000, type: "Island", vicinity: "Palm Jumeirah", lat: 25.11, lng: 55.14 },
    { name: "Dubai Mall", rating: 4.7, reviewCount: 84000, type: "Shopping", vicinity: "Downtown Dubai", lat: 25.19, lng: 55.27 },
    { name: "Desert Safari", rating: 4.8, reviewCount: 51000, type: "Adventure", vicinity: "Al Marmoom", lat: 24.83, lng: 55.83 },
  ],
  "abu dhabi": [
    { name: "Sheikh Zayed Grand Mosque", rating: 4.9, reviewCount: 48000, type: "Mosque", vicinity: "Abu Dhabi", lat: 24.41, lng: 54.47 },
    { name: "Louvre Abu Dhabi", rating: 4.7, reviewCount: 16000, type: "Museum", vicinity: "Saadiyat Island", lat: 24.53, lng: 54.39 },
    { name: "Ferrari World", rating: 4.5, reviewCount: 22000, type: "Theme Park", vicinity: "Yas Island", lat: 24.48, lng: 54.60 },
    { name: "Yas Marina Circuit", rating: 4.6, reviewCount: 9200, type: "Stadium", vicinity: "Yas Island", lat: 24.46, lng: 54.60 },
  ],
  // Europe
  paris: [
    { name: "Eiffel Tower", rating: 4.7, reviewCount: 144000, type: "Monument", vicinity: "Champ de Mars, Paris", lat: 48.86, lng: 2.29 },
    { name: "Louvre Museum", rating: 4.8, reviewCount: 118000, type: "Museum", vicinity: "1st Arr., Paris", lat: 48.86, lng: 2.33 },
    { name: "Arc de Triomphe", rating: 4.7, reviewCount: 82000, type: "Monument", vicinity: "Champs-Élysées", lat: 48.87, lng: 2.29 },
    { name: "Seine River Cruise", rating: 4.7, reviewCount: 64000, type: "Cruise", vicinity: "Paris", lat: 48.86, lng: 2.35 },
  ],
  rome: [
    { name: "Colosseum", rating: 4.7, reviewCount: 128000, type: "Monument", vicinity: "Rome, Italy", lat: 41.89, lng: 12.49 },
    { name: "Vatican City", rating: 4.8, reviewCount: 104000, type: "Heritage", vicinity: "Vatican", lat: 41.90, lng: 12.45 },
    { name: "Trevi Fountain", rating: 4.7, reviewCount: 97000, type: "Fountain", vicinity: "Rome", lat: 41.90, lng: 12.48 },
    { name: "Pantheon", rating: 4.7, reviewCount: 78000, type: "Monument", vicinity: "Rome", lat: 41.90, lng: 12.48 },
  ],
  venice: [
    { name: "St. Mark's Basilica", rating: 4.7, reviewCount: 38000, type: "Church", vicinity: "Piazza San Marco, Venice", lat: 45.43, lng: 12.33 },
    { name: "Grand Canal", rating: 4.8, reviewCount: 22000, type: "Nature", vicinity: "Venice", lat: 45.44, lng: 12.32 },
    { name: "Rialto Bridge", rating: 4.6, reviewCount: 28000, type: "Bridge", vicinity: "Sestiere San Polo, Venice", lat: 45.43, lng: 12.33 },
    { name: "Doge's Palace", rating: 4.7, reviewCount: 24000, type: "Palace", vicinity: "Piazza San Marco", lat: 45.43, lng: 12.34 },
  ],
  zurich: [
    { name: "Lake Zurich", rating: 4.7, reviewCount: 18000, type: "Lake", vicinity: "Zurich", lat: 47.32, lng: 8.57 },
    { name: "Bahnhofstrasse", rating: 4.4, reviewCount: 14000, type: "Shopping", vicinity: "Zurich Center", lat: 47.37, lng: 8.53 },
    { name: "Grossmünster", rating: 4.5, reviewCount: 11000, type: "Church", vicinity: "Zurich", lat: 47.37, lng: 8.54 },
    { name: "Swiss National Museum", rating: 4.5, reviewCount: 7800, type: "Museum", vicinity: "Zurich Center", lat: 47.37, lng: 8.54 },
  ],
  // USA
  "new york": [
    { name: "Statue of Liberty", rating: 4.7, reviewCount: 114000, type: "Monument", vicinity: "Liberty Island", lat: 40.69, lng: -74.04 },
    { name: "Central Park", rating: 4.7, reviewCount: 131000, type: "Park", vicinity: "Manhattan, NY", lat: 40.78, lng: -73.97 },
    { name: "Times Square", rating: 4.6, reviewCount: 127000, type: "Square", vicinity: "Midtown, NY", lat: 40.76, lng: -73.99 },
    { name: "Empire State Building", rating: 4.7, reviewCount: 84000, type: "Monument", vicinity: "Midtown, NY", lat: 40.74, lng: -73.99 },
  ],
  "las vegas": [
    { name: "Las Vegas Strip", rating: 4.6, reviewCount: 88000, type: "District", vicinity: "Las Vegas, Nevada", lat: 36.11, lng: -115.17 },
    { name: "Bellagio Fountains", rating: 4.8, reviewCount: 42000, type: "Fountain", vicinity: "Las Vegas Strip", lat: 36.11, lng: -115.17 },
    { name: "Fremont Street Experience", rating: 4.5, reviewCount: 39000, type: "Adventure", vicinity: "Downtown Las Vegas", lat: 36.16, lng: -115.14 },
    { name: "High Roller", rating: 4.5, reviewCount: 18000, type: "Landmark", vicinity: "Las Vegas Strip", lat: 36.11, lng: -115.16 },
  ],
  "san francisco": [
    { name: "Golden Gate Bridge", rating: 4.8, reviewCount: 94000, type: "Bridge", vicinity: "San Francisco, CA", lat: 37.81, lng: -122.47 },
    { name: "Alcatraz Island", rating: 4.7, reviewCount: 48000, type: "Island", vicinity: "San Francisco Bay", lat: 37.82, lng: -122.42 },
    { name: "Fisherman's Wharf", rating: 4.3, reviewCount: 64000, type: "District", vicinity: "San Francisco", lat: 37.80, lng: -122.41 },
    { name: "Golden Gate Park", rating: 4.7, reviewCount: 29000, type: "Park", vicinity: "San Francisco", lat: 37.76, lng: -122.48 },
  ]
};

// Normalize query to match DB keys
const normalizeQuery = (q) => q.toLowerCase().trim().replace(/[^a-z\s]/g, "").trim();

const findCuratedMatch = (query) => {
  const norm = normalizeQuery(query);
  // Exact match
  if (CURATED_DB[norm]) return CURATED_DB[norm];
  // Partial match
  for (const key of Object.keys(CURATED_DB)) {
    if (norm.includes(key) || key.includes(norm)) return CURATED_DB[key];
  }
  // Generic fallback
  return [
    { name: `${query} - Top Attraction`,  rating: 4.5, reviewCount: 5000,  type: "Attraction", vicinity: query, lat: 0, lng: 0 },
    { name: `${query} - Historic Site`,   rating: 4.4, reviewCount: 3500,  type: "Heritage",   vicinity: query, lat: 0, lng: 0 },
    { name: `${query} - City Center`,     rating: 4.3, reviewCount: 8000,  type: "Landmark",   vicinity: query, lat: 0, lng: 0 },
  ];
};

// Sanitize helper
const sanitizeQuery = (q = "") => {
  return q
    .replace(/[<>"'`;&|$]/g, "")
    .trim()
    .slice(0, 80);
};

// ─── MAIN DISCOVER HANDLER ───────────────────────────────────────────────────
router.get("/discover", protect, exploreRateLimiter, async (req, res) => {
  try {
    const rawQuery = sanitizeQuery(req.query.query || "");
    console.log("Explore Search Start:", rawQuery);

    if (!rawQuery || rawQuery.length < 2) {
      return res.json({ success: true, places: [], query: rawQuery });
    }

    const cacheKey = normalizeQuery(rawQuery);

    // ── Cache hit ─────────────────────────────────────────────────────────
    const cached = _exploreCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ success: true, places: cached.places, query: rawQuery, fromCache: true });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

    if (apiKey) {
      try {
        // ── Step 1: Geocode ───────────────────────────────────────────────
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(rawQuery)}&key=${apiKey}`;
        const geoRes  = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (geoData.status === "OK" && geoData.results?.length > 0) {
          const { lat, lng } = geoData.results[0].geometry.location;

          // ── Step 2: 3 parallel Nearby Searches ───────────────────────
          const SEARCH_TYPES = ["tourist_attraction", "museum", "park"];
          const RADIUS       = 50000; // 50km

          const fetchType = async (type) => {
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${RADIUS}&type=${type}&rankby=prominence&key=${apiKey}`;
            const r   = await fetch(url);
            const d   = await r.json();
            return d.status === "OK" ? (d.results || []) : [];
          };

          const [att, mus, par] = await Promise.all(SEARCH_TYPES.map(fetchType));

          // ── Step 3: Merge + deduplicate ───────────────────────────────
          const seen    = new Set();
          const merged  = [];
          for (const p of [...att, ...mus, ...par]) {
            if (!seen.has(p.place_id)) {
              seen.add(p.place_id);
              merged.push(p);
            }
          }

          // Filter out generic business and banned types unless they are tourist attractions
          const filtered = merged.filter(p => {
            if (!p.rating || p.rating < 3.0) return false;
            const types = p.types || [];
            const hasTouristType = types.some(t => TOURIST_TYPES.has(t));
            const hasBannedType = types.some(t => BANNED_TYPES.has(t));
            if (hasBannedType && !hasTouristType) {
              return false;
            }
            return true;
          });

          if (filtered.length > 0) {
            // ── Step 4: AI Ranking + Photo ─────────────────────────────
            const scored = filtered
              .map(p => ({
                ...p,
                _score: computeScore(p),
              }))
              .sort((a, b) => b._score - a._score)
              .slice(0, 10);

            const places = scored.map(p => {
              const typeLabel = getTypeLabel(p.types);
              return {
                name:        p.name,
                rating:      p.rating || 4.0,
                reviewCount: p.user_ratings_total || 0,
                photo:       p.photos?.[0]?.photo_reference
                  ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photos[0].photo_reference}&key=${apiKey}`
                  : null,
                vicinity:    p.vicinity || rawQuery,
                placeId:     p.place_id || "",
                type:        typeLabel,
                emoji:       getPlaceEmoji(typeLabel),
                score:       Math.round(p._score * 10) / 10,
                lat:         p.geometry?.location?.lat || lat,
                lng:         p.geometry?.location?.lng || lng,
              };
            });

            console.log("Explore API Success");
            _exploreCache.set(cacheKey, { places, expiresAt: Date.now() + CACHE_TTL_MS });
            return res.json({ success: true, places, query: rawQuery, fromCache: false });
          }
        }
      } catch (apiErr) {
        console.error("Explore API Failed, error:", apiErr.message);
      }
    }

    // ── Curated fallback ──────────────────────────────────────────────────
    console.log("Fallback Activated");
    const curated = findCuratedMatch(rawQuery);
    const places  = curated.slice(0, 10).map(p => ({
      name:        p.name,
      rating:      p.rating,
      reviewCount: p.reviewCount,
      photo:       null,
      vicinity:    p.vicinity,
      placeId:     "",
      type:        p.type,
      emoji:       getPlaceEmoji(p.type),
      score:       computeScore({ rating: p.rating, user_ratings_total: p.reviewCount, types: ["tourist_attraction"] }),
      lat:         p.lat,
      lng:         p.lng,
    }));

    _exploreCache.set(cacheKey, { places, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json({ success: true, places, query: rawQuery, fromCache: false });

  } catch (error) {
    console.error("[Explore] Discover error:", error);
    res.status(500).json({ success: false, message: "Server error", places: [] });
  }
});

export default router;
