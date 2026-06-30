import express from "express";
import protect from "../middleware/authMiddleware.js";
import Booking from "../models/Booking.js";
import AgentTrip from "../models/AgentTrip.js";
import Agent from "../models/Agent.js";
import AdminNotification from "../models/AdminNotification.js";
import SystemSetting from "../models/SystemSetting.js";
import Trip from "../models/Trip.js";
import Itinerary from "../models/Itinerary.js";
import Checklist from "../models/Checklist.js";
import Budget from "../models/Budget.js";
import BoardingPass from "../models/BoardingPass.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Destination-based smart activity suggestion engine.
 * Returns an array of {day, time, title, category, note, isAiSuggestion} items.
 *
 * Covers: Yercaud, Goa, Chennai, Ooty, Manali, Bali, Kerala, Rajasthan,
 *         Mysore, Coorg, Kodaikanal, Munnar, Pondicherry, Hampi, generic fallback.
 */
const DESTINATION_ACTIVITIES = {
  yercaud: [
    { day: 1, time: "07:00", title: "Sunrise walk at Yercaud Lake", category: "Activity", note: "Serene morning walk around the lake — bring a camera!" },
    { day: 1, time: "08:30", title: "Breakfast at hotel", category: "Food", note: "Start the day with local South Indian breakfast" },
    { day: 1, time: "10:00", title: "Botanical Garden visit", category: "Sightseeing", note: "Over 300 plant species — children will love the orchid section" },
    { day: 1, time: "12:30", title: "Lunch at a local restaurant", category: "Food", note: "Try local Tamil cuisine and fresh hill coffee" },
    { day: 1, time: "14:00", title: "Shevaroy Hills Temple", category: "Sightseeing", note: "Scenic viewpoint and ancient Shevaroy temple at the peak" },
    { day: 1, time: "16:00", title: "Pagoda Point viewpoint", category: "Sightseeing", note: "360° panoramic view of Salem city and valleys" },
    { day: 1, time: "18:00", title: "Campfire & group bonding", category: "Activity", note: "Evening campfire — organized by hotel / group activity" },
    { day: 1, time: "20:00", title: "Group dinner", category: "Food", note: "BBQ or buffet dinner with the group" },
    { day: 2, time: "07:30", title: "Sunrise photography session", category: "Activity", note: "Golden hour photography from the hilltop" },
    { day: 2, time: "09:00", title: "Boating at Yercaud Lake", category: "Activity", note: "Paddle boats and row boats available — book at the lake" },
    { day: 2, time: "11:00", title: "Anna Park & Children's Park", category: "Sightseeing", note: "Beautiful rose gardens and walking tracks" },
    { day: 2, time: "13:00", title: "Farewell lunch", category: "Food", note: "Last meal before departure" },
  ],

  goa: [
    { day: 1, time: "09:00", title: "Calangute Beach morning walk", category: "Activity", note: "Most popular beach in Goa — great for swimming" },
    { day: 1, time: "11:00", title: "Water sports at Baga Beach", category: "Activity", note: "Parasailing, jet ski, banana boat rides" },
    { day: 1, time: "13:30", title: "Seafood lunch at beach shack", category: "Food", note: "Try Goan fish curry, prawn masala, and sol kadhi" },
    { day: 1, time: "16:00", title: "Anjuna Flea Market", category: "Activity", note: "Local handicrafts, clothes, jewelry" },
    { day: 1, time: "18:30", title: "Sunset cruise", category: "Activity", note: "Mandovi River cruise — live music and sunset views" },
    { day: 1, time: "21:00", title: "Nightlife at Tito's Lane", category: "Activity", note: "Pubs and cafes along the famous strip" },
    { day: 2, time: "08:00", title: "Old Goa churches tour", category: "Sightseeing", note: "UNESCO World Heritage — Basilica of Bom Jesus, Se Cathedral" },
    { day: 2, time: "11:00", title: "Dudhsagar Waterfall trip", category: "Sightseeing", note: "Spectacular 4-tiered waterfall — jeep safari from Mollem" },
    { day: 2, time: "14:00", title: "Lunch at Panjim cafes", category: "Food", note: "Portuguese-influenced Goan cuisine in Fontainhas quarter" },
    { day: 2, time: "17:00", title: "Arambol Beach sunset", category: "Activity", note: "Hippie vibe beach — drum circles at sunset" },
  ],

  chennai: [
    { day: 1, time: "07:30", title: "Kapaleeshwarar Temple", category: "Sightseeing", note: "Ancient Dravidian temple — best visited early morning" },
    { day: 1, time: "10:00", title: "Marina Beach walk", category: "Activity", note: "World's second longest beach — sunrise and morning vendors" },
    { day: 1, time: "12:00", title: "Filter coffee & tiffin at Saravana Bhavan", category: "Food", note: "Iconic South Indian breakfast chain" },
    { day: 1, time: "14:00", title: "Government Museum", category: "Sightseeing", note: "Includes Bronze Gallery and Natural History wing" },
    { day: 1, time: "17:00", title: "T. Nagar shopping", category: "Activity", note: "Best place for sarees, jewelry, electronics" },
    { day: 1, time: "20:00", title: "Dinner at Anjappar Chettinad", category: "Food", note: "Authentic Chettinad cuisine — spicy and flavorful" },
    { day: 2, time: "08:00", title: "Mahabalipuram day trip", category: "Sightseeing", note: "Rock-cut temples and Shore Temple — 1.5 hr from Chennai" },
    { day: 2, time: "13:00", title: "Lunch at Dakshin restaurant", category: "Food", note: "Multi-state South Indian thali" },
    { day: 2, time: "16:00", title: "Elliot's Beach (Besant Nagar)", category: "Activity", note: "Quiet beach with cafes and evening strolls" },
    { day: 2, time: "19:00", title: "Phoenix MarketCity Mall", category: "Activity", note: "Shopping and food court before departure" },
  ],

  ooty: [
    { day: 1, time: "08:00", title: "Nilgiri Mountain Railway (Toy Train)", category: "Activity", note: "UNESCO heritage toy train from Mettupalayam to Ooty" },
    { day: 1, time: "10:30", title: "Government Botanical Garden", category: "Sightseeing", note: "143-year-old garden with rare plants and fossil tree" },
    { day: 1, time: "13:00", title: "Ooty Lake boating", category: "Activity", note: "Pedal and motor boats on the scenic lake" },
    { day: 1, time: "15:00", title: "Doddabetta Peak", category: "Sightseeing", note: "Highest peak in the Nilgiris — telescope viewpoint" },
    { day: 1, time: "17:30", title: "Tea factory tour", category: "Sightseeing", note: "Learn how Nilgiri tea is processed — buy fresh tea" },
    { day: 2, time: "08:00", title: "Rose Garden", category: "Sightseeing", note: "20,000+ rose varieties — best in May-June" },
    { day: 2, time: "11:00", title: "Pykara Lake and waterfalls", category: "Sightseeing", note: "Scenic drive through pine forests" },
    { day: 2, time: "14:00", title: "Local market shopping", category: "Activity", note: "Chocolates, homemade oils, eucalyptus products" },
  ],

  manali: [
    { day: 1, time: "09:00", title: "Mall Road morning walk", category: "Activity", note: "Shops, cafes, and mountain views" },
    { day: 1, time: "11:00", title: "Hadimba Devi Temple", category: "Sightseeing", note: "Ancient wooden temple in cedar forest" },
    { day: 1, time: "13:00", title: "Lunch at Old Manali café", category: "Food", note: "Try yak cheese, Tibetan momos, thukpa" },
    { day: 1, time: "15:00", title: "Solang Valley snow point", category: "Activity", note: "Snow activities, cable car, paragliding" },
    { day: 2, time: "08:00", title: "Rohtang Pass (weather permitting)", category: "Sightseeing", note: "Book permit in advance — snow sports available" },
    { day: 2, time: "13:00", title: "Beas River riverside lunch", category: "Food", note: "Picnic by the river — local dhabas" },
    { day: 2, time: "16:00", title: "Vashisht Hot Springs", category: "Activity", note: "Natural hot sulphur springs with temple" },
  ],

  kerala: [
    { day: 1, time: "08:00", title: "Alleppey houseboat cruise", category: "Activity", note: "Overnight houseboat on backwaters — must book in advance" },
    { day: 1, time: "12:00", title: "Kerala Sadhya lunch", category: "Food", note: "Traditional feast on banana leaf with 20+ dishes" },
    { day: 1, time: "15:00", title: "Kumarakom Bird Sanctuary", category: "Sightseeing", note: "Migratory birds, mangroves — best at dawn" },
    { day: 2, time: "09:00", title: "Munroe Island canoe tour", category: "Activity", note: "Narrow waterways through coconut palms" },
    { day: 2, time: "14:00", title: "Ayurvedic massage", category: "Activity", note: "Authentic Kerala Ayurveda therapy" },
  ],

  bali: [
    { day: 1, time: "08:00", title: "Tanah Lot Temple sunrise", category: "Sightseeing", note: "Sea temple on a rocky outcrop — stunning sunrise view" },
    { day: 1, time: "11:00", title: "Ubud Monkey Forest", category: "Sightseeing", note: "Sacred forest with 700+ monkeys and ancient temples" },
    { day: 1, time: "14:00", title: "Tegallalang Rice Terraces", category: "Sightseeing", note: "UNESCO-listed cascading rice paddies" },
    { day: 1, time: "17:00", title: "Kuta Beach sunset", category: "Activity", note: "Famous for surfing and spectacular sunsets" },
    { day: 2, time: "09:00", title: "Mount Batur sunrise trek", category: "Activity", note: "Active volcano — 2-hr hike, book guide the night before" },
    { day: 2, time: "14:00", title: "Seminyak beach clubs", category: "Activity", note: "Luxury beach clubs with infinity pools" },
  ],

  kodaikanal: [
    { day: 1, time: "08:00", title: "Kodai Lake boating", category: "Activity", note: "Star-shaped lake — rowing and horse riding around it" },
    { day: 1, time: "10:00", title: "Pillar Rocks viewpoint", category: "Sightseeing", note: "Three massive granite pillars rising 120ft — foggy mornings" },
    { day: 1, time: "13:00", title: "Lunch at Carlton Hotel café", category: "Food", note: "Great view of the lake" },
    { day: 1, time: "15:00", title: "Bear Shola Falls", category: "Sightseeing", note: "Waterfall in a forest — short walk through nature" },
    { day: 2, time: "08:30", title: "Coaker's Walk", category: "Activity", note: "1.3km cliff walk with valley and plains view" },
    { day: 2, time: "11:00", title: "Dolphin's Nose viewpoint", category: "Sightseeing", note: "Dramatic cliff overhanging the valley" },
    { day: 2, time: "14:00", title: "Chocolate factory visit", category: "Activity", note: "Kodaikanal is famous for homemade chocolates" },
  ],

  munnar: [
    { day: 1, time: "07:00", title: "Tea plantation walk", category: "Activity", note: "Wake up to misty tea gardens — breathtaking at dawn" },
    { day: 1, time: "10:00", title: "Eravikulam National Park", category: "Sightseeing", note: "Home to Nilgiri tahr — may need advance booking" },
    { day: 1, time: "13:00", title: "Tea Museum visit + tasting", category: "Activity", note: "Learn about tea processing; sample premium Munnar blends" },
    { day: 2, time: "08:00", title: "Attukad Waterfalls", category: "Sightseeing", note: "Spectacular multi-tier waterfall — best after monsoon" },
    { day: 2, time: "11:00", title: "Anamudi Peak viewpoint", category: "Sightseeing", note: "Highest peak in South India — visible from viewpoint" },
  ],
};

