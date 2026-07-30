import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

// COMPONENTS
import InputField from "../common/InputField";
import Button from "../common/Button";
import { getApiUrl } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { loginWithEmailPassword } from "../../services/authService";

const LoginForm = () => {
  const { login } = useAuth();
  const { t } = useTranslation();

  // NAVIGATE
  const navigate = useNavigate();



  // FORM DATA
  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });



  // ERRORS
  const [errors, setErrors] =
    useState({});



  // LOADING
  const [loading, setLoading] =
    useState(false);



  // HANDLE CHANGE
  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };




  // VALIDATE
  const validateForm = () => {
    let newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t("auth.validation.emailRequired");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(formData.email.trim().toLowerCase())) {
        newErrors.email = t("auth.validation.emailInvalid");
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = t("auth.validation.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("auth.validation.passwordMinLength");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // HANDLE LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = await loginWithEmailPassword(formData.email, formData.password);

      // SAVE AUTH STATE GLOBALLY & LOCALLY (synchronous — no await needed)
      login(data.user, data.token);

      // CLEAR FORM
      setFormData({
        email: "",
        password: "",
      });

      // NAVIGATE DASHBOARD
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("[LoginForm] Error during login:", error);
      setErrors({ general: error.message || t("auth.validation.loginFailed") });
    } finally {
      // ALWAYS reset loading regardless of success or failure
      setLoading(false);
    }
  };




  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >

      {/* GENERAL ERROR */}
      {errors.general && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium">
          {errors.general}
        </div>
      )}

      {/* EMAIL */}
      <InputField
        label={t("auth.emailLabel")}
        type="email"
        name="email"
        placeholder={t("auth.emailPlaceholder")}
        icon={User}
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />



      {/* PASSWORD */}
      <InputField
        label={t("auth.passwordLabel")}
        type="password"
        name="password"
        placeholder={t("auth.passwordPlaceholder")}
        icon={Lock}
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
      />



      {/* OPTIONS */}
      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          flex-wrap
        "
      >

        {/* REMEMBER */}
        <label
          className="
            flex
            items-center
            gap-2

            text-sm
            text-slate-500
          "
        >
          <input
            type="checkbox"
            className="
              w-4
              h-4

              accent-teal-500
            "
          />

          {t("auth.rememberMe")}
        </label>



        {/* FORGOT */}
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="
            text-sm
            font-semibold

            bg-gradient-to-r
            from-teal-600
            to-cyan-500

            bg-clip-text
            text-transparent
          "
        >
          {t("auth.forgotPassword")}
        </button>
      </div>



      {/* BUTTON */}
      <Button
        type="submit"
        text={t("auth.loginBtn")}
        loading={loading}
        icon={ShieldCheck}
      />



      {/* SECURITY */}
      <div
        className="
          flex
          items-center
          justify-center
          gap-2

          text-sm
          text-slate-400

          pt-2
        "
      >
        <ShieldCheck size={16} />

        <span>
          {t("auth.secureLogin")}
        </span>
      </div>
    </form>
  );
};

export default LoginForm;