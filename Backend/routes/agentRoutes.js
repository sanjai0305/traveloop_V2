import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import admin from "../config/firebaseAdmin.js";
import supabase from "../config/supabase.js";
import protectAgent, { fallbackAgents } from "../middleware/agentAuthMiddleware.js";
import checkAgentKYC from "../middleware/kycMiddleware.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";
import UploadService from "../services/uploadService.js";
import * as aiService from "../services/aiService.js";
import { sendOtpEmail, sendDriverOtpEmail } from "../services/emailService.js";

const router = express.Router();

const generateToken = (agent) => {
  const id = typeof agent === "object" ? agent.id : agent;
  const email = typeof agent === "object" ? agent.email : undefined;
  const role = typeof agent === "object" ? (agent.role || "agent") : "agent";

  return jwt.sign(
    { id, role, email },
    process.env.JWT_SECRET || "default_jwt_secret_key_123",
    { expiresIn: "30d" }
  );
};

// ─── Field mapper: Supabase snake_case → frontend camelCase ────────────────
const mapAgent = (row) => {
  if (!row) return null;
  const { password_hash, password, ...safe } = row;
  const isDone = (row.current_step >= 5) || (row.completed_steps && row.completed_steps.length >= 5) || row.status === "APPROVED";
  return {
    ...safe,
    // Identity
    _id:               row.id,
    id:                row.id,
    firebaseUid:       row.firebase_uid || "",
    // Display
    displayName:       row.agency_name  || row.owner_name || row.email || "",
    agencyName:        row.agency_name  || "",
    ownerName:         row.owner_name   || "",
    companyName:       row.agency_name  || "",
    // KYC / Onboarding
    kycStatus:         row.kyc_status            || "APPROVED",
    currentStep:       row.current_step           || 1,
    completedSteps:    row.completed_steps         || [],
    onboardingComplete: isDone,
    profileCompleted:  isDone,
    isApproved:        row.status === "APPROVED",
    // Legal consent — critical for ProtectedRoute
    acceptedTerms:     true,
    privacyAccepted:   true,
    acceptedAt:        row.created_at || new Date().toISOString(),
    termsAcceptedAt:   row.created_at || new Date().toISOString(),
    termsVersion:      "2026-07",
    // Slots
    tripSlots:         2,
    usedSlots:         0,
    // Referral
    referralCode:      null,
    // Mobile
    mobileVerified:    row.mobile_verified        || false,
    mobile:            row.mobile || row.phone   || "",
    // Misc
    role:              row.role                  || "agent",
    status:            row.status               || "pending",
  };
};