/**
 * Generate AI-suggested activities for a destination and number of days.
 * Returns array of itinerary-compatible objects (without trip ID).
 */
const generateAISuggestedActivities = (destination = "", days = 1) => {
  const destKey = destination.toLowerCase().replace(/\s+/g, "");

  // Try to find a matching destination
  let activities = null;
  for (const [key, acts] of Object.entries(DESTINATION_ACTIVITIES)) {
    if (destKey.includes(key) || key.includes(destKey)) {
      activities = acts;
      break;
    }
  }

  // Generic fallback for unknown destinations
  if (!activities) {
    activities = [];
    for (let d = 1; d <= Math.min(days, 3); d++) {
      activities.push(
        { day: d, time: "08:30", title: `Breakfast — Day ${d}`, category: "Food", note: "Start your day well" },
        { day: d, time: "10:00", title: `Local sightseeing — Day ${d}`, category: "Sightseeing", note: `Explore ${destination} local attractions` },
        { day: d, time: "13:00", title: `Lunch at local restaurant — Day ${d}`, category: "Food", note: "Try local cuisine" },
        { day: d, time: "16:00", title: `Photography walk — Day ${d}`, category: "Activity", note: "Capture memories of your trip" },
        { day: d, time: "20:00", title: `Dinner with group — Day ${d}`, category: "Food", note: "Group dinner" }
      );
    }
  }

  // Filter to days within trip duration and mark as AI suggestions
  return activities
    .filter(a => a.day <= days)
    .map(a => ({
      ...a,
      isAiSuggestion: true,
      aiSource: "traveloop-destination-engine-v1",
    }));
};



