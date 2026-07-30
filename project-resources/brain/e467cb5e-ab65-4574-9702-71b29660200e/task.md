- [ ] Backend
  - [/] models/Agent.js — Add KYC fields (dob, mobile, mobileVerified, companyLogo, agentPhoto, kycStatus, OTP fields)
  - [x] middleware/kycMiddleware.js — checkAgentKYC() guard
  - [x] Backend Route updates: `status` query and seat checking in `tripRoutes.js`
- [x] Backend Socket events: Emit `trip_published` and `trip_updated` in `agentRoutes.js`
- [x] usePublishedTrips.js: Socket listeners for `trip_published`/`trip_updated` and 30s polling
- [x] Activities.jsx: Search logic matching all fields and dynamic filter chips
- [/] TripDetails.jsx: Render rich itinerary timeline, stay details, vehicle photos, and packing checklist
- [ ] Verify build and functionality

- [x] Frontend
  - [x] types/agent.ts — Add kycStatus, dob, mobile, mobileVerified, agentPhoto, companyLogo
  - [x] pages/CompleteProfile.tsx — 5-step KYC wizard
  - [x] App.tsx — Add /complete-profile route
  - [x] pages/Dashboard.tsx — Replace profileCompleted with kycStatus check
  - [x] pages/Trips.tsx — Lock Create Trip button

- [x] Git commit & push
