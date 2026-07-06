import User from "../models/User.js";
import Referral from "../models/Referral.js";
import SystemSetting from "../models/SystemSetting.js";
import ReferralService from "../services/ReferralService.js";
import { triggerNotification } from "./notificationController.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/referrals/verify
// Body: { referralCode }
// Auth: protect (JWT)
// ─────────────────────────────────────────────────────────────────────────────
export const verifyReferralCode = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { referralCode } = req.body;

    // ── 1. Basic input validation ────────────────────────────────────────────
    if (!referralCode || !String(referralCode).trim()) {
      return res.status(400).json({
        success: false,
        message: "Referral code is required",
      });
    }

    const normalizedCode = String(referralCode).trim().toUpperCase();

    // ── 2. Check system setting ──────────────────────────────────────────────
    const enabledSetting = await SystemSetting.findOne({ key: "referral_enabled" });
    const referralEnabled = enabledSetting ? enabledSetting.value === true : true;
    if (!referralEnabled) {
      return res.status(403).json({
        success: false,
        message: "Referral system is currently disabled",
      });
    }

    // ── 3. Load current user ─────────────────────────────────────────────────
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ── 4. Duplicate claim guard ─────────────────────────────────────────────
    if (currentUser.referralVerified || currentUser.referredBy) {
      return res.status(409).json({
        success: false,
        message: "Referral reward already claimed",
      });
    }

    // ── 5. Resolve referral owner ────────────────────────────────────────────
    const inviterUser = await User.findOne({ referralCode: normalizedCode });
    if (!inviterUser) {
      return res.status(404).json({
        success: false,
        message: "❌ Invalid referral code. This invitation link is not valid.",
      });
    }

    // ── 6. Self-referral guard ───────────────────────────────────────────────
    if (String(inviterUser._id) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot use your own referral code",
      });
    }

    // ── 7. Load reward settings ──────────────────────────────────────────────
    const discountSetting = await SystemSetting.findOne({ key: "referral_discount_percentage" });
    const expirySetting   = await SystemSetting.findOne({ key: "referral_coupon_expiry_days" });
    const discountPercent = discountSetting ? Number(discountSetting.value) : 10;
    const expiryDays      = expirySetting   ? Number(expirySetting.value)   : 30;
    const expiresAt       = new Date(Date.now() + expiryDays * 86400000);

    // ── 8. Update invitee User ───────────────────────────────────────────────
    currentUser.referredBy      = inviterUser.referralCode;
    currentUser.referralCodeUsed = normalizedCode;
    currentUser.referralVerified = true;
    currentUser.rewardUnlocked   = true;

    // ── 9. Generate scratch card for invitee ─────────────────────────────────
    let inviteeCard = null;
    try {
      inviteeCard = await ReferralService.generateScratchCard(userId);
      if (inviteeCard) {
        currentUser.scratchCards.push(inviteeCard);
      }
    } catch (cardErr) {
      console.error("[Referral] Failed to generate scratch card for invitee:", cardErr);
    }

    await currentUser.save();

    // ── 10. Update inviter User ──────────────────────────────────────────────
    inviterUser.referralCount = (inviterUser.referralCount || 0) + 1;

    // Generate scratch card for inviter
    try {
      const inviterCard = await ReferralService.generateScratchCard(inviterUser._id);
      if (inviterCard) {
        inviterUser.scratchCards.push(inviterCard);
      }
    } catch (cardErr) {
      console.error("[Referral] Failed to generate scratch card for inviter:", cardErr);
    }

    await inviterUser.save();

    // ── 11. Create Referral record ───────────────────────────────────────────
    await Referral.create({
      inviterId: inviterUser._id,
      invitedId: currentUser._id,
      referralCode: normalizedCode,
      status: "registered",
      registered: true,
    });

    // ── 12. Notifications ────────────────────────────────────────────────────
    try {
      await triggerNotification(
        userId,
        "🎁 Referral Verified!",
        `You used ${inviterUser.firstName}'s referral code. Your scratch card reward is unlocked!`,
        "reward"
      );
    } catch (e) {
      console.warn("[Referral] Invitee notification failed:", e.message);
    }

    try {
      await triggerNotification(
        inviterUser._id,
        "🎉 New Referral!",
        `${currentUser.firstName} ${currentUser.lastName} joined using your referral code! You earned a scratch card.`,
        "reward"
      );
    } catch (e) {
      console.warn("[Referral] Inviter notification failed:", e.message);
    }

    // ── 13. Build response ───────────────────────────────────────────────────
    const rewardType        = inviteeCard?.rewardType || "percentage_discount";
    const rewardValue       = inviteeCard?.rewardValue || `${discountPercent}% OFF`;
    const cardId            = inviteeCard?.cardId || "";

    return res.status(200).json({
      success: true,
      message: "Referral verified successfully",
      referralOwner: `${inviterUser.firstName} ${inviterUser.lastName}`.toUpperCase(),
      rewardType,
      rewardValue,
      discountPercentage: discountPercent,
      cardId,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[Referral] verifyReferralCode error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error verifying referral code",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/referrals/status
// Auth: protect (JWT)
// ─────────────────────────────────────────────────────────────────────────────
export const getReferralStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const now = new Date();
    const activeCoupons = (user.scratchCards || []).filter(
      (c) => c.claimed && !c.used && c.couponCode && (!c.expiresAt || new Date(c.expiresAt) > now)
    );

    return res.status(200).json({
      success: true,
      referralVerified: user.referralVerified || false,
      rewardUnlocked:   user.rewardUnlocked   || false,
      referredBy:       user.referredBy       || "",
      referralCodeUsed: user.referralCodeUsed || "",
      scratchCards:     user.scratchCards     || [],
      couponCode:       user.couponCode       || "",
      discountPercent:  user.couponPercentage || 0,
      activeCoupons,
    });
  } catch (error) {
    console.error("[Referral] getReferralStatus error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching referral status" });
  }
};
