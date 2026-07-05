- [x] Backend
  - [x] models/Agent.js — Add KYC fields (dob, mobile, mobileVerified, companyLogo, agentPhoto, kycStatus, OTP fields)
  - [x] middleware/kycMiddleware.js — checkAgentKYC() guard
  - [x] middleware/agentAuthMiddleware.js — include new fields in select projection
  - [x] routes/agentRoutes.js — 8 KYC endpoints + trip creation guard

- [x] Frontend
  - [x] types/agent.ts — Add kycStatus, dob, mobile, mobileVerified, agentPhoto, companyLogo
  - [x] pages/CompleteProfile.tsx — 5-step KYC wizard
  - [x] App.tsx — Add /complete-profile route
  - [x] pages/Dashboard.tsx — Replace profileCompleted with kycStatus check
  - [x] pages/Trips.tsx — Lock Create Trip button

- [x] Git commit & push
