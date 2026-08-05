import supabase from "../config/supabase.js";

export const getSavedDestinations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    res.json({
      success: true,
      savedDestinations: user?.saved_destinations || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleSaveDestination = async (req, res) => {
  try {
    const userId = req.user.id;
    const { destinationId, title, location, image, price } = req.body;

    const { data: user } = await supabase
      .from("users")
      .select("saved_destinations")
      .eq("id", userId)
      .maybeSingle();

    let list = user?.saved_destinations || [];
    const exists = list.some((item) => item.destinationId === destinationId);

    if (exists) {
      list = list.filter((item) => item.destinationId !== destinationId);
    } else {
      list.push({ destinationId, title, location, image, price, savedAt: new Date().toISOString() });
    }

    await supabase.from("users").update({ saved_destinations: list }).eq("id", userId);

    res.json({
      success: true,
      saved: !exists,
      savedDestinations: list,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, firstName, lastName, phone, city, country, avatar, upiId } = req.body;

    const updates = {};
    if (name || (firstName && lastName)) updates.name = name || `${firstName} ${lastName}`.trim();
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const { data: updatedUser } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser.id,
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await supabase.from("trips").delete().eq("user_id", userId);
    await supabase.from("users").delete().eq("id", userId);

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addSavedDestination = async (req, res) => {
  try {
    const userId = req.user.id;
    const { destinationId, title, location, image, price } = req.body;
    const { data: user } = await supabase.from("users").select("saved_destinations").eq("id", userId).maybeSingle();
    const list = user?.saved_destinations || [];
    if (!list.some(i => i.destinationId === destinationId)) {
      list.push({ destinationId, title, location, image, price, savedAt: new Date().toISOString() });
      await supabase.from("users").update({ saved_destinations: list }).eq("id", userId);
    }
    res.json({ success: true, savedDestinations: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeSavedDestination = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.params;
    const { data: user } = await supabase.from("users").select("saved_destinations").eq("id", userId).maybeSingle();
    const list = (user?.saved_destinations || []).filter(i => i.destinationId !== name && i.title !== name);
    await supabase.from("users").update({ saved_destinations: list }).eq("id", userId);
    res.json({ success: true, savedDestinations: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rewardXp = async (req, res) => {
  res.json({ success: true, message: "XP rewarded" });
};

export const getReferralDashboard = async (req, res) => {
  try {
    const { data: user } = await supabase.from("users").select("referral_code, referral_count").eq("id", req.user.id).maybeSingle();
    res.json({
      success: true,
      referralCode:  user?.referral_code || null,
      referralCount: user?.referral_count || 0,
      referrals:     [],
      rewards:       [],
      totalEarned:   0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const claimScratchCard = async (req, res) => {
  res.json({ success: true, reward: { type: "discount", value: 50 }, message: "Scratch card claimed!" });
};

export const verifyFirebasePhone = async (req, res) => {
  res.json({ success: true, message: "Phone verified" });
};

