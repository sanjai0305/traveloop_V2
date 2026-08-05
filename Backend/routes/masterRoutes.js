import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

const registerMasterRoutes = (prefix, tableName) => {
  router.get(`/${prefix}`, async (req, res) => {
    try {
      const { data: items } = await supabase.from(tableName).select("*").order("name", { ascending: true });
      res.status(200).json({ success: true, items: (items || []).map((i) => ({ ...i, _id: i.id })) });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post(`/${prefix}`, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    try {
      const { data: item } = await supabase.from(tableName).insert([{ name: name.trim() }]).select().single();
      res.status(201).json({ success: true, item: { ...item, _id: item.id } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.delete(`/${prefix}/:id`, async (req, res) => {
    try {
      await supabase.from(tableName).delete().eq("id", req.params.id);
      res.status(200).json({ success: true, message: "Item deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
};

registerMasterRoutes("bus-types", "bus_types");
registerMasterRoutes("activities", "trip_activities");
registerMasterRoutes("hotel-amenities", "hotel_amenities");
registerMasterRoutes("bus-amenities", "bus_amenities");

export default router;
