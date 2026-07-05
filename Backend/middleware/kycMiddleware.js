/**
 * kycMiddleware.js
 *
 * Authorization guard for agent trip operations.
 *
 * ALLOW if:   emailVerified === true
 *             AND mobileVerified === true
 *             AND (kycStatus === "KYC_COMPLETED" || kycStatus === "APPROVED")
 *             OR  (profileCompleted === true && status === "approved")   ← legacy fallback
 *
 * DENY with a descriptive reason code.
 */

export const checkAgentKYC = (req, res, next) => {
  const agent = req.agent;

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!agent) {
    return res.status(401).json({
      success: false,
      reason: "NOT_AUTHENTICATED",
      message: "Agent not authenticated",
    });
  }

  // ── Full diagnostic dump (always printed) ─────────────────────────────────
  const debugFields = {
    emailVerified:    agent.emailVerified,
    mobileVerified:   agent.mobileVerified,
    kycStatus:        agent.kycStatus,
    isApproved:       agent.isApproved,
    profileCompleted: agent.profileCompleted,
    status:           agent.status,
  };
  console.log("\n[KYC Middleware]", req.method, req.originalUrl);
  console.log(debugFields);

  // ── Derive booleans ────────────────────────────────────────────────────────
  const emailVerified    = agent.emailVerified    === true;
  const mobileVerified   = agent.mobileVerified   === true;
  const kycStatus        = agent.kycStatus        || "PENDING";
  const profileCompleted = agent.profileCompleted === true;
  const status           = (agent.status          || "").toLowerCase();

  const kycPassed     = kycStatus === "KYC_COMPLETED" || kycStatus === "APPROVED";
  const adminApproved = profileCompleted && status === "approved";   // legacy fallback

  // ── Check 1: Email not verified ────────────────────────────────────────────
  if (!emailVerified) {
    console.warn("  ❌ BLOCKED — emailVerified is false");
    return res.status(403).json({
      success: false,
      reason: "EMAIL_NOT_VERIFIED",
      message: "Verify your email address before creating trips",
      ...debugFields,
    });
  }

  // ── Check 2: Mobile not verified ───────────────────────────────────────────
  if (!mobileVerified) {
    console.warn("  ❌ BLOCKED — mobileVerified is false");
    return res.status(403).json({
      success: false,
      reason: "MOBILE_NOT_VERIFIED",
      message: "Verify your mobile number before creating trips",
      ...debugFields,
    });
  }

  // ── Check 3: KYC / profile gate ───────────────────────────────────────────
  if (!kycPassed && !adminApproved) {
    const isPendingApproval =
      kycStatus === "MOBILE_VERIFIED" || kycStatus === "EMAIL_VERIFIED";

    if (isPendingApproval) {
      console.warn("  ❌ BLOCKED — kycStatus =", kycStatus, "(awaiting admin)");
      return res.status(403).json({
        success: false,
        reason: "ADMIN_APPROVAL_PENDING",
        message: "Your profile is under admin review. Please wait for approval.",
        ...debugFields,
      });
    }

    console.warn("  ❌ BLOCKED — kycStatus =", kycStatus, "(profile incomplete)");
    return res.status(403).json({
      success: false,
      reason: "PROFILE_INCOMPLETE",
      message: "Complete your KYC profile before creating trips",
      ...debugFields,
    });
  }

  // ── All checks passed ──────────────────────────────────────────────────────
  if (!kycPassed && adminApproved) {
    console.log("  ✅ ALLOWED via adminApproved fallback (profileCompleted + status=approved)");
  } else {
    console.log("  ✅ ALLOWED — kycStatus:", kycStatus);
  }
  next();
};

export default checkAgentKYC;
