import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  FileText,
  Upload,
  Globe,
  User2,
  Phone,
  MapPin,
  AtSign,
  Sparkles,
  Save,
  AlertTriangle,
} from "lucide-react";
import { GlassCard, Button, Input, ImageUploadBox } from "../components/ui";
import { updateAgentProfile } from "../services/authService";
import { useAuthStore } from "../store/authStore";
import { uploadImage } from "../services/firebase";

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
   Profile Form — field names aligned with Backend Agent model
   Backend fields: displayName, phone, companyName, gstNumber, businessCategory,
                   address, city, state, country, website, instagram, facebook,
                   logo, profileImage, profileCompleted, emailVerified
──────────────────────────────────────────────────────────────────────────── */

const ProfileForm: React.FC = () => {
  const { agent, updateAgent } = useAuthStore();
  const [docUploading, setDocUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Safe defaults — all fields from the Agent model with fallbacks to ""
  const safeAgent = {
    displayName:      agent?.displayName      ?? "",
    companyName:      agent?.companyName      ?? "",
    phone:            agent?.phone            ?? "",
    gstNumber:        agent?.gstNumber        ?? "",
    businessCategory: agent?.businessCategory ?? "",
    address:          agent?.address          ?? "",
    city:             agent?.city             ?? "",
    state:            agent?.state            ?? "",
    country:          agent?.country          ?? "",
    website:          agent?.website          ?? "",
    instagram:        agent?.instagram        ?? "",
    facebook:         agent?.facebook         ?? "",
    logo:             agent?.logo             ?? "",
    profileImage:     agent?.profileImage     ?? "",
    profileCompleted: agent?.profileCompleted ?? false,
    emailVerified:    agent?.emailVerified    ?? false,
    email:            agent?.email            ?? "",
    documents:        (agent as any)?.documents ?? [],
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

  const watchLogo        = watch("logo");
  const watchProfileImage = watch("profileImage");

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

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !agent) return;
    const file = e.target.files[0];
    setDocUploading(true);
    try {
      const url = await uploadImage(file, "verification_docs");
      const newDoc = { name: file.name, url, uploadedAt: new Date().toISOString() };
      const updatedDocs = [...safeAgent.documents, newDoc];
      profileMutation.mutate({ documents: updatedDocs } as any);
    } catch (err) {
      console.error("[Profile] Document upload failed:", err);
      alert("Document upload failed. Please try again.");
    } finally {
      setDocUploading(false);
    }
  };

  const removeDoc = (idx: number) => {
    if (!agent || !confirm("Delete this document?")) return;
    const updatedDocs = [...safeAgent.documents];
    updatedDocs.splice(idx, 1);
    profileMutation.mutate({ documents: updatedDocs } as any);
  };

  const onSubmit = (data: any) => {
    profileMutation.mutate(data);
  };

  // Derive display name + avatar initial safely
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
            {safeAgent.profileImage ? (
              <img
                src={safeAgent.profileImage}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border-2 border-primary">
                {avatarInitial}
              </div>
            )}
            {safeAgent.logo && (
              <img
                src={safeAgent.logo}
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
              {safeAgent.profileCompleted ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Profile Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5" /> Pending Completion
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
              {displayName}
              {safeAgent.gstNumber ? ` | GSTIN: ${safeAgent.gstNumber}` : " | GST not set"}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {safeAgent.email}
            </p>
          </div>
        </div>

        {/* Profile completion hint */}
        {!safeAgent.profileCompleted && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 max-w-xs">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
              Complete your profile to unlock trip publishing, bookings, and analytics.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Branding + Documents ── */}
        <div className="space-y-6">
          {/* Logo & profile photo uploads */}
          <GlassCard>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 mb-4">
              Agency Branding
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadBox
                label="Company Logo"
                folder="logos"
                value={watchLogo || ""}
                onChange={(url) => setValue("logo", url)}
              />
              <ImageUploadBox
                label="Profile Picture"
                folder="profiles"
                value={watchProfileImage || ""}
                onChange={(url) => setValue("profileImage", url)}
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

          {/* Verification Documents */}
          <GlassCard>
            <h3 className="text-sm font-bold text-slate-855 dark:text-slate-150 mb-3">
              Verification Documents
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed mb-4">
              Upload commercial licenses, company incorporation certificates, or taxation registrations (PDF/Image).
            </p>

            <div className="space-y-3 mb-4">
              {safeAgent.documents.length > 0 ? (
                safeAgent.documents.map((doc: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <a
                        href={doc?.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary truncate hover:underline"
                      >
                        {doc?.name || "Document"}
                      </a>
                    </div>
                    <button
                      onClick={() => removeDoc(idx)}
                      className="text-[10px] font-bold text-rose-500 hover:underline pl-2 flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-6 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No documents uploaded.
                </div>
              )}
            </div>

            <label className="block w-full">
              <input
                type="file"
                onChange={handleDocumentUpload}
                className="hidden"
                disabled={docUploading}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
              />
              <div className="flex items-center justify-center gap-2 p-3 border border-dashed border-primary/45 rounded-xl text-primary hover:bg-primary/5 cursor-pointer text-xs font-bold transition-all">
                {docUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Upload Document
                  </>
                )}
              </div>
            </label>
          </GlassCard>
        </div>

        {/* ── Right Column: Edit Profile ── */}
        <GlassCard className="lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 mb-6">
            Agency Configuration
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Agent Name / Primary Contact"
                  type="text"
                  {...register("displayName")}
                  error={(errors as any).displayName?.message}
                />
                <User2 className="absolute right-3 bottom-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
              <div className="relative">
                <Input
                  label="Agency Legal Name"
                  type="text"
                  {...register("companyName", { required: "Company name is required" })}
                  error={(errors as any).companyName?.message}
                />
                <Building2 className="absolute right-3 bottom-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Operations Phone"
                  type="tel"
                  {...register("phone", { required: "Phone is required" })}
                  error={(errors as any).phone?.message}
                />
                <Phone className="absolute right-3 bottom-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
              <Input
                label="GST Number"
                type="text"
                placeholder="22AAAAA0000A1Z5"
                {...register("gstNumber")}
              />
            </div>

            {/* Row 3 */}
            <div className="relative">
              <Input
                label="Office Street Address"
                type="text"
                {...register("address")}
              />
              <MapPin className="absolute right-3 bottom-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
            </div>

            {/* Row 4: City / State / Country */}
            <div className="grid grid-cols-3 gap-3">
              <Input label="City"    type="text" {...register("city")} />
              <Input label="State"   type="text" {...register("state")} />
              <Input label="Country" type="text" {...register("country")} />
            </div>

            {/* Row 5: Social */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Website URL"
                  type="url"
                  placeholder="https://agency.com"
                  {...register("website")}
                />
                <Globe className="absolute right-3 bottom-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
              <div className="relative">
                <Input
                  label="Instagram"
                  type="text"
                  placeholder="@username"
                  {...register("instagram")}
                />
                <AtSign className="absolute right-3 bottom-3.5 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
            </div>

            {/* Row 6: Facebook */}
            <Input
              label="Facebook Page"
              type="text"
              placeholder="https://facebook.com/yourpage"
              {...register("facebook")}
            />

            {/* Row 7: Business category */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Business Category
              </label>
              <select
                {...register("businessCategory")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="">Select category</option>
                <option value="Tour Operator">Tour Operator</option>
                <option value="Travel Agency">Travel Agency</option>
                <option value="Bus Operator">Bus Operator</option>
                <option value="Hotel Partner">Hotel Partner</option>
                <option value="Pilgrim Tour Specialist">Pilgrim Tour Specialist</option>
                <option value="Adventure Travel">Adventure Travel</option>
                <option value="Corporate Travel">Corporate Travel</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Submit */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex items-center justify-between">
              {!safeAgent.profileCompleted && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Fill all required fields to complete your profile
                </p>
              )}
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
