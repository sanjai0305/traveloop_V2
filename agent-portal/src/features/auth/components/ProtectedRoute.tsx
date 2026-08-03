import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute
 * ─────────────
 * • If session is still being restored (isLoading): show a full-page spinner.
 * • If no valid session exists (!isAuthenticated): redirect to /login.
 * • If authenticated: render children unconditionally.
 *
 * Profile completion is handled INSIDE each page via banners,
 * NOT here. An authenticated agent with profileCompleted=false
 * is always allowed through.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show spinner while session is initializing (e.g., async token checks)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Restoring session...</span>
        </div>
      </div>
    );
  }

  // Not authenticated → go to login, preserve the attempted location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const agent = useAuthStore.getState().agent;
  
  if (!agent) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const getKycStep = (agent: any) => {
    // 1. If onboardingComplete is true, agent is fully done!
    if (agent.onboardingComplete) {
      return 6; // Fully completed
    }

    // 2. If backend currentStep is set and valid (1..5), use it as the source of truth
    if (typeof agent.currentStep === "number" && agent.currentStep >= 1 && agent.currentStep <= 5) {
      return agent.currentStep;
    }

    // 3. If currentStep >= 6, agent is completed
    if (typeof agent.currentStep === "number" && agent.currentStep >= 6) {
      return 6;
    }

    // 4. Fallback evaluation logic if currentStep is not yet set in DB
    const hasGst = agent.gstNo || agent.gstNumber;
    const hasLogo = agent.companyLogo || agent.logo;
    const hasPhoto = agent.agentPhoto || agent.profileImage;
    const profileDone = !!(agent.displayName && agent.dob && agent.mobile && agent.state && agent.country && agent.companyName && hasGst && hasLogo && hasPhoto);

    if (!profileDone) {
      return 1;
    }
    if (!agent.acceptedTerms || !agent.privacyAccepted) {
      return 4; // Step 4: Legal Consent
    }
    if (!agent.mobileVerified) {
      return 5; // Step 5: Mobile OTP
    }
    return 6; // Fully completed!
  };

  const kycStep = getKycStep(agent);
  console.log(`[ProtectedRoute] Auth Check | Agent ID: ${agent._id} | Backend Current Step: ${agent.currentStep || 'N/A'} | Resolved KYC Step: ${kycStep} | Path: ${location.pathname}`);

  if (location.pathname !== "/complete-profile") {
    if (kycStep < 6) {
      console.log(`[ProtectedRoute] KYC incomplete (step ${kycStep}) — redirecting to /complete-profile?step=${kycStep}`);
      return <Navigate to={`/complete-profile?step=${kycStep}`} replace />;
    }
  } else {
    if (kycStep === 6) {
      console.log("[ProtectedRoute] KYC completed — redirecting to /dashboard");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Authenticated and correct path → render children
  return <>{children}</>;
};

export default ProtectedRoute;
