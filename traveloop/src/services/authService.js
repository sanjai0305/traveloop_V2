import { auth, GoogleAuthProvider } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { createUserProfile, updateLastLogin } from "./firestoreService";
import { getApiUrl } from "../utils/api";

/**
 * Helper to make API requests to the backend.
 */
const apiRequest = async (endpoint, method, body) => {
  const headers = {
    "Content-Type": "application/json",
  };
  const response = await fetch(getApiUrl(endpoint), {
    method,
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
};

/**
 * Sends OTP verification code.
 */
export const sendOtpCode = async (formData) => {
  return await apiRequest("/auth/send-otp", "POST", formData);
};

/**
 * Verifies OTP code.
 */
export const verifyOtpCode = async (email, otp, registrationDetails) => {
  return await apiRequest("/auth/verify-otp", "POST", { email, otp, registrationDetails });
};

/**
 * Registers a user in Firebase Auth, then Backend, then Firestore.
 */
export const registerWithEmailPassword = async (formData, otpToken) => {
  const { email, password, firstName, lastName, phone, city, country, acceptedTerms, termsVersion } = formData;

  // 1. Create User in Firebase Auth
  console.log(`[Email Auth] Starting Registration for ${email}`);
  let firebaseUser;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    firebaseUser = userCredential.user;
    console.log(`[Email Auth] Firebase user created. Firebase UID: ${firebaseUser.uid}`);
  } catch (error) {
    console.error("[Internal Auth Error] Firebase registration failed:", error);
    if (error && (error.code === "auth/operation-not-allowed" || (error.message && error.message.includes("auth/operation-not-allowed")))) {
      throw new Error("Email registration is currently unavailable. Please try again later.");
    }
    throw new Error(error.message || "Failed to create Firebase Auth account");
  }

  // 2. Create User in Backend (passing firebaseUid and otpToken)
  console.log(`[Email Auth] Syncing with Backend...`);
  let backendData;
  try {
    backendData = await apiRequest("/auth/register", "POST", {
      firstName,
      lastName,
      email,
      phone,
      city,
      country,
      password,
      acceptedTerms,
      termsVersion,
      firebaseUid: firebaseUser.uid,
      otpToken,
    });
    console.log(`[Email Auth] Backend registration successful. User ID: ${backendData.user._id}`);
  } catch (error) {
    // Clean up Firebase Auth user if backend creation fails to keep state in sync
    try {
      await firebaseUser.delete();
    } catch (deleteError) {
      console.error("Failed to delete Firebase user after backend failure:", deleteError);
    }
    throw error;
  }

  // 3. Create Profile in Firestore
  try {
    await createUserProfile(firebaseUser.uid, {
      firstName,
      lastName,
      email,
      phone,
      city,
      country,
      authProvider: "email",
      acceptedTerms,
      termsVersion,
    });
  } catch (error) {
    console.error("Firestore profile creation failed, proceeding...", error);
  }

  return backendData;
};

/**
 * Logs in user via Firebase Auth, then Backend, and updates Firestore.
 */
export const loginWithEmailPassword = async (email, password) => {
  // 1. Sign in via Firebase Auth
  console.log(`[Email Auth] Starting login for ${email}`);
  let firebaseUser;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    firebaseUser = userCredential.user;
    console.log(`[Email Auth] Firebase authenticated. Firebase UID: ${firebaseUser.uid}`);
  } catch (error) {
    console.error("Firebase Auth sign in failed:", error);
    throw new Error(error.message || "Failed to sign in via Firebase Auth");
  }

  // 2. Sign in via Backend
  console.log(`[Email Auth] Syncing with Backend...`);
  const backendData = await apiRequest("/auth/login", "POST", {
    email,
    password,
    firebaseUid: firebaseUser.uid,
  });
  console.log(`[Email Auth] Backend authenticated. User ID: ${backendData.user._id}`);

  // 3. Update lastLogin in Firestore
  try {
    await updateLastLogin(firebaseUser.uid);
  } catch (error) {
    console.error("Firestore lastLogin update failed:", error);
  }

  return backendData;
};

/**
 * Handles Google Login: exchanges GSI idToken with backend, signs into Firebase Auth, and syncs to Firestore.
 */
export const loginWithGoogle = async (idToken) => {
  // 1. Authenticate with Backend using Google ID Token
  console.log(`[Google Auth] Starting Google Login... Sending idToken to Backend`);
  const backendData = await apiRequest("/auth/google", "POST", { idToken });
  console.log(`[Google Auth] Backend authenticated. User ID: ${backendData.user._id}`);

  // 2. Authenticate with Firebase Auth using Google Credential
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const firebaseUser = result.user;
    console.log(`[Google Auth] Firebase authenticated. Firebase UID: ${firebaseUser.uid}`);

    // 3. Create or update Firestore profile
    await createUserProfile(firebaseUser.uid, {
      firstName: backendData.user.firstName,
      lastName: backendData.user.lastName,
      email: backendData.user.email,
      phone: backendData.user.phone,
      city: backendData.user.city,
      country: backendData.user.country,
      avatar: backendData.user.avatar,
      authProvider: "google",
      acceptedTerms: backendData.user.acceptedTerms,
      termsVersion: backendData.user.termsVersion,
    });
  } catch (error) {
    console.error("Firebase Google Auth or Firestore sync failed:", error);
  }

  return backendData;
};

/**
 * Sends a password reset email using Firebase Auth.
 */
export const sendPasswordReset = async (email) => {
  // First, check if email exists in our DB to avoid showing success for non-existent users
  await apiRequest("/auth/forgot-password", "POST", { email });
  
  // If email exists, proceed to send via Firebase Auth
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Firebase sendPasswordResetEmail failed:", error);
    throw new Error(error.message || "Failed to send reset email");
  }
};

/**
 * Signs out from Firebase Auth and clears local session.
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase Auth sign out failed:", error);
  }
};
