import express from "express";
import protect from "../middleware/authMiddleware.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

const isUUID = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Destination-based smart activity suggestion engine.
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
  ]
};

const generateAISuggestedActivities = (dest, days) => {
  const norm = (dest || "").toLowerCase().trim();
  let base = DESTINATION_ACTIVITIES[norm];
  if (!base) {
    // Check partial matches
    const key = Object.keys(DESTINATION_ACTIVITIES).find(k => norm.includes(k));
    base = key ? DESTINATION_ACTIVITIES[key] : null;
  }
  if (!base) {
    // generic fallback
    base = [
      { day: 1, time: "09:00", title: `Explore main spots in ${dest}`, category: "Sightseeing", note: "Enjoy the local views and landmarks" },
      { day: 1, time: "13:00", title: "Lunch at highly-rated restaurant", category: "Food", note: "Try local authentic dishes" },
      { day: 1, time: "16:00", title: "Evening walk & market shopping", category: "Activity", note: "Pick up local souvenirs and explore streets" },
      { day: 2, time: "09:00", title: "Local cultural tour", category: "Sightseeing", note: "Visit museums or historical landmarks nearby" },
    ];
  }
  return base.filter(a => a.day <= days);
};

const generatePackingItems = (agentTrip) => {
  const dest = (agentTrip.title || "").toLowerCase();
  const list = [
    { item: "ID Card / Ticket printout", category: "Documents" },
    { item: "Phone Charger & Powerbank", category: "Electronics" },
    { item: "Toiletries Kit", category: "Toiletries" },
    { item: "Comfortable clothes", category: "Clothes" },
  ];
  if (dest.includes("yercaud") || dest.includes("hill") || dest.includes("ooty")) {
    list.push({ item: "Warm jacket / Sweater", category: "Clothes" });
    list.push({ item: "Motion sickness pills", category: "Health" });
  }
  return list;
};

const parseItineraryDescription = (day, desc) => {
  if (!desc) return [];
  const lines = desc.split("\n");
  const events = [];
  lines.forEach(line => {
    const timeMatch = line.match(/^(\d{2}:\d{2})\s*[:-]?\s*(.*)/);
    if (timeMatch) {
      events.push({
        time: timeMatch[1],
        title: timeMatch[2].trim(),
      });
    }
  });
  return events;
};

const cloneAgentTripToUserTrip = async (booking, agentTrip, userId, totalAmount) => {
  const destination = (agentTrip.destinations || [])[0] || agentTrip.title || "Trip";

  const { data: userTripRow, error: tripErr } = await supabase
    .from("trips")
    .select("*")
    .eq("id", booking.id) // Mock link user trip ID
    .maybeSingle();

  const { data: newTrip, error: createTripErr } = await supabase
    .from("trips")
    .insert([{
      userId,
      image: agentTrip.coverImage || "",
      title: agentTrip.title,
      destination,
      startDate: agentTrip.startDate || null,
      endDate: agentTrip.endDate || null,
      budget: totalAmount,
      isPublic: false,
      status: "planning",
    }])
    .select()
    .single();

  if (createTripErr) throw createTripErr;

  const userTrip = { ...newTrip, _id: newTrip.id };

  // Clone itinerary
  const { data: newItinerary } = await supabase
    .from("itineraries")
    .insert([{
      tripId: userTrip._id,
      day: 1,
      title: `Departure to ${destination}`,
      description: agentTrip.pickupLocation ? `Pickup from: ${agentTrip.pickupLocation}` : "",
    }])
    .select();

  // Seed Budget
  await supabase
    .from("budgets")
    .insert([{
      tripId: userTrip._id,
      totalBudget: totalAmount,
      isArchived: false,
      isActive: true,
    }]);

  // Seed Checklist
  const packingItems = generatePackingItems(agentTrip);
  if (packingItems.length > 0) {
    const checkListInserts = packingItems.map(p => ({
      tripId: userTrip._id,
      userId,
      itemName: p.item,
      category: p.category,
      packed: false,
    }));
    await supabase.from("checklists").insert(checkListInserts);
  }

  // Seed AI suggested activities
  try {
    const daysStr = (agentTrip.duration || "").match(/(\d+)/)?.[1];
    const tripDays = daysStr ? parseInt(daysStr) : 1;
    const aiActivities = generateAISuggestedActivities(destination, tripDays);
    if (aiActivities.length > 0) {
      const aiInserts = aiActivities.map(a => ({
        tripId: userTrip._id,
        day: a.day,
        title: a.title,
        description: a.note || "",
        isAiSuggestion: true,
        aiSource: a.aiSource || "traveloop-destination-engine-v1",
      }));
      await supabase.from("itineraries").insert(aiInserts);
    }
  } catch (aiErr) {
    console.warn("[AI Activities] Failed to seed AI suggestions:", aiErr.message);
  }

  return userTrip;
};

