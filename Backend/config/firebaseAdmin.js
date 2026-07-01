import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId) {
  console.error("FIREBASE_PROJECT_ID missing");
}
if (!clientEmail) {
  console.error("FIREBASE_CLIENT_EMAIL missing");
}
if (!privateKey) {
  console.error("FIREBASE_PRIVATE_KEY missing");
}

console.log(`FIREBASE_PROJECT_ID: ${projectId ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`FIREBASE_CLIENT_EMAIL: ${clientEmail ? "✅ LOADED" : "❌ MISSING"}`);
console.log(`FIREBASE_PRIVATE_KEY: ${privateKey ? "✅ LOADED" : "❌ MISSING"}\n`);

if (
  projectId &&
  clientEmail &&
  privateKey &&
  !admin.apps.length
) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n")
      })
    });
    console.log("✅ Firebase Admin Initialized");
  } catch (err) {
    console.error("❌ Firebase Admin Initialization Failed:", err);
  }
}

export default admin;
