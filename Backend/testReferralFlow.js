import mongoose from "mongoose";
import User from "./models/User.js";
import Referral from "./models/Referral.js";
import Booking from "./models/Booking.js";
import AgentTrip from "./models/AgentTrip.js";
import SystemSetting from "./models/SystemSetting.js";
import ReferralService from "./services/ReferralService.js";
import { BookingService } from "./services/BookingService.js";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/traveloop";

async function run() {
  console.log("=== CONNECTING TO DATABASE ===");
  await mongoose.connect(mongoURI);
  console.log("Connected successfully.");

  // Clear existing test data
  await User.deleteMany({ email: { $in: ["inviter@test.com", "invitee@test.com"] } });
  await Referral.deleteMany({});
  await AgentTrip.deleteMany({ title: "Test Verification Trip" });
  await Booking.deleteMany({});

  console.log("\n=== STEP 1: CREATE INVITER (USER A) ===");
  const inviter = await User.create({
    firstName: "Sanjai",
    lastName: "M",
    email: "inviter@test.com",
    phone: "9876543210",
    password: "Password123!",
    referralCode: "TLP-SANJAI-5821",
    level: 6, // Should return "Gold Explorer"
  });
  console.log("Inviter created with referralCode:", inviter.referralCode);

  console.log("\n=== STEP 2: CREATE TEST TRIP ===");
  const trip = await AgentTrip.create({
    title: "Test Verification Trip",
    description: "A trip for verification",
    destination: "Goa",
    pricePerPerson: 1000,
    availableSeats: 20,
    agentId: new mongoose.Types.ObjectId(),
    status: "approved",
    visibility: "public",
    startDate: "2026-08-01",
    endDate: "2026-08-07"
  });
  console.log("Test Trip created:", trip.title, "Price:", trip.pricePerPerson);

  console.log("\n=== STEP 3: SIMULATE INVITER TRIPS ===");
  // Create a successful booking for User A to simulate "1 Trip" completed
  await Booking.create({
    bookingId: "TLP-INV-100",
    userId: inviter._id,
    tripId: trip._id,
    seats: 1,
    paymentStatus: "Paid",
    status: "Paid",
    amount: 1000,
    pricePaid: 1000,
  });
  console.log("Inviter successful booking created.");

  console.log("\n=== STEP 4: VALIDATE REFERRAL CODE ===");
  const codeToTest = "TLP-SANJAI-5821";
  const inviterObj = await User.findOne({ referralCode: codeToTest });
  if (!inviterObj) throw new Error("Inviter not found by code!");

  const successfulTripsCount = await Booking.countDocuments({ userId: inviterObj._id, paymentStatus: "Paid" });
  let levelName = "Bronze Explorer";
  if (inviterObj.level >= 8) levelName = "Diamond Explorer";
  else if (inviterObj.level >= 5) levelName = "Gold Explorer";
  else if (inviterObj.level >= 3) levelName = "Silver Explorer";

  const validationResult = {
    success: true,
    name: `${inviterObj.firstName} ${inviterObj.lastName}`,
    level: levelName,
    successfulTrips: `${successfulTripsCount} Trips`,
    referralStatus: "Verified"
  };
  console.log("Validation API Simulation output:", validationResult);
  if (validationResult.name !== "Sanjai M") throw new Error("Name mismatch!");
  if (validationResult.level !== "Gold Explorer") throw new Error("Level calculation mismatch!");
  if (validationResult.successfulTrips !== "1 Trips") throw new Error("Trips count mismatch!");

  console.log("\n=== STEP 5: REGISTER INVITEE (USER B) & GENERATE CARDS ===");
  // Configure referral system settings
  await SystemSetting.findOneAndUpdate({ key: "referral_scratch_rewards_enabled" }, { value: true }, { upsert: true });
  await SystemSetting.findOneAndUpdate({ key: "referral_min_reward" }, { value: 10 }, { upsert: true });
  await SystemSetting.findOneAndUpdate({ key: "referral_max_reward" }, { value: 25 }, { upsert: true });

  const invitee = await User.create({
    firstName: "Friend",
    lastName: "User",
    email: "invitee@test.com",
    phone: "9876543211",
    password: "Password123!",
    referredBy: inviter.referralCode,
  });

  // Create Referral record
  await Referral.create({
    inviterId: inviter._id,
    invitedId: invitee._id,
    status: "registered",
    referralCode: inviter.referralCode,
    registered: true
  });

  inviter.referralCount = (inviter.referralCount || 0) + 1;

  // Generate cards
  const inviterCard = await ReferralService.generateScratchCard(inviter._id);
  if (inviterCard) {
    inviter.scratchCards.push(inviterCard);
  }
  await inviter.save();

  const inviteeCard = await ReferralService.generateScratchCard(invitee._id);
  if (inviteeCard) {
    invitee.scratchCards.push(inviteeCard);
  }
  await invitee.save();

  console.log("Inviter Scratch Cards:", inviter.scratchCards.length);
  console.log("Invitee Scratch Cards:", invitee.scratchCards.length);
  if (inviter.scratchCards.length !== 1) throw new Error("Inviter card not generated!");
  if (invitee.scratchCards.length !== 1) throw new Error("Invitee card not generated!");

  console.log("Invitee card details:", invitee.scratchCards[0]);

  console.log("\n=== STEP 6: CLAIM SCRATCH CARD ===");
  const targetCardId = invitee.scratchCards[0].cardId;
  const claimResult = await ReferralService.claimScratchCard(invitee._id, targetCardId);
  console.log("Claim Result:", claimResult);

  // Reload invitee from DB
  const updatedInvitee = await User.findById(invitee._id);
  console.log("Updated Invitee active coupon:", updatedInvitee.couponCode);
  console.log("Updated Invitee coupon status:", updatedInvitee.couponStatus);
  if (!updatedInvitee.couponCode) throw new Error("Coupon code was not generated!");
  if (updatedInvitee.couponStatus !== "Unused") throw new Error("Coupon should be Unused!");

  console.log("\n=== STEP 7: PERFORM BOOKING AND APPLY COUPON ===");
  // Subtotal for 2 seats = 1000 * 2 = 2000
  // Apply coupon
  const bookingPayload = {
    tripId: trip._id.toString(),
    userId: invitee._id.toString(),
    seats: 2,
    seatNumbers: ["1A", "1B"],
    totalAmount: 2000,
    paymentStatus: "Paid",
    bookingStatus: "confirmed",
    paymentVerified: true,
    pickupLocation: "Goa Airport",
    contactNumber: "9876543211",
    couponCode: updatedInvitee.couponCode,
  };

  const { booking } = await BookingService.createBooking(bookingPayload);
  console.log("Booking created with ID:", booking.bookingId);
  console.log("Original Price:", booking.originalPrice);
  console.log("Price Paid:", booking.pricePaid);
  console.log("Referral Code Applied:", booking.referralCode);
  console.log("Referral Discount Amount:", booking.referralDiscountAmount);

  if (booking.referralCode !== updatedInvitee.couponCode) throw new Error("Coupon code mismatch on booking!");
  if (booking.referralDiscountAmount <= 0) throw new Error("Discount was not applied!");

  // Reload invitee to check coupon status is Used
  const finalInviteeObj = await User.findById(invitee._id);
  console.log("Final invitee coupon status:", finalInviteeObj.couponStatus);
  if (finalInviteeObj.couponStatus !== "Used") throw new Error("Coupon status was not updated to Used!");

  console.log("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
