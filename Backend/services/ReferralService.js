import supabase from "../config/supabase.js";
import { triggerNotification } from "../controllers/notificationController.js";

class ReferralService {
  /**
   * Generates a new Scratch Card / Coupon for a user
   */
  async generateScratchCard(userIdOrUser, cardType = null) {
    try {
      let userId = typeof userIdOrUser === "string" ? userIdOrUser : userIdOrUser?.id || userIdOrUser?._id;
      if (!userId) return null;

      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!user) return null;

      const { data: scratchSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "referral_scratch_rewards_enabled")
        .maybeSingle();

      const scratchEnabled = scratchSetting ? scratchSetting.value === true : true;
      if (!scratchEnabled) return null;

      const { data: discountSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "referral_discount_percentage")
        .maybeSingle();

      const pct = discountSetting ? Number(discountSetting.value) : 5;

      let calculatedCardType = "Bronze";
      if (pct === 5) calculatedCardType = "Bronze";
      else if (pct === 10) calculatedCardType = "Silver";
      else if (pct === 15) calculatedCardType = "Gold";
      else if (pct >= 20) calculatedCardType = "Diamond";

      const cleanName = (user.name || "USER").toUpperCase().replace(/[^a-zA-Z]/g, "");
      const couponCode = `TLP${pct}-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
      const expiresAt = new Date(Date.now() + 86400000 * 30); // 30 days expiry

      // Save coupon into coupons table
      await supabase.from("coupons").insert([{
        code: couponCode,
        discount_type: "PERCENTAGE",
        discount_value: pct,
        expires_at: expiresAt,
        status: "ACTIVE",
      }]);

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
   * Claims a scratch card reward
   */
  async claimScratchCard(userId, cardId) {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!user) throw new Error("User not found");

    const pct = 10;
    const couponCode = `CLAIM-${cardId}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await triggerNotification(
        userId,
        "🎁 Referral Reward Claimed!",
        `Congratulations! You claimed ${pct}% OFF. Use coupon ${couponCode} on your next trip.`,
        "reward"
      );
    } catch (e) {
      console.warn("Failed to notify user:", e.message);
    }

    return { type: "percentage_discount", value: `${pct}% OFF`, couponCode };
  }
}

export default new ReferralService();