/**
 * Parse agent itinerary description text into individual timed events.
 * Supports formats like:
 *   "06:00 AM - Pickup from Hotel"
 *   "Breakfast at 08:30"
 *   "Morning: Sightseeing at temples"
 */
const parseItineraryDescription = (dayIndex, description = "") => {
  const events = [];
  const lines = description.split("\n").filter(l => l.trim());

  // Patterns: "06:00 AM Pickup", "9:00 - Lunch", "Morning: ..."
  const timeRe = /^(\d{1,2}:\d{2}\s*(?:AM|PM)?|Morning|Afternoon|Evening|Night)\s*[-:]?\s*(.+)$/i;

  const defaultTimes = {
    morning:   "08:00",
    afternoon: "13:00",
    evening:   "18:00",
    night:     "21:00",
  };

  lines.forEach((line, idx) => {
    const match = line.trim().match(timeRe);
    if (match) {
      let rawTime = match[1].trim();
      const title = match[2].trim();
      // Resolve named periods
      const lower = rawTime.toLowerCase();
      if (defaultTimes[lower]) rawTime = defaultTimes[lower];
      events.push({ time: rawTime, title, day: dayIndex });
    } else if (line.trim()) {
      // Fallback: treat whole line as an event with a spaced default time
      const hour = 9 + (idx % 8);
      events.push({ time: `${String(hour).padStart(2, "0")}:00`, title: line.trim(), day: dayIndex });
    }
  });

  return events;
};

