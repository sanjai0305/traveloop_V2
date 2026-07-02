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
      if (!process.env.JWT_SECRET) {
        console.error("[Admin Auth Middleware] JWT_SECRET is missing.");
        return res.status(500).json({
          success: false,
          message: "Internal Server Error: Auth configuration missing",
        });
      }

      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const admin = await Admin.findById(decoded.id).select("name email role twoFactorEnabled googleId lastLogin");

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
        ...admin.toObject()
      };

      next();
    } catch (error) {
      console.error("[Admin Auth Error]:", error);
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
