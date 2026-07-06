import mongoose from "mongoose";

const agentSettingsSchema = new mongoose.Schema(
  {
    // The key/id of the singleton settings doc, e.g. "global"
    settingId: {
      type: String,
      default: "global",
      unique: true,
    },
    defaultTripSlots: {
      type: Number,
      default: 2,
    },
    extraSlotsPerReferral: {
      type: Number,
      default: 1,
    },
    maxSlots: {
      type: Number,
      default: 5,
    },
    approvalTimeLimit: {
      type: Number,
      default: 1, // hours
    },
    referralEnabled: {
      type: Boolean,
      default: true,
    },
    referralDiscountPercent: {
      type: Number,
      default: 5,
    },
    inviterCoins: {
      type: Number,
      default: 100,
    },
    scratchRewardsEnabled: {
      type: Boolean,
      default: true,
    },
    minRewardPercent: {
      type: Number,
      default: 5,
    },
    maxRewardPercent: {
      type: Number,
      default: 30,
    },
    tripSlotBonusEnabled: {
      type: Boolean,
      default: true,
    },
    slotPrice: {
      type: Number,
      default: 1000,
    },
    slotPurchaseEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const AgentSettings = mongoose.model("AgentSettings", agentSettingsSchema);
export default AgentSettings;
