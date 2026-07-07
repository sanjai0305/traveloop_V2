import crypto from "crypto";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import AgentTrip from "../models/AgentTrip.js";
import Agent from "../models/Agent.js";
import SystemSetting from "../models/SystemSetting.js";
import AdminNotification from "../models/AdminNotification.js";
import Trip from "../models/Trip.js";
import Itinerary from "../models/Itinerary.js";
import Budget from "../models/Budget.js";
import Checklist from "../models/Checklist.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import { triggerNotification } from "../controllers/notificationController.js";


// ─── HELPERS FOR USER TRIP CLONING ────────────────────────────────────────────

const DESTINATION_ACTIVITIES = {
  yercaud: [
    { day: 1, time: "07:00", title: "Sunrise walk at Yercaud Lake", category: "Activity", note: "Serene morning walk around the lake — bring a camera!" },
    { day: 1, time: "08:30", title: "Breakfast at hotel", category: "Food", note: "Start the day with local South Indian breakfast" },
    { day: 1, time: "10:00", title: "Botanical Garden visit", category: "Sightseeing", note: "Over 300 plant species — children will love the orchid section" },
    { day: 1, time: "12:30", title: "Lunch at a local restaurant", category: "Food", note: "Try local Tamil cuisine and fresh hill coffee" },
    { day: 1, time: "14:00", title: "Shevaroy Hills Temple", category: "Sightseeing", note: "Scenic viewpoint and ancient Shevaroy temple at the peak" },
    { day: 1, time: "16:00", title: "Pagoda Point viewpoint", category: "Sightseeing", note: "360° panoramic view of Salem city and valleys" },
    { day: 1, time: "18:00", title: "Campfire & group bonding", category: "Activity", note: "Evening campfire — organized by hotel / group activity" },
    { day: 1, time: "20:00", title: "Group dinner", category: "Food", note: "BBQ or buffet dinner with the group" },
    { day: 2, time: "07:30", title: "Sunrise photography session", category: "Activity", note: "Golden hour photography from the hilltop" },
    { day: 2, time: "09:00", title: "Boating at Yercaud Lake", category: "Activity", note: "Paddle boats and row boats available — book at the lake" },
    { day: 2, time: "11:00", title: "Anna Park & Children's Park", category: "Sightseeing", note: "Beautiful rose gardens and walking tracks" },
    { day: 2, time: "13:00", title: "Farewell lunch", category: "Food", note: "Last meal before departure" },
  ],
  goa: [
    { day: 1, time: "09:00", title: "Calangute Beach morning walk", category: "Activity", note: "Most popular beach in Goa — great for swimming" },
    { day: 1, time: "11:00", title: "Water sports at Baga Beach", category: "Activity", note: "Parasailing, jet ski, banana boat rides" },
    { day: 1, time: "13:30", title: "Seafood lunch at beach shack", category: "Food", note: "Try Goan fish curry, prawn masala, and sol kadhi" },
    { day: 1, time: "16:00", title: "Anjuna Flea Market", category: "Activity", note: "Local handicrafts, clothes, jewelry" },
    { day: 1, time: "18:30", title: "Sunset cruise", category: "Activity", note: "Mandovi River cruise — live music and sunset views" },
    { day: 1, time: "21:00", title: "Nightlife at Tito's Lane", category: "Activity", note: "Pubs and cafes along the famous strip" },
    { day: 2, time: "08:00", title: "Old Goa churches tour", category: "Sightseeing", note: "UNESCO World Heritage — Basilica of Bom Jesus, Se Cathedral" },
    { day: 2, time: "11:00", title: "Dudhsagar Waterfall trip", category: "Sightseeing", note: "Spectacular 4-tiered waterfall — jeep safari from Mollem" },
    { day: 2, time: "14:00", title: "Lunch at Panjim cafes", category: "Food", note: "Portuguese-influenced Goan cuisine in Fontainhas quarter" },
    { day: 2, time: "17:00", title: "Arambol Beach sunset", category: "Activity", note: "Hippie vibe beach — drum circles at sunset" },
  ]
};

