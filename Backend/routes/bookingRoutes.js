import express from "express";
import Razorpay from "razorpay";
import supabase from "../config/supabase.js";
import protect from "../middleware/authMiddleware.js";
import BookingService from "../services/BookingService.js";

const router = express.Router();

// POST /api/bookings/create-order & POST /api/bookings/create
const handleCreateBookingOrder = async (req, res) => {
  try {
    console.log("=================== INCOMING BOOKING REQUEST ===================");
    console.log("User:", req.user?.id || req.user?.email);
    console.log("Payload:", JSON.stringify(req.body, null, 2));
    console.log("================================================================");

    const userId = req.user.id;
    const { tripId, totalAmount = 1000, travellers = [], seatNumbers = [] } = req.body;

    // Fetch trip details from Supabase
    const { data: trip } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    const price = trip?.price_per_person || totalAmount;
    const seatsCount = seatNumbers.length || travellers.length || 1;
    const computedTotal = req.body.totalAmount || (price * seatsCount);

    // Insert booking draft into Supabase
    const { data: bookingDraft, error: draftErr } = await supabase
      .from("bookings")
      .insert([{
        user_id: userId,
        agent_trip_id: tripId,
        total_amount: computedTotal,
        final_amount: computedTotal,
        booking_status: "DRAFT",
        payment_status: "PENDING",
        booking_code: `TLP-${Date.now()}`,
      }])
      .select()
      .single();

    if (draftErr) {
      console.error("❌ [Booking Draft Error]:", draftErr);
      throw draftErr;
    }

    let orderId = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const amountPaise = Math.round(computedTotal * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

    if (keyId && keySecret && keyId !== "rzp_test_dummykeyid") {
      try {
        const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const rzpOrder = await instance.orders.create({
          amount: amountPaise,
          currency: "INR",
          receipt: `rcpt_${bookingDraft.id.slice(0, 8)}_${Date.now()}`,
          notes: {
            bookingId: bookingDraft.id,
            userId: userId,
            tripId: tripId || "",
          },
        });
        orderId = rzpOrder.id;
        console.log("✅ [Razorpay Live/Test Order Created via SDK]:", rzpOrder);
      } catch (rzpErr) {
        console.warn("⚠️ [Razorpay Order SDK Warning - Falling back to mock order]:", rzpErr.message);
      }
    }

    const responsePayload = {
      success: true,
      bookingDraftId: bookingDraft.id,
      bookingId: bookingDraft.booking_code || bookingDraft.id,
      booking: bookingDraft,
      orderId,
      amount: computedTotal,
      amountPaise,
      currency: "INR",
      razorpayKey: keyId || "rzp_test_dummykeyid",
    };

    console.log("=================== CREATED BOOKING ORDER RESPONSE ===================");
    console.log(JSON.stringify(responsePayload, null, 2));
    console.log("======================================================================");

    res.status(201).json(responsePayload);
  } catch (error) {
    console.error("❌ [Create Order Error]:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create booking order" });
  }
};

router.post("/create-order", protect, handleCreateBookingOrder);
router.post("/create", protect, handleCreateBookingOrder);

// GET /api/bookings/my-bookings & /api/bookings/my
const handleGetMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: rows, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const bookings = (rows || []).map((b) => ({
      ...b,
      _id: b.id,
      bookingId: b.booking_code || b.id,
      totalAmount: b.total_amount,
      finalAmount: b.final_amount,
      bookingStatus: b.booking_status,
      paymentStatus: b.payment_status,
      qrCode: b.qr_code_url,
    }));

    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.get("/my-bookings", protect, handleGetMyBookings);
router.get("/my", protect, handleGetMyBookings);
router.get("/user", protect, handleGetMyBookings);
router.get("/", protect, handleGetMyBookings);

