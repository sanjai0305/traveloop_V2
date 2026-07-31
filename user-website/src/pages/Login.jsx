// src/pages/Login.jsx

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// LAYOUT
import AuthLayout from "../layouts/AuthLayout";

// COMPONENTS
import AuthCard from "../components/auth/AuthCard";

import PageSkeletonLoader from "../components/common/PageSkeletonLoader";

const Login = () => {
  const { isAuthenticated, loading, user, userRefreshed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userRefreshed && isAuthenticated) {
      const needsConsent = !user?.acceptedTerms || !user?.privacyAccepted;
      const needsPhoneVerification = !user?.phoneVerified;

      if (needsConsent || needsPhoneVerification) {
        navigate("/legal-consent", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, loading, userRefreshed, user, navigate]);

  if (loading) {
    return <PageSkeletonLoader />;
  }

  return (
    <AuthLayout>
      
      {/* LOGIN CARD */}
      <AuthCard />

    </AuthLayout>
  );
};

export default Login;