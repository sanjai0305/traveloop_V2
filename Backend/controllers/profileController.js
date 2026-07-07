import User from "../models/User.js";
import Referral from "../models/Referral.js";
import Trip from "../models/Trip.js";
import Itinerary from "../models/Itinerary.js";
import Checklist from "../models/Checklist.js";
import Note from "../models/Note.js";
import Notification from "../models/Notification.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Budget from "../models/Budget.js";
import Flight from "../models/Flight.js";
import Journal from "../models/Journal.js";
import ChatMessage from "../models/ChatMessage.js";
import SystemSetting from "../models/SystemSetting.js";
import ReferralService from "../services/ReferralService.js";
import admin from "../config/firebaseAdmin.js";

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
      primaryMobile,
      alternateMobile,
      emergencyContact,
      age,
      gender,
      usersettingsCompleted,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) {
      user.phone = phone;
      user.primaryMobile = phone; // Keep in sync
      user.phoneNumber = phone;
    }
    if (primaryMobile !== undefined) {
      user.primaryMobile = primaryMobile;
      user.phone = primaryMobile; // Keep in sync
      user.phoneNumber = primaryMobile;
    }
    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber;
      user.primaryMobile = phoneNumber;
      user.phone = phoneNumber;
    }
    if (alternateMobile !== undefined) {
      user.alternateMobile = alternateMobile;
      user.alternateNumber = alternateMobile;
    }
    if (alternateNumber !== undefined) {
      user.alternateNumber = alternateNumber;
      user.alternateMobile = alternateNumber;
    }
    if (phoneVerified !== undefined) user.phoneVerified = phoneVerified;
    if (verifiedAt !== undefined) user.verifiedAt = verifiedAt;
    if (alternateVerified !== undefined) user.alternateVerified = alternateVerified;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (usersettingsCompleted !== undefined) {
      user.usersettingsCompleted = usersettingsCompleted;
      user.profileCompleted = usersettingsCompleted;
    }
    if (profileCompleted !== undefined) {
      user.profileCompleted = profileCompleted;
      user.usersettingsCompleted = profileCompleted;
    }
    
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
        primaryMobile: user.primaryMobile,
        primaryVerified: user.primaryVerified,
        phoneNumber: user.phoneNumber || user.primaryMobile || user.phone,
        phoneVerified: user.phoneVerified || user.primaryVerified,
        verifiedAt: user.verifiedAt,
        alternateMobile: user.alternateMobile,
        alternateNumber: user.alternateNumber || user.alternateMobile,
        alternateVerified: user.alternateVerified,
        emergencyContact: user.emergencyContact,
        age: user.age,
        gender: user.gender,
        usersettingsCompleted: user.usersettingsCompleted,
        profileCompleted: user.profileCompleted || user.usersettingsCompleted,
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

    // 1. Delete Firebase Authentication user profile (if exists)
    if (user.firebaseUid) {
      try {
        console.log(`[Cascading Delete] Deleting Firebase user: ${user.firebaseUid}`);
        await admin.auth().deleteUser(user.firebaseUid);
      } catch (fbErr) {
        // Log but don't block DB deletion if already deleted in Firebase
        console.warn(`[Cascading Delete] Firebase user deletion warning:`, fbErr.message);
      }
    }

    // Find all trips owned by this user (check both userId and user fields)
    const trips = await Trip.find({ $or: [{ userId }, { user: userId }] });
    const tripIds = trips.map(t => t._id);

    // 2. Delete child items of these trips
    if (tripIds.length > 0) {
      console.log(`[Cascading Delete] Deleting child resources for trips:`, tripIds);
      await Itinerary.deleteMany({ trip: { $in: tripIds } });
      await Checklist.deleteMany({ trip: { $in: tripIds } });
      await Note.deleteMany({ trip: { $in: tripIds } });
      await Budget.deleteMany({ tripId: { $in: tripIds } });
      await Flight.deleteMany({ tripId: { $in: tripIds } });
      await Journal.deleteMany({ tripId: { $in: tripIds } });
      await ChatMessage.deleteMany({ tripId: { $in: tripIds } });
      await Trip.deleteMany({ _id: { $in: tripIds } });
    }

    // 3. Delete user notifications (userId and user field)
    await Notification.deleteMany({ $or: [{ userId }, { user: userId }] });

    // 4. Delete user bookings
    await Booking.deleteMany({ userId });

    // 5. Delete user payments
    await Payment.deleteMany({ userId });

    // 6. Delete chat messages sent by this user
    await ChatMessage.deleteMany({ senderId: userId });

    // 7. Clean up other users' trip collaborators reference arrays
    await Trip.updateMany(
      { "collaborators.userId": userId },
      { $pull: { collaborators: { userId } } }
    );

    // 8. Delete user document from MongoDB (by firebaseUid or fallback userId)
    if (user.firebaseUid) {
      await User.deleteOne({ firebaseUid: user.firebaseUid });
    } else {
      await User.findByIdAndDelete(userId);
    }

    console.log(`[Cascading Delete] Account and all data deleted successfully for user: ${userId}`);

    res.json({
      success: true,
      message: "Account and all associated travel records deleted successfully.",
    });
  } catch (error) {
    console.error("[Cascading Delete Error]:", error);
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

// GET REFERRAL DASHBOARD STATS
export const getReferralDashboard = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const totalInvites = await Referral.countDocuments({ inviterId: userId });
    const successfulBookings = await Referral.countDocuments({ inviterId: userId, status: { $in: ["booked", "completed"] } });
    
    // Sum discountApplied from all referrals
    const referrals = await Referral.find({ inviterId: userId });
    const discountEarned = referrals.reduce((sum, r) => sum + (r.discountApplied || 0), 0);

    // Get referral system settings
    const enabledSetting = await SystemSetting.findOne({ key: "referral_enabled" });
    const discountSetting = await SystemSetting.findOne({ key: "referral_discount_percentage" });
    const referralEnabled = enabledSetting ? enabledSetting.value === true : false;
    const referralDiscountPercent = discountSetting ? Number(discountSetting.value) : 5;

    // Check invitee eligibility (referredBy is set, and has 0 Paid bookings)
    const paidBookingsCount = await Booking.countDocuments({ userId, paymentStatus: "Paid" });
    const isEligibleForDiscount = referralEnabled && !!user.referredBy && paidBookingsCount === 0;

    // Scratch card stats
    const scratchCards = user.scratchCards || [];
    const scratchCardsEarned = scratchCards.length;
    const rewardsClaimed = scratchCards.filter(c => c.claimed).length;

    // Count unused, unexpired coupons from scratch cards
    const now = new Date();
    const couponsAvailable = scratchCards.filter(c => 
      c.claimed && 
      !c.used && 
      c.rewardType !== "coins" && 
      (!c.expiresAt || new Date(c.expiresAt) > now)
    ).length;

    res.status(200).json({
      success: true,
      referralCode: user.referralCode || "",
      referredBy: user.referredBy || "",
      totalInvites,
      successfulBookings,
      coinsEarned: user.referralCoins || 0,
      discountEarned,
      walletBalance: user.walletBalance || 0,
      referralEnabled,
      referralDiscountPercent,
      isEligibleForDiscount,
      scratchCards,
      scratchCardsEarned,
      rewardsClaimed,
      couponsAvailable
    });
  } catch (error) {
    console.error("getReferralDashboard error:", error);
    res.status(500).json({ success: false, message: "Server Error loading referral dashboard" });
  }
};

