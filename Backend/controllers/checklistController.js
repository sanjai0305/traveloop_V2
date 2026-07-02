import Trip from "../models/Trip.js";
import Checklist from "../models/Checklist.js";
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
    adventure: [
      { item: "Hiking boots / Trail runners", category: "Clothes" },
      { item: "First aid kit",        category: "Health" },
      { item: "Hydration pack / Water bottle", category: "Accessories" },
      { item: "Quick-dry towel",      category: "Toiletries" },
      { item: "Headlamp / Flashlight", category: "Electronics" },
      { item: "Multi-tool",           category: "Accessories" },
    ],
    leisure: [
      { item: "Swimwear",             category: "Clothes" },
      { item: "Beach towel",          category: "Accessories" },
      { item: "Casual shirts/dresses",category: "Clothes" },
      { item: "E-reader / Book",      category: "Electronics" },
    ],
    business: [
      { item: "Formal suit / blazer", category: "Clothes" },
      { item: "Laptop & charger",     category: "Electronics" },
      { item: "Notebook & pen",       category: "Documents" },
      { item: "Business cards",       category: "Documents" },
    ],
    backpacking: [
      { item: "Backpack rain cover",  category: "Accessories" },
      { item: "Travel lock",          category: "Accessories" },
      { item: "Microfibre towel",     category: "Toiletries" },
      { item: "Universal adapter",    category: "Electronics" },
      { item: "Sleeping bag liner",   category: "Accessories" },
    ],
    family: [
      { item: "Wet wipes",            category: "Toiletries" },
      { item: "Hand sanitiser",       category: "Health" },
      { item: "Kids entertainment / toys", category: "Accessories" },
      { item: "Snacks",               category: "Health" },
    ],
  },
  // Destination-specific triggers (regex pattern match)
  destinations: [
    { pattern: /beach|goa|bali|maldives|hawaii|phuket/i, items: [
      { item: "Flip flops",           category: "Clothes" },
      { item: "Swimwear / Boardshorts", category: "Clothes" },
      { item: "Beach bag",            category: "Accessories" },
      { item: "After-sun lotion (Aloe)", category: "Toiletries" },
    ]},
    { pattern: /mountain|trek|himalaya|nepal|switzerland|manali|ladakh/i, items: [
      { item: "Thermal undergarments",category: "Clothes" },
      { item: "Trekking poles",       category: "Accessories" },
      { item: "High-calorie snacks",  category: "Health" },
      { item: "Lip balm with SPF",    category: "Toiletries" },
      { item: "Warm socks (wool)",    category: "Clothes" },
    ]},
    { pattern: /europe|paris|london|rome|tokyo|new york/i, items: [
      { item: "Comfortable walking shoes", category: "Clothes" },
      { item: "Universal plug adapter",category: "Electronics" },
      { item: "City map / Guide app", category: "Documents" },
      { item: "Light travel umbrella",category: "Accessories" },
    ]},
  ]
};

// HELPER: Generates smart packing list based on rules
const generateSmartPackingList = ({ destination, duration, season, travelStyle }) => {
  const items = [];
  const added = new Set();

  const addUnique = (list) => {
    if (!list) return;
    list.forEach((i) => {
      const key = `${i.item}-${i.category}`.toLowerCase();
      if (!added.has(key)) {
        added.add(key);
        items.push({ ...i });
      }
    });
  };

  // 1. Always items
  addUnique(PACKING_RULES.always);

  // 2. Season items
  if (season && PACKING_RULES.seasons[season.toLowerCase()]) {
    addUnique(PACKING_RULES.seasons[season.toLowerCase()]);
  }

  // 3. Travel style items
  if (travelStyle && PACKING_RULES.styles[travelStyle.toLowerCase()]) {
    addUnique(PACKING_RULES.styles[travelStyle.toLowerCase()]);
  }

  // 4. Destination match rules
  if (destination) {
    PACKING_RULES.destinations.forEach((rule) => {
      if (rule.pattern.test(destination)) {
        addUnique(rule.items);
      }
    });
  }

  // 5. Quantity calculation rules based on trip duration
  items.forEach((item) => {
    if (item.category === "Clothes") {
      if (item.item.toLowerCase().includes("t-shirt") || item.item.toLowerCase().includes("top")) {
        const count = Math.min(duration, 8);
        item.item = `${item.item} x${count}`;
      } else if (item.item.toLowerCase().includes("socks") || item.item.toLowerCase().includes("undergarment")) {
        const count = Math.min(duration + 1, 8);
        item.item = `${item.item} x${count}`;
      }
    }
  });

  return items;
};

// ─── ENDPOINTS ─────────────────────────────────────────────────────────────