const generateAISuggestedActivities = (dest, days) => {
  const norm = (dest || "").toLowerCase().trim();
  let base = DESTINATION_ACTIVITIES[norm];
  if (!base) {
    const key = Object.keys(DESTINATION_ACTIVITIES).find(k => norm.includes(k));
    base = key ? DESTINATION_ACTIVITIES[key] : null;
  }
  if (!base) {
    base = [
      { day: 1, time: "09:00", title: `Explore main spots in ${dest}`, category: "Sightseeing", note: "Enjoy the local views and landmarks" },
      { day: 1, time: "13:00", title: "Lunch at highly-rated restaurant", category: "Food", note: "Try local authentic dishes" },
      { day: 1, time: "16:00", title: "Evening walk & market shopping", category: "Activity", note: "Pick up local souvenirs and explore streets" },
      { day: 2, time: "09:00", title: "Local cultural tour", category: "Sightseeing", note: "Visit museums or historical landmarks nearby" },
    ];
  }
  return base.filter(a => a.day <= days);
};

const generatePackingItems = (agentTrip) => {
  const dest = (agentTrip.title || "").toLowerCase();
  const list = [
    { item: "ID Card / Ticket printout", category: "Documents" },
    { item: "Phone Charger & Powerbank", category: "Electronics" },
    { item: "Toiletries Kit", category: "Toiletries" },
    { item: "Comfortable clothes", category: "Clothes" },
  ];
  if (dest.includes("yercaud") || dest.includes("hill") || dest.includes("ooty")) {
    list.push({ item: "Warm jacket / Sweater", category: "Clothes" });
    list.push({ item: "Motion sickness pills", category: "Health" });
  }
  return list;
};

const cloneAgentTripToUserTrip = async (booking, agentTrip, userId, totalAmount) => {
  const destination = (agentTrip.destinations || [])[0] || agentTrip.title || "Trip";

  const newTrip = await Trip.create({
    userId,
    image: agentTrip.coverImage || "",
    title: agentTrip.title,
    destination,
    startDate: agentTrip.startDate || null,
    endDate: agentTrip.endDate || null,
    budget: totalAmount,
    isPublic: false,
    status: "planning",
  });

  const userTrip = { ...newTrip.toObject(), _id: newTrip._id };

  // Clone itinerary
  await Itinerary.create({
    tripId: userTrip._id,
    day: 1,
    title: `Departure to ${destination}`,
    description: agentTrip.pickupLocation ? `Pickup from: ${agentTrip.pickupLocation}` : "",
  });

  // Seed Budget
  await Budget.create({
    tripId: userTrip._id,
    totalBudget: totalAmount,
    isArchived: false,
    isActive: true,
  });

  // Seed Checklist
  const packingItems = generatePackingItems(agentTrip);
  if (packingItems.length > 0) {
    const checkListInserts = packingItems.map(p => ({
      tripId: userTrip._id,
      userId,
      itemName: p.item,
      item: p.item,
      category: p.category,
      packed: false,
      checked: false,
    }));
    await Checklist.insertMany(checkListInserts);
  }

  // Seed AI suggested activities
  try {
    const daysStr = (agentTrip.duration || "").match(/(\d+)/)?.[1];
    const tripDays = daysStr ? parseInt(daysStr) : 1;
    const aiActivities = generateAISuggestedActivities(destination, tripDays);
    if (aiActivities.length > 0) {
      const aiInserts = aiActivities.map(a => ({
        tripId: userTrip._id,
        day: a.day,
        title: a.title,
        description: a.note || "",
        isAiSuggestion: true,
        aiSource: a.aiSource || "traveloop-destination-engine-v1",
      }));
      await Itinerary.insertMany(aiInserts);
    }
  } catch (aiErr) {
    console.warn("[AI Activities] Failed to seed AI suggestions:", aiErr.message);
  }

  return userTrip;
};

// ─── CENTRALIZED BOOKING SERVICE ──────────────────────────────────────────────

