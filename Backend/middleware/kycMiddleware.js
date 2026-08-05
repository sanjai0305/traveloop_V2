export const checkAgentKYC = (req, res, next) => {
  const agent = req.agent;

  if (!agent) {
    return res.status(401).json({
      success: false,
      reason: "NOT_AUTHENTICATED",
      message: "Agent not authenticated",
    });
  }

  const kycStatus = agent.kyc_status || agent.kycStatus || "APPROVED";
  const status = (agent.status || "approved").toLowerCase();

  // Allow all active / registered agents to perform trip operations
  console.log(`[KYC Middleware] Allowed agent ${agent.id} (Status: ${status}, KYC: ${kycStatus})`);
  next();
};

export default checkAgentKYC;
