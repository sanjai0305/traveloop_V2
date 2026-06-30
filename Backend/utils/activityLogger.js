import ActivityLog from "../models/ActivityLog.js";

export const logActivity = async (tripId, userId, action) => {
  try {
    await ActivityLog.create({
      trip: tripId,
      user: userId,
      action,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};
