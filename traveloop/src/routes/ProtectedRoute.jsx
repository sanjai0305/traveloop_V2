import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import PageSkeletonLoader from "../components/common/PageSkeletonLoader";

const ProtectedRoute = ({ children, isTermsPage = false }) => {
  const { user, isAuthenticated, loading, userRefreshed } = useAuth();

  console.log("[ProtectedRoute Render]:", {
    loading,
    userRefreshed,
    isAuthenticated,
    termsVersion: user?.termsVersion,
    isTermsPage
  });

  if (loading || !userRefreshed) {
    return <PageSkeletonLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // Redirect to Legal Consent if user has not accepted terms & privacy or verified phone
  if (user && (!user.acceptedTerms || !user.privacyAccepted || !user.phoneVerified) && !isTermsPage) {
    console.log("[ProtectedRoute] Redirecting to /legal-consent:", {
      acceptedTerms: user.acceptedTerms,
      privacyAccepted: user.privacyAccepted,
      phoneVerified: user.phoneVerified
    });
    return (
      <Navigate
        to="/legal-consent"
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;