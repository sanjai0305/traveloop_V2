import mongoose from "mongoose";

const agentReferralSchema = new mongoose.Schema(
  {
    inviterAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    newAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    rewardGranted: {
      type: Boolean,
      default: false,
    },
    bonusSlotsAdded: {
      type: Number,
      default: 0,
    },
    conditionsMet: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const AgentReferral = mongoose.model("AgentReferral", agentReferralSchema);
export default AgentReferral;
