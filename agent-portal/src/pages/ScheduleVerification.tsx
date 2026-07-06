import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Mail,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  AlertCircle,
  User,
  FileText,
  Check,
  X,
  Loader2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { GlassCard, Button } from "../components/ui";
import {
  getScheduleChangeStatus,
  verifyScheduleOtp,
  resendScheduleOtp,
  applyScheduleChange,
  ScheduleChangePassenger,
} from "../services/bookingService";

export const ScheduleVerification: React.FC = () => {
  const { tripId } = useParams<{ tripId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Per-passenger OTP input state map: { [bookingId]: string }
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());
  const [rowMessages, setRowMessages] = useState<Record<string, { type: "success" | "error"; text: string }>>({});
  const [applyMsg, setApplyMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Fetch schedule change status
  const { data: statusData, isLoading, error, refetch } = useQuery({
    queryKey: ["schedule-change-status", tripId],
    queryFn: () => getScheduleChangeStatus(tripId!),
    enabled: !!tripId,
    refetchInterval: 10000,
  });

  // Redirect if no active request found
  useEffect(() => {
    if (!isLoading && statusData && !statusData.exists) {
      navigate(`/bookings/${tripId}`);
    }
  }, [statusData, isLoading, tripId, navigate]);

  const handleVerifyOtp = async (bookingId: string) => {
    const otp = otpInputs[bookingId]?.trim();
    if (!otp || otp.length < 4) {
      setRowMessages(prev => ({ ...prev, [bookingId]: { type: "error", text: "Please enter the 6-digit OTP." } }));
      return;
    }

    setVerifyingIds(prev => new Set(prev).add(bookingId));
    setRowMessages(prev => ({ ...prev, [bookingId]: { type: "success", text: "" } }));

    try {
      const result = await verifyScheduleOtp(tripId!, { bookingId, otp });
      setRowMessages(prev => ({
        ...prev,
        [bookingId]: { type: "success", text: "✓ Approved!" },
      }));
      setOtpInputs(prev => ({ ...prev, [bookingId]: "" }));
      refetch();

      if (result.allApproved) {
        setApplyMsg({ type: "success", text: "All passengers have approved! You can now apply the schedule change." });
      }
    } catch (err: any) {
      setRowMessages(prev => ({
        ...prev,
        [bookingId]: { type: "error", text: err?.response?.data?.message || "Invalid OTP. Try again." },
      }));
    } finally {
      setVerifyingIds(prev => {
        const s = new Set(prev);
        s.delete(bookingId);
        return s;
      });
    }
  };

  const handleResendOtp = async (bookingId: string) => {
    setResendingIds(prev => new Set(prev).add(bookingId));
    try {
      await resendScheduleOtp(tripId!, bookingId);
      setRowMessages(prev => ({
        ...prev,
        [bookingId]: { type: "success", text: "New OTP sent to passenger email." },
      }));
      refetch();
    } catch (err: any) {
      setRowMessages(prev => ({
        ...prev,
        [bookingId]: { type: "error", text: err?.response?.data?.message || "Failed to resend OTP." },
      }));
    } finally {
      setResendingIds(prev => {
        const s = new Set(prev);
        s.delete(bookingId);
        return s;
      });
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    setApplyMsg(null);
    try {
      await applyScheduleChange(tripId!);
      setApplyMsg({ type: "success", text: "Schedule updated! Notification emails sent to all passengers." });
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["manifest", tripId] });
      setTimeout(() => navigate(`/bookings/${tripId}`), 2500);
    } catch (err: any) {
      setApplyMsg({ type: "error", text: err?.response?.data?.message || "Failed to apply schedule change." });
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading verification status...</span>
      </div>
    );
  }

  if (error || !statusData?.exists) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-rose-500" />
        <span className="text-sm font-bold text-rose-600">No active schedule change request found.</span>
      </div>
    );
  }

  const {
    newStartDate,
    newDepartureTime,
    oldStartDate,
    oldDepartureTime,
    totalPassengers = 0,
    approvedCount = 0,
    allApproved = false,
    passengers = [],
  } = statusData;

  const progressPercent = totalPassengers > 0 ? Math.round((approvedCount / totalPassengers) * 100) : 0;

  const formatDate = (d?: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(`/bookings/${tripId}`)}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Trip Manifest
      </button>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
            <CalendarClock className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Schedule Change Verification
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              All booked passengers must approve via OTP before the schedule is updated.
            </p>
          </div>
        </div>
        {/* Overall approval badge */}
        <div className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-2 ${
          allApproved
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
        }`}>
          {allApproved ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          {allApproved ? "All Approved" : `${approvedCount}/${totalPassengers} Approved`}
        </div>
      </div>

      {/* Schedule Change Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5 border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10">
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-3">Previous Schedule</span>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Date:</span>
              <span className="font-bold text-rose-500 line-through">{formatDate(oldStartDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-rose-400" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Time:</span>
              <span className="font-bold text-rose-500 line-through">{oldDepartureTime || "—"}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-3">New Schedule</span>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Date:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatDate(newStartDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Time:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{newDepartureTime || "—"}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Approval Progress Bar */}
      <GlassCard className="p-5 border border-slate-150 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Approval Progress
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100">
            {approvedCount} / {totalPassengers} Approved
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              allApproved ? "bg-emerald-500" : "bg-indigo-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-bold text-slate-400">0 Approved</span>
          <span className="text-[10px] font-bold text-slate-400">{progressPercent}% complete</span>
          <span className="text-[10px] font-bold text-slate-400">{totalPassengers} Total</span>
        </div>

        {!allApproved && passengers.filter(p => !p.verified).length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Waiting for approval from:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {passengers.filter(p => !p.verified).map(p => (
                <span
                  key={p.bookingId}
                  className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-200/50"
                >
                  {p.travelerName || p.bookingId}
                </span>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Passenger Verification Table */}
      <GlassCard className="p-0 border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-200">
            Passenger Consent Table
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-semibold">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-450 dark:text-slate-550 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 text-left">Passenger Name</th>
                <th className="px-4 py-3 text-left">Booking ID</th>
                <th className="px-4 py-3 text-left">Email Address</th>
                <th className="px-3 py-3 text-center">OTP Status</th>
                <th className="px-4 py-3 text-center">Enter OTP</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {passengers.map((p: ScheduleChangePassenger) => (
                <tr
                  key={p.bookingId}
                  className={`transition-all ${
                    p.verified
                      ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-850/20"
                  }`}
                >
                  {/* Name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">{p.travelerName || "—"}</span>
                    </div>
                  </td>

                  {/* Booking ID */}
                  <td className="px-4 py-3.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {p.bookingId}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[160px] font-mono text-[10px]">{p.email}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-3 py-3.5 text-center">
                    {p.verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    ) : p.status === "expired" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 dark:bg-rose-950/20 border border-rose-200/50">
                        <X className="w-3 h-3" /> Expired
                      </span>
                    ) : p.status === "otp_sent" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/20 border border-amber-200/50">
                        <Mail className="w-3 h-3" /> OTP Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 dark:bg-slate-800 border border-slate-200/50">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>

                  {/* OTP Input */}
                  <td className="px-4 py-3.5 text-center">
                    {p.verified ? (
                      <span className="text-emerald-500 font-black text-sm">✓</span>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={otpInputs[p.bookingId] || ""}
                          onChange={e => setOtpInputs(prev => ({ ...prev, [p.bookingId]: e.target.value.replace(/\D/g, "") }))}
                          className="w-24 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-mono font-bold tracking-widest text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        {rowMessages[p.bookingId] && (
                          <span className={`text-[9px] font-bold ${
                            rowMessages[p.bookingId].type === "success" ? "text-emerald-500" : "text-rose-500"
                          }`}>
                            {rowMessages[p.bookingId].text}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="px-4 py-3.5 text-center">
                    {!p.verified && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleVerifyOtp(p.bookingId)}
                          disabled={verifyingIds.has(p.bookingId) || !otpInputs[p.bookingId]}
                          className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-black transition-all flex items-center gap-1"
                        >
                          {verifyingIds.has(p.bookingId) ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Verify
                        </button>
                        <button
                          onClick={() => handleResendOtp(p.bookingId)}
                          disabled={resendingIds.has(p.bookingId)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 text-slate-600 dark:text-slate-400 text-[10px] font-bold transition-all flex items-center gap-1"
                          title="Resend OTP"
                        >
                          {resendingIds.has(p.bookingId) ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          Resend
                        </button>
                      </div>
                    )}
                    {p.verified && (
                      <span className="text-[10px] text-emerald-500 font-bold">
                        {p.verifiedAt ? new Date(p.verifiedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Apply Section */}
      <GlassCard className={`p-5 border shadow-sm ${
        allApproved
          ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10"
          : "border-slate-150 dark:border-slate-800"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {allApproved ? (
                <><ShieldCheck className="w-5 h-5 text-emerald-500" /> All Passengers Approved</>
              ) : (
                <><Shield className="w-5 h-5 text-slate-400" /> Waiting for Approvals</>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {allApproved
                ? "You can now apply the schedule changes. Notification emails will be sent automatically."
                : `${totalPassengers - approvedCount} passenger(s) still need to verify their OTP before you can proceed.`}
            </p>
          </div>
          <button
            onClick={handleApply}
            disabled={!allApproved || isApplying}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 shrink-0 ${
              allApproved && !isApplying
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            {isApplying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Apply Schedule Changes</>
            )}
          </button>
        </div>

        {applyMsg && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            applyMsg.type === "success"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 border border-emerald-200/50"
              : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 border border-rose-200/50"
          }`}>
            {applyMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {applyMsg.text}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ScheduleVerification;
