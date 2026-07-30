import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Agent from "../models/Agent.js";

const router = express.Router();

// ── JWT token extraction helper ─────────────────────────────────────────────
const extractAuthId = (req) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.warn("[Legal Routes] JWT_SECRET is not set — skipping JWT decode.");
    } else {
      try {
        const decoded = jwt.verify(token, secret);
        const extractedId = decoded.id || decoded._id || decoded.userId || decoded.agentId;
        if (extractedId) {
          console.log(`[Legal Routes] JWT decoded successfully. Extracted ID: ${extractedId}`);
          return extractedId;
        }
        console.warn("[Legal Routes] JWT decoded but contains no recognised ID field:", decoded);
      } catch (err) {
        console.warn("[Legal Routes] JWT verification failed:", err.message);
      }
    }
  }

  // Fallback: use userId / id from body
  const bodyId = req.body?.userId || req.body?.id || req.body?.agentId || null;
  if (bodyId) {
    console.log(`[Legal Routes] Using body userId as ID fallback: ${bodyId}`);
  }
  return bodyId;
};

// ── POST /api/legal/accept ──────────────────────────────────────────────────
// @desc    Save Legal Consent acceptance for authenticated User or Agent
// @access  Private (JWT) or Public with userId in body
router.post("/accept", async (req, res) => {
  try {
    // ── 1. Debug logging ────────────────────────────────────────────────────
    console.log("\n[Legal Accept] ─── Incoming Request ───────────────────────────");
    console.log("[Legal Accept] Method:", req.method, "| URL:", req.originalUrl);
    console.log("[Legal Accept] Authorization Header:", req.headers.authorization
      ? `Bearer ${req.headers.authorization.split(" ")[1]?.slice(0, 20)}...`
      : "MISSING");
    console.log("[Legal Accept] Request Body:", JSON.stringify(req.body, null, 2));

    const { acceptedTerms, acceptedPrivacy, privacyAccepted, acceptedAt, termsVersion } = req.body;

    // ── 2. Normalise boolean fields (accept true, "true", 1) ───────────────
    const isTermsAccepted = acceptedTerms === true || acceptedTerms === "true" || acceptedTerms === 1;
    const isPrivacyAccepted =
      acceptedPrivacy === true || acceptedPrivacy === "true" || acceptedPrivacy === 1 ||
      privacyAccepted === true || privacyAccepted === "true" || privacyAccepted === 1;

    console.log(`[Legal Accept] isTermsAccepted: ${isTermsAccepted} | isPrivacyAccepted: ${isPrivacyAccepted}`);

    // ── 3. Validation ───────────────────────────────────────────────────────
    if (!isTermsAccepted && !isPrivacyAccepted) {
      return res.status(400).json({
        success: false,
        message: "Both acceptedTerms and acceptedPrivacy are required and must be true.",
        fields: { acceptedTerms: "required: true", acceptedPrivacy: "required: true" },
      });
    }

    if (!isTermsAccepted) {
      return res.status(400).json({
        success: false,
        message: "acceptedTerms is required and must be true.",
        fields: { acceptedTerms: "required: true" },
      });
    }

    if (!isPrivacyAccepted) {
      return res.status(400).json({
        success: false,
        message: "acceptedPrivacy is required and must be true. Send acceptedPrivacy: true in the request body.",
        fields: { acceptedPrivacy: "required: true" },
      });
    }

    // ── 4. Identify the target User / Agent ────────────────────────────────
    const targetId = extractAuthId(req);
    console.log(`[Legal Accept] Resolved targetId: ${targetId || "NONE"}`);

    if (!targetId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No valid JWT token or userId provided. Please include Authorization: Bearer <token> header or userId in the request body.",
      });
    }

    const timestamp = acceptedAt ? new Date(acceptedAt) : new Date();
    const version = termsVersion || "v1.0";

    const legalConsentData = {
      accepted: true,
      acceptedTerms: true,
      acceptedPrivacy: true,
      acceptedAt: timestamp,
    };

    // ── 5. Try Agent collection first (Agent Portal context) ───────────────
    let agent = null;
    try {
      agent = await Agent.findById(targetId);
    } catch (dbErr) {
      console.warn("[Legal Accept] Agent.findById failed (invalid ObjectId or DB error):", dbErr.message);
    }

    if (agent) {
      // Check duplicate
      if (agent.legalConsent?.accepted && agent.acceptedTerms && agent.privacyAccepted) {
        console.log(`[Legal Accept] Agent ${agent._id} already accepted legal consent — returning alreadyAccepted.`);
        const agentObj = agent.toObject();
        delete agentObj.password;
        return res.status(200).json({
          success: true,
          alreadyAccepted: true,
          message: "Legal consent was already recorded.",
          agent: agentObj,
        });
      }

      agent.legalConsent = legalConsentData;
      agent.acceptedTerms = true;
      agent.privacyAccepted = true;
      agent.acceptedAt = timestamp;
      agent.termsAcceptedAt = timestamp;
      agent.termsVersion = version;
      await agent.save();

      const agentObj = agent.toObject();
      delete agentObj.password;

      console.log(`[Legal Accept] ✅ Legal consent saved for Agent: ${agent._id} (${agent.email})`);
      return res.status(200).json({
        success: true,
        message: "Legal consent saved successfully.",
        agent: agentObj,
      });
    }

    // ── 6. Try User collection ──────────────────────────────────────────────
    let user = null;
    try {
      user = await User.findById(targetId);
    } catch (dbErr) {
      console.warn("[Legal Accept] User.findById failed:", dbErr.message);
    }

    if (user) {
      // Check duplicate
      if (user.legalConsent?.accepted && user.acceptedTerms && user.privacyAccepted) {
        console.log(`[Legal Accept] User ${user._id} already accepted legal consent.`);
        const userObj = user.toObject();
        delete userObj.password;
        return res.status(200).json({
          success: true,
          alreadyAccepted: true,
          message: "Legal consent was already recorded.",
          user: userObj,
        });
      }

      user.legalConsent = legalConsentData;
      user.acceptedTerms = true;
      user.privacyAccepted = true;
      user.acceptedAt = timestamp;
      user.termsAcceptedAt = timestamp;
      user.termsVersion = version;
      await user.save();

      const userObj = user.toObject();
      delete userObj.password;

      console.log(`[Legal Accept] ✅ Legal consent saved for User: ${user._id} (${user.email})`);
      return res.status(200).json({
        success: true,
        message: "Legal consent saved successfully.",
        user: userObj,
      });
    }

    // ── 7. Account not found in either collection ───────────────────────────
    console.warn(`[Legal Accept] No Agent or User found for targetId: ${targetId}`);
    return res.status(404).json({
      success: false,
      message: "Account not found. The provided authentication token does not match any registered account.",
    });

  } catch (error) {
    console.error("[Legal Accept] Unexpected server error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error processing legal consent.",
    });
  }
});

