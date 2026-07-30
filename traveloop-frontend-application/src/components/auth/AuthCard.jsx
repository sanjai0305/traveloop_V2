// src/components/auth/AuthCard.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// COMPONENTS
import Divider from "../common/Divider";
import LoginForm from "./LoginForm";
import SocialLogin from "./SocialLogin";

// IMAGES
import logoImg from "../../assets/logo.jpg";

const AuthCard = () => {
  const [googleError, setGoogleError] = useState("");

  // Listen for Google auth errors dispatched by SocialLogin
  useEffect(() => {
    const handleGoogleError = (e) => {
      setGoogleError(e.detail || "Google Sign-In failed. Please try again.");
      // Auto-clear after 6 seconds
      setTimeout(() => setGoogleError(""), 6000);
    };
    window.addEventListener("auth:google:error", handleGoogleError);
    return () => window.removeEventListener("auth:google:error", handleGoogleError);
  }, []);

  return (
    <div className="animate-slide-up">
      {/* WELCOME HEADER */}
      <div className="flex items-center gap-4 mb-8">
        {/* Traveloop logo */}
        <div
          className="
            relative
            flex
            items-center
            justify-center
            w-16
            h-16
            rounded-2xl
            border
            border-teal-100
            flex-shrink-0
            overflow-hidden
            shadow-[0_8px_30px_rgb(20,184,181,0.15)]
          "
        >
          <img
            src={logoImg}
            alt="Traveloop Logo"
            className="w-full h-full object-cover animate-float"
          />
        </div>

        <div>
          <h2
            className="
              text-2xl
              font-extrabold
              text-slate-800
              leading-tight
            "
          >
            Welcome Back! ✈️
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Login to plan your next adventure
          </p>
        </div>
      </div>

      {/* SOCIAL LOGIN */}
      <SocialLogin />

      {/* GOOGLE ERROR BANNER */}
      {googleError && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium text-center">
          {googleError}
        </div>
      )}

      {/* DIVIDER */}
      <Divider text="OR CONTINUE WITH EMAIL" />

      {/* FORM */}
      <LoginForm />

      {/* SIGN UP LINK */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="
              font-bold
              bg-gradient-to-r
              from-teal-600
              to-cyan-500
              bg-clip-text
              text-transparent
            "
          >
            Create Account
          </Link>
        </p>
      </div>

      {/* TERMS & PRIVACY LINKS FOOTER */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-center gap-4 text-xs font-bold text-slate-400">
        <Link to="/terms-and-conditions" className="hover:text-teal-600 dark:hover:text-teal-450 transition-colors">
          Terms & Conditions
        </Link>
        <span>•</span>
        <Link to="/privacy" className="hover:text-teal-600 dark:hover:text-teal-450 transition-colors">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
};

export default AuthCard;