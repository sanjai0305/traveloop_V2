import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, MailCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import InputField from "../common/InputField";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";

const ForgotPasswordForm = () => {
  const { sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t("auth.validation.emailRequired"));
      return;
    }

    // Basic email format regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      setError(t("auth.validation.emailInvalid"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendPasswordReset(email.trim());
      setSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("[ForgotPassword] Error sending password reset:", err);
      setError(err.message || t("auth.forgot.errorMsg"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ERROR BANNER */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* SUCCESS BANNER */}
      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-600 font-medium">
          {t("auth.forgot.successMsg")}
        </div>
      )}

      {/* EMAIL FIELD */}
      <InputField
        label={t("auth.emailLabel")}
        type="email"
        name="email"
        placeholder={t("auth.forgot.emailPlaceholder")}
        icon={User}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        error={error}
        disabled={loading}
        required
      />

      {/* SUBMIT BUTTON */}
      <Button
        type="submit"
        text={t("auth.forgot.sendResetBtn")}
        loading={loading}
        icon={MailCheck}
      />

      {/* BACK TO LOGIN */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          {t("auth.forgot.rememberPassword")}{" "}
          <Link
            to="/login"
            className="font-bold bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent"
          >
            {t("auth.forgot.backToLogin")}
          </Link>
        </p>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
