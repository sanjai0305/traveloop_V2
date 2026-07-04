import express from "express";
import BusType from "../models/BusType.js";
import TripActivity from "../models/TripActivity.js";
import HotelAmenity from "../models/HotelAmenity.js";
import BusAmenity from "../models/BusAmenity.js";
import protectAgent from "../middleware/agentAuthMiddleware.js";

const router = express.Router();

// Helper to register routes for a model
const registerMasterRoutes = (prefix, Model) => {
  // GET
  router.get(`/${prefix}`, async (req, res) => {
    try {
      const items = await Model.find({ status: "active" }).sort({ name: 1 });
      res.status(200).json({ success: true, items });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST (Agent/Admin can add or create dynamic entry)
  router.post(`/${prefix}`, async (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    try {
      // Find or create
      let item = await Model.findOne({ name: name.trim() });
      if (!item) {
        item = await Model.create({ name: name.trim() });
      } else if (item.status === "disabled") {
        item.status = "active";
        await item.save();
      }
      res.status(201).json({ success: true, item });
    } catch (err) {
      res.status(550).json({ success: false, message: err.message });
    }
  });

  // DELETE
  router.delete(`/${prefix}/:id`, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: "Item not found" });
      }
      // Instead of hard delete, disable or delete
      await Model.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true, message: "Item deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
};

registerMasterRoutes("bus-types", BusType);
registerMasterRoutes("activities", TripActivity);
registerMasterRoutes("hotel-amenities", HotelAmenity);
registerMasterRoutes("bus-amenities", BusAmenity);

export default router;