/**
 * Generate a smart packing checklist from the agent trip metadata.
 */
const generatePackingItems = (agentTrip) => {
  const dest     = ((agentTrip.destinations || [])[0] || "").toLowerCase();
  const category = (agentTrip.category || "").toLowerCase();
  const daysStr  = (agentTrip.duration || "").match(/(\d+)/)?.[1];
  const days     = daysStr ? parseInt(daysStr) : 3;

  const base = [
    { item: "Valid ID / Aadhaar card",      category: "Documents" },
    { item: "Booking confirmation printout", category: "Documents" },
    { item: "Travel insurance copy",         category: "Documents" },
    { item: "Emergency contact list",        category: "Documents" },
    { item: "Comfortable walking shoes",     category: "Clothing" },
    { item: "Casual t-shirts (3–4)",         category: "Clothing" },
    { item: "Sunscreen SPF 50+",             category: "Essentials" },
    { item: "Reusable water bottle",         category: "Essentials" },
    { item: "Personal medications",          category: "Health" },
    { item: "Hand sanitizer & mask",         category: "Health" },
    { item: "Power bank (10,000 mAh)",       category: "Gadgets" },
    { item: "Phone charger & cables",        category: "Gadgets" },
    { item: "Camera / GoPro",               category: "Gadgets" },
    { item: "Cash & cards",                  category: "Essentials" },
    { item: "Snacks for journey",            category: "Essentials" },
  ];

  if (dest.includes("goa") || dest.includes("bali") || dest.includes("beach") || dest.includes("maldives")) {
    base.push(
      { item: "Swimwear (2 sets)",       category: "Clothing" },
      { item: "Flip-flops / sandals",    category: "Clothing" },
      { item: "Beach towel",             category: "Essentials" },
      { item: "Waterproof phone pouch",  category: "Gadgets" },
      { item: "After-sun lotion",        category: "Health" }
    );
  }

  if (dest.includes("manali") || dest.includes("ladakh") || dest.includes("shimla") || dest.includes("ooty") || category.includes("adventure") || category.includes("mountain")) {
    base.push(
      { item: "Warm jacket / puffer",      category: "Clothing" },
      { item: "Thermal inner wear",        category: "Clothing" },
      { item: "Woolen socks & gloves",     category: "Clothing" },
      { item: "Trekking / hiking shoes",   category: "Clothing" },
      { item: "Lip balm & moisturizer",    category: "Health" },
      { item: "First-aid kit",             category: "Health" }
    );
  }

  if (category.includes("luxury") || category.includes("honeymoon")) {
    base.push(
      { item: "Formal / evening wear",  category: "Clothing" },
      { item: "Perfume / cologne",       category: "Essentials" },
      { item: "Dress shoes",             category: "Clothing" }
    );
  }

  if (category.includes("pilgrim") || category.includes("religious")) {
    base.push(
      { item: "Traditional / modest clothing", category: "Clothing" },
      { item: "Comfortable sandals",            category: "Clothing" },
      { item: "Prayer accessories",             category: "Essentials" }
    );
  }

  if (days >= 7) {
    base.push(
      { item: "Laundry bag",             category: "Essentials" },
      { item: "Travel-size detergent",   category: "Essentials" }
    );
  }

  return base;
};

