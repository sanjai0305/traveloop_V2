import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBEHvDMDVGXejyqg_rLROm9CW6va73802Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "traveloop-version-2-83bd2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "traveloop-version-2-83bd2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "traveloop-version-2-83bd2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "740933888609",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:740933888609:web:4cfdd9521d5af064205820",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RW489M96SW",
};

// Safe debug log for loaded configuration
if (typeof window !== "undefined") {
  console.log("[Agent Portal Firebase] Initialized with Project ID:", firebaseConfig.projectId, "| API Key Present:", Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY"));
}

// Ensure single Firebase app instance
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Firestore (with multi-tab persistence fallback)
let firestore;
try {
  firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  try {
    firestore = getFirestore(app);
  } catch (err) {
    console.warn("Firestore initialization fallback:", err);
  }
}
const db = firestore;

// Initialize Storage
const storage = getStorage(app);

// Initialize Realtime Database
let rtdb;
try {
  rtdb = getDatabase(app);
} catch (e) {
  console.warn("Realtime Database optional init check:", e);
}

// Initialize Analytics (Browser-only check)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}

export {
  app,
  auth,
  firestore,
  db,
  storage,
  rtdb,
  analytics,
  GoogleAuthProvider,
  EmailAuthProvider,
};

export default app;
