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

  // Redirect to Terms & Conditions page if the user has not accepted the latest terms version
  if (user && user.termsVersion !== "2026-06" && !isTermsPage) {
    return (
      <Navigate
        to="/terms-and-conditions?force=true"
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;