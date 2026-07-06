import mongoose from "mongoose";
import User from "../models/User.js";
import SystemSetting from "../models/SystemSetting.js";
import Booking from "../models/Booking.js";
import { triggerNotification } from "../controllers/notificationController.js";

class ReferralService {
  /**
   * Generates a new Scratch Card document for a user
   */
  async generateScratchCard(userId, cardType = null) {
    try {
      const scratchEnabledSetting = await SystemSetting.findOne({ key: "referral_scratch_rewards_enabled" });
      const scratchEnabled = scratchEnabledSetting ? scratchEnabledSetting.value === true : true;
      if (!scratchEnabled) return null;

      const minSetting = await SystemSetting.findOne({ key: "referral_min_reward" });
      const maxSetting = await SystemSetting.findOne({ key: "referral_max_reward" });
      const minReward = minSetting ? Number(minSetting.value) : 5;
      const maxReward = maxSetting ? Number(maxSetting.value) : 30;

      const bSetting = await SystemSetting.findOne({ key: "referral_prob_bronze" });
      const sSetting = await SystemSetting.findOne({ key: "referral_prob_silver" });
      const gSetting = await SystemSetting.findOne({ key: "referral_prob_gold" });
      const dSetting = await SystemSetting.findOne({ key: "referral_prob_diamond" });

      const probB = bSetting ? Number(bSetting.value) : 50;
      const probS = sSetting ? Number(sSetting.value) : 25;
      const probG = gSetting ? Number(gSetting.value) : 15;
      const probD = dSetting ? Number(dSetting.value) : 10;

      if (!cardType) {
        const rand = Math.random() * 100;
        if (rand < probB) cardType = "Bronze";
        else if (rand < probB + probS) cardType = "Silver";
        else if (rand < probB + probS + probG) cardType = "Gold";
        else cardType = "Diamond";
      }

      // Traveloop referral rewards must only be percentage discounts (5%, 10%, 15%, 20%, 25%, 30%)
      const rewardType = "percentage_discount";

      let pct = 10;
      if (cardType === "Bronze") pct = 5;
      else if (cardType === "Silver") pct = 10;
      else if (cardType === "Gold") pct = 15;
      else if (cardType === "Diamond") pct = 20;

      // Respect admin configurations for min/max
      pct = Math.max(minReward, Math.min(maxReward, pct));
      
      // Ensure the percentage is one of the allowed values: 5, 10, 15, 20, 25, 30.
      // If it doesn't align exactly, round to nearest 5 within bounds.
      pct = Math.round(pct / 5) * 5;
      pct = Math.max(5, Math.min(30, pct));

      const rewardValue = `${pct}% OFF`;

      const cardId = `SC-${Math.floor(100000 + Math.random() * 900000)}`;
      const expiresAt = new Date(Date.now() + 86400000 * 30); // 30 days expiry

      return {
        cardId,
        cardType,
        rewardType,
        rewardValue,
        scratched: false,
        claimed: false,
        used: false,
        couponCode: "",
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

    const cleanName = user.firstName.toUpperCase().replace(/[^a-zA-Z]/g, "");

    let claimResult = { type: scratchCard.rewardType, value: scratchCard.rewardValue };

    // Format coupon code: e.g., TLP15-SANJAI-9821
    const pct = parseInt(scratchCard.rewardValue);
    const formattedPct = String(pct).padStart(2, "0"); // TLP05, TLP10, TLP15 etc.
    const codePrefix = `TLP${formattedPct}`;

    const couponCode = `${codePrefix}-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
    scratchCard.couponCode = couponCode;

    // Update main user coupon fields
    user.couponCode = couponCode;
    user.couponPercentage = pct;
    user.couponStatus = "Unused";
    user.rewardClaimed = true;
    user.rewardExpiry = scratchCard.expiresAt;

    claimResult.couponCode = couponCode;

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
