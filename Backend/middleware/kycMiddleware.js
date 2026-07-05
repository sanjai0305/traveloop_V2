export const checkAgentKYC = (req, res, next) => {
  const agent = req.agent;

  // ── Guard: agent must be on request (set by protectAgent) ─────────────────
  if (!agent) {
    return res.status(401).json({
      success: false,
      reason: "NOT_AUTHENTICATED",
      message: "Agent not authenticated",
    });
  }

  // ── Diagnostic logs ────────────────────────────────────────────────────────
  console.log("\n[KYC Middleware] Verifying agent permissions for:", req.method, req.originalUrl);
  console.log("  Agent ID      :", agent._id);
  console.log("  Email         :", agent.email);
  console.log("  KYC Status    :", agent.kycStatus);
  console.log("  Email Verified:", agent.emailVerified);
  console.log("  Mobile Verified:", agent.mobileVerified);
  console.log("  Approved      :", agent.isApproved ?? agent.status);

  const kycStatus     = agent.kycStatus    || "PENDING";
  const emailVerified = agent.emailVerified === true;
  const mobileVerified = agent.mobileVerified === true;
  const kycPassed     = kycStatus === "KYC_COMPLETED" || kycStatus === "APPROVED";

  // ── Check 1: Email not verified ────────────────────────────────────────────
  if (!emailVerified) {
    console.warn("  [KYC Middleware] ❌ REJECTED — emailVerified is false");
    return res.status(403).json({
      success: false,
      reason: "EMAIL_NOT_VERIFIED",
      message: "Verify your email address before creating trips",
      kycStatus,
    });
  }

  // ── Check 2: Mobile not verified ───────────────────────────────────────────
  if (!mobileVerified) {
    console.warn("  [KYC Middleware] ❌ REJECTED — mobileVerified is false");
    return res.status(403).json({
      success: false,
      reason: "MOBILE_NOT_VERIFIED",
      message: "Verify your mobile number before creating trips",
      kycStatus,
    });
  }

  // ── Check 3: KYC status not completed ─────────────────────────────────────
  if (!kycPassed) {
    // Distinguish between "never submitted" vs "submitted but not yet approved"
    const isAdminPendingApproval = kycStatus === "MOBILE_VERIFIED" || kycStatus === "EMAIL_VERIFIED";

    if (isAdminPendingApproval) {
      console.warn("  [KYC Middleware] ❌ REJECTED — kycStatus is", kycStatus, "(awaiting admin approval)");
      return res.status(403).json({
        success: false,
        reason: "ADMIN_APPROVAL_REQUIRED",
        message: "Your profile is under review. Waiting for admin approval.",
        kycStatus,
      });
    }

    console.warn("  [KYC Middleware] ❌ REJECTED — kycStatus is PENDING (profile incomplete)");
    return res.status(403).json({
      success: false,
      reason: "KYC_NOT_COMPLETED",
      message: "Complete profile verification before creating trips",
      kycStatus,
    });
  }

  // ── All checks passed ──────────────────────────────────────────────────────
  console.log("  [KYC Middleware] ✅ ALLOWED — agent is verified and KYC_COMPLETED");
  next();
};

export default checkAgentKYC;

