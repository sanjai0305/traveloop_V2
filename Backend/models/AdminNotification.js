import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["booking", "trip_published", "refund_requested", "settlement_due", "info"],
      default: "info",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const AdminNotification = mongoose.model("AdminNotification", adminNotificationSchema);
export default AdminNotification;
