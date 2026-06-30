import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Itinerary from "../models/Itinerary.js";
import Checklist from "../models/Checklist.js";
import Note from "../models/Note.js";
import Notification from "../models/Notification.js";

// Get saved destinations
export const getSavedDestinations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      savedDestinations: user.savedDestinations || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add saved destination
export const addSavedDestination = async (req, res) => {
  try {
    const { destination } = req.body;
    if (!destination) {
      return res.status(400).json({ success: false, message: "Destination is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.savedDestinations) {
      user.savedDestinations = [];
    }

    // Add if not already saved
    if (!user.savedDestinations.includes(destination)) {
      user.savedDestinations.push(destination);
      await user.save();
    }

    res.json({
      success: true,
      message: "Destination saved successfully",
      savedDestinations: user.savedDestinations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove saved destination
export const removeSavedDestination = async (req, res) => {
  try {
    const { name } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.savedDestinations) {
      user.savedDestinations = user.savedDestinations.filter(d => d !== name);
      await user.save();
    }

    res.json({
      success: true,
      message: "Destination removed successfully",
      savedDestinations: user.savedDestinations || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update profile details
export const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      city,
      country,
      language,
      privacyVisibility,
      notificationPreferences,
      avatar,
      upiId,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;
    if (language !== undefined) user.language = language;
    if (privacyVisibility !== undefined) user.privacyVisibility = privacyVisibility;
    if (avatar !== undefined) user.avatar = avatar;
    if (upiId !== undefined) user.upiId = upiId;
    if (notificationPreferences !== undefined) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences,
      };
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        avatar: user.avatar,
        authProvider: user.authProvider,
        language: user.language,
        privacyVisibility: user.privacyVisibility,
        notificationPreferences: user.notificationPreferences,
        savedDestinations: user.savedDestinations,
        upiId: user.upiId,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        lastActiveDate: user.lastActiveDate,
        acceptedTerms: user.acceptedTerms,
        termsVersion: user.termsVersion,
        termsAcceptedAt: user.termsAcceptedAt,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete account cascading delete
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Find all trips owned by this user
    const trips = await Trip.find({ user: userId });
    const tripIds = trips.map(t => t._id);

    // Delete child items of these trips
    if (tripIds.length > 0) {
      await Itinerary.deleteMany({ trip: { $in: tripIds } });
      await Checklist.deleteMany({ trip: { $in: tripIds } });
      await Note.deleteMany({ trip: { $in: tripIds } });
      await Trip.deleteMany({ _id: { $in: tripIds } });
    }

    // Delete user notifications
    await Notification.deleteMany({ user: userId });

    // Delete user document
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "Account and all associated travel records deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reward XP & Unlock Chat Starter achievement
export const rewardXp = async (req, res) => {
  try {
    const { action } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let xpToAdd = 0;
    let achievementToUnlock = null;

    if (action === "chat_message") {
      xpToAdd = 2;
      achievementToUnlock = "Chat Starter";
    } else if (action === "trip_creation") {
      xpToAdd = 10;
      achievementToUnlock = "First Trip Created";
    } else if (action === "expense_added") {
      xpToAdd = 5;
      achievementToUnlock = "Budget Master";
    } else if (action === "journal_entry") {
      xpToAdd = 3;
      achievementToUnlock = "Journal Keeper";
    } else if (action === "trip_completion") {
      xpToAdd = 20;
    }

    if (xpToAdd > 0) {
      user.xp = (user.xp || 0) + xpToAdd;
      user.level = Math.floor(user.xp / 100) + 1;
      const today = new Date().toISOString().split("T")[0];
      user.lastActiveDate = today;
    }

    if (achievementToUnlock && !user.achievements.includes(achievementToUnlock)) {
      user.achievements.push(achievementToUnlock);
    }

    await user.save();

    res.json({
      success: true,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      achievements: user.achievements,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
