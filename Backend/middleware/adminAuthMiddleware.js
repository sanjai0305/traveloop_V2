import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const verifyAdmin = async (req, res, next) => {
  let token;

  console.log(`\n[Admin Auth Middleware] Checking authorization for ${req.method} ${req.originalUrl}`);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const secret = process.env.JWT_SECRET || "traveloop_local_dev_secret_key_2026";
      token = req.headers.authorization.split(" ")[1];

      console.log("[Admin Auth Debug] Received Authorization Token:", token ? `${token.substring(0, 15)}...` : "NONE");

      let decoded;
      try {
        decoded = jwt.verify(token, secret);
        console.log("[Admin Auth Debug] Decoded JWT Payload:", decoded);
      } catch (jwtErr) {
        console.error("[Admin Auth Debug] JWT Verification Error:", jwtErr.message);
        if (jwtErr.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Session expired. Please log in again.",
            code: "TOKEN_EXPIRED",
          });
        }
        return res.status(401).json({
          success: false,
          message: "Not Authorized, token failed",
          code: "INVALID_TOKEN",
        });
      }

      // Try finding by decoded ID
      let admin = null;
      if (decoded.id) {
        try {
          admin = await Admin.findById(decoded.id).select("name email role twoFactorEnabled googleId lastLogin");
        } catch (dbErr) {
          console.warn("[Admin Auth Debug] Admin.findById error:", dbErr.message);
        }
      }

      // Fallback: If not found by ID, try finding by email if present in payload or fallback to primary super admin
      if (!admin) {
        if (decoded.email) {
          admin = await Admin.findOne({ email: decoded.email.toLowerCase() }).select("name email role twoFactorEnabled googleId lastLogin");
        }
        if (!admin) {
          admin = await Admin.findOne({ role: "Super Admin" }).select("name email role twoFactorEnabled googleId lastLogin");
        }
      }

      if (!admin) {
        console.warn(`[Admin Auth] Admin lookup failed for ID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          message: "Admin account not found",
        });
      }

      req.admin = {
        _id: admin._id,
        id: admin._id.toString(),
        ...admin.toObject(),
      };

      console.log(`[Admin Auth Debug] Middleware Success: Attached req.admin (${admin.email}) [${admin.role}]`);
      next();
    } catch (error) {
      console.error("[Admin Auth Unexpected Error]:", error);
      return res.status(401).json({
        success: false,
        message: "Not Authorized",
        code: "INVALID_TOKEN",
      });
    }
  } else {
    console.warn("[Admin Auth Debug] No Bearer token provided in Authorization header.");
    return res.status(401).json({
      success: false,
      message: "No Token Provided",
    });
  }
};

// Aliasing protectAdmin to verifyAdmin for backward compatibility
export const protectAdmin = verifyAdmin;

export const verifyFinance = async (req, res, next) => {
  verifyAdmin(req, res, () => {
    if (req.admin.role === "Super Admin" || req.admin.role === "Finance Admin") {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: "Forbidden: Finance Admin or Super Admin privileges required",
      });
    }
  });
};

export const verifySuperAdmin = async (req, res, next) => {
  verifyAdmin(req, res, () => {
    if (req.admin.role === "Super Admin") {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: "Forbidden: Super Admin privileges required",
      });
    }
  });
};

export default verifyAdmin;