// CLAIM SCRATCH CARD REWARD
export const claimScratchCard = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { cardId } = req.params;

    if (!cardId) {
      return res.status(400).json({ success: false, message: "Card ID is required" });
    }

    const result = await ReferralService.claimScratchCard(userId, cardId);
    res.status(200).json({
      success: true,
      message: "Reward claimed successfully",
      reward: result
    });
  } catch (error) {
    console.error("claimScratchCard error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to claim reward" });
  }
};

// SEND MOBILE OTP
export const sendMobileOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required." });
    }
    // Validation
    const isValid = /^[6-9][0-9]{9}$/.test(phone);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid phone number format. Must be 10 digits starting with 6-9." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Write to Firestore otps collection using admin
    const key = `phone_${phone}`;
    await admin.firestore().collection("otps").doc(key).set({
      otpCode,
      phone,
      expiresAt: expiresAt.toISOString(),
      verified: false,
    });

    console.log(`[Mobile OTP] Phone: ${phone}, OTP: ${otpCode}`);

    res.json({
      success: true,
      message: `OTP sent successfully to ${phone}`,
      debugOtp: otpCode,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// VERIFY MOBILE OTP
export const verifyMobileOtp = async (req, res) => {
  try {
    const { phone, otpCode, isAlternate } = req.body;
    if (!phone || !otpCode) {
      return res.status(400).json({ success: false, message: "Phone number and OTP code are required." });
    }

    const key = `phone_${phone}`;
    const otpDoc = await admin.firestore().collection("otps").doc(key).get();

    if (!otpDoc.exists) {
      return res.status(400).json({ success: false, message: "OTP not found or expired." });
    }

    const otpData = otpDoc.data();
    if (otpData.verified) {
      return res.status(400).json({ success: false, message: "This OTP has already been verified." });
    }

    if (new Date() > new Date(otpData.expiresAt)) {
      return res.status(400).json({ success: false, message: "OTP code has expired." });
    }

    if (otpData.otpCode !== otpCode) {
      return res.status(400).json({ success: false, message: "Invalid OTP code." });
    }

    // Mark as verified
    await admin.firestore().collection("otps").doc(key).update({ verified: true });

    // Update user profile status
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (isAlternate) {
      user.alternateMobile = phone;
      user.alternateVerified = true;
    } else {
      user.primaryMobile = phone;
      user.phone = phone; // sync
      user.primaryVerified = true;
    }

    await user.save();

    res.json({
      success: true,
      message: "Phone number verified successfully.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        primaryMobile: user.primaryMobile,
        primaryVerified: user.primaryVerified,
        alternateMobile: user.alternateMobile,
        alternateVerified: user.alternateVerified,
        emergencyContact: user.emergencyContact,
        age: user.age,
        gender: user.gender,
        usersettingsCompleted: user.usersettingsCompleted,
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
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// VERIFY FIREBASE PHONE TOKEN (REAL FIREBASE AUTH)
export const verifyFirebasePhone = async (req, res) => {
  try {
    const { phone, idToken, isAlternate } = req.body;
    if (!phone || !idToken) {
      return res.status(400).json({ success: false, message: "Phone number and Firebase ID token are required." });
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (fbErr) {
      return res.status(401).json({ success: false, message: "Invalid or expired Firebase Auth token." });
    }

    // Update user profile status
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (isAlternate) {
      user.alternateMobile = phone;
      user.alternateNumber = phone;
      user.alternateVerified = true;
    } else {
      user.primaryMobile = phone;
      user.phoneNumber = phone;
      user.phone = phone; // sync
      user.primaryVerified = true;
      user.phoneVerified = true; // store verified state
      user.verifiedAt = new Date();
    }

    await user.save();

    res.json({
      success: true,
      message: "Real Firebase Phone number verified successfully.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        primaryMobile: user.primaryMobile,
        primaryVerified: user.primaryVerified,
        phoneNumber: user.phoneNumber || user.primaryMobile || user.phone,
        phoneVerified: user.phoneVerified || user.primaryVerified,
        verifiedAt: user.verifiedAt,
        alternateMobile: user.alternateMobile,
        alternateNumber: user.alternateNumber || user.alternateMobile,
        alternateVerified: user.alternateVerified,
        emergencyContact: user.emergencyContact,
        age: user.age,
        gender: user.gender,
        usersettingsCompleted: user.usersettingsCompleted,
        profileCompleted: user.profileCompleted || user.usersettingsCompleted,
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
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

