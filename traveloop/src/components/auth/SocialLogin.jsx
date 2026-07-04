// src/components/auth/SocialLogin.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginWithGoogle } from "../../services/authService";
import { auth, GoogleAuthProvider } from "../../services/firebase";
import { signInWithPopup, signInWithCredential } from "firebase/auth";
import { Capacitor } from "@capacitor/core";

const SocialLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    console.log(`[GoogleAuth Audit] Platform detected: "${platform}", isNativePlatform: ${isNative}`);

    if (isNative) {
      setIsCapacitor(true);
      
      const nativeClientId = "740933888609-m3po7gl817kloa75ua69eo6bpkpfjho3.apps.googleusercontent.com";

      // Initialize Capacitor Google Auth
      import("@codetrix-studio/capacitor-google-auth")
        .then(async ({ GoogleAuth }) => {
          try {
            await GoogleAuth.initialize({
              clientId: nativeClientId,
              scopes: ["profile", "email"],
              grantOfflineAccess: true
            });
            console.log("GoogleAuth initialized");
            console.log("Using Client ID:", nativeClientId);
          } catch (error) {
            console.error("Google Sign-In Error:", error);
          }
        })
        .catch((err) =>
          console.error("[SocialLogin] Failed to import Capacitor GoogleAuth:", err)
        );
    } else {
      console.log("[GoogleAuth Audit] Running in standard Web browser. Bypassing Capacitor GoogleAuth initialization.");
    }
  }, []);

  const sendTokenToBackend = async (idToken) => {
    setLoading(true);

    try {
      console.log("[GoogleAuth Audit] Performing Google Login flow...");
      const data = await loginWithGoogle(idToken);

      // Commit auth state (synchronous)
      login(data.user, data.token);
      console.log("[GoogleAuth Audit] Login successful. Navigating to dashboard.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("[GoogleAuth Audit] Unexpected error:", err.message, err);
      window.dispatchEvent(
        new CustomEvent("auth:google:error", {
          detail: err.message || "Google Sign-In failed. Please check your internet.",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWebSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      console.log("[GoogleAuth Audit] Starting Firebase signInWithPopup...");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      if (idToken) {
        await sendTokenToBackend(idToken);
      } else {
        throw new Error("No ID Token returned from Google authentication.");
      }
    } catch (err) {
      console.error("[GoogleAuth Audit] Web Google Sign-In error:", err.message, err);
      window.dispatchEvent(
        new CustomEvent("auth:google:error", {
          detail: err.message || "Google Sign-In failed. Please try again.",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNativeSignIn = async () => {
    setLoading(true);

    try {
      const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
      console.log("[GoogleAuth Audit] Starting native Google Sign-In...");

      const user = await GoogleAuth.signIn();
      console.log("[GoogleAuth Audit] Native sign-in user received:", user?.email);

      if (user && user.authentication && user.authentication.idToken) {
        // Sign into Firebase Auth first using the native Google OAuth ID Token
        const credential = GoogleAuthProvider.credential(user.authentication.idToken);
        const result = await signInWithCredential(auth, credential);
        
        // Retrieve the Firebase ID Token to send to the backend
        const firebaseIdToken = await result.user.getIdToken();
        await sendTokenToBackend(firebaseIdToken);
      } else {
        console.warn("[GoogleAuth Audit] Native sign-in: No idToken in user object.", user);
        window.dispatchEvent(
          new CustomEvent("auth:google:error", {
            detail: "Google Sign-In did not return a valid token. Please try again.",
          })
        );
      }
    } catch (error) {
      if (error.message && error.message.includes("cancelled")) {
        console.log("[GoogleAuth Audit] Native sign-in cancelled by user.");
      } else {
        console.error("Google Sign-In Error:", error);
        window.dispatchEvent(
          new CustomEvent("auth:google:error", {
            detail: "Google Sign-In failed. Please try again.",
          })
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center my-2.5">
      {loading ? (
        <div className="flex flex-col items-center gap-2 py-3" aria-live="polite">
          <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 animate-spin rounded-full" />
          <p className="text-slate-500 text-xs font-semibold">Signing in with Google...</p>
        </div>
      ) : (
        <button
          onClick={isCapacitor ? handleNativeSignIn : handleWebSignIn}
          className="w-full max-w-[350px] flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
             <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.54l3.79 2.94C6.18 7.55 8.87 5.04 12 5.04z"/>
             <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.57v2.96h3.87c2.26-2.09 3.55-5.17 3.55-8.68z"/>
             <path fill="#FBBC05" d="M5.21 10.48c-.25-.75-.39-1.56-.39-2.39 0-.83.14-1.64.39-2.39L1.42 2.76C.51 4.57 0 6.62 0 8.79s.51 4.22 1.42 6.03l3.79-2.94z"/>
             <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.87-2.96c-1.08.72-2.45 1.16-4.09 1.16-3.13 0-5.82-2.51-6.79-5.44l-3.79 2.94C3.37 20.35 7.35 23 12 23z"/>
          </svg>
          Continue with Google
        </button>
      )}
    </div>
  );
};

export default SocialLogin;