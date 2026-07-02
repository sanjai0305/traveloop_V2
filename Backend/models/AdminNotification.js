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

adminNotificationSchema.index({ read: 1 });

const AdminNotification = mongoose.model("AdminNotification", adminNotificationSchema);
export default AdminNotification;
