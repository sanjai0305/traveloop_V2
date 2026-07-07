import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth as firebaseAuth } from "../config/firebase.js";
import { signInAnonymously } from "firebase/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Admin from "../models/Admin.js";

async function testAdminAuth() {
  console.log("Starting Admin Authentication Audit and Verification...");

  // Connect to DB
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/traveloop");
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection failed:", err.message);
    process.exit(1);
  }

  const testEmail = "sanjaim0940r@gmail.com";
  const testPassword = "Sanjai@2006";

  try {
    // 1. Delete any existing admin for testEmail to ensure seeding works
    await Admin.deleteOne({ email: testEmail });
    console.log("✅ Cleared any existing test admin user to test seeding.");

    // 2. Perform seeding / login simulation
    let adminUser = await Admin.findOne({ email: testEmail });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(testPassword, salt);
      adminUser = await Admin.create({
        name: "Traveloop Super Admin",
        email: testEmail,
        passwordHash,
        role: "Super Admin",
        twoFactorEnabled: true,
      });
      console.log("✅ Seeded test admin user in DB.");
    }

    // 3. Verify match password works
    const isMatch = await adminUser.matchPassword(testPassword);
    console.log("✅ Password match verification:", isMatch ? "SUCCESS" : "FAILED");
    if (!isMatch) throw new Error("Seeded password does not match!");

    // 4. Test OTP Generation and Firestore persistence
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated test OTP:", otpCode);

    if (!firebaseAuth.currentUser) {
      await signInAnonymously(firebaseAuth);
    }
    console.log("✅ Authenticated anonymously with Firebase");

    const otpDocRef = doc(db, "otps", testEmail);
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 mins
    
    await setDoc(otpDocRef, {
      otp: hashedOtp,
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
      createdAt: now.toISOString(),
      debugOtp: otpCode,
    });
    console.log("✅ Saved OTP to Firestore");

    // 5. Test retrieving and comparing OTP
    const otpSnap = await getDoc(otpDocRef);
    if (!otpSnap.exists()) {
      throw new Error("Stored OTP document not found in Firestore!");
    }
    const data = otpSnap.data();
    console.log("Retrieved OTP data from Firestore. debugOtp matches:", data.debugOtp === otpCode ? "YES" : "NO");

    const otpVerified = await bcrypt.compare(otpCode, data.otp);
    console.log("✅ OTP verified against stored hash:", otpVerified ? "YES" : "NO");
    if (!otpVerified) throw new Error("Stored OTP hash does not match generated code!");

    // Clean up
    await deleteDoc(otpDocRef);
    console.log("✅ Cleared OTP from Firestore");

  } catch (error) {
    console.error("❌ Authentication Verification failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

testAdminAuth();
