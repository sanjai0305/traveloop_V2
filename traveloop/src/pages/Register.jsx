// src/pages/Register.jsx

import React from "react";

// LAYOUT
import AuthLayout from "../layouts/AuthLayout";

// COMPONENTS
import RegistrationWizard from "../components/auth/RegistrationWizard";
import ServerStatusIndicator from "../components/common/ServerStatusIndicator";

const Register = () => {
  return (
    <AuthLayout>
      {/* UNIFIED REGISTRATION WIZARD - STABLE & PERFORMANT */}
      <RegistrationWizard />
      <ServerStatusIndicator />
    </AuthLayout>
  );
};

export default Register;