// src/pages/Login.jsx

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// LAYOUT
import AuthLayout from "../layouts/AuthLayout";

// COMPONENTS
import AuthCard from "../components/auth/AuthCard";
import ServerStatusIndicator from "../components/common/ServerStatusIndicator";

import PageSkeletonLoader from "../components/common/PageSkeletonLoader";

const Login = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const needsConsent = !!user && !user.acceptedTerms;
      const needsPhoneVerification = !!user && !user.phoneVerified;

      if (needsConsent || needsPhoneVerification) {
        navigate("/legal-consent", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, loading, user, navigate]);

  if (loading) {
    return <PageSkeletonLoader />;
  }

  return (
    <AuthLayout>
      
      {/* LOGIN CARD */}
      <AuthCard />
      <ServerStatusIndicator />

    </AuthLayout>
  );
};

export default Login;