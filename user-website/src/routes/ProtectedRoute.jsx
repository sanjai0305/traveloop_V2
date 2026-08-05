import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import PageSkeletonLoader from "../components/common/PageSkeletonLoader";

const ProtectedRoute = ({ children, isTermsPage = false }) => {
  const { user, isAuthenticated, loading, userRefreshed } = useAuth();

  const isConsentPath = window.location.pathname === "/legal-consent" || isTermsPage;
  
  // Property checks with robust fallbacks
  const isTermsAccepted = user?.acceptedTerms !== false;
  const isPrivacyAccepted = user?.privacyAccepted !== false;
  const isPhoneVerified = user?.phoneVerified !== false;

  console.log("[ProtectedRoute Decision Audit]:", {
    loading,
    userRefreshed,
    isAuthenticated,
    userEmail: user?.email,
    userId: user?.id || user?._id,
    isConsentPath,
    isTermsAccepted,
    isPrivacyAccepted,
    isPhoneVerified,
    isTermsPage
  });

  if (loading || !userRefreshed) {
    return <PageSkeletonLoader />;
  }

  if (!isAuthenticated) {
    console.log("[ProtectedRoute] Not authenticated -> Redirecting to /");
    return <Navigate to="/" replace />;
  }

  // Redirect to Legal Consent only if explicitly unaccepted
  if (user && (!isTermsAccepted || !isPrivacyAccepted || !isPhoneVerified) && !isConsentPath) {
    console.log("[ProtectedRoute] Onboarding incomplete -> Redirecting to /legal-consent:", {
      isTermsAccepted,
      isPrivacyAccepted,
      isPhoneVerified
    });
    return <Navigate to="/legal-consent" replace />;
  }

  return children;
};

export default ProtectedRoute;