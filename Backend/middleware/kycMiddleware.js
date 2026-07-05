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
  console.log("  Agent ID       :", agent._id);
  console.log("  Email          :", agent.email);
  console.log("  KYC Status     :", agent.kycStatus);
  console.log("  Email Verified :", agent.emailVerified);
  console.log("  Mobile Verified:", agent.mobileVerified);
  console.log("  isApproved     :", agent.isApproved);
  console.log("  profileCompleted:", agent.profileCompleted);
  console.log("  status         :", agent.status);

  const kycStatus       = agent.kycStatus || "PENDING";
  const emailVerified   = agent.emailVerified === true;
  const mobileVerified  = agent.mobileVerified === true;
  const kycPassed       = kycStatus === "KYC_COMPLETED" || kycStatus === "APPROVED";

  // ── Permissive fallback: allow agents approved by admin or seeder ──────────
  // These agents have profileCompleted=true and status=approved but may still
  // have a stale kycStatus="PENDING" in legacy data.
  const adminApproved   = agent.profileCompleted === true && agent.status === "approved";

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

  // ── Check 2: KYC status gate (with profileCompleted fallback) ─────────────
  if (!kycPassed && !adminApproved) {
    // Distinguish "submitted but awaiting admin" vs "never completed"
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
  if (adminApproved && !kycPassed) {
    console.log("  [KYC Middleware] ✅ ALLOWED via adminApproved fallback (profileCompleted + status=approved)");
  } else {
    console.log("  [KYC Middleware] ✅ ALLOWED — agent KYC status:", kycStatus);
  }
  next();
};

export default checkAgentKYC;