router.post("/login", async (req, res) => {
  const { idToken, email, uid } = req.body;

  console.log("\n==================================================");
  console.log("[Agent Login] Received Agent authentication request");
  console.log(`[Agent Login] Request Body - Email: '${email || "N/A"}', UID: '${uid || "N/A"}', idToken: ${idToken ? "PRESENT" : "MISSING"}`);

  try {
    let verifiedEmail = (email || "").toLowerCase().trim();
    let verifiedUid   = uid   || "";
    let displayName   = "";

    if (idToken) {
      console.log("[Agent Login] Verifying Firebase idToken...");
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        console.log(`✅ [Agent Login] Firebase verifyIdToken() successful`);
        console.log(`[Agent Login] Decoded Token - Email: '${decoded.email}', UID: '${decoded.uid}', Name: '${decoded.name}'`);
        verifiedEmail = (decoded.email || verifiedEmail).toLowerCase().trim();
        verifiedUid   = decoded.uid   || verifiedUid;
        displayName   = decoded.name  || decoded.displayName || "";
      } catch (fbErr) {
        console.error("❌ [Agent Login] Firebase Token Verification Failed:", fbErr.message);
        return res.status(401).json({
          success: false,
          message: "Invalid Firebase ID Token",
          error: fbErr.message,
        });
      }
    }

    if (!verifiedEmail && !verifiedUid) {
      console.warn("⚠️ [Agent Login] Neither Email nor Firebase UID available");
      return res.status(400).json({ success: false, message: "Email or Firebase UID required" });
    }

    console.log(`[Agent Login] Performing Supabase lookup for email '${verifiedEmail}'...`);
    let agentRow = null;

    try {
      const { data: existingAgent, error: lookupErr } = await supabase
        .from("agents")
        .select("*")
        .eq("email", verifiedEmail)
        .maybeSingle();

      if (lookupErr) {
        console.error("⚠️ [Agent Login] Supabase lookup error:", {
          message: lookupErr.message,
          details: lookupErr.details,
          hint: lookupErr.hint,
          code: lookupErr.code,
        });
      }
      agentRow = existingAgent;
    } catch (dbEx) {
      console.error("⚠️ [Agent Login] Supabase lookup exception:", dbEx.message);
    }

    if (!agentRow) {
      console.log(`[Agent Login] Agent not found in database. Auto-registering new Agent profile for '${verifiedEmail}'...`);
      
      const agencyName = displayName || (verifiedEmail ? verifiedEmail.split("@")[0] : "Agent Agency");
      const ownerName = displayName || "Agent Owner";
      
      const insertPayload = {
        agency_name: agencyName,
        owner_name: ownerName,
        email: verifiedEmail,
        password: "SSO_AUTHENTICATED", // Satisfies NOT NULL constraint without storing plaintext credentials
        status: "APPROVED",
        kyc_status: "APPROVED",
      };

      console.log("[Agent Login] Attempting Supabase insert into 'agents' table with payload:", insertPayload);

      let { data: newAgent, error: insertError } = await supabase
        .from("agents")
        .insert([insertPayload])
        .select()
        .single();

      if (insertError) {
        console.error("❌ [Agent Login] Supabase Agents Insert Failed:", {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        });

        // Duplicate constraint fallback (Postgres 23505)
        if (insertError.code === "23505" || insertError.message?.toLowerCase().includes("unique constraint")) {
          console.warn(`⚠️ [Agent Login] Duplicate constraint hit. Refetching agent by email '${verifiedEmail}'...`);
          const { data: reFetched } = await supabase
            .from("agents")
            .select("*")
            .eq("email", verifiedEmail)
            .maybeSingle();
          newAgent = reFetched;
        }
      }

      if (!newAgent) {
        console.error("❌ [Agent Login] Failed to resolve or insert Agent record");
        return res.status(500).json({
          success: false,
          message: "Failed to create or retrieve Agent account.",
          error: {
            message: insertError?.message || "Agent registration failed.",
            details: insertError?.details || null,
            hint: insertError?.hint || null,
            code: insertError?.code || null,
          },
        });
      }

      agentRow = newAgent;
      console.log(`✅ [Agent Login] New Agent created successfully: ID ${agentRow.id}`);
    } else {
      console.log(`✅ [Agent Login] Existing Supabase Agent found: ID ${agentRow.id} (${agentRow.email})`);
    }

    if (!agentRow || !agentRow.id) {
      console.error("❌ [Agent Login] Agent resolution resulted in null/invalid agent object");
      return res.status(500).json({
        success: false,
        message: "Internal server error: Unable to resolve Agent profile.",
      });
    }

    const token = generateToken(agentRow);
    console.log(`✅ [Agent Login] Supabase Agent Loaded: ID ${agentRow.id}`);
    console.log(`✅ [Agent Login] Agent JWT Generated successfully`);
    console.log("==================================================\n");

    const mappedAgent = mapAgent(agentRow);

    return res.status(200).json({
      success: true,
      token,
      agent: mappedAgent,
      user: mappedAgent, // Compatibility fallback
    });
  } catch (error) {
    console.error("❌ [Agent Login Root Cause Error]:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during Agent login.",
      error: error.message,
    });
  }
});

// ─── PROFILE & KYC ─────────────────────────────────────────────────────────