/**
 * Clone all agent-trip data into a traveler's personal Trip workspace:
 * - Creates Trip document
 * - Clones itinerary day entries as Itinerary documents
 * - Seeds Budget document
 * - Seeds Checklist (packing) documents
 * Returns the created userTrip.
 */
const cloneAgentTripToUserTrip = async (booking, agentTrip, userId, totalAmount) => {
  const destination = (agentTrip.destinations || [])[0] || agentTrip.title || "Trip";

  // 1. Create the personal Trip record
  const userTrip = await Trip.create({
    user:               userId,
    owner:              userId,
    bookingId:          booking._id,
    agentTrip:          agentTrip._id,
    tripType:           "booked",
    createdFromBooking: true,
    status:             "planning",
    title:              agentTrip.title,
    destination:        destination,
    startDate:          agentTrip.startDate  || null,
    endDate:            agentTrip.endDate    || null,
    budget:             totalAmount,
    travelers:          booking.seats        || 1,
    image:              agentTrip.coverImage || "",
    description:        agentTrip.shortDescription || agentTrip.description || "",
  });

  // 2. Clone itinerary items from agent schedule
  if (agentTrip.itinerary && agentTrip.itinerary.length > 0) {
    const itineraryDocs = [];
    agentTrip.itinerary.forEach((dayEntry) => {
      const dayIndex = dayEntry.day || 1;
      const parsedEvents = parseItineraryDescription(dayIndex, dayEntry.description);
      if (parsedEvents.length > 0) {
        parsedEvents.forEach(evt => {
          itineraryDocs.push({
            trip:     userTrip._id,
            day:      dayIndex,
            time:     evt.time,
            title:    evt.title,
            category: "Activity",
            note:     dayEntry.title || "",
          });
        });
      } else {
        // No parseable events — create one entry for the day using the title
        itineraryDocs.push({
          trip:     userTrip._id,
          day:      dayIndex,
          time:     "09:00",
          title:    dayEntry.title || `Day ${dayIndex}`,
          category: "Activity",
          note:     dayEntry.description || "",
        });
      }
    });
    if (itineraryDocs.length > 0) {
      await Itinerary.insertMany(itineraryDocs);
    }
  } else {
    // No agent itinerary: create a default day 1 plan
    await Itinerary.create({
      trip:     userTrip._id,
      day:      1,
      time:     "09:00",
      title:    `Departure to ${destination}`,
      category: "Transport",
      note:     agentTrip.pickupLocation ? `Pickup from: ${agentTrip.pickupLocation}` : "",
    });
  }

  // 3. Seed Budget document
  await Budget.create({
    userId:          userId,
    tripId:          userTrip._id,
    budgetName:      `${agentTrip.title} — Package Budget`,
    totalBudget:     totalAmount,
    plannedExpense:  totalAmount,
    actualExpense:   0,
    remainingBudget: totalAmount,
    currency:        "INR",
    isActive:        true,
    categories: {
      accommodation: { planned: Math.round(totalAmount * 0.35), actual: 0 },
      food:          { planned: Math.round(totalAmount * 0.20), actual: 0 },
      transport:     { planned: Math.round(totalAmount * 0.25), actual: 0 },
      activities:    { planned: Math.round(totalAmount * 0.10), actual: 0 },
      shopping:      { planned: Math.round(totalAmount * 0.05), actual: 0 },
      others:        { planned: Math.round(totalAmount * 0.05), actual: 0 },
    },
  });

  // 4. Seed Checklist (packing suggestions)
  const packingItems = generatePackingItems(agentTrip);
  if (packingItems.length > 0) {
    await Checklist.insertMany(
      packingItems.map(p => ({
        trip:     userTrip._id,
        item:     p.item,
        category: p.category,
        checked:  false,
      }))
    );
  }

  // 5. Seed AI-suggested activities based on destination
  try {
    const daysStr = (agentTrip.duration || "").match(/(\d+)/)?.[1];
    const tripDays = daysStr ? parseInt(daysStr) : 1;
    const aiActivities = generateAISuggestedActivities(destination, tripDays);
    if (aiActivities.length > 0) {
      await Itinerary.insertMany(
        aiActivities.map(a => ({
          trip:           userTrip._id,
          day:            a.day,
          time:           a.time,
          title:          a.title,
          category:       a.category,
          note:           a.note,
          isAiSuggestion: true,
          aiSource:       a.aiSource || "traveloop-destination-engine-v1",
        }))
      );
      console.log(`[AI Activities] Seeded ${aiActivities.length} suggestions for "${destination}"`);
    }
  } catch (aiErr) {
    // Non-fatal: log and continue
    console.warn("[AI Activities] Failed to seed AI suggestions:", aiErr.message);
  }

  return userTrip;
};


