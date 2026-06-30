import Checklist from "../models/Checklist.js";
import Trip from "../models/Trip.js";
import { logActivity } from "../utils/activityLogger.js";
import { hasTripPermission } from "../utils/permissionHelper.js";

// ─── PACKING DATA — Rule-based destination-aware suggestions ───────────────
const PACKING_RULES = {
  // Always include
  always: [
    { item: "Passport / ID",        category: "Documents" },
    { item: "Phone charger",        category: "Electronics" },
    { item: "Power bank",           category: "Electronics" },
    { item: "Toothbrush & paste",   category: "Toiletries" },
    { item: "Deodorant",            category: "Toiletries" },
    { item: "Paracetamol",          category: "Health" },
    { item: "Travel insurance docs",category: "Documents" },
    { item: "Credit / Debit card",  category: "Documents" },
    { item: "Earphones",            category: "Electronics" },
  ],
  // By season
  seasons: {
    winter: [
      { item: "Heavy jacket",         category: "Clothes" },
      { item: "Thermals (top+bottom)",category: "Clothes" },
      { item: "Gloves",               category: "Clothes" },
      { item: "Beanie / Woollen hat", category: "Clothes" },
      { item: "Scarf",                category: "Clothes" },
      { item: "Thermal socks",        category: "Clothes" },
      { item: "Lip balm",             category: "Toiletries" },
      { item: "Moisturiser",          category: "Toiletries" },
    ],
    summer: [
      { item: "Sunscreen SPF 50+",    category: "Toiletries" },
      { item: "Sunglasses",           category: "Accessories" },
      { item: "Cap / Hat",            category: "Accessories" },
      { item: "Light cotton T-shirts",category: "Clothes" },
      { item: "Shorts",               category: "Clothes" },
      { item: "Sandals",              category: "Clothes" },
      { item: "Insect repellent",     category: "Health" },
    ],
    monsoon: [
      { item: "Rain jacket / Poncho", category: "Clothes" },
      { item: "Waterproof shoes",     category: "Clothes" },
      { item: "Quick-dry clothes",    category: "Clothes" },
      { item: "Umbrella",             category: "Accessories" },
      { item: "Waterproof bag cover", category: "Accessories" },
    ],
    spring: [
      { item: "Light jacket",         category: "Clothes" },
      { item: "Allergy medicine",     category: "Health" },
      { item: "Comfortable walking shoes", category: "Clothes" },
    ],
    autumn: [
      { item: "Light jacket",         category: "Clothes" },
      { item: "Layering tops",        category: "Clothes" },
      { item: "Comfortable walking shoes", category: "Clothes" },
    ],
  },
  // By travel style
  styles: {
    beach: [
      { item: "Swimwear (2x)",        category: "Clothes" },
      { item: "Beach towel",          category: "Accessories" },
      { item: "Flip flops",           category: "Clothes" },
      { item: "Sunscreen SPF 50+",    category: "Toiletries" },
      { item: "Waterproof phone case",category: "Electronics" },
      { item: "Snorkelling gear",     category: "Accessories" },
    ],
    business: [
      { item: "Formal shirts (3x)",   category: "Clothes" },
      { item: "Formal trousers (2x)", category: "Clothes" },
      { item: "Blazer",               category: "Clothes" },
      { item: "Formal shoes",         category: "Clothes" },
      { item: "Laptop + charger",     category: "Electronics" },
      { item: "Business cards",       category: "Documents" },
      { item: "Presentation clicker", category: "Electronics" },
    ],
    adventure: [
      { item: "Hiking boots",         category: "Clothes" },
      { item: "Moisture-wicking tees",category: "Clothes" },
      { item: "Trekking pants",       category: "Clothes" },
      { item: "First aid kit",        category: "Health" },
      { item: "Water bottle (2L)",    category: "Accessories" },
      { item: "Headlamp + batteries", category: "Electronics" },
      { item: "Trekking poles",       category: "Accessories" },
      { item: "Energy bars / snacks", category: "Food" },
    ],
    backpacker: [
      { item: "Lightweight backpack", category: "Accessories" },
      { item: "Packable towel",       category: "Accessories" },
      { item: "Universal travel adapter", category: "Electronics" },
      { item: "Padlock",              category: "Accessories" },
      { item: "Hostel-friendly flip flops", category: "Clothes" },
      { item: "Reusable water bottle",category: "Accessories" },
    ],
    casual: [
      { item: "Casual t-shirts (5x)", category: "Clothes" },
      { item: "Jeans / Trousers (2x)",category: "Clothes" },
      { item: "Sneakers",             category: "Clothes" },
      { item: "Comfortable shoes",    category: "Clothes" },
    ],
  },
  // By destination keyword
  destinations: {
    beach: [
      { item: "Swimwear (2x)",        category: "Clothes" },
      { item: "Sunscreen SPF 50+",    category: "Toiletries" },
      { item: "Sunglasses",           category: "Accessories" },
    ],
    mountain: [
      { item: "Warm layers",          category: "Clothes" },
      { item: "Altitude sickness med",category: "Health" },
      { item: "Trekking poles",       category: "Accessories" },
    ],
    japan: [
      { item: "Universal adapter (Type A)", category: "Electronics" },
      { item: "Portable WiFi / SIM",  category: "Electronics" },
      { item: "IC Card (Suica) cash", category: "Documents" },
      { item: "Pocket tissues",       category: "Toiletries" },
    ],
    europe: [
      { item: "Universal adapter (Type C)", category: "Electronics" },
      { item: "Schengen visa docs",   category: "Documents" },
      { item: "Euro cash (small bills)", category: "Documents" },
      { item: "Travel-size shampoo",  category: "Toiletries" },
    ],
    dubai: [
      { item: "Modest clothing (full sleeves)", category: "Clothes" },
      { item: "Sunscreen SPF 50+",    category: "Toiletries" },
      { item: "Currency exchange (AED)", category: "Documents" },
    ],
    goa: [
      { item: "Swimwear",             category: "Clothes" },
      { item: "Sunscreen SPF 50+",    category: "Toiletries" },
      { item: "Sandals",              category: "Clothes" },
      { item: "Insect repellent",     category: "Health" },
    ],
    bali: [
      { item: "Swimwear",             category: "Clothes" },
      { item: "Temple scarf / Sarong",category: "Clothes" },
      { item: "Insect repellent",     category: "Health" },
      { item: "Cash (IDR)",           category: "Documents" },
    ],
  },
  // By duration
  duration: {
    short: [ // 1-3 days
      { item: "Mini toiletries bag",  category: "Toiletries" },
      { item: "Change of clothes (2x)", category: "Clothes" },
    ],
    medium: [ // 4-7 days
      { item: "Laundry bag",          category: "Accessories" },
      { item: "Full toiletry kit",    category: "Toiletries" },
    ],
    long: [ // 8+ days
      { item: "Laundry bag",          category: "Accessories" },
      { item: "Portable laundry soap",category: "Toiletries" },
      { item: "Extra memory card",    category: "Electronics" },
      { item: "Travel pillow",        category: "Accessories" },
    ],
  },
};

