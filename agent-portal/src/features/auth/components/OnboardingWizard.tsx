import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Compass, Sparkles, Building2, ShieldCheck, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useAgentProfile } from "../hooks/useAgentProfile";
import { GlassCard, Button, Input, Select, ImageUploadBox } from "../../../components/ui";

interface OnboardingWizardProps {
  modalMode?: boolean;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ modalMode = false }) => {
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const { completeOnboarding, isLoading } = useAgentProfile();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      displayName: "",
      companyName: "",
      gstNumber: "",
      businessCategory: "Leisure Agency",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      description: "",
      website: "",
      instagram: "",
      facebook: "",
      logo: "",
      profileImage: "",
    },
  });

  const watchLogo = watch("logo");
  const watchPhoto = watch("profileImage");

  const onSubmit = async (data: any) => {
    setErrorMsg("");
    try {
      await completeOnboarding({
        ...data,
        profileCompleted: true,
      });
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to submit onboarding profile. Please try again.");
    }
  };

  const nextStep = () => {
    if (step === 1) {
      const displayName = watch("displayName");
      const companyName = watch("companyName");
      const gstNumber = watch("gstNumber");
      if (!displayName || !companyName || !gstNumber) {
        setErrorMsg("All fields in Step 1 are required.");
        return;
      }
    } else if (step === 2) {
      const phone = watch("phone");
      const address = watch("address");
      const city = watch("city");
      const state = watch("state");
      const country = watch("country");
      if (!phone || !address || !city || !state || !country) {
        setErrorMsg("All fields in Step 2 are required.");
        return;
      }
    }
    setErrorMsg("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setErrorMsg("");
    setStep(step - 1);
  };

  const categoryOptions = [
    { value: "Leisure Agency", label: "Leisure Tour Agency" },
    { value: "Adventure Tour Operators", label: "Adventure Tour Operator" },
    { value: "Corporate Event Planners", label: "Corporate Event Planner" },
    { value: "Destination Management", label: "Destination Management Company (DMC)" },
    { value: "Independent Agent", label: "Independent Agent" },
  ];

  const wizardFormContent = (
    <>
      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-xs font-semibold text-rose-600 dark:text-rose-400">
          {errorMsg}
        </div>
      )}

      {/* Stepper Status */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Step {step} of 4: {step === 1 ? "Core Details" : step === 2 ? "Contact info" : step === 3 ? "Portfolios" : "Branding"}
        </h3>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-6 h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-8 bg-primary shadow-brand" : s < step ? "bg-primary/40" : "bg-slate-200 dark:bg-slate-880"
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* STEP 1: Agency Profiles */}
        {step === 1 && (
          <div className="space-y-4 animate-page">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Agent Contact Name"
                placeholder="e.g. Sanjay Kumar"
                {...register("displayName", { required: true })}
              />
              <Input
                label="Travel Agency Name"
                placeholder="e.g. Traveloop Agency"
                {...register("companyName", { required: true })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="GSTIN Number"
                placeholder="e.g. 22AAAAA0000A1Z5"
                {...register("gstNumber", { required: true })}
              />
              <Select
                label="Business Category"
                options={categoryOptions}
                {...register("businessCategory")}
              />
            </div>

            <Button type="button" onClick={nextStep} className="w-full mt-4">
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: Address & Phone */}
        {step === 2 && (
          <div className="space-y-4 animate-page">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Operations Phone Contact"
                placeholder="e.g. 9876543210"
                {...register("phone", { required: true })}
              />
              <Input
                label="Street Address"
                placeholder="e.g. 123 Travel Tower, Salem"
                {...register("address", { required: true })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input label="City" placeholder="Salem" {...register("city", { required: true })} />
              <Input label="State" placeholder="Tamil Nadu" {...register("state", { required: true })} />
              <Input label="Country" placeholder="India" {...register("country", { required: true })} />
            </div>

            <div className="flex gap-4 mt-6">
              <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button type="button" onClick={nextStep} className="flex-1">
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Portfolios & description */}
        {step === 3 && (
          <div className="space-y-4 animate-page">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1 space-y-4">
                <Input label="Website Link" placeholder="https://agency.com" {...register("website")} />
                <Input label="Instagram Handle" placeholder="@username" {...register("instagram")} />
                <Input label="Facebook Page" placeholder="@facebook" {...register("facebook")} />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Business Portfolio Description
                </label>
                <textarea
                  rows={6}
                  placeholder="Share a short bio of your agency travel packages, target routes, and history..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs font-semibold"
                  {...register("description")}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button type="button" onClick={nextStep} className="flex-1">
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Logos and complete */}
        {step === 4 && (
          <div className="space-y-6 animate-page">
            <div className="grid grid-cols-2 gap-6">
              <ImageUploadBox
                label="Agency Logo"
                folder="logos"
                value={watchLogo || ""}
                onChange={(url) => setValue("logo", url)}
              />
              <ImageUploadBox
                label="Profile Picture"
                folder="profiles"
                value={watchPhoto || ""}
                onChange={(url) => setValue("profileImage", url)}
                circular
              />
            </div>

            <div className="p-4 rounded-xl bg-teal-50/30 dark:bg-teal-950/10 border border-primary/20 flex gap-3 items-start font-semibold">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Onboarding Activation</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed mt-0.5">
                  By clicking submit, your profile completes and your Agent Portal dashboard gets unlocked immediately.
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button type="button" variant="outline" onClick={prevStep} className="flex-1" disabled={isLoading}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button type="submit" loading={isLoading} className="flex-1">
                Submit Onboarding Profile
              </Button>
            </div>
          </div>
        )}
      </form>
    </>
  );

  if (modalMode) {
    return (
      <div className="p-2">
        {wizardFormContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 auth-bg">
      <div className="w-full max-w-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center text-white font-bold mb-3 shadow-brand animate-float">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            Agent Profile Onboarding
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold max-w-sm mt-1">
            Complete your agency profile credentials to activate your dashboard.
          </p>
        </div>

        <GlassCard className="p-8">
          {wizardFormContent}
        </GlassCard>
      </div>
    </div>
  );
};

export default OnboardingWizard;
