import React from "react";
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../../../../traveloop/src/services/firebase";
import { useAuthStore } from "../../../store/authStore";
import api from "../../../services/api";
import { Button } from "../../../components/ui";

interface GoogleLoginButtonProps {
  onSuccess: (agent: any) => void;
  onError: (error: string) => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { setAuth } = useAuthStore();

  const handleGoogleClick = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      console.log("[Google Login] Initiating direct signInWithPopup on user click...");
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken(true);

      console.log("[Google Login] Firebase token acquired. Authenticating with Agent Portal backend...");
      const response = await api.post("/agent/login", {
        idToken,
        email: firebaseUser.email,
        uid: firebaseUser.uid,
      });

      if (!response || !response.data) {
        throw new Error("Backend returned null response");
      }
      const resData = response.data;
      setAuth(resData.token, resData.agent);
      
      const needsConsent = !resData.agent?.acceptedTerms;
      const needsPhoneVerification = !resData.agent?.mobileVerified;

      if (needsConsent || needsPhoneVerification) {
        console.log("[Google Login] Onboarding incomplete. Redirecting to legal consent.");
        onSuccess(resData.agent);
        window.location.href = "/legal-consent";
      } else {
        onSuccess(resData.agent);
      }
    } catch (err: any) {
      console.error("[Google Login] Error encountered during authentication:", err);
      
      if (err.code === "auth/popup-blocked") {
        console.warn("[Google Login] Popup blocked by browser. Attempting redirect fallback...");
        onError("Popup blocked by browser. Please allow popups or continue using Email OTP.");
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr: any) {
          console.error("[Google Login] Redirect fallback failed:", redirectErr);
          onError(redirectErr.message || "Redirect authentication failed");
        }
      } else {
        const msg = err.response?.data?.message || err.message || "Google Authentication failed";
        onError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleClick}
      loading={isLoading}
      className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-bold transition-all text-sm"
    >
      {!isLoading && (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.355 0 3.39 2.673 1.473 6.564l3.793 3.201z"
          />
          <path
            fill="#4285F4"
            d="M23.491 12.273c0-.818-.073-1.609-.209-2.373H12v4.509h6.445c-.277 1.482-1.12 2.736-2.39 3.582l3.69 3.127c2.164-2 3.746-4.945 3.746-8.845z"
          />
          <path
            fill="#34A853"
            d="M16.055 17.991c-1.182.782-2.69 1.255-4.055 1.255a7.078 7.078 0 0 1-6.734-4.855L1.473 17.59A11.954 11.954 0 0 0 12 24c3.218 0 6.136-1.073 8.2-2.909l-4.145-3.1z"
          />
          <path
            fill="#FBBC05"
            d="M5.266 14.391A7.018 7.018 0 0 1 4.909 12c0-.827.136-1.636.357-2.4L1.473 6.4A11.97 11.97 0 0 0 0 12c0 2.055.518 4.01 1.436 5.764l3.83-3.373z"
          />
        </svg>
      )}
      Continue with Google
    </Button>
  );
};

export default GoogleLoginButton;
