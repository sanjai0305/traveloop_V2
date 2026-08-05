import crypto from "crypto";
import supabase from "../config/supabase.js";
import { triggerNotification } from "../controllers/notificationController.js";

const generateBookingId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randStr = "";
  for (let i = 0; i < 6; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TL-${dateStr}-${randStr}`;
};

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
    const key = Object.keys(DESTINATION_ACTIVITIES).find(k => norm.includes(k));
    base = key ? DESTINATION_ACTIVITIES[key] : null;
  }
  if (!base) {
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

const cloneAgentTripToUserTrip = async (booking, agentTrip, userId, totalAmount) => {
  const destination = agentTrip.destination || agentTrip.title || "Trip";

  const { data: newTrip, error: tripErr } = await supabase
    .from("trips")
    .insert([{
      user_id: userId,
      title: agentTrip.title,
      destination,
      start_date: agentTrip.start_date || null,
      end_date: agentTrip.end_date || null,
      budget_total: totalAmount,
      cover_image: agentTrip.thumbnail || "",
      status: "PLANNED",
    }])
    .select()
    .single();

  if (tripErr || !newTrip) {
    console.warn("[Clone Trip Notice] Failed to create user trip:", tripErr?.message);
    return null;
  }

  const userTrip = { ...newTrip, _id: newTrip.id };

  // Clone itinerary
  await supabase.from("itineraries").insert([{
    trip_id: userTrip.id,
    day: 1,
    title: `Departure to ${destination}`,
    description: agentTrip.pickup_points ? `Pickup location set` : "",
  }]);

  // Seed Budget
  await supabase.from("budgets").insert([{
    trip_id: userTrip.id,
    user_id: userId,
    total_budget: totalAmount,
  }]);

  // Seed Checklist
  const packingItems = generatePackingItems(agentTrip);
  if (packingItems.length > 0) {
    const checkListInserts = packingItems.map(p => ({
      trip_id: userTrip.id,
      user_id: userId,
      items: [{ item: p.item, category: p.category, checked: false }],
    }));
    await supabase.from("checklists").insert(checkListInserts);
  }

  return userTrip;
};

export class BookingService {
  static async createBooking(payload) {
    const {
      tripId,
      userId,
      travellers = [],
      seats,
      seatNumbers = [],
      totalAmount = 0,
      paymentStatus = "Paid",
      bookingStatus = "confirmed",
      pickupPoint = null,
      transactionId = null,
      discountAmount = 0,
      finalAmount = totalAmount,
    } = payload;

    const { data: agentTrip } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    if (!agentTrip) {
      throw new Error("Agent trip package not found");
    }

    const bookingCode = generateBookingId();
    const finalPassengers = travellers.length > 0 ? travellers : [{ name: "Traveler 1", age: 25, gender: "Male" }];
    const count = finalPassengers.length;

    const { data: booking, error: bkgErr } = await supabase
      .from("bookings")
      .insert([{
        booking_code: bookingCode,
        user_id: userId,
        agent_trip_id: tripId,
        agent_id: agentTrip.agent_id,
        passenger_count: count,
        passengers: finalPassengers,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        payment_status: paymentStatus.toUpperCase(),
        booking_status: bookingStatus.toUpperCase(),
        pickup_point: pickupPoint || {},
        seats: seatNumbers.length > 0 ? seatNumbers : (seats || []),
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${bookingCode}`,
      }])
      .select()
      .single();

    if (bkgErr || !booking) {
      throw new Error(`Failed to create booking: ${bkgErr?.message}`);
    }

    const bookingObj = { ...booking, _id: booking.id, bookingId: booking.id };

    // Update seat counts
    const newSlots = Math.max(0, (agentTrip.available_slots || 20) - count);
    await supabase
      .from("agent_trips")
      .update({ available_slots: newSlots })
      .eq("id", tripId);

    // Update Agent balance
    if (agentTrip.agent_id) {
      const { data: agent } = await supabase
        .from("agents")
        .select("wallet_balance")
        .eq("id", agentTrip.agent_id)
        .maybeSingle();

      if (agent) {
        const newBal = (Number(agent.wallet_balance) || 0) + Number(finalAmount);
        await supabase
          .from("agents")
          .update({ wallet_balance: newBal })
          .eq("id", agentTrip.agent_id);
      }
    }

    // Clone trip to user planner
    let clonedTrip = null;
    try {
      clonedTrip = await cloneAgentTripToUserTrip(bookingObj, agentTrip, userId, finalAmount);
    } catch (err) {
      console.warn("[Booking Service] Trip clone warning:", err.message);
    }

    // Trigger Notification
    try {
      await triggerNotification({
        userId,
        title: "🎉 Booking Confirmed!",
        message: `Your trip to ${agentTrip.destination || agentTrip.title} has been confirmed. Booking Code: ${bookingCode}`,
        type: "BOOKING_CONFIRMED",
        data: { bookingId: booking.id, bookingCode },
      });
    } catch (nErr) {
      console.warn("[Booking Notification Notice]", nErr.message);
    }

    return {
      success: true,
      booking: bookingObj,
      clonedTrip,
    };
  }
}

export default BookingService;