// GET /api/bookings/ticket/:bookingId  — Booking Success page
// GET /api/bookings/details/:bookingId — alias
const handleGetBookingTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log(`[Booking Ticket] Fetching ticket for ID: ${bookingId}`);

    // Fetch booking (by UUID or booking_code)
    const { data: b, error: bErr } = await supabase
      .from("bookings")
      .select("*")
      .or(`id.eq.${bookingId},booking_code.eq.${bookingId}`)
      .maybeSingle();

    if (bErr) {
      console.error("[Booking Ticket] Supabase error:", bErr);
      return res.status(500).json({ success: false, message: bErr.message });
    }

    if (!b) {
      console.warn(`[Booking Ticket] No booking found for ID: ${bookingId}`);
      return res.status(404).json({ success: false, message: `Booking not found for ID: ${bookingId}` });
    }

    console.log(`[Booking Ticket] Found booking:`, { id: b.id, code: b.booking_code, status: b.booking_status, agentTripId: b.agent_trip_id });

    // Fetch related trip info
    let tripTitle = "Your Trip";
    let startDate = null;
    let pickupLocation = "";
    if (b.agent_trip_id) {
      const { data: trip } = await supabase
        .from("agent_trips")
        .select("title, start_date, pickup_location")
        .eq("id", b.agent_trip_id)
        .maybeSingle();
      if (trip) {
        tripTitle = trip.title || tripTitle;
        startDate = trip.start_date || null;
        pickupLocation = trip.pickup_location || "";
      }
    }

    // Fetch passengers linked to this booking
    const { data: passengerRows } = await supabase
      .from("passengers")
      .select("*")
      .eq("booking_id", b.id);

    const passengers = (passengerRows || []).map((p) => ({
      ...p,
      seatNumber: p.seat_number || p.seatNumber || "N/A",
      name: p.name || p.passenger_name || "",
    }));

    const booking = {
      ...b,
      _id: b.id,
      bookingId: b.booking_code || b.id,
      totalAmount: b.total_amount,
      finalAmount: b.final_amount,
      bookingStatus: b.booking_status,
      paymentStatus: b.payment_status,
      qrCode: b.qr_code_url,
      tripTitle,
      startDate,
      pickupLocation,
    };

    res.json({ success: true, booking, passengers });
  } catch (error) {
    console.error("[Booking Ticket] Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

router.get("/ticket/:bookingId", protect, handleGetBookingTicket);
router.get("/details/:bookingId", protect, handleGetBookingTicket);

// ── Shared helper: look up a booking by UUID or booking_code safely ────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const findBookingById = async (rawId) => {
  // Detect whether it looks like a UUID
  const isUuid = UUID_RE.test(rawId);

  if (isUuid) {
    // Try UUID first, then fallback to booking_code
    const { data: byUuid } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", rawId)
      .maybeSingle();
    if (byUuid) return byUuid;
  }

  // Always try booking_code (safe for TLP-... strings)
  const { data: byCode } = await supabase
    .from("bookings")
    .select("*")
    .eq("booking_code", rawId)
    .maybeSingle();
  return byCode || null;
};

// ── Enrich a raw booking row with trip + passengers ────────────────────────
const enrichBooking = async (b) => {
  let agentTrip = null;
  let tripTitle = "Your Trip";
  let startDate = null;
  let pickupLocation = "";

  if (b.agent_trip_id) {
    const { data: trip } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", b.agent_trip_id)
      .maybeSingle();

    if (trip) {
      agentTrip = {
        ...trip,
        _id: trip.id,
        title: trip.title,
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        pricePerPerson: trip.price_per_person,
        availableSeats: trip.available_seats,
        totalSlots: trip.total_slots,
        busType: trip.bus_type,
        busAmenities: trip.bus_amenities,
        hotelName: trip.hotel_name,
        hotelRating: trip.hotel_rating,
        itinerary: trip.itinerary || [],
        images: trip.images || [],
        thumbnail: trip.thumbnail,
        inclusions: trip.inclusions || [],
        exclusions: trip.exclusions || [],
        pickupLocation: trip.pickup_location || "",
        status: trip.status,
        duration: trip.duration_days ? `${trip.duration_days}D/${trip.duration_nights || trip.duration_days - 1}N` : "",
      };
      tripTitle = trip.title || tripTitle;
      startDate = trip.start_date;
      pickupLocation = trip.pickup_location || "";
    }
  }

  const { data: passengerRows } = await supabase
    .from("passengers")
    .select("*")
    .eq("booking_id", b.id);

  const passengers = (passengerRows || []).map((p) => ({
    ...p,
    _id: p.id,
    seatNumber: p.seat_number || p.seatNumber || "N/A",
    name: p.name || p.passenger_name || "",
  }));

  return {
    ...b,
    _id: b.id,
    bookingId: b.booking_code || b.id,
    totalAmount: b.total_amount,
    finalAmount: b.final_amount,
    bookingStatus: b.booking_status,
    paymentStatus: b.payment_status,
    status: b.booking_status,
    qrCode: b.qr_code_url,
    agentTrip,
    tripTitle,
    startDate,
    pickupLocation,
    passengers,
    seatNumbers: passengers.map((p) => p.seatNumber),
  };
};

// GET /api/bookings/:id  — by UUID or booking_code
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Booking GET /:id] Looking up: ${id}`);

    const b = await findBookingById(id);
    if (!b) {
      console.warn(`[Booking GET /:id] Not found for: ${id}`);
      return res.status(404).json({ success: false, message: `Booking not found: ${id}` });
    }

    const booking = await enrichBooking(b);
    console.log(`[Booking GET /:id] Found: ${b.id} | code: ${b.booking_code} | status: ${b.booking_status}`);
    res.json({ success: true, booking });
  } catch (error) {
    console.error(`[Booking GET /:id] Error:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/bookings/:id/user-trip  — fallback used by BookedPackageDetail
router.get("/:id/user-trip", protect, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Booking GET /:id/user-trip] Looking up: ${id}`);

    const b = await findBookingById(id);
    if (!b) {
      console.warn(`[Booking GET /:id/user-trip] Not found for: ${id}`);
      return res.status(404).json({ success: false, message: `Booking not found: ${id}` });
    }

    const booking = await enrichBooking(b);
    console.log(`[Booking GET /:id/user-trip] Found: ${b.id}`);
    res.json({ success: true, booking, userTrip: null, agency: null });
  } catch (error) {
    console.error(`[Booking GET /:id/user-trip] Error:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/bookings/:id/cancel
router.post("/:id/cancel", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const b = await findBookingById(id);
    if (!b) return res.status(404).json({ success: false, message: "Booking not found" });

    await supabase
      .from("bookings")
      .update({ booking_status: "CANCELLED" })
      .eq("id", b.id);

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
