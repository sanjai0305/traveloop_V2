import express from "express";
import User from "../models/User.js";
import Agent from "../models/Agent.js";

const router = express.Router();

// @route   POST /api/legal/accept
// @desc    Accept terms & conditions and privacy policy for User or Agent
router.post("/accept", async (req, res) => {
  try {
    const { userId, acceptedTerms, acceptedAt, termsVersion } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    const timestamp = acceptedAt ? new Date(acceptedAt) : new Date();
    const version = termsVersion || "v1.0";

    // 1. Try to find and update in User collection
    let user = await User.findById(userId);
    if (user) {
      user.acceptedTerms = acceptedTerms !== undefined ? acceptedTerms : true;
      user.privacyAccepted = true;
      user.acceptedAt = timestamp;
      user.termsAcceptedAt = timestamp;
      user.termsVersion = version;
      await user.save();

      const userObj = user.toObject();
      delete userObj.password;

      console.log(`[Legal Consent] Terms accepted for User: ${userId}`);
      return res.status(200).json({
        success: true,
        message: "Terms & Conditions and Privacy Policy accepted successfully.",
        user: userObj,
      });
    }

    // 2. Try to find and update in Agent collection
    let agent = await Agent.findById(userId);
    if (agent) {
      agent.acceptedTerms = acceptedTerms !== undefined ? acceptedTerms : true;
      agent.privacyAccepted = true;
      agent.acceptedAt = timestamp;
      agent.termsAcceptedAt = timestamp;
      agent.termsVersion = version;
      await agent.save();

      console.log(`[Legal Consent] Terms accepted for Agent: ${userId}`);
      return res.status(200).json({
        success: true,
        message: "Terms & Conditions and Privacy Policy accepted successfully.",
        agent,
      });
    }

    return res.status(404).json({
      success: false,
      message: "User or Agent not found with the provided userId.",
    });

  } catch (error) {
    console.error("[Legal Routes] Accept terms error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

export default router;
