import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import Booking from "../models/Booking.js";
import AgentTrip from "../models/AgentTrip.js";
import SystemSetting from "../models/SystemSetting.js";
import Notification from "../models/Notification.js";
import BookingService from "../services/BookingService.js";

dotenv.config();

const runTest = async () => {
  console.log("🚀 Starting End-to-End Referral Flow Verification Test...");

  // Connect to DB
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/traveloop");
    console.log("✅ Database Connected.");
  } catch (err) {
    console.error("❌ DB Connection failed:", err);
    process.exit(1);
  }

  try {
    // 1. Cleanup old test users & bookings
    const testEmails = ["inviter@traveloop.test", "invitee@traveloop.test"];
    await User.deleteMany({ email: { $in: testEmails } });
    await Booking.deleteMany({ contactNumber: "9999999999" });
    await Referral.deleteMany({});
    await Notification.deleteMany({ title: /Referral/ });
    console.log("🧹 Test cleanup completed.");

    // 2. Set Referral System Settings
    await SystemSetting.findOneAndUpdate(
      { key: "referral_enabled" },
      { value: true },
      { upsert: true, new: true }
    );
    await SystemSetting.findOneAndUpdate(
      { key: "referral_discount_percentage" },
      { value: 10 }, // 10% discount
      { upsert: true, new: true }
    );
    await SystemSetting.findOneAndUpdate(
      { key: "referral_coin_reward" },
      { value: 150 }, // 150 coins reward
      { upsert: true, new: true }
    );
    console.log("⚙️ Referral configurations set (Enabled: true, Discount: 10%, Reward: 150 Coins).");

    // 3. Create Inviter User
    const inviter = await User.create({
      firstName: "Inviter",
      lastName: "Test",
      email: "inviter@traveloop.test",
      password: "Password123!",
      phone: "1234567890",
      acceptedTerms: true,
      termsVersion: "2026-06",
      walletBalance: 0,
      referralCoins: 0,
      referralCount: 0
    });
    console.log(`👤 Inviter created with referralCode: ${inviter.referralCode}`);

    // 4. Validate referral code endpoint logic directly
    const inviteeReferralCode = inviter.referralCode;
    const inviterUserToCheck = await User.findOne({ referralCode: inviteeReferralCode.trim().toUpperCase() });
    if (!inviterUserToCheck) {
      throw new Error(`Referral code check failed: Code ${inviteeReferralCode} is invalid`);
    }
    console.log("✅ Referral code validation check passed.");

    // 5. Create Invitee User (Signing up with inviter's referral code)
    const invitee = await User.create({
      firstName: "Invitee",
      lastName: "Test",
      email: "invitee@traveloop.test",
      password: "Password123!",
      phone: "0987654321",
      acceptedTerms: true,
      termsVersion: "2026-06",
      referredBy: inviteeReferralCode,
      walletBalance: 0,
      referralCoins: 0,
      referralCount: 0
    });

    // Update inviter's referral counter
    await User.findByIdAndUpdate(inviter._id, { $inc: { referralCount: 1 } });
    
    // Create Referral record
    await Referral.create({
      inviterId: inviter._id,
      invitedId: invitee._id,
      status: "registered",
      referralCode: inviteeReferralCode,
    });
    console.log("👤 Invitee created and successfully linked to Inviter.");

    // Fetch updated inviter
    const updatedInviter = await User.findById(inviter._id);
    if (updatedInviter.referralCount !== 1) {
      throw new Error(`Inviter referral count expected 1, got ${updatedInviter.referralCount}`);
    }
    console.log("📈 Inviter referralCount successfully incremented to 1.");

    // Check Referral log
    const refRecord = await Referral.findOne({ inviterId: inviter._id, invitedId: invitee._id });
    if (!refRecord || refRecord.status !== "registered") {
      throw new Error("Referral log was not created correctly in 'registered' status.");
    }
    console.log("✅ Referral status is correctly logged as 'registered'.");

    // 6. Find a Published Agent Trip for Booking
    let trip = await AgentTrip.findOne({ status: "approved" });
    if (!trip) {
      const dummyAgentId = new mongoose.Types.ObjectId();
      trip = await AgentTrip.create({
        title: "Test Explorer Trip",
        description: "Test description",
        pricePerPerson: 2000,
        offerPrice: 1800,
        availableSeats: 30,
        bookedSeats: 0,
        startDate: new Date(Date.now() + 86400000 * 5),
        endDate: new Date(Date.now() + 86400000 * 10),
        status: "approved",
        agentId: dummyAgentId,
        pickupLocation: "Test Point",
        busType: "Volvo AC Sleeper"
      });
      console.log("🗺️ Created temporary approved AgentTrip.");
    } else {
      console.log(`🗺️ Found approved trip: "${trip.title}" (Price per seat: ₹${trip.offerPrice || trip.pricePerPerson})`);
    }

    // 7. Complete a Booking for Invitee
    const basePrice = trip.offerPrice || trip.pricePerPerson || 0;
    const subtotal = basePrice * 2; // 2 seats
    const tax = Math.round(subtotal * 0.05);
    const convenienceFee = 150;
    const clientGrandTotal = subtotal + tax + convenienceFee; // Base total without discount sent from client

    console.log(`🛒 Creating booking of 2 seats... (Base total: ₹${clientGrandTotal})`);

    const booking = await BookingService.createBooking({
      tripId: trip._id,
      userId: invitee._id,
      seats: 2,
      seatNumbers: ["1A", "1B"],
      totalAmount: clientGrandTotal,
      paymentStatus: "Paid",
      bookingStatus: "Confirmed",
      paymentVerified: true,
      paymentDate: new Date(),
      contactNumber: "9999999999",
      maleCount: 1,
      femaleCount: 1,
      adults: 2,
      children: 0,
      pickupLocation: "Test Point",
      travellers: [
        { name: "Invitee Test", age: 25, gender: "Male", phone: "9999999999", email: "invitee@traveloop.test" },
        { name: "Friend Test", age: 26, gender: "Female", phone: "9999999999", email: "friend@traveloop.test" }
      ]
    });

    console.log("🎉 Booking processed successfully!");

    // 8. Assertions
    // A. Check Booking fields
    const dbBooking = await Booking.findById(booking.booking._id);
    if (!dbBooking.referralApplied) {
      throw new Error("Booking does not have referralApplied = true");
    }
    console.log(`✅ Booking referralApplied check passed: ${dbBooking.referralApplied}`);
    console.log(`   Original Price: ₹${dbBooking.originalPrice}`);
    console.log(`   Referral Discount Percent: ${dbBooking.referralDiscountPercent}%`);
    console.log(`   Referral Discount Amount: ₹${dbBooking.referralDiscountAmount}`);
    console.log(`   Price Paid: ₹${dbBooking.pricePaid}`);

    // B. Check Referral Log status
    const updatedRefRecord = await Referral.findOne({ inviterId: inviter._id, invitedId: invitee._id });
    if (!updatedRefRecord || updatedRefRecord.status !== "booked" || !updatedRefRecord.booked) {
      throw new Error(`Referral status expected 'booked', got '${updatedRefRecord?.status}'`);
    }
    console.log("✅ Referral status successfully updated to 'booked' in database.");

    // C. Check Inviter Reward Coins & Wallet
    const rewardedInviter = await User.findById(inviter._id);
    if (rewardedInviter.walletBalance !== 150 || rewardedInviter.referralCoins !== 150) {
      throw new Error(`Inviter wallet expected 150 coins, got Balance: ${rewardedInviter.walletBalance}, Coins: ${rewardedInviter.referralCoins}`);
    }
    console.log(`✅ Inviter wallet successfully rewarded with ${rewardedInviter.walletBalance} Travel Coins.`);

    // D. Check Notifications
    const inviterNotification = await Notification.findOne({ userId: inviter._id });
    const inviteeNotification = await Notification.findOne({ userId: invitee._id });

    if (!inviterNotification) {
      throw new Error("Inviter notification was not sent.");
    }
    console.log(`🔔 Inviter Notification: "${inviterNotification.title}" - "${inviterNotification.message}"`);

    if (!inviteeNotification) {
      throw new Error("Invitee notification was not sent.");
    }
    console.log(`🔔 Invitee Notification: "${inviteeNotification.title}" - "${inviteeNotification.message}"`);

    console.log("\n⭐️⭐️⭐️ ALL CORE REFERRAL FLOW CHECKS PASSED SUCCESSFULLY! ⭐️⭐️⭐️\n");
  } catch (err) {
    console.error("❌ Verification failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database Disconnected.");
  }
};

runTest();
