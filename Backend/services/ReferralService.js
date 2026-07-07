import mongoose from "mongoose";
import User from "../models/User.js";
import SystemSetting from "../models/SystemSetting.js";
import Booking from "../models/Booking.js";
import { triggerNotification } from "../controllers/notificationController.js";

class ReferralService {
  /**
   * Generates a new Scratch Card document for a user
   */
  async generateScratchCard(userIdOrUser, cardType = null) {
    try {
      let user = userIdOrUser;
      let shouldSave = false;
      if (typeof userIdOrUser === "string" || userIdOrUser instanceof mongoose.Types.ObjectId) {
        user = await User.findById(userIdOrUser);
        shouldSave = true;
      }
      if (!user) return null;

      const scratchEnabledSetting = await SystemSetting.findOne({ key: "referral_scratch_rewards_enabled" });
      const scratchEnabled = scratchEnabledSetting ? scratchEnabledSetting.value === true : true;
      if (!scratchEnabled) return null;

      // Users always receive exactly what admin configured. No randomization.
      const discountSetting = await SystemSetting.findOne({ key: "referral_discount_percentage" });
      const pct = discountSetting ? Number(discountSetting.value) : 5;

      let calculatedCardType = "Bronze";
      if (pct === 5) calculatedCardType = "Bronze";
      else if (pct === 10) calculatedCardType = "Silver";
      else if (pct === 15) calculatedCardType = "Gold";
      else if (pct >= 20) calculatedCardType = "Diamond";

      const cleanName = (user.firstName || "USER").toUpperCase().replace(/[^a-zA-Z]/g, "");
      const couponCode = `TLP${pct}-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
      const expiresAt = new Date(Date.now() + 86400000 * 30); // 30 days expiry

      // Add to user.rewards array
      user.rewards = user.rewards || [];
      const rewardObj = {
        couponCode,
        discountPercent: pct,
        status: "AVAILABLE",
        used: false,
        expiresAt,
      };
      user.rewards.push(rewardObj);

      if (shouldSave) {
        await user.save();
      }

      const cardId = `SC-${Math.floor(100000 + Math.random() * 900000)}`;

      return {
        cardId,
        cardType: calculatedCardType,
        rewardType: "percentage_discount",
        rewardValue: `${pct}% OFF`,
        scratched: false,
        claimed: false,
        used: false,
        couponCode,
        expiresAt,
      };
    } catch (err) {
      console.error("Error generating scratch card:", err);
      return null;
    }
  }

  /**
   * Claims a scratch card reward, generating the corresponding coupon code
   */
  async claimScratchCard(userId, cardId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const scratchCard = user.scratchCards.find(c => c.cardId === cardId);
    if (!scratchCard) throw new Error("Scratch card not found");
    if (scratchCard.claimed) throw new Error("Reward already claimed");

    scratchCard.scratched = true;
    scratchCard.claimed = true;
    scratchCard.claimedAt = new Date();

    const couponCode = scratchCard.couponCode;
    const pct = parseInt(scratchCard.rewardValue);

    // Make sure the coupon is marked as AVAILABLE in user.rewards
    user.rewards = user.rewards || [];
    let reward = user.rewards.find(r => r.couponCode === couponCode);
    if (!reward) {
      reward = {
        couponCode,
        discountPercent: pct,
        status: "AVAILABLE",
        used: false,
        expiresAt: scratchCard.expiresAt || new Date(Date.now() + 86400000 * 30),
      };
      user.rewards.push(reward);
    } else {
      reward.status = "AVAILABLE";
      reward.used = false;
    }

    // Update main user coupon fields for backward compatibility
    user.couponCode = couponCode;
    user.couponPercentage = pct;
    user.couponStatus = "Unused";
    user.rewardClaimed = true;
    user.rewardExpiry = scratchCard.expiresAt;

    let claimResult = { type: scratchCard.rewardType, value: scratchCard.rewardValue, couponCode };

    // Send Invitee Notification
    try {
      await triggerNotification(
        userId,
        "🎁 Referral Reward Claimed!",
        `Congratulations! You claimed ${scratchCard.rewardValue}. Use coupon ${couponCode} on your next trip.`,
        "reward"
      );
    } catch (e) {
      console.warn("Failed to notify user:", e.message);
    }

    await user.save();
    return claimResult;
  }
}

export default new ReferralService();
