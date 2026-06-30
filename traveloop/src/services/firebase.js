import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore
} from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_FIREBASE_APP_ID",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "YOUR_FIREBASE_MEASUREMENT_ID",
};

// Initialize Firebase App with safety fallback
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.warn("Firebase App initialization failed, attempting fallback getApp():", e);
  try {
    const { getApp } = await import("firebase/app");
    app = getApp();
  } catch (err2) {
    console.error("Critical: Firebase App failed to initialize:", err2);
  }
}

// Initialize Firestore with fallback for offline cache conflicts & single-tab webview environments (like Capacitor)
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (error) {
  console.warn("Firestore multi-tab persistent cache failed. Retrying with basic persistent cache...", error);
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({}),
    });
  } catch (error2) {
    console.warn("Firestore persistent cache failed. Retrying with default settings...", error2);
    try {
      db = initializeFirestore(app, {});
    } catch (error3) {
      console.warn("Firestore initializeFirestore failed. Falling back to getFirestore().", error3);
      db = getFirestore(app);
    }
  }
}

// Initialize Realtime Database, Storage, and Auth with safety try-catch
let rtdb;
try {
  rtdb = getDatabase(app);
} catch (e) {
  console.error("Failed to initialize Realtime Database:", e);
}

let storage;
try {
  storage = getStorage(app);
} catch (e) {
  console.error("Failed to initialize Storage:", e);
}

let auth;
try {
  auth = getAuth(app);
} catch (e) {
  console.error("Failed to initialize Auth:", e);
}

export { app, db, rtdb, storage, auth, GoogleAuthProvider, EmailAuthProvider };
