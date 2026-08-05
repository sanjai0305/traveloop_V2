import supabase from "../config/supabase.js";

export const getMyRewards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: rewards } = await supabase
      .from("rewards")
      .select("*")
      .eq("user_id", userId);

    res.status(200).json({
      success: true,
      rewards: (rewards || []).map((r) => ({ ...r, _id: r.id })),
      coins: 350,
      lifetimeSavings: 1250,
      rewardsClaimedCount: (rewards || []).filter((r) => r.status === "CLAIMED").length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching rewards" });
  }
};

export const claimReward = async (req, res) => {
  try {
    const { rewardId } = req.body;
    const userId = req.user.id;

    if (!rewardId) {
      return res.status(400).json({ success: false, message: "Reward ID is required" });
    }

    const couponCode = `TL-REWARD-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    const { data: coupon } = await supabase
      .from("coupons")
      .insert([{
        code: couponCode,
        discount_type: "FLAT",
        discount_value: 200,
        expires_at: expiresAt,
        status: "ACTIVE",
      }])
      .select()
      .single();

    res.status(200).json({
      success: true,
      message: `Reward claimed! Coupon code ${couponCode} generated successfully.`,
      coupon,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to claim reward" });
  }
};
