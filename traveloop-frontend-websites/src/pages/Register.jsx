// src/pages/Register.jsx

import React from "react";

// LAYOUT
import AuthLayout from "../layouts/AuthLayout";

// COMPONENTS
import RegistrationWizard from "../components/auth/RegistrationWizard";

const Register = () => {
  return (
    <AuthLayout>
      {/* UNIFIED REGISTRATION WIZARD - STABLE & PERFORMANT */}
      <RegistrationWizard />
    </AuthLayout>
  );
};

export default Register;