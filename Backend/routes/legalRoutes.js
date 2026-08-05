import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.post("/accept", async (req, res) => {
  try {
    const { userId, agentId, termsVersion } = req.body;
    const now = new Date();
    const version = termsVersion || "2026-07";

    if (agentId) {
      await supabase.from("agents").update({
        accepted_terms: true,
        privacy_accepted: true,
        accepted_at: now,
        terms_accepted_at: now,
        terms_version: version,
      }).eq("id", agentId);

      await supabase.from("legal_acceptance").insert([{
        agent_id: agentId,
        version,
        accepted_at: now,
      }]);
    } else if (userId) {
      await supabase.from("users").update({
        is_verified: true,
      }).eq("id", userId);

      await supabase.from("legal_acceptance").insert([{
        user_id: userId,
        version,
        accepted_at: now,
      }]);
    }

    res.status(200).json({
      success: true,
      message: "Legal consent saved successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/status", async (req, res) => {
  res.status(200).json({
    success: true,
    termsVersion: "2026-07",
    legalConsent: { accepted: true, acceptedTerms: true, acceptedPrivacy: true, termsVersion: "2026-07" },
  });
});

export default router;
