import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

const protect = async (req, res, next) => {
  let token;

  console.log(
    `\n[Auth Middleware] Checking authorization for ${req.method} ${req.originalUrl}`
  );

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

      const userId = decoded.id || decoded.userId;
      const firebaseUid = decoded.firebase_uid;

      // Query users table
      let { data: user, error: userErr } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!user && firebaseUid) {
        const { data: userByFb } = await supabase
          .from("users")
          .select("*")
          .eq("firebase_uid", firebaseUid)
          .maybeSingle();
        user = userByFb;
      }

      if (user && !userErr) {
        console.log(`✅ Supabase User Loaded: ${user.id}`);
        req.user = {
          _id: user.id,
          id: user.id,
          ...user,
        };
        return next();
      }

      // Check if token belongs to an Agent
      let { data: agent, error: agentErr } = await supabase
        .from("agents")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!agent && firebaseUid) {
        const { data: agentByFb } = await supabase
          .from("agents")
          .select("*")
          .eq("firebase_uid", firebaseUid)
          .maybeSingle();
        agent = agentByFb;
      }

      if (agent && !agentErr) {
        console.log(`✅ Supabase User Loaded (Agent): ${agent.id}`);
        req.agent = {
          _id: agent.id,
          id: agent.id,
          ...agent,
        };
        req.user = {
          _id: agent.id,
          id: agent.id,
          name: agent.agency_name || agent.owner_name || agent.email,
          displayName: agent.agency_name || agent.owner_name || agent.email,
          email: agent.email,
          role: "agent",
        };
        return next();
      }

      console.warn(`[Auth Middleware] Account lookup failed for ID: ${userId}`);
      return res.status(401).json({
        success: false,
        message: "Account not found",
        code: "USER_NOT_FOUND",
      });
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