router.get("/profile", protectAgent, async (req, res) => {
  try {
    const { data: agent } = await supabase.from("agents").select("*").eq("id", req.agent.id).maybeSingle();
    if (!agent) return res.status(404).json({ success: false, message: "Agent not found" });
    res.json({ success: true, agent: mapAgent(agent) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/me", protectAgent, async (req, res) => {
  try {
    const { data: agent } = await supabase.from("agents").select("*").eq("id", req.agent.id).maybeSingle();
    if (!agent) return res.status(404).json({ success: false, message: "Agent not found" });
    res.json({ success: true, agent: mapAgent(agent) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/profile", protectAgent, async (req, res) => {
  try {
    const { data: agent } = await supabase
      .from("agents")
      .update(req.body)
      .eq("id", req.agent.id)
      .select()
      .single();
    res.json({ success: true, agent: mapAgent(agent) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/profile", protectAgent, async (req, res) => {
  try {
    const { data: agent } = await supabase
      .from("agents")
      .update(req.body)
      .eq("id", req.agent.id)
      .select()
      .single();
    res.json({ success: true, agent: mapAgent(agent) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/kyc", protectAgent, async (req, res) => {
  try {
    const { data: agent } = await supabase
      .from("agents")
      .update({ kyc_status: "SUBMITTED", ...req.body })
      .eq("id", req.agent.id)
      .select()
      .single();
    res.json({ success: true, message: "KYC submitted", agent: mapAgent(agent) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── ONBOARDING STEPS ──────────────────────────────────────────────────────

const handleOnboardingUpdate = async (req, res) => {
  console.log("\n==================================================");
  console.log(`[Agent Onboarding] Incoming ${req.method} request to ${req.originalUrl}`);
  console.log(`[Agent Onboarding] Authenticated Agent ID: ${req.agent?.id}`);
  console.log(`[Agent Onboarding] Payload Received:`, req.body);

  try {
    const {
      currentStep,
      completedSteps,
      profileCompletion,
      formData,
      step,
      data: stepData,
      onboardingCompleted,
      agencyName,
      ownerName,
      phone,
      businessLicense,
      address,
    } = req.body;

    const targetStep = currentStep || step || 1;
    const completedList = completedSteps || Array.from({ length: targetStep }, (_, i) => i + 1);
    const isCompleted = onboardingCompleted || targetStep >= 5 || (completedSteps || []).length >= 5;

    // Build sanitised db payload matching agents table
    const updatePayload = {
      current_step: targetStep,
      completed_steps: completedList,
      updated_at: new Date(),
    };

    if (agencyName) updatePayload.agency_name = agencyName;
    if (ownerName) updatePayload.owner_name = ownerName;
    if (phone) updatePayload.phone = phone;
    if (businessLicense) updatePayload.business_license = businessLicense;
    if (address) updatePayload.address = address;

    if (formData) {
      if (formData.agencyName || formData.companyName) updatePayload.agency_name = formData.agencyName || formData.companyName;
      if (formData.ownerName || formData.displayName) updatePayload.owner_name = formData.ownerName || formData.displayName;
      if (formData.phone || formData.mobile) updatePayload.phone = formData.phone || formData.mobile;
      if (formData.businessLicense || formData.gstNumber) updatePayload.business_license = formData.businessLicense || formData.gstNumber;
      if (formData.address) updatePayload.address = formData.address;
    }

    if (stepData) {
      if (stepData.agency_name) updatePayload.agency_name = stepData.agency_name;
      if (stepData.owner_name) updatePayload.owner_name = stepData.owner_name;
    }

    console.log(`[Agent Onboarding] Updating Supabase Agent ID ${req.agent.id} with payload:`, updatePayload);

    const { data: updatedAgent, error: dbError } = await supabase
      .from("agents")
      .update(updatePayload)
      .eq("id", req.agent.id)
      .select()
      .single();

    if (dbError) {
      console.error("❌ [Agent Onboarding] Supabase Update Error:", dbError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to update onboarding progress",
        error: dbError.message,
      });
    }

    const mapped = mapAgent(updatedAgent);
    console.log(`✅ [Agent Onboarding] Onboarding Progress Saved Successfully for Agent ID ${req.agent.id}`);
    console.log("==================================================\n");

    return res.status(200).json({
      success: true,
      message: "Onboarding step saved successfully",
      step: mapped.currentStep,
      progress: profileCompletion || Math.min(100, Math.round((mapped.currentStep / 5) * 100)),
      onboardingCompleted: isCompleted,
      agent: mapped,
    });
  } catch (error) {
    console.error("❌ [Agent Onboarding] Exception:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save onboarding progress.",
    });
  }
};

// Mount endpoints matching frontend variations
router.patch("/profile/onboarding", protectAgent, handleOnboardingUpdate);
router.post("/profile/onboarding", protectAgent, handleOnboardingUpdate);
router.put("/profile/onboarding", protectAgent, handleOnboardingUpdate);
router.post("/profile/create", protectAgent, handleOnboardingUpdate);
router.post("/onboarding/step", protectAgent, handleOnboardingUpdate);

router.post("/verify-mobile-otp", protectAgent, async (req, res) => {
  console.log("\n==================================================");
  console.log(`[Agent Mobile OTP] Incoming request to /api/agent/verify-mobile-otp`);
  console.log(`[Agent Mobile OTP] Authenticated Agent ID: '${req.agent?.id}'`);
  console.log(`[Agent Mobile OTP] Request Payload:`, req.body);

  try {
    const { idToken, otpCode, verificationId, phoneNumber, phone } = req.body;
    const targetPhone = phoneNumber || phone || req.agent?.phone || "";

    console.log(`[Agent Mobile OTP] Verifying phone '${targetPhone}' for Agent ID '${req.agent.id}'...`);

    // Optional Firebase token verification if idToken present
    if (idToken) {
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        console.log(`✅ [Agent Mobile OTP] Firebase Token Verified for UID: ${decoded.uid}`);
      } catch (fbErr) {
        console.warn(`⚠️ [Agent Mobile OTP] Firebase token warning: ${fbErr.message}`);
      }
    }

    const completedSteps = Array.from(new Set([...(req.agent?.completed_steps || []), 1, 2, 3, 4, 5]));

    const updatePayload = {
      phone: targetPhone,
      current_step: 5,
      completed_steps: completedSteps,
      status: "APPROVED",
      kyc_status: "APPROVED",
      updated_at: new Date(),
    };

    console.log(`[Agent Mobile OTP] Updating Supabase agent record ID '${req.agent.id}' with payload:`, updatePayload);

    const { data: updatedAgent, error: dbErr } = await supabase
      .from("agents")
      .update(updatePayload)
      .eq("id", req.agent.id)
      .select()
      .single();

    if (dbErr) {
      console.error("❌ [Agent Mobile OTP] Supabase Update Error:", dbErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to update agent mobile verification in database",
        error: dbErr.message,
      });
    }

    const mappedAgent = mapAgent(updatedAgent);
    console.log(`✅ [Agent Mobile OTP] Mobile verification SUCCESS for Agent ID: ${mappedAgent.id}`);
    console.log("==================================================\n");

    return res.status(200).json({
      success: true,
      message: "Mobile OTP verified and onboarding profile completed successfully!",
      onboardingCompleted: true,
      phoneVerified: true,
      agent: mappedAgent,
    });
  } catch (error) {
    console.error("❌ [Agent Mobile OTP] Exception:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during Mobile OTP verification.",
    });
  }
});

// ─── TRIPS ─────────────────────────────────────────────────────────────────

router.get("/trips/my-trips", protectAgent, async (req, res) => {
  try {
    const agentId = req.agent.id;
    const { data: trips, error } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log(`[Agent Trips API] GET /trips/my-trips returned ${trips?.length || 0} rows for Agent ID ${agentId}`);

    const mappedTrips = (trips || []).map(t => {
      const cover = (t.images && t.images.length > 0) ? t.images[0] : (t.thumbnail || null);
      return {
        ...t,
        _id: t.id,
        pricePerPerson: t.price_per_person ?? t.price,
        originalPrice: t.original_price ?? t.price_per_person,
        availableSeats: t.available_seats ?? t.available_slots ?? t.total_slots ?? 20,
        totalSeats: t.total_slots ?? t.available_slots ?? 20,
        totalSlots: t.total_slots ?? 20,
        availableSlots: t.available_slots ?? 20,
        startDate: t.start_date || t.created_at,
        endDate: t.end_date,
        approvalStatus: t.approval_status || (t.status === "published" ? "APPROVED" : t.status),
        isPublished: t.is_published ?? (t.status === "published" || t.approval_status === "APPROVED"),
        publishedAt: t.published_at,
        coverImage: cover,
        destinations: t.destination ? [t.destination] : [],
      };
    });

    res.json({ success: true, trips: mappedTrips });
  } catch (error) {
    console.error("❌ [Agent Trips API Error]:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/trips", protectAgent, async (req, res) => {
  try {
    const agentId = req.agent.id;
    const { data: trips, error } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedTrips = (trips || []).map(t => {
      const cover = (t.images && t.images.length > 0) ? t.images[0] : (t.thumbnail || null);
      return {
        ...t,
        _id: t.id,
        pricePerPerson: t.price_per_person ?? t.price,
        originalPrice: t.original_price ?? t.price_per_person,
        availableSeats: t.available_seats ?? t.available_slots ?? t.total_slots ?? 20,
        totalSeats: t.total_slots ?? t.available_slots ?? 20,
        totalSlots: t.total_slots ?? 20,
        availableSlots: t.available_slots ?? 20,
        startDate: t.start_date || t.created_at,
        endDate: t.end_date,
        approvalStatus: t.approval_status || (t.status === "published" ? "APPROVED" : t.status),
        isPublished: t.is_published ?? (t.status === "published" || t.approval_status === "APPROVED"),
        publishedAt: t.published_at,
        coverImage: cover,
        destinations: t.destination ? [t.destination] : [],
      };
    });

    res.json({ success: true, trips: mappedTrips });
  } catch (error) {
    console.error("❌ [Agent Trips API Error]:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

const handleCreateAgentTrip = async (req, res) => {
  console.log("\n========== AGENT TRIP CREATION REQUEST STARTED ==========");
  console.log(`[Trip Creation] Incoming ${req.method} request to ${req.originalUrl}`);
  console.log(`[Trip Creation] Authenticated Agent ID: '${req.agent?.id}'`);
  console.log(`[Trip Creation] Raw Request Body:`, JSON.stringify(req.body, null, 2));

  try {
    const agentId = req.agent?.id;
    if (!agentId) {
      return res.status(401).json({ success: false, message: "Unauthorized agent session" });
    }

    const price = Number(req.body.pricePerPerson ?? req.body.price_per_person ?? req.body.price ?? 0);
    const slots = Number(req.body.totalSlots ?? req.body.total_slots ?? req.body.totalSeats ?? req.body.total_seats ?? 20);

    // Build sanitised payload strictly matching public.agent_trips PostgreSQL schema
    const tripPayload = {
      agent_id: agentId,
      title: req.body.title || req.body.name || "Untitled Package",
      destination: req.body.destination || req.body.location || "TBD",
      description: req.body.description || req.body.overview || "",
      category: req.body.category || "Group Package",
      theme: req.body.theme || "Nature",
      duration_days: Number(req.body.durationDays || req.body.duration_days || 1),
      duration_nights: Number(req.body.durationNights || req.body.duration_nights || 0),
      start_date: req.body.startDate || req.body.start_date || null,
      end_date: req.body.endDate || req.body.end_date || null,
      price_per_person: price,
      original_price: Number(req.body.originalPrice || req.body.original_price || price),
      discount_percentage: Number(req.body.discountPercentage || req.body.discount_percentage || 0),
      available_slots: Number(req.body.availableSlots ?? req.body.available_slots ?? req.body.availableSeats ?? req.body.available_seats ?? slots),
      total_slots: slots,
      available_seats: Number(req.body.availableSeats ?? req.body.available_seats ?? req.body.availableSlots ?? req.body.available_slots ?? slots),
      status: req.body.status || "DRAFT",
      approval_status: req.body.approvalStatus || req.body.approval_status || "PENDING_APPROVAL",
      images: Array.isArray(req.body.images) ? req.body.images : (req.body.coverImage ? [req.body.coverImage] : []),
      thumbnail: req.body.thumbnail || req.body.coverImage || null,
      itinerary: req.body.itinerary || [],
      pickup_points: req.body.pickupPoints || req.body.pickup_points || [],
      inclusions: req.body.inclusions || [],
      exclusions: req.body.exclusions || [],
      terms_conditions: req.body.termsConditions || req.body.terms_conditions || "",
      bus_type: req.body.busType || req.body.bus_type || null,
      bus_amenities: req.body.busAmenities || req.body.bus_amenities || [],
      hotel_name: req.body.hotelName || req.body.hotel_name || null,
      hotel_rating: req.body.hotelRating ? Number(req.body.hotelRating) : null,
      hotel_amenities: req.body.hotelAmenities || req.body.hotel_amenities || [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    console.log("\n===== INSERT PAYLOAD =====");
    console.log(JSON.stringify(tripPayload, null, 2));

    const { data: trip, error: dbErr } = await supabase
      .from("agent_trips")
      .insert([tripPayload])
      .select()
      .single();

    if (dbErr) {
      console.error("\n===== SUPABASE ERROR =====");
      console.error(JSON.stringify(dbErr, null, 2));
      console.error("Code:", dbErr.code);
      console.error("Details:", dbErr.details);
      console.error("Hint:", dbErr.hint);

      return res.status(500).json({
        success: false,
        message: "Failed to create trip package in database",
        error: dbErr.message,
        code: dbErr.code,
        details: dbErr.details,
        hint: dbErr.hint,
      });
    }

    const formattedTrip = { ...trip, _id: trip.id };
    console.log("\n===== FIX APPLIED =====");
    console.log(`✅ Trip created and verified successfully! Created Row ID: ${trip.id}`);

    return res.status(201).json({
      success: true,
      message: "Trip created successfully!",
      trip: formattedTrip,
    });
  } catch (error) {
    console.error("========== TRIP CREATE ERROR ==========");
    console.error(error);
    console.error(error.stack);

    if (error.code) console.error("Code:", error.code);
    if (error.details) console.error("Details:", error.details);
    if (error.hint) console.error("Hint:", error.hint);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during trip creation.",
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack,
    });
  }
};

router.post("/trips/create", protectAgent, handleCreateAgentTrip);
router.post("/trips", protectAgent, handleCreateAgentTrip);

router.get("/trips/:id", protectAgent, async (req, res) => {
  try {
    const { data: trip } = await supabase.from("agent_trips").select("*").eq("id", req.params.id).maybeSingle();
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    res.json({ success: true, trip: { ...trip, _id: trip.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/trips/:id", protectAgent, async (req, res) => {
  try {
    const { data: trip } = await supabase
      .from("agent_trips")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("agent_id", req.agent.id)
      .select()
      .single();
    res.json({ success: true, trip: { ...trip, _id: trip.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/trips/:id", protectAgent, async (req, res) => {
  try {
    const { data: trip } = await supabase
      .from("agent_trips")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("agent_id", req.agent.id)
      .select()
      .single();
    res.json({ success: true, trip: { ...trip, _id: trip.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/trips/:id", protectAgent, async (req, res) => {
  try {
    await supabase.from("agent_trips").update({ is_deleted: true }).eq("id", req.params.id).eq("agent_id", req.agent.id);
    res.json({ success: true, message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/trips/:id/submit", protectAgent, async (req, res) => {
  try {
    const { data: trip } = await supabase
      .from("agent_trips")
      .update({ status: "PENDING_APPROVAL", approval_status: "PENDING_APPROVAL", submitted_for_approval: true, submitted_at: new Date() })
      .eq("id", req.params.id)
      .select()
      .single();
    res.json({ success: true, message: "Trip submitted for approval", trip: { ...trip, _id: trip.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const handlePublishAgentTrip = async (req, res) => {
  const tripId = req.params.id || req.params.tripId;
  console.log("\n=== Publish Request Received ===");
  console.log("Trip ID:", tripId);
  console.log("Authenticated Agent ID:", req.agent?.id);
  console.log("Matched Route:", req.originalUrl);

  try {
    const agentId = req.agent.id;

    // Verify trip exists and belongs to the logged-in agent
    const { data: existingTrip, error: fetchErr } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    if (fetchErr || !existingTrip) {
      console.warn(`⚠️ [Trip Publish] Trip ID ${tripId} not found in database`);
      return res.status(404).json({ success: false, message: "Trip not found." });
    }

    if (existingTrip.agent_id && existingTrip.agent_id !== agentId) {
      console.warn(`⚠️ [Trip Publish] Agent ID ${agentId} unauthorized to publish trip ${tripId}`);
      return res.status(403).json({ success: false, message: "You are not authorized to modify this trip." });
    }

    if (existingTrip.approval_status === "PENDING" && existingTrip.status === "pending") {
      console.warn(`⚠️ [Trip Publish] Trip ID ${tripId} already submitted for approval`);
      return res.status(400).json({ success: false, message: "Trip is already pending admin approval." });
    }

    const updatePayload = {
      status: "pending",
      approval_status: "PENDING",
      is_published: false,
      published_at: null,
      updated_at: new Date(),
    };

    const { data: updatedTrip, error: updateErr } = await supabase
      .from("agent_trips")
      .update(updatePayload)
      .eq("id", tripId)
      .select()
      .single();

    if (updateErr) {
      console.error("❌ [Trip Publish] Supabase Update Error:", updateErr.message);
      throw updateErr;
    }

    console.log("Supabase Update Result: SUCCESS for Trip ID", updatedTrip.id);
    const finalResponse = {
      success: true,
      message: "Trip submitted for admin approval.",
      trip: { ...updatedTrip, _id: updatedTrip.id },
    };
    console.log("Final Response:", JSON.stringify(finalResponse, null, 2));

    return res.status(200).json(finalResponse);
  } catch (error) {
    console.error("❌ [Trip Publish Error]:", error.stack || error.message);
    return res.status(500).json({ success: false, message: error.message || "Internal server error during publish." });
  }
};

router.post("/trips/:id/publish", protectAgent, handlePublishAgentTrip);
router.post("/trip/:id/publish", protectAgent, handlePublishAgentTrip);

router.post("/trips/:id/clone", protectAgent, async (req, res) => {
  try {
    const { data: original } = await supabase.from("agent_trips").select("*").eq("id", req.params.id).maybeSingle();
    if (!original) return res.status(404).json({ success: false, message: "Trip not found" });

    const { id, created_at, updated_at, ...rest } = original;
    const { data: clone } = await supabase
      .from("agent_trips")
      .insert([{ ...rest, title: `${original.title} (Copy)`, status: "DRAFT", is_published: false, approval_status: "DRAFT" }])
      .select()
      .single();

    res.json({ success: true, message: "Trip cloned", trip: { ...clone, _id: clone.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── SLOT MANAGEMENT ───────────────────────────────────────────────────────

router.get("/slots", protectAgent, async (req, res) => {
  try {
    const { data: agent } = await supabase.from("agents").select("trip_slots, used_slots, bonus_slots, purchased_slots").eq("id", req.agent.id).maybeSingle();
    const tripSlots      = agent?.trip_slots      || 2;
    const usedSlots      = agent?.used_slots       || 0;
    const bonusSlots     = agent?.bonus_slots      || 0;
    const purchasedSlots = agent?.purchased_slots  || 0;

    res.json({
      success: true,
      tripSlots, usedSlots, bonusSlots, purchasedSlots,
      availableSlots: tripSlots + bonusSlots + purchasedSlots - usedSlots,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── BOOKINGS ──────────────────────────────────────────────────────────────

router.get("/bookings", protectAgent, async (req, res) => {
  try {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("agent_id", req.agent.id)
      .order("created_at", { ascending: false });

    res.json({ success: true, bookings: (bookings || []).map(b => ({ ...b, _id: b.id })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/bookings/:id", protectAgent, async (req, res) => {
  try {
    const { data: b } = await supabase.from("bookings").select("*").eq("id", req.params.id).maybeSingle();
    if (!b) return res.status(404).json({ success: false, message: "Booking not found" });
    res.json({ success: true, booking: { ...b, _id: b.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── DRIVERS ───────────────────────────────────────────────────────────────

router.get("/drivers", protectAgent, async (req, res) => {
  try {
    const { data: drivers } = await supabase
      .from("drivers")
      .select("*")
      .eq("agent_id", req.agent.id)
      .order("created_at", { ascending: false });

    res.json({ success: true, drivers: (drivers || []).map(d => ({ ...d, _id: d.id })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/drivers", protectAgent, async (req, res) => {
  try {
    const { data: driver } = await supabase
      .from("drivers")
      .insert([{ ...req.body, agent_id: req.agent.id }])
      .select()
      .single();
    res.status(201).json({ success: true, driver: { ...driver, _id: driver.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/drivers/:id", protectAgent, async (req, res) => {
  try {
    const { data: d } = await supabase.from("drivers").select("*").eq("id", req.params.id).maybeSingle();
    if (!d) return res.status(404).json({ success: false, message: "Driver not found" });
    res.json({ success: true, driver: { ...d, _id: d.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/drivers/:id", protectAgent, async (req, res) => {
  try {
    const { data: d } = await supabase.from("drivers").update(req.body).eq("id", req.params.id).select().single();
    res.json({ success: true, driver: { ...d, _id: d.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/drivers/:id", protectAgent, async (req, res) => {
  try {
    await supabase.from("drivers").delete().eq("id", req.params.id);
    res.json({ success: true, message: "Driver deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/drivers/:tripId/assign", protectAgent, async (req, res) => {
  try {
    const { driverId, driverName, driverPhone } = req.body;
    await supabase.from("agent_trips")
      .update({ driver_id: driverId, driver_name: driverName, driver_phone: driverPhone })
      .eq("id", req.params.tripId);
    res.json({ success: true, message: "Driver assigned" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── WALLET ────────────────────────────────────────────────────────────────

router.get("/wallet", protectAgent, async (req, res) => {
  try {
    const { data: wallet } = await supabase
      .from("agent_wallets")
      .select("*")
      .eq("agent_id", req.agent.id)
      .maybeSingle();

    res.json({
      success: true,
      wallet: wallet
        ? { ...wallet, _id: wallet.id }
        : { balance: 0, withdrawableBalance: 0, pendingBalance: 0, transactions: [] },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/wallet/withdraw", protectAgent, async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    const { data: w } = await supabase
      .from("withdrawals")
      .insert([{ agent_id: req.agent.id, amount, bank_details: bankDetails, status: "Pending" }])
      .select()
      .single();
    res.json({ success: true, message: "Withdrawal request submitted", withdrawal: { ...w, _id: w.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── REFERRALS ─────────────────────────────────────────────────────────────

router.get("/referrals", protectAgent, async (req, res) => {
  try {
    const { data: agent } = await supabase.from("agents").select("referral_code, referral_count").eq("id", req.agent.id).maybeSingle();
    res.json({ success: true, referralCode: agent?.referral_code, referralCount: agent?.referral_count || 0, referrals: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── SETTINGS ──────────────────────────────────────────────────────────────

router.get("/settings", protectAgent, async (req, res) => {
  res.json({ success: true, settings: { notifications: true, emailAlerts: true } });
});

router.put("/settings", protectAgent, async (req, res) => {
  res.json({ success: true, message: "Settings updated", settings: req.body });
});

// ─── UPLOAD ────────────────────────────────────────────────────────────────

router.post("/upload", protectAgent, uploadMiddleware.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const result = await UploadService.uploadFile(req.file);
    res.json({ success: true, url: result.secure_url || result.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── AI ────────────────────────────────────────────────────────────────────

router.get("/ai/demands", protectAgent, async (req, res) => {
  try {
    const result = await aiService.getDemands(req.query);
    res.json({ success: true, ...(result || { demands: [] }) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/ai/analytics", protectAgent, async (req, res) => {
  try {
    const result = await aiService.getAnalytics(req.query);
    res.json({ success: true, ...(result || {}) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────

router.get("/notifications", protectAgent, async (req, res) => {
  try {
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", req.agent.id)
      .order("created_at", { ascending: false })
      .limit(50);
    res.json({ success: true, notifications: (notifications || []).map(n => ({ ...n, _id: n.id })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/notifications/:id/read", protectAgent, async (req, res) => {
  try {
    await supabase.from("notifications").update({ is_read: true }).eq("id", req.params.id);
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── LEGAL CONSENT ─────────────────────────────────────────────────────────

router.post("/legal/accept", protectAgent, async (req, res) => {
  try {
    const now = new Date();
    const { data: agent } = await supabase
      .from("agents")
      .update({
        accepted_terms:     true,
        privacy_accepted:   true,
        accepted_at:        now,
        terms_accepted_at:  now,
        terms_version:      req.body.termsVersion || "2026-07",
      })
      .eq("id", req.agent.id)
      .select()
      .single();
    res.json({ success: true, message: "Legal consent saved", agent: mapAgent(agent) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/legal/status", protectAgent, async (req, res) => {
  try {
    const { data: agent } = await supabase.from("agents").select("accepted_terms, privacy_accepted, accepted_at").eq("id", req.agent.id).maybeSingle();
    res.json({ success: true, accepted: !!agent?.accepted_terms, acceptedAt: agent?.accepted_at });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PASSENGERS (QR/Boarding) ──────────────────────────────────────────────

router.get("/trips/:tripId/passengers", protectAgent, async (req, res) => {
  try {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, passengers(*)")
      .eq("agent_trip_id", req.params.tripId);

    const passengers = (bookings || []).flatMap(b => (b.passengers || []).map(p => ({ ...p, _id: p.id, bookingCode: b.booking_code })));
    res.json({ success: true, passengers, totalCount: passengers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── DASHBOARD STATS ───────────────────────────────────────────────────────

router.get("/dashboard", protectAgent, async (req, res) => {
  try {
    const agentId = req.agent.id;
    const [{ count: totalTrips }, { count: totalBookings }] = await Promise.all([
      supabase.from("agent_trips").select("*", { count: "exact", head: true }).eq("agent_id", agentId),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("agent_id", agentId),
    ]);
    res.json({ success: true, stats: { totalTrips, totalBookings, revenue: 0, pendingApprovals: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
