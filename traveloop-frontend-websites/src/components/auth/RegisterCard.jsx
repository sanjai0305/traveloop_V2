// src/components/auth/RegisterCard.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";

// COMPONENTS
import Logo from "../common/Logo";
import RegisterForm from "./RegisterForm";

// IMAGE
import Luggage from "../../assets/images/luggage.png";

const RegisterCard = () => {
  const [step, setStep] = useState(() => {
    try {
      const savedStep = sessionStorage.getItem("traveloop_register_step");
      return savedStep ? parseInt(savedStep, 10) : 1;
    } catch (e) {
      return 1;
    }
  });

  const [email, setEmail] = useState(() => {
    try {
      const cached = sessionStorage.getItem("traveloop_register_form");
      if (cached) {
        return JSON.parse(cached).email || "";
      }
    } catch (e) {}
    return "";
  });

  const handleStepChange = (newStep, userEmail) => {
    setStep(newStep);
    try {
      sessionStorage.setItem("traveloop_register_step", newStep.toString());
    } catch (e) {}
    if (userEmail) {
      setEmail(userEmail);
    }
  };

  let stepTitle = "Create Your Account";
  let stepSubtitle = "Join Traveloop and start planning your adventures around the world.";

  if (step === 2) {
    stepTitle = "Verify Your Email";
  } else if (step === 3) {
    stepTitle = "Secure Your Account";
    stepSubtitle = "Create a strong password to protect your account.";
  }

  return (
    <div
      className="
        relative
        
        w-full
        max-w-5xl
        
        px-4
        sm:px-8
        md:px-12
        
        py-6
        sm:py-10
        md:py-12
        
        rounded-3xl
        sm:rounded-[40px]
        
        bg-white/85
        backdrop-blur-2xl
        
        border
        border-white/40
        
        shadow-[0_20px_80px_rgba(15,23,42,0.15)]
        
        overflow-hidden
      "
    >
      
      {/* TOP GLOW */}
      <div
        className="
          absolute
          top-[-100px]
          right-[-80px]
          
          w-72
          h-72
          
          bg-cyan-300/20
          
          rounded-full
          
          blur-3xl
        "
      />

      {/* BOTTOM GLOW */}
      <div
        className="
          absolute
          bottom-[-120px]
          left-[-100px]
          
          w-72
          h-72
          
          bg-teal-300/20
          
          rounded-full
          
          blur-3xl
        "
      />

      {/* MAIN CONTENT */}
      <div className="relative z-10">
        
        {/* LOGO */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* LUGGAGE IMAGE */}
        <div className="flex justify-center mt-4 sm:mt-8">
          <div
            className="
              relative
              
              flex
              items-center
              justify-center
              
              w-24
              h-24
              sm:w-36
              sm:h-36
              
              rounded-full
              
              bg-gradient-to-br
              from-teal-100
              via-cyan-50
              to-sky-100
              
              shadow-inner
            "
          >
            
            {/* ROTATING BORDER */}
            <div
              className="
                absolute
                inset-0
                
                rounded-full
                
                border-2
                border-dashed
                border-teal-300
                
                animate-spin
                [animation-duration:18s]
              "
            />

            {/* IMAGE */}
            <img
              src={Luggage}
              alt="Travel"
              className="
                w-16
                h-16
                sm:w-24
                sm:h-24
                object-contain
                relative
                z-10
                animate-float
              "
            />
          </div>
        </div>

        {/* HEADING */}
        <div className="text-center mt-4 sm:mt-6">
          
          <h2
            className="
              text-2xl
              sm:text-4xl
              md:text-5xl
              
              font-extrabold
              
              text-slate-800
              
              leading-tight
            "
          >
            {stepTitle}
          </h2>

          <p
            className="
              mt-2
              
              text-slate-500
              
              text-base
              md:text-lg
              
              leading-6
            "
          >
            {step === 2 ? (
              <>
                We sent a 6-digit verification code to:{" "}
                <span className="font-bold text-teal-600 dark:text-teal-400 break-all">
                  {(() => {
                    if (!email) return "";
                    const [name, domain] = email.split("@");
                    if (!domain) return email;
                    if (name.length <= 2) return `${name[0]}*@${domain}`;
                    return `${name.substring(0, 2)}******${name.slice(-1)}@${domain}`;
                  })()}
                </span>
              </>
            ) : (
              stepSubtitle
            )}
          </p>
        </div>

        {/* FORM */}
        <div className="mt-6">
          <RegisterForm step={step} onStepChange={handleStepChange} />
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center flex flex-col items-center gap-4">
          {step === 1 && (
            <p
              className="
                text-slate-500
                text-sm
                md:text-base
              "
            >
              Already have an account?{" "}
              
              <Link
                to="/"
                className="
                  font-bold
                  
                  bg-gradient-to-r
                  from-teal-600
                  to-cyan-500
                  
                  bg-clip-text
                  text-transparent
                  
                  hover:opacity-80
                  
                  transition
                "
              >
                Login
              </Link>
            </p>
          )}

          {/* TERMS & PRIVACY LINKS FOOTER */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-center gap-4 text-xs font-bold text-slate-400 w-full max-w-xs">
            <Link to="/terms-and-conditions" className="hover:text-teal-600 dark:hover:text-teal-450 transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-teal-600 dark:hover:text-teal-450 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCard;