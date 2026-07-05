import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  ShieldCheck,
  ShieldAlert,
  User2,
  Phone,
  MapPin,
  Sparkles,
  Save,
  AlertTriangle,
} from "lucide-react";
import { GlassCard, Button, Input, ImageUploadBox } from "../components/ui";
import { updateAgentProfile } from "../services/authService";
import { useAuthStore } from "../store/authStore";

/* ────────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────────────── */

/** Safe initial for avatar fallback — never throws on empty/undefined string */
const getInitial = (name?: string | null): string => {
  if (!name || typeof name !== "string" || name.trim() === "") return "A";
  return name.trim()[0].toUpperCase();
};

/* ────────────────────────────────────────────────────────────────────────────
   Error Boundary — prevents white screen on any render error
   ──────────────────────────────────────────────────────────────────────────── */

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ProfileErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Profile Error Boundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            Unable to load profile
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center max-w-xs">
            Please complete onboarding or reload the page. If the issue persists, log out and sign in again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all"
          >
            Reload Page
          </button>
          {this.state.error && (
            <p className="text-[10px] text-slate-300 dark:text-slate-700 font-mono mt-1">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   Profile Form
   ──────────────────────────────────────────────────────────────────────────── */

const ProfileForm: React.FC = () => {
  const { agent, updateAgent } = useAuthStore();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Safe defaults — KYC details ONLY
  const safeAgent = {
    displayName:      agent?.displayName      ?? "",
    dob:              agent?.dob              ?? "",
    email:            agent?.email            ?? "",
    mobile:           agent?.mobile           ?? "",
    state:            agent?.state            ?? "",
    country:          agent?.country          ?? "India",
    companyName:      agent?.companyName      ?? "",
    gstNo:            agent?.gstNo || agent?.gstNumber || "",
    companyLogo:      agent?.companyLogo || agent?.logo || "",
    agentPhoto:       agent?.agentPhoto || agent?.profileImage || "",
    emailVerified:    agent?.emailVerified    ?? false,
    mobileVerified:   agent?.mobileVerified   ?? false,
    kycStatus:        agent?.kycStatus        ?? "PENDING",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<typeof safeAgent>({
    defaultValues: safeAgent,
  });

  const watchLogo = watch("companyLogo");
  const watchAgentPhoto = watch("agentPhoto");

  const profileMutation = useMutation({
    mutationFn: updateAgentProfile,
    onSuccess: (data) => {
      if (data?.agent) {
        updateAgent(data.agent);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    },
    onError: (err) => {
      console.error("[Profile] Save failed:", err);
      alert("Failed to save profile. Please try again.");
    },
  });

  const onSubmit = (data: any) => {
    // Keep internal aliases in sync
    const payload = {
      ...data,
      name: data.displayName,
      logo: data.companyLogo,
      profileImage: data.agentPhoto,
      gstNumber: data.gstNo,
    };
    profileMutation.mutate(payload);
  };

  const displayName = safeAgent.displayName || safeAgent.companyName || safeAgent.email || "Agent";
  const avatarInitial = getInitial(displayName);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Success toast ── */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-xl animate-fade-in-up">
          <ShieldCheck className="w-4 h-4" />
          Profile saved successfully!
        </div>
      )}

      {/* ── Header banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {safeAgent.agentPhoto ? (
              <img
                src={safeAgent.agentPhoto}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border-2 border-primary">
                {avatarInitial}
              </div>
            )}
            {safeAgent.companyLogo && (
              <img
                src={safeAgent.companyLogo}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-cover absolute -bottom-1 -right-1 border border-white dark:border-slate-900 shadow-md"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">
                {safeAgent.companyName || "Your Agency"}
              </h1>
              {safeAgent.kycStatus === "KYC_COMPLETED" || safeAgent.kycStatus === "APPROVED" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Profile Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-955/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5" /> Pending Verification
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
              {displayName}
              {safeAgent.gstNo ? ` | GSTIN: ${safeAgent.gstNo}` : " | GST not set"}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {safeAgent.email}
            </p>
          </div>
        </div>

        {/* Profile completion hint */}
        {safeAgent.kycStatus !== "KYC_COMPLETED" && safeAgent.kycStatus !== "APPROVED" && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 max-w-xs">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
              Complete your KYC details and OTP verifications to unlock trip publishing.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Card 1: Agency Branding ── */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 mb-4">
              Agency Branding
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadBox
                label="Company Logo"
                folder="logos"
                value={watchLogo || ""}
                onChange={(url) => setValue("companyLogo", url)}
              />
              <ImageUploadBox
                label="Agent Photo"
                folder="profiles"
                value={watchAgentPhoto || ""}
                onChange={(url) => setValue("agentPhoto", url)}
                circular
              />
            </div>
            <Button
              onClick={handleSubmit(onSubmit)}
              className="w-full mt-4 py-2"
              loading={profileMutation.isPending}
            >
              Update Brand Images
            </Button>
          </GlassCard>
        </div>

        {/* ── Card 2: Agent Details ── */}
        <GlassCard className="lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-855 dark:text-slate-150 mb-6">
            Agent Details
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Full Name"
                  type="text"
                  {...register("displayName", { required: "Full name is required" })}
                  error={(errors as any).displayName?.message}
                />
                <User2 className="absolute right-3 bottom-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
              <Input
                label="Date of Birth"
                type="date"
                {...register("dob", { required: "Date of birth is required" })}
                error={(errors as any).dob?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Gmail Address"
                type="email"
                {...register("email")}
                disabled
                readOnly
              />
              <div className="relative">
                <Input
                  label="Mobile Number"
                  type="tel"
                  maxLength={10}
                  {...register("mobile", {
                    required: "Mobile number is required",
                    pattern: { value: /^[0-9]{10}$/, message: "Exactly 10 digits required" }
                  })}
                  error={(errors as any).mobile?.message}
                />
                <Phone className="absolute right-3 bottom-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="State"
                  type="text"
                  {...register("state", { required: "State is required" })}
                  error={(errors as any).state?.message}
                />
                <MapPin className="absolute right-3 bottom-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
              <Input
                label="Country"
                type="text"
                {...register("country", { required: "Country is required" })}
                error={(errors as any).country?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                type="text"
                {...register("companyName", { required: "Company name is required" })}
                error={(errors as any).companyName?.message}
              />
              <Input
                label="GST Number"
                type="text"
                {...register("gstNo", { required: "GST number is required" })}
                error={(errors as any).gstNo?.message}
              />
            </div>

            {/* Verification Status */}
            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-3 mt-4">
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Verification & KYC Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${safeAgent.emailVerified ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`} />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Email Verified: {safeAgent.emailVerified ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${safeAgent.mobileVerified ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`} />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Mobile Verified: {safeAgent.mobileVerified ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${(safeAgent.kycStatus === "KYC_COMPLETED" || safeAgent.kycStatus === "APPROVED") ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    KYC Status: {safeAgent.kycStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex items-center justify-between">
              <Button
                type="submit"
                loading={profileMutation.isPending}
                className="ml-auto px-8 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Profile
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Exported page component — wrapped in ErrorBoundary
   ──────────────────────────────────────────────────────────────────────────── */

export const Profile: React.FC = () => {
  const { agent, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <User2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          No profile found
        </h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center max-w-xs">
          Please log in to access your agency profile.
        </p>
      </div>
    );
  }

  return (
    <ProfileErrorBoundary>
      <ProfileForm />
    </ProfileErrorBoundary>
  );
};

export default Profile;
