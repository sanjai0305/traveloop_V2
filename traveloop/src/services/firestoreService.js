import { db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * Creates or updates a user profile in Firestore.
 * @param {string} uid - The Firebase Auth UID.
 * @param {object} data - The user profile data (email, name, etc.).
 */
export const createUserProfile = async (uid, data) => {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  const profileData = {
    uid,
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    email: data.email ? data.email.toLowerCase() : "",
    phone: data.phone || "",
    city: data.city || "",
    country: data.country || "",
    avatar: data.avatar || "",
    authProvider: data.authProvider || "email",
    xp: data.xp || 0,
    level: data.level || 1,
    streak: data.streak || 0,
    acceptedTerms: data.acceptedTerms || false,
    termsAcceptedAt: data.termsAcceptedAt || null,
    termsVersion: data.termsVersion || "",
    lastLogin: serverTimestamp(),
    createdAt: data.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(userRef, profileData, { merge: true });
    console.log(`Firestore profile created/updated for ${uid}`);
  } catch (error) {
    console.error("Error writing user profile to Firestore:", error);
  }
};

/**
 * Retrieves a user profile from Firestore.
 * @param {string} uid - The Firebase Auth UID.
 * @returns {Promise<object|null>}
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const userRef = doc(db, "users", uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error reading user profile from Firestore:", error);
    return null;
  }
};

/**
 * Updates specific fields in a user profile.
 * @param {string} uid - The Firebase Auth UID.
 * @param {object} data - Object containing fields to update.
 */
export const updateUserProfile = async (uid, data) => {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  try {
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log(`Firestore profile updated for ${uid}`);
  } catch (error) {
    console.error("Error updating user profile in Firestore:", error);
  }
};

/**
 * Updates the lastLogin timestamp in Firestore user profile.
 * @param {string} uid - The Firebase Auth UID.
 */
export const updateLastLogin = async (uid) => {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  try {
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`Firestore lastLogin updated for ${uid}`);
  } catch (error) {
    console.error("Error updating lastLogin in Firestore:", error);
  }
};
