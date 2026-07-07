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
    const hasGst = agent.gstNo || agent.gstNumber;
    const hasLogo = agent.companyLogo || agent.logo;
    const hasPhoto = agent.agentPhoto || agent.profileImage;
    const profileDone = !!(agent.displayName && agent.dob && agent.mobile && agent.state && agent.country && agent.companyName && hasGst && hasLogo && hasPhoto);

    if (!profileDone) {
      return 1;
    }
    if (agent.kycStatus !== "EMAIL_VERIFIED" && agent.kycStatus !== "MOBILE_VERIFIED" && agent.kycStatus !== "KYC_COMPLETED" && agent.kycStatus !== "APPROVED" && !agent.emailVerified) {
      return 4;
    }
    if (!agent.acceptedTerms || !agent.privacyAccepted) {
      return 5;
    }
    if (!agent.mobileVerified) {
      return 6;
    }
    return 7; // Completed!
  };

  const kycStep = getKycStep(agent);

  if (location.pathname !== "/complete-profile") {
    if (kycStep < 7) {
      console.log(`[ProtectedRoute] KYC incomplete (step ${kycStep}) — redirecting to /complete-profile`);
      return <Navigate to="/complete-profile" replace />;
    }
  } else {
    if (kycStep === 7) {
      console.log("[ProtectedRoute] KYC completed — redirecting to /dashboard");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Authenticated and correct path → render children
  return <>{children}</>;
};

export default ProtectedRoute;
