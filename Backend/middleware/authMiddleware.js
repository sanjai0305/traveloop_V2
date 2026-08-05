import jwt from "jsonwebtoken";
import admin from "../config/firebaseAdmin.js";
import { getDbClient } from "../config/supabase.js";

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
      token = req.headers.authorization.split(" ")[1];
      const db = await getDbClient();

      let userId;
      let firebaseUid;
      let email;

      // 1. Try decoding custom backend JWT
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "traveloop_local_dev_secret_key_2026"
        );
        userId = decoded.id || decoded.userId;
        firebaseUid = decoded.firebase_uid;
        email = decoded.email;
      } catch (jwtErr) {
        // 2. Fallback: Try verifying as a raw Firebase ID Token
        try {
          const decodedFb = await admin.auth().verifyIdToken(token);
          firebaseUid = decodedFb.uid;
          email = (decodedFb.email || "").toLowerCase().trim();
        } catch (fbErr) {
          console.error("[Auth Middleware] Token verification failed for both JWT and Firebase:", jwtErr.message);
          return res.status(401).json({
            success: false,
            message: "Not authorized, invalid token",
            code: "INVALID_TOKEN",
          });
        }
      }

      let user = null;

      // 3. User lookup in Supabase
      if (userId) {
        const { data: userById } = await db
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        user = userById;
      }

      if (!user && firebaseUid) {
        const { data: userByFb } = await db
          .from("users")
          .select("*")
          .eq("firebase_uid", firebaseUid)
          .maybeSingle();
        user = userByFb;
      }

      if (!user && email) {
        const { data: userByEmail } = await db
          .from("users")
          .select("*")
          .eq("email", email)
          .maybeSingle();
        user = userByEmail;
      }

      // 4. Auto-provision user if Firebase token is valid but user record doesn't exist yet in Supabase
      if (!user && email) {
        console.log(`[Auth Middleware] Auto-provisioning new Supabase user for email: ${email}`);
        const { data: newUser } = await db
          .from("users")
          .insert([
            {
              email,
              name: email.split("@")[0] || "Traveler",
              firebase_uid: firebaseUid || null,
              is_verified: true,
              role: "user",
            },
          ])
          .select()
          .maybeSingle();
        user = newUser;
      }

      if (user) {
        console.log(`✅ Supabase User Loaded: ${user.id} (${user.email})`);
        req.user = {
          _id: user.id,
          id: user.id,
          ...user,
        };
        return next();
      }

      // 5. Agent lookup in Supabase
      let agent = null;
      if (userId) {
        const { data: agentById } = await db
          .from("agents")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        agent = agentById;
      }

      if (!agent && firebaseUid) {
        const { data: agentByFb } = await db
          .from("agents")
          .select("*")
          .eq("firebase_uid", firebaseUid)
          .maybeSingle();
        agent = agentByFb;
      }

      if (agent) {
        console.log(`✅ Supabase Agent Loaded: ${agent.id}`);
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

      console.warn(`[Auth Middleware] Account lookup failed for token`);
      return res.status(401).json({
        success: false,
        message: "Account not found in database",
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