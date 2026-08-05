import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

export const fallbackAgents = new Map();

const protectAgent = async (req, res, next) => {
  let token;

  console.log(
    `\n[Agent Auth Middleware] Checking authorization for ${req.method} ${req.originalUrl}`
  );

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
      const agentId = decoded.id || decoded.agentId;

      let { data: agent } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .maybeSingle();

      if (agent) {
        console.log(`✅ Supabase Agent Loaded: ${agent.id}`);
        let currentStepVal = agent.current_step || 1;
        if (currentStepVal > 5) {
          currentStepVal = 5;
        }
        req.agent = {
          _id: agent.id,
          id: agent.id,
          agencyName: agent.agency_name,
          ownerName: agent.owner_name,
          currentStep: currentStepVal,
          completedSteps: agent.completed_steps || [1, 2, 3, 4, 5],
          kycStatus: agent.kyc_status || "APPROVED",
          isApproved: agent.status === "APPROVED",
          ...agent,
        };
      }

      if (!req.agent) {
        const fallback = fallbackAgents.get(agentId);
        if (fallback) {
          req.agent = fallback;
        }
      }

      if (!req.agent) {
        console.warn(`[Agent Auth] Agent lookup failed for ID: ${agentId}`);
        return res.status(401).json({
          success: false,
          message: "Agent account not found",
          code: "AGENT_NOT_FOUND",
        });
      }

      next();
    } catch (error) {
      console.error("[Agent Auth Error]:", error);
      if (
        error.name === "TokenExpiredError" ||
        error.name === "JsonWebTokenError"
      ) {
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
