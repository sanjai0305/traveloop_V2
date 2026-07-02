import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  console.log(`\n[Auth Middleware] Checking authorization for ${req.method} ${req.originalUrl}`);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      if (!process.env.JWT_SECRET) {
        console.error("[Auth Middleware] JWT_SECRET is missing.");
        return res.status(500).json({
          success: false,
          message: "Internal Server Error: Auth configuration missing",
          code: "AUTH_CONFIG_ERROR",
        });
      }

      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select(
        "firstName lastName email phone city country avatar xp level streak acceptedTerms firebaseUid"
      );

      if (!user) {
        console.warn(`[Auth Middleware] User lookup failed for ID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          message: "User account not found",
          code: "USER_NOT_FOUND",
        });
      }

      const userObj = user.toObject();
      // Maintain compatibility: set req.user to match expected properties
      req.user = {
        _id: user._id,
        id: user._id.toString(),
        ...userObj
      };

      next();
    } catch (error) {
      console.error("[Auth Middleware Error]:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
        code: "INVALID_TOKEN",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
      code: "NO_TOKEN",
    });
  }
};

export default protect;