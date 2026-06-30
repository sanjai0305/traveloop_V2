// src/pages/ForgotPassword.jsx

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// LAYOUT
import AuthLayout from "../layouts/AuthLayout";

// COMPONENTS
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import PageSkeletonLoader from "../components/common/PageSkeletonLoader";

// IMAGES
import Luggage from "../assets/images/luggage.png";

const ForgotPassword = () => {
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
      <div className="animate-slide-up">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 flex-shrink-0">
            <img
              src={Luggage}
              alt="Travel"
              className="w-10 h-10 object-contain animate-float"
            />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">
              Reset Password 🔑
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Enter your email to receive a password reset link
            </p>
          </div>
        </div>

        {/* FORGOT PASSWORD FORM */}
        <ForgotPasswordForm />
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
