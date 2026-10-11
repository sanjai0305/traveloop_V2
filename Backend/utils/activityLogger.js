import { db } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const logActivity = async (tripId, userId, action) => {
  try {
    await db.from("activity_logs").insert({
      id: uuidv4(),
      trip_id: tripId,
      user_id: userId,
      action,
    });
  } catch (err) {
    console.error("Failed to log activity:", err.message);
  }
};
