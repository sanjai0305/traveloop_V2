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

      // Pick a random reward type
      const rewardTypes = ["percentage_discount", "flat_discount", "coins", "free_upgrade"];
      const rewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];

      let rewardValue = "";
      if (rewardType === "percentage_discount") {
        let pct = 5;
        if (cardType === "Bronze") pct = 5;
        else if (cardType === "Silver") pct = 10;
        else if (cardType === "Gold") pct = 15;
        else if (cardType === "Diamond") pct = 20;

        pct = Math.max(minReward, Math.min(maxReward, pct));
        rewardValue = `${pct}% OFF`;
      } else if (rewardType === "flat_discount") {
        let amt = 200;
        if (cardType === "Bronze") amt = 100;
        else if (cardType === "Silver") amt = 300;
        else if (cardType === "Gold") amt = 500;
        else if (cardType === "Diamond") amt = 1000;
        rewardValue = `₹${amt} OFF`;
      } else if (rewardType === "coins") {
        let coins = 100;
        if (cardType === "Bronze") coins = 50;
        else if (cardType === "Silver") coins = 100;
        else if (cardType === "Gold") coins = 200;
        else if (cardType === "Diamond") coins = 500;
        rewardValue = `${coins} Coins`;
      } else {
        rewardValue = "Free Seat Upgrade";
      }

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

    if (scratchCard.rewardType === "percentage_discount" || scratchCard.rewardType === "flat_discount" || scratchCard.rewardType === "free_upgrade") {
      // Generate coupon code, e.g. TLP10-SANJAI or TLP500-SANJAI
      let codePrefix = "TLP";
      let discountPct = 10;

      if (scratchCard.rewardType === "percentage_discount") {
        const pct = parseInt(scratchCard.rewardValue);
        codePrefix = `TLP${pct}`;
        discountPct = pct;
      } else if (scratchCard.rewardType === "flat_discount") {
        const amt = parseInt(scratchCard.rewardValue.replace(/[^0-9]/g, ""));
        codePrefix = `TLP${amt}`;
        discountPct = 0; // Flat discount
      } else {
        codePrefix = "TLPUPGRADE";
        discountPct = 0;
      }

      const couponCode = `${codePrefix}-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
      scratchCard.couponCode = couponCode;

      // Update main user coupon fields
      user.couponCode = couponCode;
      user.couponPercentage = discountPct;
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
    } else if (scratchCard.rewardType === "coins") {
      const coinsSetting = await SystemSetting.findOne({ key: "referral_travel_coins_enabled" });
      const coinsEnabled = coinsSetting ? coinsSetting.value === true : true;

      if (coinsEnabled) {
        const coins = parseInt(scratchCard.rewardValue);
        user.walletBalance = (user.walletBalance || 0) + coins;
        user.referralCoins = (user.referralCoins || 0) + coins;

        // Send Invitee Notification
        try {
          await triggerNotification(
            userId,
            "🪙 Travel Coins Awarded!",
            `Referral reward claimed: ${coins} Travel Coins credited to your wallet.`,
            "reward"
          );
        } catch (e) {
          console.warn("Failed to notify user:", e.message);
        }
      }
    }

    await user.save();
    return claimResult;
  }
}

export default new ReferralService();