// CREATE CHECKLIST ITEM
export const createChecklistItem = async (req, res) => {
  try {
    const { tripId, item, category } = req.body;

    if (!tripId || !item) {
      return res.status(400).json({ success: false, message: "tripId and item description are required" });
    }

    const tripRow = await Trip.findById(tripId);

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

    if (!hasTripPermission(trip, req.user.id, "create")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this checklist" });
    }

    const newChecklist = await Checklist.create({
      tripId,
      userId: req.user.id,
      itemName: item,
      item,
      category: category || "General",
      packed: false,
      checked: false,
    });

    const checklist = {
      ...newChecklist.toObject(),
      _id: newChecklist._id,
      trip: newChecklist.tripId,
      item: newChecklist.itemName,
      checked: newChecklist.packed
    };

    const userName = req.user.firstName || req.user.email;
    await logActivity(tripId, req.user.id, `${userName} added packing item: "${item}"`);

    res.status(201).json({
      success: true,
      message: "Checklist Item Created",
      checklist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET CHECKLIST FOR A TRIP
export const getChecklist = async (req, res) => {
  try {
    const { tripId } = req.params;

    const tripRow = await Trip.findById(tripId);

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view this checklist" });
    }

    const listRows = await Checklist.find({ tripId });

    const checklist = (listRows || []).map(row => {
      const obj = row.toObject ? row.toObject() : row;
      return {
        ...obj,
        _id: row._id,
        trip: row.tripId,
        item: row.itemName,
        checked: row.packed
      };
    });

    res.status(200).json({
      success: true,
      count: checklist.length,
      checklist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// TOGGLE CHECKLIST ITEM
export const toggleChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { checked } = req.body;

    const row = await Checklist.findById(id);

    if (!row) {
      return res.status(404).json({ success: false, message: "Checklist item not found" });
    }

    const checklistItem = {
      ...row.toObject(),
      _id: row._id,
      trip: row.tripId,
      item: row.itemName,
      checked: row.packed
    };

    const tripRow = await Trip.findById(checklistItem.trip);

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Associated Trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this checklist" });
    }

    checklistItem.checked = checked;

    await Checklist.findByIdAndUpdate(id, { packed: checked, checked: checked });

    const userName = req.user.firstName || req.user.email;
    await logActivity(checklistItem.trip, req.user.id, `${userName} marked "${checklistItem.item}" as ${checked ? "packed" : "unpacked"}`);

    res.status(200).json({
      success: true,
      message: "Checklist item toggled successfully",
      checklist: checklistItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE CHECKLIST ITEM DETAILS (item description or category)
export const updateChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item, category } = req.body;

    const row = await Checklist.findById(id);

    if (!row) {
      return res.status(404).json({ success: false, message: "Checklist item not found" });
    }

    const checklistItem = {
      ...row.toObject(),
      _id: row._id,
      trip: row.tripId,
      item: row.itemName,
      checked: row.packed
    };

    const tripRow = await Trip.findById(checklistItem.trip);

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Associated Trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this checklist" });
    }

    const oldItem = checklistItem.item;
    checklistItem.item = item || checklistItem.item;
    checklistItem.category = category || checklistItem.category;

    await Checklist.findByIdAndUpdate(id, {
      itemName: checklistItem.item,
      item: checklistItem.item,
      category: checklistItem.category
    });

    const userName = req.user.firstName || req.user.email;
    await logActivity(checklistItem.trip, req.user.id, `${userName} updated packing item: "${oldItem}" to "${checklistItem.item}"`);

    res.status(200).json({
      success: true,
      message: "Checklist item updated successfully",
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

    const row = await Checklist.findById(id);

    if (!row) {
      return res.status(404).json({ success: false, message: "Checklist item not found" });
    }

    const checklistItem = {
      ...row.toObject(),
      _id: row._id,
      trip: row.tripId,
      item: row.itemName,
      checked: row.packed
    };

    const tripRow = await Trip.findById(checklistItem.trip);

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Associated Trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

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

    const tripRow = await Trip.findById(tripId);

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this checklist" });
    }

    await Checklist.updateMany({ tripId }, { packed: false, checked: false });

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

    const tripRow = await Trip.findById(tripId);

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = {
      ...tripRow.toObject(),
      _id: tripRow._id,
      owner: tripRow.userId,
      user: tripRow.userId
    };

    if (!hasTripPermission(trip, req.user.id, "create")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this checklist" });
    }

    const inserts = items.map((i) => ({
      tripId,
      userId: req.user.id,
      itemName: i.item,
      item: i.item,
      category: i.category || "General",
      packed: false,
      checked: false,
    }));

    const createdRows = await Checklist.insertMany(inserts);

    const created = (createdRows || []).map(row => {
      const obj = row.toObject ? row.toObject() : row;
      return {
        ...obj,
        _id: row._id,
        trip: row.tripId,
        item: row.itemName,
        checked: row.packed
      };
    });

    const userName = req.user.firstName || req.user.email;
    await logActivity(tripId, req.user.id, `${userName} bulk-added ${created.length} packing suggestions`);

    res.status(201).json({
      success: true,
      message: `${created.length} items added to checklist`,
      checklist: created,
      count: created.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};