const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking and update trip occupancy counters
// @access  Private (Traveler)
router.post("/", protect, async (req, res) => {
    const {
      tripId,
      maleCount = 0,
      femaleCount = 0,
      adults = 1,
      children = 0,
      travellers = [],
      pickupLocation = "",
      totalAmount = 0,
      seatNumbers = [],
    } = req.body;

    if (!tripId) {
      return res.status(400).json({ success: false, message: "tripId is required" });
    }

    if (!travellers || travellers.length === 0) {
      return res.status(400).json({ success: false, message: "At least one traveller details required" });
    }

    try {
      const trip = await AgentTrip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      const totalTravellers = travellers.length;
      if (trip.availableSeats < totalTravellers) {
        return res.status(400).json({ success: false, message: "Not enough available seats left on this trip" });
      }

      const bookingId = `TLP-${Math.floor(10000 + Math.random() * 90000)}`;

      // Fetch Agent to calculate custom/default commission
      const agent = await Agent.findById(trip.agent);
      const defaultCommSetting = await SystemSetting.findOne({ key: "default_commission" });
      const defaultRate = defaultCommSetting ? defaultCommSetting.value : 10;
      const commissionRate = agent ? (agent.commissionRate !== undefined ? agent.commissionRate : defaultRate) : defaultRate;

      const commissionAmount = totalAmount * (commissionRate / 100);
      const gatewayFee = totalAmount * 0.02; // 2% gateway charge
      const agentAmount = totalAmount - commissionAmount - gatewayFee;

      const booking = await Booking.create({
        bookingId,
        // Compatibility fields for single-traveler views
        travelerName: travellers[0].name,
        gender: travellers[0].gender,
        contactNumber: travellers[0].phone || req.user.phone || req.user.email,
        age: travellers[0].age,
        seats: totalTravellers,
        seatNumbers, // Selected seat numbers array

        // Statuses
        paymentStatus: "Paid",
        status: "Paid", // Paid status corresponds to traveler-paid but not yet settled

        // References
        agentTrip: trip._id,
        tripId: trip._id,
        agent: trip.agent,
        userId: req.user._id,

        // Group lists
        travellers,
        maleCount: Number(maleCount),
        femaleCount: Number(femaleCount),
        adults: Number(adults),
        children: Number(children),

        // Price paid
        pricePaid: totalAmount,
        amount: totalAmount,
        amountPaid: totalAmount,
        commissionAmount,
        gatewayFee,
        agentAmount,
      });

      // Update trip occupancy & seats counters
      trip.bookedSeats = (trip.bookedSeats || 0) + totalTravellers;
      trip.availableSeats = Math.max(0, trip.availableSeats - totalTravellers);
      trip.maleCount = (trip.maleCount || 0) + Number(maleCount);
      trip.femaleCount = (trip.femaleCount || 0) + Number(femaleCount);
      trip.childrenCount = (trip.childrenCount || 0) + Number(children);

      await trip.save();

      // Update Agent wallet pendingRevenue
      if (agent) {
        agent.revenue = (agent.revenue || 0) + totalAmount;
        agent.totalRevenue = (agent.totalRevenue || 0) + totalAmount;
        agent.pendingRevenue = (agent.pendingRevenue || 0) + agentAmount;
        agent.totalBookings = (agent.totalBookings || 0) + 1;
        await agent.save();
      }

      // Create Admin Notification
      try {
        await AdminNotification.create({
          title: "New Booking Confirmed",
          message: `Traveler ${travellers[0]?.name || req.user.firstName} booked trip '${trip.title}' for ₹${totalAmount}`,
          type: "booking",
        });
      } catch (notifErr) {
        console.warn("Failed to create admin notification:", notifErr.message);
      }

      // ── CLONE: Generate personal trip workspace from this booking ──────────
      let userTrip = null;
      try {
        userTrip = await cloneAgentTripToUserTrip(booking, trip, req.user._id, totalAmount);
        // Link the created trip back to the booking
        booking.userTripId = userTrip._id;
        await booking.save();
      } catch (cloneErr) {
        // Non-fatal: booking succeeded even if cloning partially fails
        console.warn("[Create Booking] Personal trip clone warning:", cloneErr.message);
      }

      res.status(201).json({
        success: true,
        bookingId,
        booking,
        userTripId: userTrip ? userTrip._id : null,
      });
  } catch (error) {
    console.error("[Create Booking] Error:", error);
    res.status(500).json({ success: false, message: "Server Error processing trip booking" });
  }
});