const generateSmartPackingList = ({ destination = "", duration = 5, season = "summer", travelStyle = "casual" }) => {
  const dest = destination.toLowerCase();
  const items = new Map(); // use Map to deduplicate by item name

  const addItem = (i) => {
    const key = i.item.toLowerCase();
    if (!items.has(key)) items.set(key, i);
  };

  // Always-include
  PACKING_RULES.always.forEach(addItem);

  // Season
  const seasonKey = season.toLowerCase();
  (PACKING_RULES.seasons[seasonKey] || PACKING_RULES.seasons.summer).forEach(addItem);

  // Style
  const styleKey = travelStyle.toLowerCase();
  (PACKING_RULES.styles[styleKey] || PACKING_RULES.styles.casual).forEach(addItem);

  // Duration
  const durationKey = duration <= 3 ? "short" : duration <= 7 ? "medium" : "long";
  PACKING_RULES.duration[durationKey].forEach(addItem);

  // Destination keywords
  for (const [keyword, destItems] of Object.entries(PACKING_RULES.destinations)) {
    if (dest.includes(keyword)) {
      destItems.forEach(addItem);
    }
  }

  return Array.from(items.values());
};

// CREATE CHECKLIST ITEM
export const createChecklistItem = async (req, res) => {
  try {
    const { trip: tripId, item, category } = req.body;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "create")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this checklist" });
    }

    const checklist = await Checklist.create({
      trip: tripId,
      item,
      category,
    });

    const userName = req.user.firstName || req.user.email;
    await logActivity(tripId, req.user.id, `${userName} added packing item: "${item}"`);

    res.status(201).json({
      success: true,
      message: "Checklist Item Added",
      checklist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET CHECKLIST
export const getChecklist = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view this checklist" });
    }

    let checklist = await Checklist.find({ trip: tripId });

    // Prepopulate standard default checklist list items on first fetch (only for owners/editors)
    if (checklist.length === 0 && hasTripPermission(trip, req.user.id, "create")) {
      const DEFAULTS = [
        { item: "T-shirts (5x)", category: "clothes" },
        { item: "Trousers (2x)", category: "clothes" },
        { item: "Underwear (5x)", category: "clothes" },
        { item: "Socks (5x)", category: "clothes" },
        { item: "Jacket", category: "clothes" },
        { item: "Swimwear", category: "clothes" },
        { item: "Phone charger", category: "electronics" },
        { item: "Power bank", category: "electronics" },
        { item: "Laptop + charger", category: "electronics" },
        { item: "Earphones", category: "electronics" },
        { item: "Travel adapter", category: "electronics" },
        { item: "Passport / ID", category: "documents" },
        { item: "Flight tickets", category: "documents" },
        { item: "Hotel booking", category: "documents" },
        { item: "Travel insurance", category: "documents" },
        { item: "Visa documents", category: "documents" },
        { item: "Toothbrush & paste", category: "toiletries" },
        { item: "Shampoo & conditioner", category: "toiletries" },
        { item: "Sunscreen SPF 50+", category: "toiletries" },
        { item: "Deodorant", category: "toiletries" },
        { item: "Face wash", category: "toiletries" },
        { item: "Paracetamol", category: "health" },
        { item: "Antacids", category: "health" },
        { item: "Motion sickness", category: "health" },
        { item: "First aid kit", category: "health" },
        { item: "Camera + lens", category: "camera" },
        { item: "Memory cards", category: "camera" },
        { item: "Tripod", category: "camera" }
      ];

      const createdItems = [];
      for (const d of DEFAULTS) {
        const item = await Checklist.create({
          trip: tripId,
          item: d.item,
          category: d.category,
          checked: false
        });
        createdItems.push(item);
      }
      checklist = createdItems;
    }

    res.status(200).json({
      success: true,
      checklist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE CHECKLIST ITEM
export const updateChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { checked, item, category } = req.body;

    const checklistItem = await Checklist.findById(id);
    if (!checklistItem) {
      return res.status(404).json({ success: false, message: "Checklist item not found" });
    }

    const trip = await Trip.findById(checklistItem.trip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this checklist" });
    }

    const userName = req.user.firstName || req.user.email;
    if (checked !== undefined && checked !== checklistItem.checked) {
      await logActivity(checklistItem.trip, req.user.id, `${userName} ${checked ? "checked" : "unchecked"} packing item: "${checklistItem.item}"`);
    } else if (item !== undefined && item !== checklistItem.item) {
      await logActivity(checklistItem.trip, req.user.id, `${userName} renamed packing item to "${item}"`);
    }

    if (checked !== undefined) checklistItem.checked = checked;
    if (item !== undefined) checklistItem.item = item;
    if (category !== undefined) checklistItem.category = category;

    await checklistItem.save();

    res.status(200).json({
      success: true,
      message: "Checklist Item Updated",
      checklist: checklistItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE CHECKLIST ITEM
export const deleteChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;

    const checklistItem = await Checklist.findById(id);
    if (!checklistItem) {
      return res.status(404).json({ success: false, message: "Checklist item not found" });
    }

    const trip = await Trip.findById(checklistItem.trip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "delete")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this checklist" });
    }

    const userName = req.user.firstName || req.user.email;
    await logActivity(checklistItem.trip, req.user.id, `${userName} deleted packing item: "${checklistItem.item}"`);

    await Checklist.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Checklist Item Deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// RESET ALL CHECKLIST ITEMS FOR A TRIP
export const resetChecklist = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this checklist" });
    }

    await Checklist.updateMany({ trip: tripId }, { checked: false });

    const userName = req.user.firstName || req.user.email;
    await logActivity(tripId, req.user.id, `${userName} reset the checklist`);

    res.status(200).json({
      success: true,
      message: "Checklist reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GENERATE AI PACKING SUGGESTIONS (rule-based, no external API needed)
export const generatePackingList = async (req, res) => {
  try {
    const { destination, duration, season, travelStyle } = req.body;

    const suggestions = generateSmartPackingList({
      destination: destination || "",
      duration: parseInt(duration) || 5,
      season: season || "summer",
      travelStyle: travelStyle || "casual",
    });

    res.status(200).json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// BULK CREATE CHECKLIST ITEMS (used after AI generation)
export const bulkCreateChecklist = async (req, res) => {
  try {
    const { tripId, items } = req.body;

    if (!tripId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "tripId and items array required" });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    if (!hasTripPermission(trip, req.user.id, "create")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this checklist" });
    }

    const docs = items.map((i) => ({
      trip: tripId,
      item: i.item,
      category: i.category || "General",
      checked: false,
    }));

    const created = await Checklist.insertMany(docs);

    const userName = req.user.firstName || req.user.email;
    await logActivity(tripId, req.user.id, `${userName} bulk-added ${created.length} packing suggestions`);

    res.status(201).json({
      success: true,
      message: `${created.length} items added to checklist`,
      checklist: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};