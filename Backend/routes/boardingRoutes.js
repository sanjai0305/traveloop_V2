import express from "express";
import supabase from "../config/supabase.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate-qr", protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId required" });
    }

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .or(`id.eq.${bookingId},booking_code.eq.${bookingId}`)
      .maybeSingle();

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(booking.booking_code || booking.id)}`;

    res.json({
      success: true,
      qrImage,
      token: booking.booking_code || booking.id,
      expiresAt: new Date(Date.now() + 86400000),
      boardingId: booking.id,
      booking: { ...booking, _id: booking.id, qrCode: qrImage },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/:bookingId", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .or(`id.eq.${bookingId},booking_code.eq.${bookingId}`)
      .maybeSingle();

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    res.json({ success: true, booking: { ...booking, _id: booking.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/verify", async (req, res) => {
  res.json({ success: true, valid: true });
});

export default router;
