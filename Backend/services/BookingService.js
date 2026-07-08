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

const generateBookingId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randStr = "";
  for (let i = 0; i < 6; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TL-${dateStr}-${randStr}`;
};


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
      accountEmail = "",
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
      phone: t.phone || t.travelerPhone || t.contactPhone || "",
      email: t.email || t.accountEmail || t.contactEmail || "",
      contactEmail: t.contactEmail || t.accountEmail || "",
      contactPhone: t.contactPhone || t.travelerPhone || "",
      emailVerified: t.emailVerified !== undefined ? t.emailVerified : true,
      phoneVerified: t.phoneVerified !== undefined ? t.phoneVerified : true,
      accountEmail: t.accountEmail || "",
      travelerPhone: t.travelerPhone || "",
      travelerPhoneVerified: t.travelerPhoneVerified !== undefined ? t.travelerPhoneVerified : false,
      bookingForOthers: t.bookingForOthers !== undefined ? t.bookingForOthers : false,
      verifiedAt: t.verifiedAt || null,
    }));

    const bookingId = generateBookingId();

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
        // Find in userObj.rewards
        const reward = userObj.rewards ? userObj.rewards.find(r => 
          r.couponCode.trim().toUpperCase() === couponCode.trim().toUpperCase() &&
          r.status === "AVAILABLE" &&
          !r.used &&
          (!r.expiresAt || new Date(r.expiresAt) > new Date())
        ) : null;

        // Find matching scratch card coupon
        const couponCard = userObj.scratchCards ? userObj.scratchCards.find(c => 
          c.couponCode && 
          c.couponCode.trim().toUpperCase() === couponCode.trim().toUpperCase() &&
          c.claimed && 
          !c.used &&
          (!c.expiresAt || new Date(c.expiresAt) > new Date())
        ) : null;

        if (reward || couponCard) {
          isReferralApplied = true;
          appliedReferralCode = couponCode.trim();
          const subtotal = (trip.offerPrice || trip.pricePerPerson || 0) * totalTravellers;
          
          let pct = 0;
          if (reward) {
            pct = reward.discountPercent;
          } else if (couponCard && couponCard.rewardType === "percentage_discount") {
            pct = parseInt(couponCard.rewardValue);
          }
          
          discountAmount = Math.round(subtotal * (pct / 100));
          originalPrice = totalAmount + discountAmount;
          
          // Mark as used in rewards
          if (reward) {
            reward.used = true;
            reward.status = "USED";
            reward.usedBookingId = bookingId;
            reward.usedAt = new Date();
          }

          // Mark as used in scratchCards for backward compatibility
          if (couponCard) {
            couponCard.used = true;
            couponCard.couponUsed = true;
            couponCard.usedBookingId = bookingId;
            couponCard.usedAt = new Date();
          }
          
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
      pricePaid: totalAmount - discountAmount,
      amount: totalAmount - discountAmount,
      amountPaid: 0,
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
      bookingAmount: totalAmount - discountAmount,
      pickupLocation,
      token: crypto.randomUUID(),
      referralApplied: isReferralApplied,
      referralCode: appliedReferralCode,
      referralDiscountPercent: (couponCode && isReferralApplied) ? 0 : (isReferralApplied ? referralDiscountPercent : 0),
      referralDiscountAmount: discountAmount,
      originalPrice: originalPrice,
      couponCode: couponCode ? couponCode.trim().toUpperCase() : "",
      discountAmount: discountAmount,
      originalAmount: originalPrice || totalAmount,
      finalAmount: totalAmount - discountAmount,
      paymentAmount: totalAmount - discountAmount,
      contactEmail: contactEmail || travelersNormalized[0]?.contactEmail || travelersNormalized[0]?.email || userObj?.email || "",
      contactPhone: contactPhone || travelersNormalized[0]?.contactPhone || travelersNormalized[0]?.phone || contactNumber || userObj?.phone || userObj?.phoneNumber || userObj?.primaryMobile || "",
      emailVerified: emailVerified !== undefined ? emailVerified : true,
      phoneVerified: phoneVerified !== undefined ? phoneVerified : true,
      accountEmail: accountEmail || travelersNormalized[0]?.accountEmail || userObj?.email || "",
      travelerPhone: travelerPhone || travelersNormalized[0]?.travelerPhone || contactPhone || "",
      travelerPhoneVerified: travelerPhoneVerified !== undefined ? travelerPhoneVerified : (travelersNormalized[0]?.travelerPhoneVerified || false),
      bookingForOthers: bookingForOthers !== undefined ? bookingForOthers : (travelersNormalized[0]?.bookingForOthers || false),
      verifiedAt: verifiedAt || travelersNormalized[0]?.verifiedAt || null,
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

  /**
   * Finalizes a booking draft atomically.
   * Supports execution within a MongoDB session/transaction.
   */
  static async finalizeBooking(payload, session = null) {
    const { bookingId, paymentId, orderId, signature } = payload;
    
    // Resolve Booking
    const booking = await Booking.findOne({
      $or: [
        { bookingId: bookingId },
        { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null }
      ].filter(Boolean)
    }).session(session);

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "PAID" || booking.paymentStatus === "Paid") {
      return { booking, alreadyPaid: true };
    }

    const trip = await AgentTrip.findById(booking.tripId).session(session);
    if (!trip) {
      throw new Error("Trip not found");
    }

    // Update booking status
    booking.paymentStatus = "Paid";
    booking.status = "PAID";
    booking.bookingStatus = "confirmed";
    booking.paymentVerified = true;
    booking.paymentDate = new Date();
    booking.amountPaid = booking.pricePaid || booking.amount || 0;
    
    // Generate unique ticketId and verification code
    const randDigits = Math.floor(100000 + Math.random() * 900000).toString();
    booking.ticketId = `TLP-2026-${randDigits}`;
    booking.ticketNumber = booking.ticketId;
    booking.paymentId = paymentId || "";
    
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "TLP-";
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    booking.verificationCode = code;
    
    booking.qrToken = Buffer.from(JSON.stringify({
      bookingId: booking._id.toString(),
      ticketId: booking.ticketId,
      verificationCode: booking.verificationCode,
      seatNumber: booking.assignedSeat || booking.seatNumbers?.[0] || "",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).getTime(),
    })).toString("base64");

    await booking.save({ session });

    // Increment Coupon usedCount if applied
    if (booking.couponCode && booking.couponCode.trim()) {
      const Coupon = mongoose.model("Coupon");
      const normalizedCode = booking.couponCode.trim().toUpperCase();
      await Coupon.updateOne(
        { couponCode: normalizedCode },
        { $inc: { usedCount: 1 } }
      ).session(session);
    }

    // Update Passengers and SeatBookings
    const createdPassengers = [];
    const Passenger = mongoose.model("Passenger");
    const SeatBooking = mongoose.model("SeatBooking");

    const travellersList = booking.travellers || [];
    const seatNumbersList = booking.seatNumbers || [];

    for (let i = 0; i < travellersList.length; i++) {
      const pData = travellersList[i];
      const seatNumber = seatNumbersList[i] || pData.seatNumber;
      if (!seatNumber) continue;

      const passenger = await Passenger.findOneAndUpdate(
        { bookingId: booking._id, seatNumber },
        {
          bookingId: booking._id,
          bookingRef: booking.bookingId,
          tripId: booking.tripId,
          userId: booking.userId,
          name: pData.name || "",
          age: Number(pData.age) || 0,
          gender: pData.gender || "Other",
          phone: pData.phone || "",
          email: pData.email || "",
          emergencyContact: pData.emergencyContact || booking.contactNumber || "",
          seatNumber,
          seatPreference: pData.seatPreference || "No Preference",
          seatType: pData.seatType || "Window",
          specialRequest: pData.specialRequest || "",
          status: "active",
          paymentStatus: "completed",
          qrPayload: {
            bookingId: booking.bookingId || String(booking._id),
            tripId: String(booking.tripId),
            passenger: pData.name,
            seat: seatNumber,
            gender: pData.gender,
            age: pData.age,
            timestamp: new Date().toISOString(),
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, session }
      );

      createdPassengers.push(passenger);

      await SeatBooking.updateOne(
        { tripId: booking.tripId, seatNumber },
        {
          status: "booked",
          bookingId: booking._id,
          passengerId: passenger._id,
          passengerName: pData.name || "",
          gender: pData.gender || "Other",
          age: Number(pData.age) || 0,
          paymentStatus: "completed",
          reservedUntil: null,
        },
        { session }
      );
    }

    // Update Trip available seats
    trip.bookedSeats = (trip.bookedSeats || 0) + booking.seats;
    trip.availableSeats = Math.max(0, (trip.availableSeats || 0) - booking.seats);
    
    const totalS = trip.totalSeats || 40;
    trip.occupancy = totalS > 0 ? Math.round((trip.bookedSeats / totalS) * 100) : 0;
    trip.occupancyRate = trip.occupancy;
    trip.bookingCount = (trip.bookingCount || 0) + 1;

    // Recalculate agent revenue and update wallet
    const agent = await Agent.findById(trip.agentId || trip.agent).session(session);
    const defaultCommSetting = await SystemSetting.findOne({ key: "default_commission" }).session(session);
    const defaultRate = defaultCommSetting ? defaultCommSetting.value : 10;
    const commRate = trip.commissionPercentage !== undefined ? trip.commissionPercentage : defaultRate;

    const commissionAmount = booking.pricePaid * (commRate / 100);
    const agentAmount = booking.pricePaid - commissionAmount;

    trip.walletAmount = (trip.walletAmount || 0) + agentAmount;
    await trip.save({ session });

    // Update Wallet balance
    const targetAgentId = trip.agentId || trip.agent;
    if (targetAgentId) {
      let wallet = await Wallet.findOne({ agentId: targetAgentId }).session(session);
      if (!wallet) {
        wallet = new Wallet({ agentId: targetAgentId });
      }
      wallet.balance += agentAmount;
      wallet.withdrawableBalance += agentAmount;
      wallet.transactions.push({
        date: new Date(),
        bookingId: booking.bookingId,
        customerName: travellersList[0]?.name || "Traveler",
        amount: booking.pricePaid,
        commission: commissionAmount,
        netEarnings: agentAmount,
        status: "Completed",
      });
      await wallet.save({ session });
    }

    if (agent) {
      agent.revenue = (agent.revenue || 0) + booking.pricePaid;
      agent.totalRevenue = (agent.totalRevenue || 0) + booking.pricePaid;
      agent.pendingRevenue = (agent.pendingRevenue || 0) + agentAmount;
      agent.totalBookings = (agent.totalBookings || 0) + 1;
      await agent.save({ session });
    }

    // Create Payment record
    const payment = await Payment.create([{
      bookingId: booking._id,
      bookingRef: booking.bookingId,
      tripId: trip._id,
      agentId: trip.agentId || trip.agent,
      userId: booking.userId,
      amount: booking.pricePaid,
      status: "SUCCESS",
      gateway: "razorpay",
      orderId: orderId || booking.orderId || "",
      paymentId: paymentId || "",
      transactionId: paymentId || "",
      signature: signature || "",
      razorpayOrderId: orderId || booking.orderId || "",
      razorpayPaymentId: paymentId || "",
      paymentStatus: "SUCCESS",
      currency: "INR",
      paymentMethod: "razorpay",
      paidAt: new Date()
    }], { session });

    // Clone user trip
    let userTrip = null;
    try {
      userTrip = await cloneAgentTripToUserTrip(booking, trip, booking.userId, booking.pricePaid);
    } catch (cloneErr) {
      console.warn("[BookingService] Trip clone failed:", cloneErr.message);
    }

    // Create Admin Notification
    try {
      const AdminNotification = mongoose.model("AdminNotification");
      await AdminNotification.create([{
        title: "New Booking Confirmed",
        message: `Traveler ${travellersList[0]?.name || "Traveler"} booked trip '${trip.title}' for ₹${booking.pricePaid}`,
        type: "booking",
      }], { session });
    } catch (notifErr) {}

    return {
      booking,
      payment: payment[0] || payment,
      userTrip,
      passengers: createdPassengers
    };
  }
}
export default BookingService;
