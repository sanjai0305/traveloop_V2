import express from "express";
import supabase from "../config/supabase.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

const generateSeatLayout = (totalSeats = 40, busType = "Sleeper Bus") => {
  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const seatsPerRow = 4;
  const numRows = Math.ceil(totalSeats / seatsPerRow);
  const rows = [];
  const layoutSeats = [];

  let seatCount = 0;
  for (let r = 0; r < numRows && seatCount < totalSeats; r++) {
    const row = rowLabels[r] || `R${r + 1}`;
    rows.push(row);
    for (let c = 1; c <= seatsPerRow && seatCount < totalSeats; c++) {
      layoutSeats.push({
        seatNumber: `${row}${c}`,
        row,
        col: c,
        isLower: r < Math.ceil(numRows / 2),
      });
      seatCount++;
    }
  }

  return {
    rows,
    seatsPerRow,
    seats: layoutSeats,
  };
};

// GET /api/seats/:tripId
router.get("/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data: trip, error: tripErr } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    if (tripErr) throw tripErr;

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const { data: bookedSeats } = await supabase
      .from("seats")
      .select("*")
      .eq("trip_id", tripId);

    const totalSeatsNum = trip.total_slots || trip.available_seats || trip.available_slots || 30;
    const busTypeStr = trip.bus_type || "Sleeper Bus";
    const layoutConfig = generateSeatLayout(totalSeatsNum, busTypeStr);
    
    const bookedMap = new Map((bookedSeats || []).map((s) => [s.seat_number, s]));

    const seats = layoutConfig.seats.map((s) => {
      const dbSeat = bookedMap.get(s.seatNumber);
      const rawStatus = (dbSeat?.status || "available").toLowerCase();
      return {
        ...s,
        status: rawStatus,
        gender: dbSeat?.gender || null,
        passengerName: dbSeat?.passenger_name || null,
        age: dbSeat?.age || null,
      };
    });

    const counters = {
      total: seats.length,
      available: seats.filter((x) => x.status === "available").length,
      reserved: seats.filter((x) => x.status === "reserved").length,
      booked: seats.filter((x) => x.status === "booked" || x.status === "occupied").length,
      male: seats.filter((x) => x.status === "booked" && x.gender === "Male").length,
      female: seats.filter((x) => x.status === "booked" && x.gender === "Female").length,
    };

    console.log("=================== SEAT LAYOUT API RESPONSE ===================");
    console.log(`Trip ID: ${tripId} | Bus Type: ${busTypeStr} | Total Seats: ${totalSeatsNum}`);
    console.log(`Rows: ${layoutConfig.rows.join(", ")} | Seats Generated: ${seats.length}`);
    console.log("=================================================================");

    res.json({
      success: true,
      tripId,
      busType: busTypeStr,
      totalSeats: totalSeatsNum,
      availableSlots: trip.available_seats ?? trip.available_slots ?? totalSeatsNum,
      layout: {
        rows: layoutConfig.rows,
        seatsPerRow: layoutConfig.seatsPerRow,
      },
      counters,
      seats,
    });
  } catch (error) {
    console.error("❌ [GET /api/seats/:tripId Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/seats/reserve
router.post("/reserve", protect, async (req, res) => {
  res.json({ success: true, message: "Seat reserved", expiresAt: new Date(Date.now() + 600000) });
});

// POST /api/seats/release
router.post("/release", protect, async (req, res) => {
  res.json({ success: true, message: "Seat released" });
});

// POST /api/seats/confirm
router.post("/confirm", protect, async (req, res) => {
  res.json({ success: true, message: "Seat confirmed" });
});

export default router;
