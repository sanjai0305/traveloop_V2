import mongoose from "mongoose";
import dotenv from "dotenv";
import { db, auth } from "./config/firebase.js";
import { doc, deleteDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

dotenv.config();

const testEmail = "agent_registration_flow_test@example.com";

async function cleanup() {
  console.log("Cleaning up user:", testEmail);
  
  // 1. Connect MongoDB
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("❌ Please define the MONGO_URI environment variable.");
  }
  await mongoose.connect(mongoUri);
  
  // 2. Delete from MongoDB
  const res = await mongoose.connection.db.collection("users").deleteOne({ email: testEmail });
  console.log("Deleted from MongoDB:", res.deletedCount);
  
  // 3. Delete OTP from Firestore
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    const otpDocRef = doc(db, "otps", testEmail);
    await deleteDoc(otpDocRef);
    console.log("Deleted OTP from Firestore");
  } catch (err) {
    console.log("Firestore OTP deletion ignored/failed:", err.message);
  }
  
  await mongoose.connection.close();
  console.log("Cleanup complete!");
}

cleanup().catch(err => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
