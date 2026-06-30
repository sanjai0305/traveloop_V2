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
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

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