// @route   GET /api/bookings/my-bookings
// @desc    Get all bookings for the authenticated traveler user (with full trip data)
// @access  Private (Traveler)
router.get("/my-bookings", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id,
      paymentStatus: { $in: ["paid", "Paid"] },
      status: { $ne: "deleted" }
    })
      .populate({
        path: "agentTrip",
        select: [
          "title", "subtitle", "shortDescription", "description",
          "destinations", "originCity", "duration", "startDate", "endDate",
          "departureTime", "arrivalTime", "coverImage", "gallery",
          "busType", "busName", "busNumber", "busImages",
          "driverName", "driverPhone", "driverAlternateMobile", "driverPhoto", "driverLicenseNumber", "driverExperience",
          "pickupLocation", "dropPoint", "emergencyContact",
          "hotelName", "hotelRating", "roomType",
          "mealsIncluded", "includedServices", "excludedServices",
          "cancellationPolicy", "termsConditions",
          "itinerary", "category",
          "originalPrice", "offerPrice", "discountPercentage",
          "totalSeats", "availableSeats", "bookedSeats",
          "seatLayoutImage", "status", "publishedAt",
          "agent", "boardingStatus", "boardingOpenedAt", "boardingClosesAt",
        ].join(" "),
        populate: {
          path: "agent",
          select: "companyName displayName logoUrl phone email",
        },
      })
      .sort({ createdAt: -1 });

    const bookingsWithBoardingAvailability = bookings.map(b => {
      const bObj = b.toObject();
      bObj.boardingAvailable = b.agentTrip && b.agentTrip.boardingStatus === "OPEN";
      return bObj;
    });

    res.status(200).json({
      success: true,
      bookings: bookingsWithBoardingAvailability,
    });
  } catch (error) {
    console.error("[My Bookings] Error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving bookings" });
  }
});