// ── GET /api/legal/status ───────────────────────────────────────────────────
// @desc    Get legal consent status for authenticated user / agent
router.get("/status", async (req, res) => {
  try {
    const targetId = extractAuthId(req);
    if (!targetId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    let agent = null;
    try { agent = await Agent.findById(targetId).select("legalConsent acceptedTerms privacyAccepted acceptedAt"); }
    catch { /* ignore */ }

    if (agent) {
      return res.status(200).json({
        success: true,
        legalConsent: agent.legalConsent || {
          accepted: Boolean(agent.acceptedTerms && agent.privacyAccepted),
          acceptedTerms: Boolean(agent.acceptedTerms),
          acceptedPrivacy: Boolean(agent.privacyAccepted),
          acceptedAt: agent.acceptedAt,
        },
      });
    }

    let user = null;
    try { user = await User.findById(targetId).select("legalConsent acceptedTerms privacyAccepted acceptedAt"); }
    catch { /* ignore */ }

    if (user) {
      return res.status(200).json({
        success: true,
        legalConsent: user.legalConsent || {
          accepted: Boolean(user.acceptedTerms && user.privacyAccepted),
          acceptedTerms: Boolean(user.acceptedTerms),
          acceptedPrivacy: Boolean(user.privacyAccepted),
          acceptedAt: user.acceptedAt,
        },
      });
    }

    return res.status(404).json({ success: false, message: "Account not found." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
