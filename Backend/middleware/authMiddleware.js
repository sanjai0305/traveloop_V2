import jwt from "jsonwebtoken";
import User from "../models/User.js";
import mongoose from "mongoose";

const protect = async (req, res, next) => {
  let token;

  console.log(`\n[Auth Middleware] -----------------------------------------`);
  console.log(`[Auth Middleware] Checking authorization for ${req.method} ${req.originalUrl}`);
  console.log(`[Auth Middleware] DB Connection State: ${mongoose.connection.readyState} (1=Connected)`);

  if (mongoose.connection.readyState !== 1) {
    console.error("[Auth Middleware] ❌ Database is unavailable. Rejecting request to prevent silent failures.");
    return res.status(503).json({
      success: false,
      message: "Database connection is temporarily unavailable. Please try again later.",
      code: "DB_UNAVAILABLE",
    });
  }

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      if (!process.env.JWT_SECRET) {
        console.error("[Auth Middleware] ❌ CRITICAL: JWT_SECRET is missing from environment variables.");
        return res.status(500).json({
          success: false,
          message: "Internal Server Error: Auth configuration missing",
          code: "AUTH_CONFIG_ERROR",
        });
      }

      console.log(`[Auth Middleware] Raw Authorization Header: ${req.headers.authorization}`);
      token = req.headers.authorization.split(" ")[1];
      console.log(`[Auth Middleware] Extracted Token Length: ${token ? token.length : 0}`);
      
      // Mask token for logs
      const maskedToken = token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : "undefined";
      console.log(`[Auth Middleware] Extracted Token Value: ${maskedToken}`);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`[Auth Middleware] Token verified. Decoded Payload: ${JSON.stringify(decoded)}`);

      // Check if MongoDB is connected? Mongoose will throw error if not connected, which goes to catch
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        console.warn(`[Auth Middleware] ❌ User lookup failed. No user found in DB for ID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          message: "User account not found",
          code: "USER_NOT_FOUND",
        });
      }

      console.log(`[Auth Middleware] ✅ Authorization successful (Route access granted) for user: ${req.user.email}`);
      next();
    } catch (error) {
      console.error("[Auth Middleware Error Trace]:", error.name, error.message);
      
      if (error.name === "TokenExpiredError") {
        console.warn(`[Auth Middleware] ❌ JWT Expired.`);
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
          code: "TOKEN_EXPIRED",
        });
      }
      if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
        console.warn(`[Auth Middleware] ❌ Invalid JWT.`);
        return res.status(401).json({
          success: false,
          message: "Not Authorized",
          code: "INVALID_TOKEN",
        });
      }
      console.error("[Auth Middleware Error]:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error during authentication verification",
        code: "AUTH_SERVER_ERROR",
      });
    }
  } else {
    console.warn(`[Auth Middleware] ❌ Missing Authorization header or Bearer prefix.`);
    res.status(401).json({
      success: false,
      message: "No Token",
      code: "NO_TOKEN",
    });
  }
};

export default protect;