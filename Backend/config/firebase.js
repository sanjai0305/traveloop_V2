import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY && !process.env.FIREBASE_API_KEY.includes("FakeKey") 
    ? process.env.FIREBASE_API_KEY 
    : "AIzaSyBEHvDMDVGXejyqg_rLROm9CW6va73802Y",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "traveloop-version-2-83bd2.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "traveloop-version-2-83bd2",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "740933888609",
  appId: process.env.FIREBASE_APP_ID || "1:740933888609:web:4cfdd9521d5af064205820",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-RW489M96SW",
};

console.log("[Firebase Config] Initializing with project ID:", firebaseConfig.projectId, "API Key:", firebaseConfig.apiKey);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