// ─── ENDPOINTS ───────────────────────────────────────────────────────────────

// POST /api/bookings
router.post("/", protect, async (req, res) => {
  const {
    tripId,
    maleCount = 0,
    femaleCount = 0,
    adults = 1,
    children = 0,
    travellers = [],
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
    const { data: trip } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const totalTravellers = travellers.length;
    const bookingId = `TLP-${Math.floor(10000 + Math.random() * 90000)}`;

    const commissionAmount = totalAmount * 0.10;
    const gatewayFee = totalAmount * 0.02;
    const agentAmount = totalAmount - commissionAmount - gatewayFee;

    const { data: newBooking, error: bookingErr } = await supabase
      .from("bookings")
      .insert([{
        bookingId,
        userId: req.user.id,
        tripId: trip.id,
        seats: totalTravellers,
        pricePaid: totalAmount,
        paymentStatus: "Paid",
        boardingStatus: "Pending",
        assignedSeat: seatNumbers[0] || "",
        token: "",
      }])
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    const booking = { ...newBooking, _id: newBooking.id, agentTrip: newBooking.tripId };

    // Update trip seats counters (simulated database updates on agent_trips)
    await supabase
      .from("agent_trips")
      .update({
        boardingStatus: trip.boardingStatus,
      })
      .eq("id", tripId);

    // Clone agent trip to personal user planner trip workspace
    let userTrip = null;
    try {
      userTrip = await cloneAgentTripToUserTrip(booking, trip, req.user.id, totalAmount);
    } catch (cloneErr) {
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

// GET /api/bookings/my-bookings
router.get("/my-bookings", protect, async (req, res) => {
  try {
    const { data: bookingsList } = await supabase
      .from("bookings")
      .select("*")
      .eq("userId", req.user.id);

    const bookings = (bookingsList || []).map(b => ({
      ...b,
      _id: b.id,
      agentTrip: {
        _id: b.tripId,
        title: "Yercaud Trip",
        boardingStatus: "CLOSED",
      },
    }));

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("[My Bookings] Error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving bookings" });
  }
});

// PUT /api/bookings/:bookingId/notes
router.put("/:bookingId/notes", protect, async (req, res) => {
  try {
    const { notes } = req.body;
    const { bookingId } = req.params;

    const { data: bookingRow } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("userId", req.user.id)
      .maybeSingle();

    if (!bookingRow) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const { data: updatedBooking } = await supabase
      .from("bookings")
      .update({ assignedSeat: notes || "" })
      .eq("id", bookingId)
      .select()
      .single();

    res.status(200).json({
      success: true,
      message: "Notes updated successfully",
      personalNotes: notes || "",
    });
  } catch (error) {
    console.error("[Update Notes] Error:", error);
    res.status(500).json({ success: false, message: "Server Error updating notes" });
  }
});

// GET /api/bookings/:bookingId/user-trip
router.get("/:bookingId/user-trip", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { data: bookingRow } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("userId", req.user.id)
      .maybeSingle();

    if (!bookingRow) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const { data: trip } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", bookingRow.tripId)
      .maybeSingle();

    const booking = {
      ...bookingRow,
      _id: bookingRow.id,
      agentTrip: trip ? { ...trip, _id: trip.id } : null,
    };

    res.status(200).json({
      success: true,
      booking,
      trip: booking.agentTrip || null,
      driver: null,
      seat: null,
      boardingPass: null,
      agency: null,
      userTrip: null,
      boardingAvailable: booking.agentTrip && booking.agentTrip.boardingStatus === "OPEN",
    });
  } catch (error) {
    console.error("[Booking User Trip] Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// POST /api/bookings/:bookingId/cancel
router.post("/:bookingId/cancel", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("userId", req.user.id)
      .maybeSingle();

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.paymentStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }

    const { data: updatedBooking } = await supabase
      .from("bookings")
      .update({ paymentStatus: "Cancelled" })
      .eq("id", bookingId)
      .select()
      .single();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking: {
        ...updatedBooking,
        _id: updatedBooking.id,
      },
    });
  } catch (error) {
    console.error("[Cancel Booking] Error:", error);
    res.status(500).json({ success: false, message: "Server Error cancelling booking" });
  }
});

// GET /api/bookings/my
router.get("/my", protect, async (req, res) => {
  try {
    const { data: bookingsList } = await supabase
      .from("bookings")
      .select("*")
      .eq("userId", req.user.id)
      .neq("paymentStatus", "Cancelled");

    const bookings = (bookingsList || []).map(b => ({
      ...b,
      _id: b.id,
      agentTrip: {
        _id: b.tripId,
        title: "Yercaud Weekend Escapade",
        boardingStatus: "CLOSED",
      },
    }));

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
