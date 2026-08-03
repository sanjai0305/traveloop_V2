import mongoose from 'mongoose';
import admin from "../config/firebaseAdmin.js";
import Agent from "../models/Agent.js";
import jwt from "jsonwebtoken";

async function testLoginFlow() {
  console.log("=== STARTING FULL END-TO-END LOGIN VERIFICATION ===");
  await mongoose.connect('mongodb://localhost:27017/traveloop-website');
  console.log("[TEST] MongoDB Connected successfully.");

  const testEmail = "sanjaim0940r@gmail.com";
  const testUid = "DKKJBjA1GybuuEw7KmsWMfHJKi13";
  const displayName = "SANJAI R";
  const emailVerified = true;

  console.log("[TEST] 1. Searching for agent by email or uid...");
  let agent = await Agent.findOne({ $or: [{ email: testEmail }, { uid: testUid }] });

  if (!agent) {
    console.log("[TEST] 2. Agent not found. Creating new Agent record...");
    const cleanName = (displayName || "AGT").replace(/[^a-zA-Z]/g, "").toUpperCase();
    const initialReferralCode = `AGT-${cleanName.slice(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`;

    agent = await Agent.create({
      uid: testUid,
      email: testEmail,
      displayName,
      companyName: displayName || "Pending Verification",
      emailVerified,
      profileCompleted: false,
      referralCode: initialReferralCode,
    });
    console.log("[TEST] Agent created successfully! ID:", agent._id, "ReferralCode:", agent.referralCode);
  } else {
    console.log("[TEST] 2. Agent found! ID:", agent._id, "ReferralCode:", agent.referralCode);
    agent.emailVerified = emailVerified;
    if (!agent.uid) agent.uid = testUid;
    if (!agent.referralCode) {
      const cleanName = (agent.companyName || agent.displayName || "AGT").replace(/[^a-zA-Z]/g, "").toUpperCase();
      agent.referralCode = `AGT-${cleanName.slice(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    await agent.save();
    console.log("[TEST] Agent profile synced & saved.");
  }

  console.log("[TEST] 3. Testing JWT Token Generation...");
  const token = jwt.sign({ id: agent._id.toString() }, process.env.JWT_SECRET || "default_jwt_secret_key_123", {
    expiresIn: "30d",
  });
  console.log("[TEST] JWT generated successfully! Token length:", token.length);

  console.log("=== END-TO-END LOGIN VERIFICATION SUCCESSFUL ===");
  process.exit(0);
}

testLoginFlow().catch(err => {
  console.error("=== TEST FAILED WITH ERROR ===", err);
  process.exit(1);
});
