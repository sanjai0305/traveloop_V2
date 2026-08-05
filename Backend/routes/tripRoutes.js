import express from "express";
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} from "../controllers/tripController.js";
import protect from "../middleware/authMiddleware.js";
import supabase from "../config/supabase.js";

const router = express.Router();

// ── Published Marketplace Routes ───────────────────────────────────────────

router.get("/published", async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from("agent_trips")
      .select("*")
      .or("approval_status.eq.APPROVED,status.eq.published,status.eq.APPROVED")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter strictly to ensure approval_status is APPROVED and is_published is true
    const verifiedTrips = (rows || []).filter(
      (t) =>
        (t.approval_status === "APPROVED" || t.approval_status === "approved" || t.status === "published") &&
        t.is_published === true
    );

    const trips = verifiedTrips.map((t) => {
      const cover = (t.images && t.images.length > 0) ? t.images[0] : (t.thumbnail || null);
      const destName = t.destination || "TBD";
      return {
        ...t,
        _id: t.id,
        id: t.id,
        isPublished: true,
        published: true,
        status: "published",
        approvalStatus: "APPROVED",
        pricePerPerson: t.price_per_person ?? t.price ?? 0,
        originalPrice: t.original_price ?? t.price_per_person,
        offerPrice: t.price_per_person,
        availableSeats: t.available_seats ?? t.available_slots ?? t.total_slots ?? 20,
        totalSeats: t.total_slots ?? 20,
        availableSlots: t.available_slots ?? 20,
        totalSlots: t.total_slots ?? 20,
        startDate: t.start_date || t.created_at,
        endDate: t.end_date,
        coverImage: cover,
        thumbnail: cover,
        hero_image: cover,
        destinations: t.destination ? [t.destination] : [],
        destinationCity: destName,
        originCity: t.pickup_location || "Origin",
        tripType: t.category || "Group Package",
        category: t.category || "Standard",
        duration: `${t.duration_days || 1} Days / ${t.duration_nights || 0} Nights`,
      };
    });

    console.log(`[Published Trips] Returning ${trips.length} approved published packages to Traveler Portal`);
    res.status(200).json({ success: true, trips });
  } catch (error) {
    console.error("[Published Trips] Fetch error:", error);
    res.status(500).json({ success: false, message: "Error retrieving published trips" });
  }
});

