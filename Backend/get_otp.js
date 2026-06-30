import dotenv from "dotenv";
import { db, auth } from "./config/firebase.js";
import { doc, getDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

dotenv.config();

const testEmail = "agent_registration_flow_test@example.com";

async function getOtp() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  const otpDocRef = doc(db, "otps", testEmail);
  const otpSnap = await getDoc(otpDocRef);
  if (otpSnap.exists()) {
    const data = otpSnap.data();
    console.log("FOUND_OTP:" + (data.debugOtp || "NO_DEBUG_OTP_FIELD"));
  } else {
    console.log("FOUND_OTP:NOT_FOUND");
  }
}

getOtp().catch(err => {
  console.error(err);
  process.exit(1);
});
