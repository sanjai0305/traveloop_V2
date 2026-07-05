export const checkAgentKYC = (req, res, next) => {
  // Check if agent exists on request
  const agent = req.agent;
  if (!agent) {
    return res.status(401).json({
      success: false,
      message: "Agent not authenticated",
    });
  }

  // Get status
  const kycStatus = agent.kycStatus || "PENDING";

  if (kycStatus !== "KYC_COMPLETED" && kycStatus !== "APPROVED") {
    return res.status(403).json({
      success: false,
      message: "Complete profile verification before creating trips",
      kycStatus,
    });
  }

  next();
};

export default checkAgentKYC;
