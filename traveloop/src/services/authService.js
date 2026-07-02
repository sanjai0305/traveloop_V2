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
 * Maps Firebase Auth errors to clear, user-friendly messages.
 */
const mapFirebaseError = (error) => {
  const code = error?.code || (error?.message && error.message.match(/auth\/[a-zA-Z\-]+/)?.[0]) || "";
  
  switch (code) {
    case "auth/unauthorized-domain":
      return new Error("This domain is not authorized for Firebase Sign-In. Please add it to Authorized Domains in the Firebase Console.");
    case "auth/network-request-failed":
      return new Error("Network error occurred. Please check your internet connection and try again.");
    case "auth/email-already-in-use":
      return new Error("An account already exists with this email address.");
    case "auth/user-not-found":
      return new Error("No account found with this email address. Please check your spelling or register.");
    case "auth/wrong-password":
      return new Error("Incorrect password. Please verify your credentials and try again.");
    case "auth/invalid-credential":
      return new Error("Invalid credentials. Please verify your email and password.");
    case "auth/user-disabled":
      return new Error("This user account has been disabled. Please contact support.");
    case "auth/too-many-requests":
      return new Error("Too many unsuccessful login attempts. Please try again later.");
    case "auth/operation-not-allowed":
      return new Error("Email registration is currently unavailable. Please try again later.");
    default:
      return new Error(error?.message || "Authentication failed. Please try again.");
  }
};

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

  if (!response) {
    throw new Error("Backend returned empty response");
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
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
    throw mapFirebaseError(error);
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
    throw mapFirebaseError(error);
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
  console.log(idToken);
  const backendData = await apiRequest("/auth/google", "POST", { idToken });
  console.log(`[Google Auth] Backend authenticated. User ID: ${backendData.user._id}`);

  // 2. Create or update Firestore profile
  try {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      console.log(`[Google Auth] Firebase user exists. Firebase UID: ${firebaseUser.uid}`);
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
    }
  } catch (error) {
    console.error("Firestore sync failed:", error);
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
    throw mapFirebaseError(error);
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