export class BookingService {
  /**
   * Centralized method to create a booking, update seat counters, update agent revenue,
   * clone the trip, and send notifications.
   */
  static async createBooking(payload) {
    const {
      tripId,
      userId,
      travellers = [],
      seats,
      seatNumbers = [],
      totalAmount = 0,
      paymentStatus = "Paid",
      bookingStatus = "confirmed",
      paymentVerified = true,
      paymentDate = new Date(),
      maleCount = 0,
      femaleCount = 0,
      adults = 1,
      children = 0,
      pickupLocation = "",
      contactNumber = "",
      couponCode = "",
      contactEmail = "",
      contactPhone = "",
      emailVerified = true,
      phoneVerified = true,
    } = payload;

    if (!tripId) {
      throw new Error("tripId is required");
    }
    if (!userId) {
      throw new Error("userId is required");
    }

    // 1. Fetch AgentTrip
    const trip = await AgentTrip.findById(tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }

    if (trip.bookingDeadline) {
      const deadline = new Date(trip.bookingDeadline);
      if (!isNaN(deadline.getTime()) && new Date() > deadline) {
        throw new Error("Bookings closed for this trip");
      }
    }

    const totalTravellers = seats || travellers.length || 1;

    // 2. Validate seat availability
    if ((trip.availableSeats || 0) < totalTravellers) {
      throw new Error("Not enough available seats left on this trip");
    }

    // 3. Compute commission, gateway fee, agent amount
    const agent = await Agent.findById(trip.agentId || trip.agent);
    const defaultCommSetting = await SystemSetting.findOne({ key: "default_commission" });
    const defaultRate = defaultCommSetting ? defaultCommSetting.value : 10;
    
    // Check if trip has commissionPercentage stored, else fallback
    const commRate = trip.commissionPercentage !== undefined ? trip.commissionPercentage : defaultRate;

    const commissionAmount = totalAmount * (commRate / 100);
    const agentAmount = totalAmount - commissionAmount;

    // 4. Normalize gender helper
    const normalizeGender = (g) => {
      if (!g) return "Other";
      const lower = g.toLowerCase();
      if (lower === "male") return "Male";
      if (lower === "female") return "Female";
      return "Other";
    };

    const travelersNormalized = travellers.map(t => ({
      name: t.name,
      age: Number(t.age || 0),
      gender: normalizeGender(t.gender),
      phone: t.phone || t.contactPhone || "",
      email: t.email || t.contactEmail || "",
      contactEmail: t.contactEmail || "",
      contactPhone: t.contactPhone || "",
      emailVerified: t.emailVerified !== undefined ? t.emailVerified : true,
      phoneVerified: t.phoneVerified !== undefined ? t.phoneVerified : true,
    }));

    const bookingId = `TLP-${Math.floor(10000 + Math.random() * 90000)}`;

    // Referral calculation check
    const referralEnabledSetting = await SystemSetting.findOne({ key: "referral_enabled" });
    const referralEnabled = referralEnabledSetting ? referralEnabledSetting.value === true : false;

    const referralDiscountSetting = await SystemSetting.findOne({ key: "referral_discount_percentage" });
    const referralDiscountPercent = referralDiscountSetting ? Number(referralDiscountSetting.value) : 5;

    const userObj = await User.findById(userId);
    const paidBookingsCount = await Booking.countDocuments({ userId, paymentStatus: "Paid" });

    let isReferralApplied = false;
    let discountAmount = 0;
    let originalPrice = totalAmount;
    let appliedReferralCode = "";

    // Resolve Coupon if passed
    if (couponCode && couponCode.trim()) {
      if (userObj) {
        // Find matching scratch card coupon
        const couponCard = userObj.scratchCards.find(c => 
          c.couponCode && 
          c.couponCode.trim().toUpperCase() === couponCode.trim().toUpperCase() &&
          c.claimed && 
          !c.used &&
          (!c.expiresAt || new Date(c.expiresAt) > new Date())
        );

        if (couponCard) {
          isReferralApplied = true;
          appliedReferralCode = couponCode.trim();
          const subtotal = (trip.offerPrice || trip.pricePerPerson || 0) * totalTravellers;
          
          if (couponCard.rewardType === "percentage_discount") {
            const pct = parseInt(couponCard.rewardValue);
            discountAmount = Math.round(subtotal * (pct / 100));
          } else if (couponCard.rewardType === "flat_discount") {
            const flatAmt = parseInt(couponCard.rewardValue.replace(/[^0-9]/g, ""));
            discountAmount = Math.min(subtotal, flatAmt);
          } else if (couponCard.rewardType === "free_upgrade") {
            discountAmount = 150;
          }
          
          originalPrice = totalAmount + discountAmount;
          
          // Mark the scratch card coupon as used!
          couponCard.used = true;
          couponCard.couponUsed = true;
          couponCard.usedBookingId = bookingId;
          
          // If this is the active coupon in user fields, mark it used
          if (userObj.couponCode && userObj.couponCode.trim().toUpperCase() === couponCode.trim().toUpperCase()) {
            userObj.couponStatus = "Used";
          }
          await userObj.save();
        }
      }
    }

    if (!isReferralApplied && referralEnabled && userObj && userObj.referredBy && paidBookingsCount === 0) {
      isReferralApplied = true;
      appliedReferralCode = userObj.referredBy;
      const subtotal = (trip.offerPrice || trip.pricePerPerson || 0) * totalTravellers;
      discountAmount = Math.round(subtotal * (referralDiscountPercent / 100));
      originalPrice = totalAmount + discountAmount;
    }

    // 5. Create Booking record
    const booking = await Booking.create({
      bookingId,
      userId,
      tripId: trip._id,
      agentId: trip.agentId || trip.agent,
      seats: totalTravellers,
      seatNumbers,
      pricePaid: totalAmount,
      amount: totalAmount,
      amountPaid: totalAmount,
      paymentStatus,
      status: paymentStatus,
      bookingStatus,
      boardingStatus: "LOCKED",
      paymentVerified,
      paymentDate,
      assignedSeat: seatNumbers[0] || "",
      travelerName: travelersNormalized[0]?.name || "",
      gender: normalizeGender(travelersNormalized[0]?.gender || ""),
      contactNumber: contactPhone || travelersNormalized[0]?.contactPhone || travelersNormalized[0]?.phone || contactNumber || userObj?.phone || userObj?.phoneNumber || userObj?.primaryMobile || "",
      age: travelersNormalized[0]?.age || 0,
      travellers: travelersNormalized,
      maleCount: Number(maleCount || 0),
      femaleCount: Number(femaleCount || 0),
      adults: Number(adults || 1),
      children: Number(children || 0),
      commissionAmount,
      adminCommission: commissionAmount,
      agentAmount,
      bookingAmount: totalAmount,
      pickupLocation,
      token: crypto.randomUUID(),
      referralApplied: isReferralApplied,
      referralCode: appliedReferralCode,
      referralDiscountPercent: (couponCode && isReferralApplied) ? 0 : (isReferralApplied ? referralDiscountPercent : 0),
      referralDiscountAmount: discountAmount,
      originalPrice: originalPrice,
      contactEmail: contactEmail || travelersNormalized[0]?.contactEmail || travelersNormalized[0]?.email || userObj?.email || "",
      contactPhone: contactPhone || travelersNormalized[0]?.contactPhone || travelersNormalized[0]?.phone || contactNumber || userObj?.phone || userObj?.phoneNumber || userObj?.primaryMobile || "",
      emailVerified: emailVerified !== undefined ? emailVerified : true,
      phoneVerified: phoneVerified !== undefined ? phoneVerified : true,
    });

    if (isReferralApplied) {
      // 1. Update referral status
      const referral = await Referral.findOne({ invitedId: userId, status: "registered" });
      if (referral) {
        referral.status = "booked";
        referral.booked = true;
        referral.tripId = trip._id;
        referral.discountApplied = discountAmount;
        await referral.save();
      }

      // 2. Load coins configuration
      const coinRewardSetting = await SystemSetting.findOne({ key: "referral_coin_reward" });
      const rewardCoins = coinRewardSetting ? Number(coinRewardSetting.value) : 100;

      // 3. Find inviter user and reward
      const inviter = await User.findOne({ referralCode: userObj.referredBy.trim().toUpperCase() });
      if (inviter) {
        inviter.walletBalance = (inviter.walletBalance || 0) + rewardCoins;
        inviter.referralCoins = (inviter.referralCoins || 0) + rewardCoins;
        await inviter.save();

        // 4. Trigger inviter notification
        try {
          await triggerNotification(
            inviter._id,
            "Referral Reward Earned! 🎉",
            `Your friend booked a trip. You earned ${rewardCoins} Travel Coins.`,
            "reward"
          );
        } catch (notifErr) {
          console.error("Failed to send inviter notification:", notifErr);
        }
      }

      // 5. Trigger invitee notification
      try {
        await triggerNotification(
          userId,
          "Referral Discount Applied! 🎁",
          `Referral discount applied successfully. Saved ₹${discountAmount} on this booking.`,
          "reward"
        );
      } catch (notifErr) {
        console.error("Failed to send invitee notification:", notifErr);
      }
    }

    // 6. Update AgentTrip seat counters & occupancy recalculation
    trip.bookedSeats = (trip.bookedSeats || 0) + totalTravellers;
    trip.availableSeats = Math.max(0, (trip.availableSeats || 0) - totalTravellers);
    trip.maleCount = (trip.maleCount || 0) + Number(maleCount || 0);
    trip.femaleCount = (trip.femaleCount || 0) + Number(femaleCount || 0);
    trip.childrenCount = (trip.childrenCount || 0) + Number(children || 0);
    
    // occupancy rate calculation is also performed in AgentTrip's pre-save hook
    const totalS = trip.totalSeats || 40;
    trip.occupancy = totalS > 0 ? Math.round((trip.bookedSeats / totalS) * 100) : 0;
    
    // Set custom database attributes
    trip.bookingCount = (trip.bookingCount || 0) + 1;
    trip.occupancyRate = trip.occupancy;
    trip.walletAmount = (trip.walletAmount || 0) + agentAmount;
    await trip.save();

    // Update Wallet balance & transactional ledger
    const targetAgentId = trip.agentId || trip.agent;
    if (targetAgentId) {
      let wallet = await Wallet.findOne({ agentId: targetAgentId });
      if (!wallet) {
        wallet = new Wallet({ agentId: targetAgentId });
      }
      wallet.balance += agentAmount;
      wallet.withdrawableBalance += agentAmount;
      wallet.transactions.push({
        date: new Date(),
        bookingId: bookingId,
        customerName: travelersNormalized[0]?.name || "Traveler",
        amount: totalAmount,
        commission: commissionAmount,
        netEarnings: agentAmount,
        status: "Completed",
      });
      await wallet.save();
    }

    // 7. Update Agent aggregated statistics
    if (agent) {
      agent.revenue = (agent.revenue || 0) + totalAmount;
      agent.totalRevenue = (agent.totalRevenue || 0) + totalAmount;
      agent.pendingRevenue = (agent.pendingRevenue || 0) + agentAmount;
      agent.totalBookings = (agent.totalBookings || 0) + 1;
      await agent.save();
    }

    // 8. Clone agent trip to personal user planner workspace
    let userTrip = null;
    try {
      userTrip = await cloneAgentTripToUserTrip(booking, trip, userId, totalAmount);
    } catch (cloneErr) {
      console.warn("[BookingService] Personal trip clone warning:", cloneErr.message);
    }

    // 9. Create Admin Notification
    try {
      const passengerName = travelersNormalized[0]?.name || "Traveler";
      await AdminNotification.create({
        title: "New Booking Confirmed",
        message: `Traveler ${passengerName} booked trip '${trip.title}' for ₹${totalAmount}`,
        type: "booking",
      });
    } catch (notifErr) {
      console.warn("[BookingService] Failed to create admin notification:", notifErr.message);
    }

    return {
      booking,
      userTrip,
    };
  }
}
export default BookingService;
