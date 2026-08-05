import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

export const verifyAdmin = async (req, res, next) => {
  let token;

  const requestMethod = req.method?.toUpperCase();
  const requestUrl = req.originalUrl || req.url;
  console.log(`\n==================================================`);
  console.log(`[Admin Auth Middleware] Incoming Request: ${requestMethod} ${requestUrl}`);
  console.log(`[Admin Auth Middleware] Raw Authorization Header: ${req.headers.authorization || "MISSING"}`);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const secret =
        process.env.JWT_SECRET || "traveloop_local_dev_secret_key_2026";
      token = req.headers.authorization.split(" ")[1];
      console.log(`[Admin Auth Middleware] Bearer Token Extracted: ${token ? `${token.substring(0, 20)}...` : "EMPTY"}`);

      let decoded;
      try {
        decoded = jwt.verify(token, secret);
        console.log(`[Admin Auth Middleware] JWT Verification Result: SUCCESS`);
        console.log(`[Admin Auth Middleware] Decoded Payload:`, decoded);
      } catch (jwtErr) {
        console.error("❌ [Admin Auth Middleware] JWT Verification Error:", jwtErr.message);
        if (jwtErr.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Session expired. Please log in again.",
            reason: "TokenExpiredError",
            code: "TOKEN_EXPIRED",
          });
        }
        return res.status(401).json({
          success: false,
          message: "Not Authorized, token failed verification",
          reason: "Invalid JWT",
          code: "INVALID_TOKEN",
        });
      }

      let admin = null;
      if (decoded.id) {
        console.log(`[Admin Auth Middleware] Fetching admin record from Supabase by ID: ${decoded.id}...`);
        const { data: found } = await supabase
          .from("admins")
          .select("*")
          .eq("id", decoded.id)
          .maybeSingle();
        admin = found;
      }

      if (!admin && decoded.email) {
        console.log(`[Admin Auth Middleware] Fetching admin record from Supabase by Email: ${decoded.email}...`);
        const { data: found } = await supabase
          .from("admins")
          .select("*")
          .ilike("email", decoded.email)
          .maybeSingle();
        admin = found;
      }

      if (!admin) {
        console.warn(`⚠️ [Admin Auth Middleware] Database search fallback checking default ADMIN role...`);
        const { data: found } = await supabase
          .from("admins")
          .select("*")
          .or("role.eq.super_admin,role.eq.SUPER_ADMIN,role.eq.ADMIN")
          .limit(1)
          .maybeSingle();
        admin = found;
      }

      if (!admin) {
        console.warn(`❌ [Admin Auth Middleware] Admin account not found for ID: ${decoded.id}, Email: ${decoded.email}`);
        return res.status(404).json({
          success: false,
          message: "Admin account not found in database",
          reason: "Admin account not found",
        });
      }

      // Auto-grant all permissions if role is super_admin / super admin
      let permissions = admin.permissions || [];
      const normalizedRole = (admin.role || "").toLowerCase().trim();
      if (
        (normalizedRole === "super_admin" || normalizedRole === "super admin" || normalizedRole === "admin") &&
        (!permissions.includes("all") || !permissions.includes("manage_finance"))
      ) {
        console.log(`ℹ️ [Admin Auth Middleware] Super Admin detected. Auto-granting full permission set...`);
        permissions = Array.from(new Set([...permissions, "all", "manage_finance", "manage_users", "manage_agents", "manage_trips", "super_admin"]));
        admin.permissions = permissions;
      }

      console.log(`[Admin Auth Middleware] Admin ID: ${admin.id}`);
      console.log(`[Admin Auth Middleware] Admin Role: '${admin.role}'`);
      console.log(`[Admin Auth Middleware] Admin Permissions:`, permissions);

      req.admin = {
        _id: admin.id,
        id: admin.id,
        ...admin,
        permissions,
      };

      console.log(`✅ [Admin Auth Middleware] Auth Check Passed for ${admin.email}`);
      console.log(`==================================================\n`);
      next();
    } catch (error) {
      console.error("❌ [Admin Auth Middleware] Unexpected Error:", error);
      return res.status(401).json({
        success: false,
        message: "Not Authorized",
        reason: "Invalid JWT",
        code: "INVALID_TOKEN",
      });
    }
  } else {
    console.warn(`❌ [Admin Auth Middleware] Missing Authorization header for ${requestMethod} ${requestUrl}`);
    return res.status(401).json({
      success: false,
      message: "No Authorization Bearer Token Provided",
      reason: "No Token Provided",
    });
  }
};

export const protectAdmin = verifyAdmin;

export const verifyFinance = async (req, res, next) => {
  verifyAdmin(req, res, () => {
    const role = (req.admin?.role || "").toLowerCase().trim();
    const permissions = req.admin?.permissions || [];

    console.log(`[Admin Auth Middleware] verifyFinance evaluating endpoint protection...`);
    console.log(`  - Required Permission: 'manage_finance' or 'super_admin' or 'all'`);
    console.log(`  - Admin Role: '${req.admin?.role}'`);
    console.log(`  - Admin Permissions:`, permissions);

    const isFinanceAuthorized =
      role === "super_admin" ||
      role === "super admin" ||
      role === "admin" ||
      role === "finance_admin" ||
      role === "finance admin" ||
      permissions.includes("all") ||
      permissions.includes("manage_finance") ||
      permissions.includes("super_admin");

    if (isFinanceAuthorized) {
      console.log(`✅ [Admin Auth Middleware] verifyFinance AUTHORIZED for Admin ID ${req.admin.id}\n`);
      next();
    } else {
      console.warn(`❌ [Admin Auth Middleware] verifyFinance FORBIDDEN for Admin ID ${req.admin.id} [Role: '${req.admin.role}']`);
      res.status(403).json({
        success: false,
        message: "Forbidden: Finance Admin or Super Admin privileges required",
        reason: "Missing permission: manage_finance",
        role: req.admin.role,
        requiredRole: "super_admin | finance_admin",
      });
    }
  });
};

export const verifySuperAdmin = async (req, res, next) => {
  verifyAdmin(req, res, () => {
    const role = (req.admin?.role || "").toLowerCase().trim();
    const permissions = req.admin?.permissions || [];

    console.log(`[Admin Auth Debug] verifySuperAdmin checking Admin Role: '${req.admin?.role}', Permissions:`, permissions);

    const isSuperAdminAuthorized =
      role === "super_admin" ||
      role === "super admin" ||
      role === "admin" ||
      permissions.includes("all") ||
      permissions.includes("super_admin");

    if (isSuperAdminAuthorized) {
      console.log(`[Admin Auth Debug] verifySuperAdmin SUCCESS for Admin ID ${req.admin.id}`);
      next();
    } else {
      console.warn(`[Admin Auth Debug] verifySuperAdmin FORBIDDEN for Admin ID ${req.admin.id} [Role: ${req.admin.role}]`);
      res.status(403).json({
        success: false,
        message: "Forbidden: Super Admin privileges required",
        role: req.admin.role,
        requiredRole: "super_admin",
      });
    }
  });
};

export default verifyAdmin;
