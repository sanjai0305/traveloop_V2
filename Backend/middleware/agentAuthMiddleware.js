import jwt from "jsonwebtoken";
import Agent from "../models/Agent.js";

export const fallbackAgents = new Map();

const protectAgent = async (req, res, next) => {
  let token;

  console.log(`\n[Agent Auth Middleware] Checking authorization for ${req.method} ${req.originalUrl}`);

  if (!process.env.JWT_SECRET) {
    console.error("[Agent Auth Middleware] JWT_SECRET is missing.");
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Auth configuration missing",
    });
  }

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const agent = await Agent.findById(decoded.id).select(
        "uid displayName companyName email phone gstNumber businessCategory " +
        "address city state country website instagram facebook logo profileImage " +
        "status role isVerified emailVerified profileCompleted dob mobile mobileVerified " +
        "gstNo companyLogo agentPhoto kycStatus isApproved " +
        "acceptedTerms privacyAccepted acceptedAt legalConsent termsVersion termsAcceptedAt " +
        "referralCode referralCount tripSlots usedSlots bonusSlots purchasedSlots " +
        "currentStep completedSteps profileCompletion onboardingComplete"
      );

      if (agent) {
        let currentStepVal = agent.currentStep || 1;
        if (currentStepVal > 5) {
          currentStepVal = 5;
          try {
            await Agent.findByIdAndUpdate(agent._id, {
              $set: { currentStep: 5, completedSteps: [1, 2, 3, 4, 5] },
              $pull: { completedSteps: { $gt: 5 } }
            });
          } catch (clampErr) {
            console.warn("[Agent Auth Middleware] Error clamping currentStep > 5:", clampErr.message);
          }
        }
        req.agent = {
          ...agent.toObject(),
          currentStep: currentStepVal,
          _id: agent._id,
          firebaseUid: agent.uid || "",
          email: agent.email || ""
        };
      }

      if (!req.agent) {
        const fallback = fallbackAgents.get(decoded.id);
        if (fallback) {
          req.agent = fallback;
        }
      }

      if (!req.agent) {
        console.warn(`[Agent Auth] Agent lookup failed for ID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          message: "Agent account not found",
          code: "AGENT_NOT_FOUND",
        });
      }

      next();
    } catch (error) {
      console.error("[Agent Auth Error]:", error);
      if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Session expired or invalid token. Please log in again.",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

export default protectAgent;
