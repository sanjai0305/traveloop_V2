import supabase from "../config/supabase.js";
import ReferralService from "../services/ReferralService.js";
import { triggerNotification } from "./notificationController.js";

export const verifyReferralCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { referralCode } = req.body;

    if (!referralCode || !String(referralCode).trim()) {
      return res.status(400).json({ success: false, message: "Referral code is required" });
    }

    const normalizedCode = String(referralCode).trim().toUpperCase();

    const { data: inviterUser } = await supabase
      .from("users")
      .select("*")
      .eq("referral_code", normalizedCode)
      .maybeSingle();

    if (!inviterUser) {
      return res.status(404).json({
        success: false,
        message: "❌ Invalid referral code. This invitation link is not valid.",
      });
    }

    if (inviterUser.id === userId) {
      return res.status(400).json({ success: false, message: "You cannot use your own referral code" });
    }

    // Link referral
    await supabase.from("referrals").insert([{
      referrer_id: inviterUser.id,
      referred_id: userId,
      status: "COMPLETED",
    }]);

    await supabase.from("users").update({ referred_by: normalizedCode }).eq("id", userId);

    try {
      await triggerNotification(
        userId,
        "🎁 Referral Verified!",
        `You used ${inviterUser.name}'s referral code. Reward is unlocked!`,
        "reward"
      );
    } catch (e) {
      console.warn("Notice:", e.message);
    }

    return res.status(200).json({
      success: true,
      message: "Referral verified successfully",
      referralOwner: inviterUser.name.toUpperCase(),
      rewardValue: "10% OFF",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error verifying referral code" });
  }
};

export const getReferralStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      referralVerified: !!user?.referred_by,
      referredBy: user?.referred_by || "",
      referralCode: user?.referral_code || "",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error fetching referral status" });
  }
};
