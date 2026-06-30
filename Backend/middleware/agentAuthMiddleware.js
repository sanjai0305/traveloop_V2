import jwt from "jsonwebtoken";
import Agent from "../models/Agent.js";
import mongoose from "mongoose";

// A secure in-memory cache for fallback mode (if MongoDB is disconnected)
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

      // Check if DB is connected
      if (mongoose.connection.readyState === 1) {
        req.agent = await Agent.findById(decoded.id).select("-password");
      }

      // If DB is disconnected or agent not found in DB, check in-memory fallback
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
      console.error("[Agent Auth Error]:", error.name, error.message);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Not Authorized",
        code: "INVALID_TOKEN",
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: "No Token Provided",
    });
  }
};

export default protectAgent;
