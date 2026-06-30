import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

export const fallbackAgents = new Map();

const protectAgent = async (req, res, next) => {
  let token;

  console.log(`\n[Agent Auth Middleware] Checking authorization for ${req.method} ${req.originalUrl}`);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      if (!process.env.JWT_SECRET) {
        console.error("[Agent Auth Middleware] JWT_SECRET is missing.");
        return res.status(500).json({
          success: false,
          message: "Internal Server Error: Auth configuration missing",
        });
      }

      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { data: agent, error } = await supabase
        .from("agents")
        .select("id, companyName, email, status")
        .eq("id", decoded.id)
        .maybeSingle();

      if (agent) {
        req.agent = {
          _id: agent.id,
          id: agent.id,
          ...agent
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
        });
      }

      next();
    } catch (error) {
      console.error("[Agent Auth Error]:", error);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
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
