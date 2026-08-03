import Reward from "../models/Reward.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// GET USER REWARDS
export const getMyRewards = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let rewards = await Reward.find({ userId }).sort({ createdAt: -1 });

    // Seed default starter rewards if empty for user experience
    if (!rewards || rewards.length === 0) {
      const defaultRewards = [
        {
          userId,
          title: "🎉 Welcome Bonus Reward",
          description: "Get ₹200 OFF on your first tour package booking",
          points: 100,
          rewardType: "FLAT_DISCOUNT",
          discountValue: 200,
          discountType: "FLAT",
          minimumBookingAmount: 1000,
          status: "available",
        },
        {
          userId,
          title: "🏕️ Explorer Milestone Reward",
          description: "Enjoy 15% OFF (up to ₹500) on adventure packages",
          points: 250,
          rewardType: "PERCENTAGE_DISCOUNT",
          discountValue: 15,
          discountType: "PERCENTAGE",
          minimumBookingAmount: 2500,
          status: "available",
        },
        {
          userId,
          title: "✨ Festival Travel Reward",
          description: "Flat ₹500 OFF on group tour packages",
          points: 500,
          rewardType: "FESTIVAL_REWARD",
          discountValue: 500,
          discountType: "FLAT",
          minimumBookingAmount: 5000,
          status: "available",
        },
      ];

      rewards = await Reward.insertMany(defaultRewards);
    }

    const userObj = await User.findById(userId).select("points referralCode");

    res.status(200).json({
      success: true,
      rewards,
      coins: userObj?.points || 350,
      lifetimeSavings: 1250,
      rewardsClaimedCount: rewards.filter(r => r.status === "claimed").length,
    });
  } catch (error) {
    console.error("[Get Rewards Error]:", error);
    res.status(500).json({ success: false, message: "Error fetching rewards" });
  }
};

// CLAIM REWARD -> GENERATE COUPON
export const claimReward = async (req, res) => {
  try {
    const { rewardId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!rewardId) {
      return res.status(400).json({ success: false, message: "Reward ID is required" });
    }

    const reward = await Reward.findOne({ _id: rewardId, userId });

    if (!reward) {
      return res.status(404).json({ success: false, message: "Reward not found" });
    }

    if (reward.status === "claimed") {
      return res.status(400).json({ success: false, message: "Reward already claimed!" });
    }

    // Generate unique Coupon Code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const couponCode = `TL-REWARD-${randomSuffix}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Valid for 30 days

    // Create Coupon record
    const coupon = await Coupon.create({
      couponCode,
      userId,
      type: "REWARD",
      discountType: reward.discountType || "FLAT",
      discountValue: reward.discountValue || 200,
      minimumAmount: reward.minimumBookingAmount || 1000,
      expiryDate,
      status: "ACTIVE",
      userStatus: "Unused",
      claimedFromRewardId: reward._id,
      createdBy: "REWARD_SYSTEM",
    });

    // Update reward state
    reward.status = "claimed";
    reward.claimedAt = new Date();
    reward.couponCode = couponCode;
    await reward.save();

    // Create Notification
    await Notification.create({
      user: userId,
      title: "Reward Claimed! 🎟️",
      message: `You claimed "${reward.title}"! Coupon code ${couponCode} is now active under My Coupons.`,
      type: "reward",
      isInvite: false,
    });

    res.status(200).json({
      success: true,
      message: `Reward claimed! Coupon code ${couponCode} generated successfully.`,
      reward,
      coupon,
    });
  } catch (error) {
    console.error("[Claim Reward Error]:", error);
    res.status(500).json({ success: false, message: "Failed to claim reward" });
  }
};
