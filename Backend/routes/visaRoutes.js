import express from "express";
import protect from "../middleware/authMiddleware.js";
import { VISA_DATA, normalizeDestination } from "../data/visaData.js";

const router = express.Router();

// GET visa requirements for a destination
router.get("/", protect, async (req, res) => {
  try {
    const { destination, nationality = "IN" } = req.query;

    if (!destination) {
      return res.status(400).json({ success: false, message: "destination query param required" });
    }

    const key = normalizeDestination(destination);
    if (!key || !VISA_DATA[key]) {
      return res.status(200).json({
        success: true,
        found: false,
        message: "Specific visa data not available for this destination. Check your country's embassy website.",
        destination,
      });
    }

    const data = VISA_DATA[key];
    const nationalityOverride = data.requirementsFor?.[nationality.toUpperCase()];

    const result = {
      name: data.name,
      flag: data.flag,
      visaType: nationalityOverride?.visaType || data.visaType,
      note: nationalityOverride?.note || null,
      passportValidity: data.passportValidity,
      entryRestrictions: data.entryRestrictions,
      advisory: data.advisory,
      advisoryColor: data.advisoryColor,
      requirements: data.requirements || [],
      visaOnArrival: data.visaOnArrival,
      evisa: data.evisa,
    };

    res.status(200).json({ success: true, found: true, destination: key, visa: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