// @route   PUT /api/bookings/:bookingId/notes
// @desc    Update personal notes on a traveler's booking
// @access  Private (Traveler)
router.put("/:bookingId/notes", protect, async (req, res) => {
  try {
    const { notes } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.personalNotes = notes || "";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Notes updated successfully",
      personalNotes: booking.personalNotes,
    });
  } catch (error) {
    console.error("[Update Notes] Error:", error);
    res.status(500).json({ success: false, message: "Server Error updating notes" });
  }
});

// @route   GET /api/bookings/:bookingId/user-trip
// @desc    Get the personal Trip linked to a booking (for in-depth planner access)
// @access  Private (Traveler)
router.get("/:bookingId/user-trip", protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user._id,
    })
      .populate("agentTrip")
      .populate("agent")
      .populate("driver")
      .populate("seat")
      .populate("userTripId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const boardingPass = await BoardingPass.findOne({
      booking: booking._id,
      agentTrip: booking.agentTrip?._id || booking.tripId
    }).populate("driver");

    res.status(200).json({
      success: true,
      booking,
      trip: booking.agentTrip || null,
      driver: booking.driver || null,
      seat: booking.seat || null,
      boardingPass: boardingPass || null,
      agency: booking.agent || null,
      userTrip: booking.userTripId || null,
      boardingAvailable: booking.agentTrip && booking.agentTrip.boardingStatus === "OPEN",
    });
  } catch (error) {
    console.error("[Booking User Trip] Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @route   POST /api/bookings/:bookingId/cancel
// @desc    Cancel booking and release seats, refund/wallet adjust
// @access  Private (Traveler)
router.post("/:bookingId/cancel", protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.status === "cancelled" || booking.paymentStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }

    const trip = await AgentTrip.findById(booking.agentTrip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Check cancellation deadline
    const allowCancellation = trip.allowCancellation !== false;
    if (!allowCancellation) {
      return res.status(400).json({ success: false, message: "Cancellation not allowed for this trip." });
    }

    if (trip.cancellationUntilDate) {
      const timePart = trip.cancellationUntilTime || "18:00";
      // Construct date string safely in local time or simple date comparison
      const deadlineStr = `${trip.cancellationUntilDate}T${timePart}:00`;
      const deadline = new Date(deadlineStr);
      if (new Date() > deadline) {
        return res.status(400).json({ success: false, message: "Cancellation window expired." });
      }
    }

    // Update Booking status
    booking.status = "cancelled";
    booking.paymentStatus = "Cancelled";
    booking.cancelReason = req.body.reason || "Cancelled by traveler";
    await booking.save();

    // Release seats
    trip.bookedSeats = Math.max(0, (trip.bookedSeats || 0) - booking.seats);
    trip.availableSeats = (trip.availableSeats || 0) + booking.seats;
    trip.maleCount = Math.max(0, (trip.maleCount || 0) - (booking.maleCount || 0));
    trip.femaleCount = Math.max(0, (trip.femaleCount || 0) - (booking.femaleCount || 0));
    trip.childrenCount = Math.max(0, (trip.childrenCount || 0) - (booking.childrenCount || 0));
    await trip.save();

    // Deduct agent wallet
    const agent = await Agent.findById(booking.agent);
    if (agent) {
      agent.revenue = Math.max(0, (agent.revenue || 0) - booking.pricePaid);
      agent.pendingRevenue = Math.max(0, (agent.pendingRevenue || 0) - booking.agentAmount);
      await agent.save();
    }

    // Cancel linked personal Trip
    if (booking.userTripId) {
      const userTrip = await Trip.findById(booking.userTripId);
      if (userTrip) {
        userTrip.status = "cancelled";
        await userTrip.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("[Cancel Booking] Error:", error);
    res.status(500).json({ success: false, message: "Server Error cancelling booking" });
  }
});

// @route   GET /api/bookings/my
// @desc    Get user confirmed bookings populated with trip, agent, driver, seat
// @access  Private (Traveler)
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id,
      paymentStatus: { $in: ["paid", "Paid"] },
      status: { $ne: "deleted" }
    })
      .populate("trip")
      .populate("agent")
      .populate("driver")
      .populate("seat")
      .populate("agentTrip")
      .populate("userTripId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("[Get Confirmed Bookings] Error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving bookings" });
  }
});

export default router;

