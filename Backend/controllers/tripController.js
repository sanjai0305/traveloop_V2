import Trip from "../models/Trip.js";
import Itinerary from "../models/Itinerary.js";
import Checklist from "../models/Checklist.js";
import Note from "../models/Note.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import Flight from "../models/Flight.js";
import ChatMessage from "../models/ChatMessage.js";
import ChatReadStatus from "../models/ChatReadStatus.js";
import Journal from "../models/Journal.js";
import ExchangeRateCache from "../models/ExchangeRateCache.js";
import { logActivity } from "../utils/activityLogger.js";
import { triggerNotification } from "./notificationController.js";
import { sendInviteEmail } from "../services/gmailService.js";
import { hasTripPermission } from "../utils/permissionHelper.js";
import Budget from "../models/Budget.js";
import { recalculateBudget } from "../services/budgetSync.js";
import { generateTripPDF } from "../utils/pdfHelper.js";

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
  "singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
  "phuket": "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80",
  "chennai": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
};

const fetchDestinationImage = async (destination, placeId = null) => {
  const destName = (destination || "").toLowerCase();
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (apiKey) {
    try {
      let resolvedPlaceId = placeId;
      if (!resolvedPlaceId) {
        const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(destination)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
        const searchRes = await fetch(searchUrl);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.candidates && searchData.candidates.length > 0) {
            resolvedPlaceId = searchData.candidates[0].place_id;
          }
        }
      }
      if (resolvedPlaceId) {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${resolvedPlaceId}&fields=photos&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          const photos = detailsData.result?.photos;
          if (photos && photos.length > 0) {
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photos[0].photo_reference}&key=${apiKey}`;
          }
        }
      }
    } catch (err) {
      console.error("fetchDestinationImage from Google API failed:", err);
    }
  }

  for (const [key, url] of Object.entries(CURATED_DESTINATION_IMAGES)) {
    if (destName.includes(key)) {
      return url;
    }
  }

  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";
};

export const createTrip = async (req, res) => {
  try {
    const {
      title,
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      description,
      destinationName,
      placeId,
      formattedAddress,
      country,
      state,
      latitude,
      longitude,
      image,
    } = req.body;

    let finalImage = image;
    if (!finalImage) {
      finalImage = await fetchDestinationImage(destination || destinationName, placeId);
    }

    const trip = await Trip.create({
      user: req.user.id,
      title,
      destination: destination || destinationName,
      startDate,
      endDate,
      budget,
      travelers,
      description,
      destinationName: destinationName || destination,
      placeId,
      formattedAddress,
      country,
      state,
      latitude,
      longitude,
      image: finalImage,
    });

    // Trigger Notification
    if (req.user && req.user.id) {
      await triggerNotification(
        req.user.id,
        "Trip Created ✈️",
        `Your trip to ${destination || destinationName} ("${title}") has been created! Start planning your itinerary.`,
        "trip",
        trip._id
      );

      // Reward +10 XP and unlock First Trip Created achievement
      const userObj = await User.findById(req.user.id);
      if (userObj) {
        userObj.xp = (userObj.xp || 0) + 10;
        userObj.level = Math.floor(userObj.xp / 100) + 1;
        const today = new Date().toISOString().split("T")[0];
        userObj.lastActiveDate = today;
        if (!userObj.achievements.includes("First Trip Created")) {
          userObj.achievements.push("First Trip Created");
        }
        await userObj.save();
      }
    }

    res.status(201).json({
      success: true,
      message: "Trip Created Successfully",
      trip,
    });

  } catch (error) {
    console.error("Trip Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



export const getTrips =
  async (req, res) => {

    try {

      const trips =
        await Trip.find({
          $or: [
            { user: req.user.id },
            { owner: req.user.id },
            { "collaborators.userId": req.user.id, "collaborators.acceptedAt": { $ne: null } }
          ]
        }).lean();

      const tripsWithCounts = await Promise.all(trips.map(async (trip) => {
        const activitiesCount = await Itinerary.countDocuments({ trip: trip._id });
        let role = "owner";
        const isOwner = (trip.owner?._id || trip.owner)?.toString() === req.user.id || (trip.user?._id || trip.user)?.toString() === req.user.id;
        if (!isOwner) {
          const collab = trip.collaborators?.find(c => c.userId && (c.userId._id || c.userId).toString() === req.user.id && c.acceptedAt !== null);
          if (collab) {
            role = collab.role;
          }
        }
        const acceptedCollaborators = trip.collaborators?.filter(c => c.acceptedAt !== null) || [];

        // Compute unreadCount based on ChatReadStatus
        const readStatus = await ChatReadStatus.findOne({ tripId: trip._id, userId: req.user.id });
        const lastSeenAt = readStatus ? readStatus.lastSeenAt : new Date(0);
        const unreadCount = await ChatMessage.countDocuments({
          tripId: trip._id,
          createdAt: { $gt: lastSeenAt },
          sender: { $ne: req.user.id },
          deletedAt: null
        });

        return {
          ...trip,
          collaborators: acceptedCollaborators,
          role,
          activitiesCount,
          unreadCount
        };
      }));

      res.json({
        success: true,
        trips: tripsWithCounts,
      });

    } catch (error) {

      console.error("Trip Controller Error:", error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  };



export const getTripById = async (req, res) => {
  try {
    console.log("[DEBUG Backend] getTripById - ID param received:", req.params.id);
    console.log("[DEBUG Backend] getTripById - Auth user ID:", req.user?.id || req.user?._id);

    const trip = await Trip.findById(req.params.id)
      .populate("owner", "firstName lastName avatar upiId")
      .populate("collaborators.userId", "firstName lastName avatar upiId email");

    if (!trip) {
      console.log("[DEBUG Backend] getTripById - Trip not found in database for ID:", req.params.id);
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const permissionResult = hasTripPermission(trip, req.user.id, "read");
    console.log("[DEBUG Backend] getTripById - Permission check result:", permissionResult);

    if (!permissionResult) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view this trip" });
    }

    let role = "owner";
    const isOwner = (trip.owner?._id || trip.owner)?.toString() === req.user.id || (trip.user?._id || trip.user)?.toString() === req.user.id;
    if (!isOwner) {
      const collab = trip.collaborators?.find(c => c.userId && (c.userId._id || c.userId).toString() === req.user.id && c.acceptedAt !== null);
      if (collab) {
        role = collab.role;
      }
    }

    // Geocode missing coordinates for backward compatibility
    if (trip.latitude === undefined || trip.longitude === undefined || !trip.placeId || !trip.image) {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
      
      // Update image if missing
      if (!trip.image) {
        trip.image = await fetchDestinationImage(trip.destination, trip.placeId);
      }

      if (apiKey && (trip.latitude === undefined || trip.longitude === undefined || !trip.placeId)) {
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trip.destination)}&key=${apiKey}`;
          const geoRes = await fetch(geocodeUrl);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              const result = geoData.results[0];
              const { lat, lng } = result.geometry.location;

              let country = "";
              let state = "";
              for (const comp of result.address_components) {
                if (comp.types.includes("country")) {
                  country = comp.long_name;
                }
                if (comp.types.includes("administrative_area_level_1")) {
                  state = comp.long_name;
                }
              }

              trip.latitude = lat;
              trip.longitude = lng;
              trip.placeId = result.place_id;
              trip.formattedAddress = result.formatted_address;
              trip.country = country;
              trip.state = state;
              trip.destinationName = trip.destination;
            }
          }
        } catch (geocodeError) {
          console.error("Geocoding fallback failed:", geocodeError);
        }
      }
      
      await trip.save();
    }

    const acceptedCollaborators = trip.collaborators?.filter(c => c.acceptedAt !== null) || [];

    // Compute unreadCount based on ChatReadStatus
    const readStatus = await ChatReadStatus.findOne({ tripId: trip._id, userId: req.user.id });
    const lastSeenAt = readStatus ? readStatus.lastSeenAt : new Date(0);
    const unreadCount = await ChatMessage.countDocuments({
      tripId: trip._id,
      createdAt: { $gt: lastSeenAt },
      sender: { $ne: req.user.id },
      deletedAt: null
    });

    res.json({
      success: true,
      trip: {
        ...trip.toObject(),
        collaborators: acceptedCollaborators,
        role,
        unreadCount
      },
    });

  } catch (error) {
    console.error("Trip Controller Error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid Trip ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// UPDATE TRIP
export const updateTrip = async (req, res) => {
  try {
    const {
      title,
      destination,
      startDate,
      endDate,
      budget,
      expenses,
      isPublic,
      shareToken,
      travelers,
      description,
      status,
      destinationName,
      placeId,
      formattedAddress,
      country,
      state,
      latitude,
      longitude,
      image,
      scannedExpenseInfo,
    } = req.body;

    const oldTrip = await Trip.findById(req.params.id);
    if (!oldTrip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (!hasTripPermission(oldTrip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to edit this trip" });
    }

    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      {
        title,
        destination: destination || destinationName,
        startDate,
        endDate,
        budget,
        expenses,
        isPublic,
        shareToken,
        travelers,
        description,
        status,
        destinationName: destinationName || destination,
        placeId,
        formattedAddress,
        country,
        state,
        latitude,
        longitude,
        image,
      },
      { new: true, runValidators: true }
    );

    if (req.user && req.user.id) {
      // 1. Status changes
      if (status && status !== oldTrip.status) {
        if (status === "ongoing") {
          await triggerNotification(
            req.user.id,
            "Trip Started! 🎒",
            `Your trip to ${trip.destination} is now ongoing! Keep tracking your notes and expenses.`,
            "trip",
            trip._id
          );
        } else if (status === "completed") {
          await triggerNotification(
            req.user.id,
            "Trip Completed! 🏆",
            `Congratulations on completing your trip to ${trip.destination}! Record your journal notes.`,
            "success",
            trip._id
          );

          // Reward +20 XP to the user for completing the trip
          const userObj = await User.findById(req.user.id);
          if (userObj) {
            userObj.xp = (userObj.xp || 0) + 20;
            userObj.level = Math.floor(userObj.xp / 100) + 1;
            const today = new Date().toISOString().split("T")[0];
            userObj.lastActiveDate = today;
            await userObj.save();
          }
        } else if (status === "upcoming") {
          await triggerNotification(
            req.user.id,
            "Trip Starting Soon 📅",
            `Your trip to ${trip.destination} is now upcoming! Check your packing checklist.`,
            "trip",
            trip._id
          );
        }
      }

      // 2. Budget threshold alerts
      const limit = Number(budget !== undefined ? budget : (trip.budget || 0));
      if (limit > 0) {
        const totalSpent = Object.values(trip.expenses || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
        const oldSpent = Object.values(oldTrip.expenses || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
        
        if (totalSpent > limit && oldSpent <= limit) {
          await triggerNotification(
            req.user.id,
            "Budget Limit Exceeded! ⚠️",
            `Alert: Your spent costs of ₹${totalSpent.toLocaleString()} for "${trip.title}" have exceeded your budget limit of ₹${limit.toLocaleString()}!`,
            "warning",
            trip._id
          );
        } else if (totalSpent > limit * 0.85 && oldSpent <= limit * 0.85 && totalSpent <= limit) {
          await triggerNotification(
            req.user.id,
            "Approaching Budget Limit 📊",
            `Caution: You have used over 85% of your budget limit for "${trip.title}". Remaining: ₹${(limit - totalSpent).toLocaleString()}`,
            "warning",
            trip._id
          );
        }
      }

      // 3. Receipt scan notifications
      if (scannedExpenseInfo) {
        const { amount, vendor, category } = scannedExpenseInfo;
        await triggerNotification(
          req.user.id,
          "Receipt Scanned 🧾",
          `Successfully scanned receipt of ₹${Number(amount).toLocaleString()} from "${vendor}" and added to ${category}.`,
          "success",
          trip._id
        );
      }
    }

    res.json({
      success: true,
      message: "Trip Updated Successfully",
      trip,
    });
  } catch (error) {
    console.error("Trip Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// DELETE TRIP
export const deleteTrip = async (req, res) => {
  try {
    const oldTrip = await Trip.findById(req.params.id);
    if (!oldTrip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (!hasTripPermission(oldTrip, req.user.id, "delete_trip")) {
      return res.status(403).json({ success: false, message: "Forbidden: Only the Owner can delete this trip" });
    }

    await Trip.findByIdAndDelete(req.params.id);

    // Delete associated itinerary items, checklist items, notes, notifications, and flights
    await Itinerary.deleteMany({ trip: req.params.id });
    await Checklist.deleteMany({ trip: req.params.id });
    await Note.deleteMany({ trip: req.params.id });
    await Flight.deleteMany({ trip: req.params.id });
    await Notification.deleteMany({
      $or: [
        { trip: req.params.id },
        { message: { $regex: oldTrip.title, $options: "i" } }
      ]
    });

    res.json({
      success: true,
      message: "Trip Deleted Successfully",
    });
  } catch (error) {
    console.error("Trip Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GENERATE SHARE TOKEN
import crypto from "crypto";
export const generateShareToken = async (req, res) => {
  try {
    const { isPublic } = req.body;
    
    let updateFields = { isPublic };
    if (isPublic) {
      const trip = await Trip.findById(req.params.id);
      if (trip && !trip.shareToken) {
        updateFields.shareToken = crypto.randomUUID();
      }
    }

    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.json({
      success: true,
      message: isPublic ? "Trip shared publicly" : "Trip sharing disabled",
      trip,
    });
  } catch (error) {
    console.error("Trip Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const visitorCache = new Set();
setInterval(() => visitorCache.clear(), 24 * 60 * 60 * 1000);

// GET SHARED TRIP (PUBLIC)
export const getSharedTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      shareToken: req.params.token,
    })
      .populate("owner", "firstName lastName avatar")
      .populate("collaborators.userId", "firstName lastName avatar");

    if (!trip || (trip.visibility !== "public" && !trip.isPublic)) {
      return res.status(404).json({
        success: false,
        message: "Shared trip not found or is private",
      });
    }

    // Update shareAnalytics
    if (!trip.shareAnalytics) {
      trip.shareAnalytics = {
        views: 0,
        visitors: 0,
        visitorCountries: [],
        lastViewed: null,
      };
    }

    trip.shareAnalytics.views = (trip.shareAnalytics.views || 0) + 1;
    trip.shareAnalytics.lastViewed = new Date();

    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const visitorKey = `${trip._id}_${clientIp}`;
    if (!visitorCache.has(visitorKey)) {
      visitorCache.add(visitorKey);
      trip.shareAnalytics.visitors = (trip.shareAnalytics.visitors || 0) + 1;
    }

    const country = req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"] || "Unknown";
    const countryObj = trip.shareAnalytics.visitorCountries.find(vc => vc.country === country);
    if (countryObj) {
      countryObj.count += 1;
    } else {
      trip.shareAnalytics.visitorCountries.push({ country, count: 1 });
    }

    await trip.save();

    // Get itinerary, flights, and journals
    const itinerary = await Itinerary.find({ trip: trip._id }).sort({ day: 1, time: 1 });
    const flights = await Flight.find({ trip: trip._id }).sort({ departureTime: 1 });
    const journals = await Journal.find({ trip: trip._id }).sort({ day: 1 });

    // Sanitize trip object
    const sanitizedTrip = trip.toObject();
    delete sanitizedTrip.settlements;

    res.json({
      success: true,
      trip: sanitizedTrip,
      itinerary,
      flights,
      journals,
    });
  } catch (error) {
    console.error("Trip Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// CLONE TRIP
export const cloneTrip = async (req, res) => {
  try {
    const originalTrip = await Trip.findById(req.params.id);
    if (!originalTrip) {
      return res.status(404).json({
        success: false,
        message: "Original trip not found",
      });
    }

    if (originalTrip.user && originalTrip.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this trip" });
    }

    // Create cloned trip
    const clonedTrip = await Trip.create({
      user: req.user.id,
      title: `${originalTrip.title} (Copy)`,
      destination: originalTrip.destination,
      startDate: originalTrip.startDate,
      endDate: originalTrip.endDate,
      budget: originalTrip.budget,
      expenses: originalTrip.expenses,
      travelers: originalTrip.travelers,
      description: originalTrip.description,
      status: "planning",
      destinationName: originalTrip.destinationName,
      placeId: originalTrip.placeId,
      formattedAddress: originalTrip.formattedAddress,
      country: originalTrip.country,
      state: originalTrip.state,
      latitude: originalTrip.latitude,
      longitude: originalTrip.longitude,
      image: originalTrip.image,
    });

    // Copy itinerary items
    const originalItineraries = await Itinerary.find({ trip: originalTrip._id });
    for (const item of originalItineraries) {
      await Itinerary.create({
        trip: clonedTrip._id,
        day: item.day,
        time: item.time,
        title: item.title,
        place: item.place,
        category: item.category,
        budget: item.budget,
        note: item.note,
      });
    }

    // Copy checklist items
    const originalChecklist = await Checklist.find({ trip: originalTrip._id });
    for (const item of originalChecklist) {
      await Checklist.create({
        trip: clonedTrip._id,
        item: item.item,
        category: item.category,
        checked: false, // reset checked state
      });
    }

    // Copy notes
    const originalNotes = await Note.find({ trip: originalTrip._id });
    for (const item of originalNotes) {
      await Note.create({
        trip: clonedTrip._id,
        title: item.title,
        content: item.content,
        day: item.day,
        pinned: item.pinned,
        tags: item.tags,
        type: item.type,
      });
    }

    res.status(201).json({
      success: true,
      message: "Trip Cloned Successfully",
      trip: clonedTrip,
    });
  } catch (error) {
    console.error("Trip Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET ACTIVITIES RECOMMENDATIONS (GEMINI API)
export const getActivitiesRecommendations = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    const destination = trip.destination || "Goa";

    let recommendations = [];
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Suggest 5 popular tourist activities in ${destination}. Return the response strictly as a JSON array of objects, where each object has these fields: "title" (string), "description" (string), "duration" (string, e.g. "2-3 hours"), "estimatedCost" (number in INR, e.g. 1500), "category" (one of: Food, Sightseeing, Stay, Transport, Coffee, Activity). Do not include markdown formatting, code block backticks, or any conversational text.`
              }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          text = text.replace(/```json/g, "").replace(/```/g, "").trim();
          recommendations = JSON.parse(text);
        }
      } catch (geminiError) {
        console.error("Gemini API call failed, falling back:", geminiError);
      }
    }

    // Fallback if Gemini key is missing or failed
    if (!recommendations || recommendations.length === 0) {
      const dest = destination.toLowerCase();
      if (dest.includes("goa")) {
        recommendations = [
          { title: "Baga Beach Water Sports", description: "Enjoy jet skiing, parasailing, and banana rides.", duration: "2-3 hours", estimatedCost: 2500, category: "Activity" },
          { title: "Visit Dudhsagar Falls", description: "Majestic four-tiered waterfall on the Mandovi River.", duration: "5-6 hours", estimatedCost: 1500, category: "Sightseeing" },
          { title: "Dine at Britto's", description: "Famous beachfront restaurant offering delicious seafood.", duration: "1-2 hours", estimatedCost: 1200, category: "Food" },
          { title: "Explore Fort Aguada", description: "17th-century Portuguese lighthouse and fort.", duration: "1-2 hours", estimatedCost: 200, category: "Sightseeing" },
          { title: "South Goa Heritage Tour", description: "Visit old churches and spice plantations.", duration: "4-5 hours", estimatedCost: 1800, category: "Sightseeing" },
        ];
      } else if (dest.includes("bali")) {
        recommendations = [
          { title: "Ubud Monkey Forest Visit", description: "Sanctuary of grey long-tailed macaques.", duration: "2 hours", estimatedCost: 500, category: "Sightseeing" },
          { title: "Tanah Lot Temple Sunset", description: "Iconic offshore temple on a rock formation.", duration: "3 hours", estimatedCost: 800, category: "Sightseeing" },
          { title: "White Water Rafting Ayung River", description: "Thrilling rafting with beautiful scenery.", duration: "3-4 hours", estimatedCost: 2200, category: "Activity" },
          { title: "Balinese Cooking Class", description: "Learn traditional Balinese recipes.", duration: "3 hours", estimatedCost: 1800, category: "Food" },
          { title: "Scuba Diving in Tulamben", description: "Explore the USAT Liberty Shipwreck.", duration: "4 hours", estimatedCost: 3500, category: "Activity" },
        ];
      } else if (dest.includes("paris")) {
        recommendations = [
          { title: "Eiffel Tower Summit Tour", description: "Access the top floor for spectacular city views.", duration: "2 hours", estimatedCost: 2500, category: "Sightseeing" },
          { title: "Louvre Museum Guided Visit", description: "See the Mona Lisa and Venus de Milo.", duration: "3-4 hours", estimatedCost: 2000, category: "Sightseeing" },
          { title: "Seine River Dinner Cruise", description: "Scenic gourmet dining cruise past illuminated monuments.", duration: "2 hours", estimatedCost: 6500, category: "Food" },
          { title: "Pastry & Macaron Baking", description: "Learn to bake French macarons from a local chef.", duration: "2-3 hours", estimatedCost: 4000, category: "Food" },
          { title: "Palace of Versailles Tour", description: "Explore the Hall of Mirrors and royal gardens.", duration: "5-6 hours", estimatedCost: 3000, category: "Sightseeing" },
        ];
      } else if (dest.includes("chennai")) {
        recommendations = [
          { title: "Marina Beach Walk", description: "Take a stroll along the second longest urban beach in the world.", duration: "2 hours", estimatedCost: 0, category: "Sightseeing" },
          { title: "Visit Kapaleeshwarar Temple", description: "Explore the 7th-century Dravidian architecture temple in Mylapore.", duration: "1.5 hours", estimatedCost: 50, category: "Sightseeing" },
          { title: "South Indian Food Tour", description: "Savor traditional filter coffee, idli, dosa, and pongal at a local mess.", duration: "2 hours", estimatedCost: 350, category: "Food" },
          { title: "Government Museum & Art Gallery", description: "Discover rich history and bronze collections.", duration: "2 hours", estimatedCost: 150, category: "Sightseeing" },
          { title: "DakshinaChitra Heritage Museum", description: "Explore South Indian culture and craft workshops.", duration: "3-4 hours", estimatedCost: 500, category: "Sightseeing" },
        ];
      } else {
        recommendations = [
          { title: "City Sightseeing Bus Tour", description: "Hop-on hop-off tour of historical landmarks.", duration: "3 hours", estimatedCost: 1200, category: "Sightseeing" },
          { title: "Local Street Food Adventure", description: "Guided walking tour tasting authentic dishes.", duration: "2 hours", estimatedCost: 800, category: "Food" },
          { title: "Sunset Sailing Cruise", description: "Relaxing catamaran cruise with drinks.", duration: "2 hours", estimatedCost: 2500, category: "Activity" },
          { title: "Museum of Fine Arts", description: "Exhibitions of local and global history.", duration: "2 hours", estimatedCost: 600, category: "Sightseeing" },
          { title: "Local Cafe Crawl", description: "Visit the highest-rated specialty coffee shops.", duration: "2 hours", estimatedCost: 500, category: "Coffee" },
        ];
      }
    }

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error("Trip Controller Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET DESTINATIONS AUTOCOMPLETE (PLACES API)
export const getDestinationsAutocomplete = async (req, res) => {
  try {
    const { input, q } = req.query;
    const query = input || q;
    if (!query) {
      return res.json({ success: true, predictions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${apiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "OK" && data.predictions) {
            const predictions = data.predictions.map(p => ({
              description: p.description,
              placeId: p.place_id,
            }));
            return res.json({ success: true, predictions });
          } else {
            console.warn(`Places API returned status: ${data.status}. Falling back to curated list.`);
          }
        }
      } catch (placesError) {
        console.error("Places API autocomplete failed, falling back:", placesError);
      }
    }

    // Curated list of popular destinations worldwide as fallback
    const FALLBACK_DESTINATIONS = [
      "Paris, France", "London, UK", "New York, USA", "Tokyo, Japan", 
      "Bali, Indonesia", "Rome, Italy", "Singapore", "Dubai, UAE", 
      "Bangkok, Thailand", "Barcelona, Spain", "Amsterdam, Netherlands",
      "Istanbul, Turkey", "Seoul, South Korea", "Sydney, Australia",
      "Goa, India", "Mumbai, India", "Delhi, India", "Bangalore, India",
      "Kochi, India", "Jaipur, India", "Agra, India", "Manali, India",
      "Shimla, India", "Srinagar, India", "Udaipur, India", "Darjeeling, India",
      "Ooty, India", "Munnar, India", "Santorini, Greece", "Maldives",
      "Zurich, Switzerland", "Geneva, Switzerland", "Lucerne, Switzerland",
      "Interlaken, Switzerland", "Zermatt, Switzerland"
    ];

    const predictions = FALLBACK_DESTINATIONS.filter(d =>
      d.toLowerCase().includes(query.toLowerCase())
    ).map(d => ({
      description: d,
      placeId: "",
    })).slice(0, 8);

    res.json({
      success: true,
      predictions,
    });
  } catch (error) {
    console.error("Trip Controller Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET PLACE DETAILS
export const getDestinationDetails = async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId) {
      return res.status(400).json({ success: false, message: "placeId query parameter is required" });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: "Google API Key is not configured" });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,address_components,formatted_address,name,photos&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Place Details API query failed");
    }

    const data = await response.json();
    if (data.status !== "OK") {
      return res.status(400).json({ success: false, message: data.error_message || "Failed to load place details" });
    }

    const result = data.result;
    const { lat, lng } = result.geometry.location;

    let country = "";
    let state = "";
    for (const comp of result.address_components) {
      if (comp.types.includes("country")) {
        country = comp.long_name;
      }
      if (comp.types.includes("administrative_area_level_1")) {
        state = comp.long_name;
      }
    }

    let imageUrl = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80"; // fallback travel image
    if (result.photos && result.photos.length > 0) {
      imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${result.photos[0].photo_reference}&key=${apiKey}`;
    }

    res.json({
      success: true,
      formattedAddress: result.formatted_address,
      latitude: lat,
      longitude: lng,
      country,
      state,
      placeId,
      destinationName: result.name,
      imageUrl,
    });
  } catch (error) {
    console.error("Place details controller failed:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// INVITE COLLABORATOR
export const inviteCollaborator = async (req, res) => {
  try {
    const { email, role } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const isOwner = (trip.owner?._id || trip.owner)?.toString() === req.user.id || (trip.user?._id || trip.user)?.toString() === req.user.id;
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden: Only the Owner can invite collaborators" });
    }

    const invitee = await User.findOne({ email: email.trim().toLowerCase() });
    if (!invitee) {
      return res.status(404).json({ success: false, message: "User with this email address does not exist." });
    }

    if (invitee._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot invite yourself." });
    }

    const alreadyCollaborator = trip.collaborators?.some(
      (c) => c.userId && c.userId.toString() === invitee._id.toString()
    );
    if (alreadyCollaborator) {
      return res.status(400).json({ success: false, message: "User is already invited or is a collaborator." });
    }

    trip.collaborators.push({
      userId: invitee._id,
      role: role || "viewer",
      invitedAt: new Date(),
      acceptedAt: null,
    });
    await trip.save();

    const inviterName = req.user.firstName || req.user.email;
    await Notification.create({
      user: invitee._id,
      title: "Trip Invitation ✈️",
      message: `${inviterName} invited you to collaborate on "${trip.title}"`,
      type: "trip",
      trip: trip._id,
      isInvite: true,
      inviteStatus: "pending",
    });

    // Send Gmail Invitation Email
    try {
      const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}`;
      await sendInviteEmail({
        collaborator_email: invitee.email,
        trip_name: trip.title,
        owner_name: inviterName,
        role: role || "viewer",
        invite_link: inviteLink
      });
    } catch (mailErr) {
      console.error("Gmail Invite Send Failed:", mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Invitation sent successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET COLLABORATORS
export const getCollaborators = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate("collaborators.userId", "firstName lastName email");
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const acceptedCollaborators = trip.collaborators?.filter(c => c.acceptedAt !== null) || [];
    res.status(200).json({
      success: true,
      collaborators: acceptedCollaborators,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// REMOVE COLLABORATOR
export const removeCollaborator = async (req, res) => {
  try {
    const { userId } = req.params;
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const isOwner = (trip.owner?._id || trip.owner)?.toString() === req.user.id || (trip.user?._id || trip.user)?.toString() === req.user.id;
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden: Only the Owner can remove collaborators" });
    }

    trip.collaborators = trip.collaborators.filter(
      (c) => c.userId && c.userId.toString() !== userId.toString()
    );
    await trip.save();

    await Notification.create({
      user: userId,
      title: "Removed from Trip 🚪",
      message: `You have been removed from collaboration on "${trip.title}"`,
      type: "warning",
      trip: trip._id,
    });

    res.status(200).json({
      success: true,
      message: "Collaborator removed successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE COLLABORATOR ROLE
export const updateCollaboratorRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const isOwner = (trip.owner?._id || trip.owner)?.toString() === req.user.id || (trip.user?._id || trip.user)?.toString() === req.user.id;
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden: Only the Owner can change permissions" });
    }

    const collab = trip.collaborators.find(
      (c) => c.userId && c.userId.toString() === userId.toString()
    );
    if (!collab) {
      return res.status(404).json({ success: false, message: "Collaborator not found" });
    }

    collab.role = role;
    await trip.save();

    await Notification.create({
      user: userId,
      title: "Permissions Updated 🔑",
      message: `Your role on "${trip.title}" was updated to ${role}.`,
      type: "info",
      trip: trip._id,
    });

    res.status(200).json({
      success: true,
      message: "Collaborator role updated successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ACCEPT INVITE
export const acceptInvite = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    if (notification.inviteStatus !== "pending") {
      return res.status(400).json({ success: false, message: "Invitation already processed" });
    }

    const trip = await Trip.findById(notification.trip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip associated with invite not found" });
    }

    const collab = trip.collaborators.find(
      (c) => c.userId && (c.userId._id || c.userId).toString() === req.user.id.toString()
    );
    if (collab) {
      collab.acceptedAt = new Date();
      await trip.save();
    }

    notification.inviteStatus = "accepted";
    notification.read = true;
    await notification.save();

    const userName = req.user.firstName || req.user.email;
    await triggerNotification(
      trip.owner || trip.user,
      "Invitation Accepted 🎉",
      `${userName} accepted your invitation to collaborate on "${trip.title}"`,
      "success",
      trip._id
    );

    res.status(200).json({
      success: true,
      message: "Invitation accepted!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DECLINE INVITE
export const declineInvite = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    if (notification.inviteStatus !== "pending") {
      return res.status(400).json({ success: false, message: "Invitation already processed" });
    }

    const trip = await Trip.findById(notification.trip);
    if (trip) {
      trip.collaborators = trip.collaborators.filter(
        (c) => c.userId && c.userId.toString() !== req.user.id.toString()
      );
      await trip.save();
    }

    notification.inviteStatus = "declined";
    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Invitation declined!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ACTIVITY LOGS
export const getActivityLogs = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view activity logs" });
    }

    const logs = await ActivityLog.find({ trip: req.params.id })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET NEARBY DESTINATIONS (Smart Explore Engine — FIX 3/9) ──────────────
// In-memory cache: key=destinationName, value={ places, expiresAt }
const _nearbyCache = new Map();
const NEARBY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Curated fallback places keyed by normalized destination name fragment
const CURATED_NEARBY = {
  salem: [
    { name: "Yercaud", rating: 4.5, type: "Hill Station", emoji: "🏔️" },
    { name: "Kiliyur Falls", rating: 4.3, type: "Waterfall", emoji: "💧" },
    { name: "Mettur Dam", rating: 4.2, type: "Dam", emoji: "🏛️" },
    { name: "Pagoda Point", rating: 4.4, type: "Viewpoint", emoji: "🌄" },
    { name: "Bear's Cave", rating: 4.1, type: "Cave", emoji: "🗻" },
  ],
  chennai: [
    { name: "Marina Beach", rating: 4.5, type: "Beach", emoji: "🏖️" },
    { name: "Mahabalipuram", rating: 4.7, type: "Heritage Site", emoji: "🏛️" },
    { name: "Kapaleeshwarar Temple", rating: 4.6, type: "Temple", emoji: "🛕" },
    { name: "VGP Marine Kingdom", rating: 4.2, type: "Aquarium", emoji: "🐟" },
    { name: "DakshinaChitra", rating: 4.4, type: "Heritage Museum", emoji: "🎭" },
  ],
  tokyo: [
    { name: "Tokyo Tower", rating: 4.6, type: "Landmark", emoji: "🗼" },
    { name: "Shibuya Sky", rating: 4.7, type: "Observation Deck", emoji: "🌆" },
    { name: "Ginza", rating: 4.5, type: "Shopping District", emoji: "🛍️" },
    { name: "Imperial Palace", rating: 4.6, type: "Palace", emoji: "🏯" },
    { name: "Senso-ji Temple", rating: 4.8, type: "Temple", emoji: "⛩️" },
  ],
  bali: [
    { name: "Uluwatu Temple", rating: 4.7, type: "Temple", emoji: "🛕" },
    { name: "Ubud Rice Terraces", rating: 4.8, type: "Nature", emoji: "🌾" },
    { name: "Kuta Beach", rating: 4.4, type: "Beach", emoji: "🏖️" },
    { name: "Tanah Lot", rating: 4.7, type: "Temple", emoji: "🌊" },
    { name: "Mount Agung", rating: 4.6, type: "Volcano", emoji: "🌋" },
  ],
  goa: [
    { name: "Calangute Beach", rating: 4.4, type: "Beach", emoji: "🏖️" },
    { name: "Basilica of Bom Jesus", rating: 4.7, type: "Church", emoji: "⛪" },
    { name: "Dudhsagar Falls", rating: 4.7, type: "Waterfall", emoji: "💧" },
    { name: "Fort Aguada", rating: 4.4, type: "Fort", emoji: "🏰" },
    { name: "Anjuna Flea Market", rating: 4.2, type: "Market", emoji: "🛍️" },
  ],
  dubai: [
    { name: "Burj Khalifa", rating: 4.8, type: "Skyscraper", emoji: "🏙️" },
    { name: "Dubai Mall", rating: 4.7, type: "Shopping", emoji: "🛍️" },
    { name: "Palm Jumeirah", rating: 4.7, type: "Island", emoji: "🌴" },
    { name: "Dubai Frame", rating: 4.5, type: "Landmark", emoji: "🖼️" },
    { name: "Desert Safari", rating: 4.8, type: "Adventure", emoji: "🐪" },
  ],
  paris: [
    { name: "Eiffel Tower", rating: 4.7, type: "Landmark", emoji: "🗼" },
    { name: "Louvre Museum", rating: 4.8, type: "Museum", emoji: "🎨" },
    { name: "Palace of Versailles", rating: 4.8, type: "Palace", emoji: "🏰" },
    { name: "Musée d'Orsay", rating: 4.8, type: "Museum", emoji: "🖼️" },
    { name: "Sacré-Cœur Basilica", rating: 4.7, type: "Church", emoji: "⛪" },
  ],
  manali: [
    { name: "Rohtang Pass", rating: 4.6, type: "Mountain Pass", emoji: "🏔️" },
    { name: "Solang Valley", rating: 4.6, type: "Valley", emoji: "⛷️" },
    { name: "Hadimba Temple", rating: 4.5, type: "Temple", emoji: "🛕" },
    { name: "Jogini Waterfall", rating: 4.4, type: "Waterfall", emoji: "💧" },
    { name: "Beas River", rating: 4.3, type: "River", emoji: "🏞️" },
  ],
};

export const getNearbyDestinations = async (req, res) => {
  try {
    const { destination, budget, style } = req.query;
    if (!destination || destination.trim().length < 2) {
      return res.json({ success: true, places: [] });
    }

    const normalizedKey = destination.trim().toLowerCase();

    // Check in-memory cache
    const cached = _nearbyCache.get(normalizedKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ success: true, places: cached.places, fromCache: true });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

    if (apiKey) {
      try {
        // Step 1: Geocode the destination
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${apiKey}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (geoData.status === "OK" && geoData.results?.length > 0) {
          const { lat, lng } = geoData.results[0].geometry.location;

          // Step 2: Nearby Search — tourist attractions within 50km
          const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&type=tourist_attraction&rankby=prominence&key=${apiKey}`;
          const nearbyRes = await fetch(nearbyUrl);
          const nearbyData = await nearbyRes.json();

          if (nearbyData.status === "OK" && nearbyData.results?.length > 0) {
            // Sort by rating desc, take top 5
            const places = nearbyData.results
              .filter(p => p.rating && p.rating >= 3.5)
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 5)
              .map(p => ({
                name: p.name,
                rating: p.rating || 4.0,
                type: (p.types?.[0] || "attraction").replace(/_/g, " "),
                emoji: "📍",
                vicinity: p.vicinity || "",
                placeId: p.place_id || "",
              }));

            // Cache the result
            _nearbyCache.set(normalizedKey, { places, expiresAt: Date.now() + NEARBY_CACHE_TTL_MS });
            return res.json({ success: true, places });
          }
        }
      } catch (apiErr) {
        console.error("Google Places Nearby Search failed, using curated fallback:", apiErr);
      }
    }

    // Curated fallback: match by key fragment
    let places = [];
    for (const [key, list] of Object.entries(CURATED_NEARBY)) {
      if (normalizedKey.includes(key) || key.includes(normalizedKey)) {
        places = list;
        break;
      }
    }

    // Cache curated fallback for 5 minutes too
    if (places.length > 0) {
      _nearbyCache.set(normalizedKey, { places, expiresAt: Date.now() + NEARBY_CACHE_TTL_MS });
    }

    return res.json({ success: true, places });
  } catch (error) {
    console.error("getNearbyDestinations Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ADD EXPENSE ITEM
export const addExpense = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to add expenses to this trip" });
    }

    const {
      description,
      amount,
      currency,
      convertedAmount,
      baseCurrency,
      exchangeRate,
      category,
      paidBy,
      paidByName,
      participants,
      date,
    } = req.body;

    if (convertedAmount !== undefined && Number(convertedAmount) < 0) {
      return res.status(400).json({ success: false, message: "Expense amount cannot be negative." });
    }

    const activeBudget = await Budget.findOne({ tripId: trip._id, isArchived: false, isActive: true });
    const limitBudget = activeBudget ? activeBudget.totalBudget : (trip.budget || 0);

    const totalSpent = Object.values(trip.expenses || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const projectedTotal = totalSpent + (Number(convertedAmount) || 0);
    if (projectedTotal > limitBudget) {
      return res.status(400).json({ success: false, message: "Trip budget exceeded" });
    }

    const newExpense = {
      description,
      amount,
      currency,
      convertedAmount,
      baseCurrency,
      exchangeRate,
      category: category || "shopping",
      paidBy,
      paidByName,
      participants,
      date: date || new Date(),
    };

    trip.expenseItems.push(newExpense);

    // Update category summaries
    const cat = (category || "shopping").toLowerCase();
    const validCategories = ["transport", "accommodation", "food", "activities", "shopping"];
    const targetCat = validCategories.includes(cat) ? cat : "shopping";
    
    trip.expenses[targetCat] = (trip.expenses[targetCat] || 0) + Number(convertedAmount);

    await trip.save();

    // Sync budget
    await recalculateBudget(trip._id);

    // Reward +5 XP to the user who paid
    const user = await User.findById(req.user.id);
    if (user) {
      user.xp = (user.xp || 0) + 5;
      user.level = Math.floor(user.xp / 100) + 1;
      // Also update lastActiveDate for streak checking
      const today = new Date().toISOString().split("T")[0];
      user.lastActiveDate = today;
      await user.save();
    }

    const updatedTrip = await Trip.findById(trip._id);

    res.status(201).json({
      success: true,
      message: "Expense added successfully",
      trip: updatedTrip,
    });
  } catch (error) {
    console.error("Add Expense Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// DELETE EXPENSE ITEM
export const deleteExpense = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to delete expenses from this trip" });
    }

    const { expenseId } = req.params;
    const expenseIndex = trip.expenseItems.findIndex(item => item._id.toString() === expenseId);
    if (expenseIndex === -1) {
      return res.status(404).json({ success: false, message: "Expense item not found" });
    }

    const expense = trip.expenseItems[expenseIndex];
    const cat = (expense.category || "shopping").toLowerCase();
    const validCategories = ["transport", "accommodation", "food", "activities", "shopping"];
    const targetCat = validCategories.includes(cat) ? cat : "shopping";

    trip.expenses[targetCat] = Math.max(0, (trip.expenses[targetCat] || 0) - Number(expense.convertedAmount));
    trip.expenseItems.splice(expenseIndex, 1);

    await trip.save();

    // Sync budget
    await recalculateBudget(trip._id);

    const updatedTrip = await Trip.findById(trip._id);

    res.json({
      success: true,
      message: "Expense deleted successfully",
      trip: updatedTrip,
    });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ADD SETTLEMENT RECORD
export const addSettlement = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "update")) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to add settlements to this trip" });
    }

    const { from, fromName, to, toName, amount, currency, date } = req.body;

    const newSettlement = {
      from,
      fromName,
      to,
      toName,
      amount,
      currency: currency || "INR",
      date: date || new Date(),
    };

    trip.settlements.push(newSettlement);

    await trip.save();

    res.status(201).json({
      success: true,
      message: "Settlement recorded successfully",
      trip,
    });
  } catch (error) {
    console.error("Add Settlement Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET EXCHANGE RATES
export const getExchangeRates = async (req, res) => {
  try {
    const base = req.query.base || "INR";
    
    // Check cache
    let cached = await ExchangeRateCache.findOne({ baseCurrency: base });
    const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    if (cached && (Date.now() - cached.lastUpdated < cacheDuration)) {
      return res.json({
        success: true,
        rates: cached.rates,
        lastUpdated: cached.lastUpdated,
      });
    }
    
    // Fetch new rates
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }
    const data = await response.json();
    
    // Map to plain JS object to store in map
    const ratesMap = new Map(Object.entries(data.rates));

    if (cached) {
      cached.rates = ratesMap;
      cached.lastUpdated = new Date();
      await cached.save();
    } else {
      cached = await ExchangeRateCache.create({
        baseCurrency: base,
        rates: ratesMap,
        lastUpdated: new Date()
      });
    }
    
    res.json({
      success: true,
      rates: data.rates,
      lastUpdated: cached.lastUpdated,
    });
  } catch (error) {
    console.error("Exchange Rate Error:", error);
    res.status(500).json({
      success: false,
      message: "Could not fetch exchange rates",
    });
  }
};

// EXPORT TRIP AS PDF
export const exportTripPDF = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasTripPermission(trip, req.user.id, "read")) {
      return res.status(403).json({ success: false, message: "Forbidden: No permission to view this trip" });
    }

    const [itinerary, notes, checklist, flights, journals, activeBudget] = await Promise.all([
      Itinerary.find({ trip: trip._id }),
      Note.find({ trip: trip._id }),
      Checklist.find({ trip: trip._id }),
      Flight.find({ trip: trip._id }),
      Journal.find({ trip: trip._id }),
      Budget.findOne({ tripId: trip._id, isArchived: false, isActive: true })
    ]);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="trip-report-${trip._id}.pdf"`);

    generateTripPDF({
      trip,
      itinerary,
      notes,
      checklist,
      flights,
      journals,
      activeBudget
    }, res);
  } catch (error) {
    console.error("PDF Export Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Server Error generating PDF" });
    }
  }
};