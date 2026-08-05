import { getDbClient } from "../config/supabase.js";
import { recalculateBudget } from "../services/budgetSync.js";

const CURATED_DESTINATION_IMAGES = {
  "bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  "paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
  "london": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
  "tokyo": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
  "goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
  "switzerland": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  "maldives": "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=800&q=80",
  "santorini": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
  "dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
  "manali": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
};

const mapTrip = (t) => {
  if (!t) return null;
  return {
    _id: t.id,
    id: t.id,
    userId: t.user_id,
    title: t.title,
    destination: t.destination,
    startDate: t.start_date,
    endDate: t.end_date,
    budget: t.budget_total || 0,
    coverImage: t.cover_image || CURATED_DESTINATION_IMAGES[(t.destination || "").toLowerCase()] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
    status: t.status || "PLANNED",
    collaborators: t.collaborators || [],
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
};

export const getTrips = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User identity missing" });
    }

    const db = await getDbClient();
    const { data: rows, error } = await db
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getTrips Error]:", error);
      throw error;
    }

    const trips = (rows || []).map(mapTrip);
    res.status(200).json({ success: true, count: trips.length, data: trips, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDbClient();

    const { data: row, error } = await db
      .from("trips")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !row) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = mapTrip(row);
    res.status(200).json({ success: true, data: trip, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTrip = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User identity missing" });
    }

    const { title, destination, startDate, endDate, budget, coverImage } = req.body;

    if (!title || !destination) {
      return res.status(400).json({ success: false, message: "Title and destination are required" });
    }

    const img = coverImage || CURATED_DESTINATION_IMAGES[(destination || "").toLowerCase()] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";

    const db = await getDbClient();

    console.log(`[createTrip] Inserting trip for User ID: ${userId}, Title: '${title}'`);

    const { data: newRow, error } = await db
      .from("trips")
      .insert([
        {
          user_id: userId,
          title,
          destination,
          start_date: startDate || null,
          end_date: endDate || null,
          budget_total: Number(budget) || 0,
          cover_image: img,
          status: "PLANNED",
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error("❌ [createTrip Error]:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create trip record",
        code: error.code || "DB_ERROR",
      });
    }

    const trip = mapTrip(newRow);

    // Create default budget entry for the new trip
    if (trip && trip.id) {
      const { error: budgetErr } = await db.from("budgets").insert([
        {
          trip_id: trip.id,
          user_id: userId,
          total_budget: Number(budget) || 0,
        },
      ]);
      if (budgetErr) {
        console.warn("⚠️ [createTrip] Non-fatal error creating initial budget:", budgetErr.message);
      }
    }

    console.log(`✅ [createTrip] Trip created successfully: ID ${trip.id}`);
    res.status(201).json({ success: true, message: "Trip created successfully", data: trip, trip });
  } catch (error) {
    console.error("❌ [createTrip Exception]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, destination, startDate, endDate, budget, coverImage, status } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (destination !== undefined) updates.destination = destination;
    if (startDate !== undefined) updates.start_date = startDate;
    if (endDate !== undefined) updates.end_date = endDate;
    if (budget !== undefined) updates.budget_total = Number(budget) || 0;
    if (coverImage !== undefined) updates.cover_image = coverImage;
    if (status !== undefined) updates.status = status;
    updates.updated_at = new Date().toISOString();

    const db = await getDbClient();
    const { data: updated, error } = await db
      .from("trips")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[updateTrip Error]:", error);
      throw error;
    }

    const trip = mapTrip(updated);
    res.status(200).json({ success: true, message: "Trip updated successfully", data: trip, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDbClient();

    await db.from("itineraries").delete().eq("trip_id", id);
    await db.from("checklists").delete().eq("trip_id", id);
    await db.from("notes").delete().eq("trip_id", id);
    await db.from("budgets").delete().eq("trip_id", id);

    const { error } = await db.from("trips").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ success: true, message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptInvite = async (req, res) => {
  res.json({ success: true, message: "Invite accepted" });
};

export const declineInvite = async (req, res) => {
  res.json({ success: true, message: "Invite declined" });
};