router.put("/:id/publish", protect, async (req, res) => {
  try {
    const { data: trip } = await supabase
      .from("agent_trips")
      .update({ status: "PENDING_APPROVAL" })
      .eq("id", req.params.id)
      .select()
      .single();

    res.status(200).json({
      success: true,
      message: "Trip submitted for admin approval.",
      trip: trip ? { ...trip, _id: trip.id } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error publishing trip" });
  }
});

router.get("/published/:id", async (req, res) => {
  try {
    const { data: t, error } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;

    if (!t) {
      return res.status(404).json({ success: false, message: "Trip not found or not approved" });
    }

    console.log("=================== RAW SUPABASE TRIP ROW ===================");
    console.log(JSON.stringify(t, null, 2));
    console.log("=============================================================");

    const rawImages = Array.isArray(t.images) && t.images.length > 0
      ? t.images
      : t.thumbnail
        ? [t.thumbnail]
        : ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"];

    const cover = rawImages[0];
    const destName = t.destination || "TBD";

    // Build normalized hotels array
    let hotels = [];
    if (Array.isArray(t.hotels) && t.hotels.length > 0) {
      hotels = t.hotels;
    } else if (t.hotel_name) {
      hotels = [{
        name: t.hotel_name,
        category: t.hotel_rating ? `${t.hotel_rating} Star` : "3 Star",
        address: t.destination || "",
        amenities: t.hotel_amenities || []
      }];
    }

    // Build normalized transport object
    const busAmenitiesArr = Array.isArray(t.bus_amenities) ? t.bus_amenities : [];
    const transportObj = {
      type: t.bus_type || "Bus",
      busType: t.bus_type || "Sleeper Bus",
      busNumber: t.bus_number || "TN-38-TR-108",
      amenities: busAmenitiesArr,
      driverName: t.driver_name || null,
      driverPhone: t.driver_phone || null
    };

    // Extract activities list
    let activitiesArr = [];
    if (Array.isArray(t.activities) && t.activities.length > 0) {
      activitiesArr = t.activities;
    } else if (Array.isArray(t.itinerary)) {
      t.itinerary.forEach(day => {
        if (Array.isArray(day.activities)) {
          activitiesArr.push(...day.activities);
        }
      });
    }
    activitiesArr = [...new Set(activitiesArr)]; // deduplicate

    // Extract packing list
    const packingArr = Array.isArray(t.packing_checklist) && t.packing_checklist.length > 0
      ? t.packing_checklist
      : ["ID Proof (Aadhaar / Passport)", "Comfortable Walking Shoes", "Personal Medications", "Power Bank & Charging Cables"];

    // Inclusions & Exclusions
    const inclusionsArr = Array.isArray(t.inclusions) && t.inclusions.length > 0
      ? t.inclusions
      : (Array.isArray(t.included_services) ? t.included_services : ["Accommodation", "Transportation", "Guided Sightseeing"]);

    const exclusionsArr = Array.isArray(t.exclusions) && t.exclusions.length > 0
      ? t.exclusions
      : (Array.isArray(t.excluded_services) ? t.excluded_services : ["Personal Expenses", "Entry Permits", "Unspecified Meals"]);

    const trip = {
      ...t,
      _id: t.id,
      id: t.id,
      isPublished: t.is_published ?? true,
      published: t.is_published ?? true,
      status: t.status || "published",
      approvalStatus: t.approval_status || "APPROVED",
      pricePerPerson: t.price_per_person ?? t.price ?? 0,
      originalPrice: t.original_price ?? t.price_per_person,
      offerPrice: t.price_per_person,
      availableSeats: t.available_seats ?? t.available_slots ?? t.total_slots ?? 20,
      totalSeats: t.total_slots ?? 20,
      availableSlots: t.available_slots ?? 20,
      totalSlots: t.total_slots ?? 20,
      startDate: t.start_date || t.created_at,
      endDate: t.end_date,
      coverImage: cover,
      coverImages: rawImages,
      images: rawImages,
      thumbnail: cover,
      hero_image: cover,
      destinations: t.destination ? [t.destination] : [],
      destinationCity: destName,
      pickupLocation: t.pickup_location || "Coimbatore",
      pickupPoint: t.pickup_location || "Coimbatore",
      pickupMapsLink: t.pickup_maps_link || null,
      dropPoint: t.drop_point || t.destination || "Return Point",
      dropMapsLink: t.drop_maps_link || null,
      originCity: t.pickup_location || "Origin",
      tripType: t.category || "Group Package",
      category: t.category || "Standard",
      duration: `${t.duration_days || 1} Days / ${t.duration_nights || 0} Nights`,
      hotels: hotels,
      transport: transportObj,
      busType: transportObj.busType,
      busNumber: transportObj.busNumber,
      driverName: transportObj.driverName,
      driverPhone: transportObj.driverPhone,
      busAmenities: busAmenitiesArr,
      activities: activitiesArr,
      packingChecklist: packingArr,
      includedServices: inclusionsArr,
      excludedServices: exclusionsArr,
      termsConditions: t.terms_conditions || "Standard cancellation policy applies.",
      cancellationPolicy: t.terms_conditions || "Full refund 7 days prior to departure."
    };

    console.log("=================== MAPPED API TRIP RESPONSE ===================");
    console.log("Images:", trip.coverImages);
    console.log("Hotels:", trip.hotels);
    console.log("Transport:", trip.transport);
    console.log("Activities:", trip.activities);
    console.log("Packing:", trip.packingChecklist);
    console.log("================================================================");

    res.status(200).json({ success: true, trip });
  } catch (error) {
    console.error("❌ [GET /published/:id Error]:", error);
    res.status(500).json({ success: false, message: "Error fetching trip details" });
  }
});

// ── Standard User Planner Routes ───────────────────────────────────────────
router.post("/create", protect, createTrip);
router.post("/", protect, createTrip);

router.get("/my", protect, getTrips);
router.get("/my-trips", protect, getTrips);
router.get("/user", protect, getTrips);
router.get("/", protect, getTrips);

router.get("/destination", async (req, res) => {
  try {
    const { data: rows } = await supabase.from("agent_trips").select("*").order("created_at", { ascending: false });
    const trips = (rows || []).map((t) => ({ ...t, _id: t.id }));
    res.status(200).json({ success: true, trips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", protect, getTripById);
router.put("/:id", protect, updateTrip);
router.delete("/:id", protect, deleteTrip);

export default router;