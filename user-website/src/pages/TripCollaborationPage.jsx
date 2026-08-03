// src/pages/TripCollaborationPage.jsx — Full-Page Collaboration & Member Management Engine

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import TripHeaderNav from "../components/trip/TripHeaderNav";
import Avatar from "../components/common/Avatar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/mobile/MobileToast";
import { getApiUrl } from "../utils/api";
import { socket } from "../utils/socket";
import {
  Users, Mail, UserPlus, Copy, Check, QrCode, Trash2,
  Crown, Clock, History, AlertCircle, X, RefreshCw, Loader2,
  AlertTriangle, UserX, LogOut, Send, Wifi
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Flatten a raw collaborator entry from the API into a simple display object */
const normaliseCollab = (c) => ({
  _id:        c._id || c.inviteId,
  userId:     c.userId?._id || c.userId,
  email:      c.userId?.email || c.email || "",
  name:       c.userId?.firstName
                ? `${c.userId.firstName} ${c.userId.lastName || ""}`.trim()
                : (c.name || c.userId?.name || c.email || "Invited User"),
  role:       c.role || "viewer",
  acceptedAt: c.acceptedAt,
  invitedAt:  c.invitedAt || c.createdAt,
  avatar:     c.avatar || c.userId?.avatar || null,
});

/** Map backend error codes → friendly user-facing messages */
const INVITE_CODE_MSG = {
  INVITE_ALREADY_PENDING: "An invitation has already been sent to this user.",
  ALREADY_COLLABORATOR:   "This user is already a collaborator on this trip.",
  CANNOT_INVITE_SELF:     "You cannot invite yourself.",
  INVITE_USER_NOT_FOUND:  "No Traveloop account found with that email address.",
};

/** Format ISO date into readable string */
const formatSentTime = (isoString) => {
  if (!isoString) return "Recently";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (_) {
    return "Recently";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TripCollaborationPage = () => {
  const { tripId } = useParams();
  const navigate   = useNavigate();
  const toast      = useToast();
  const { user }   = useAuth();

  // Primary state
  const [trip,            setTrip]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [inviteEmail,     setInviteEmail]     = useState("");
  const [inviteRole,      setInviteRole]      = useState("Editor");
  const [inviting,        setInviting]        = useState(false);
  const [resendingId,     setResendingId]     = useState(null);
  const [showQrModal,     setShowQrModal]     = useState(false);
  const [copiedLink,      setCopiedLink]      = useState(false);
  const [acceptedMembers, setAcceptedMembers] = useState([]);
  const [pendingInvites,  setPendingInvites]  = useState([]);
  const [activityLogs,    setActivityLogs]    = useState([]);

  // Real-time online presence state
  const [onlineUsers,     setOnlineUsers]     = useState(new Set());
  const [isConnected,     setIsConnected]     = useState(socket.connected);

  // Modals & in-flight state
  const [cancelTarget,    setCancelTarget]    = useState(null); // invite object being cancelled
  const [cancelling,      setCancelling]      = useState(false);
  const [showLeaveModal,  setShowLeaveModal]  = useState(false);
  const [leaving,         setLeaving]         = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchCollaborationData = useCallback(async (silent = false) => {
    if (!tripId || tripId === "undefined") return;
    if (silent) setRefreshing(true);
    else        setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // 1. Full trip (includes collaborators array with acceptedAt timestamps)
      const tripRes = await fetch(getApiUrl(`trips/${tripId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!tripRes.ok) {
        const err = await tripRes.json().catch(() => ({}));
        console.warn("[Collab] Trip fetch failed:", tripRes.status, err.message);
        if (!silent) toast.error("Failed to load trip details");
        return;
      }

      const tripData = await tripRes.json().catch(() => ({}));
      if (!tripData?.success || !tripData.trip) {
        if (!silent) toast.error("Failed to load trip details");
        return;
      }
      setTrip(tripData.trip);

      // 2. Dedicated Pending Invitations API Endpoint
      let pendingList = [];
      const pendingRes = await fetch(getApiUrl(`trips/${tripId}/pending-invitations`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pendingRes.ok) {
        const pd = await pendingRes.json().catch(() => ({}));
        pendingList = (pd.pendingInvitations || pd.invitations || []).map(normaliseCollab);
      }

      // 3. Collaborators endpoint — returns accepted entries
      let acceptedList = [];
      const collabRes = await fetch(getApiUrl(`trips/${tripId}/collaborators`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (collabRes.ok) {
        const cd = await collabRes.json().catch(() => ({}));
        acceptedList = (cd.collaborators || []).map(normaliseCollab).filter(c => c.acceptedAt);
      } else {
        acceptedList = (tripData.trip.collaborators || []).map(normaliseCollab).filter(c => c.acceptedAt);
      }

      // Fallback pending merge if pendingRes fails
      if (pendingList.length === 0 && tripData.trip.collaborators) {
        pendingList = tripData.trip.collaborators
          .filter(c => !c.acceptedAt)
          .map(normaliseCollab);
      }

      // Deduplicate by email or ID
      const uniquePendingMap = new Map();
      pendingList.forEach(c => {
        const key = c._id || c.email?.toLowerCase();
        if (key && !uniquePendingMap.has(key)) {
          uniquePendingMap.set(key, c);
        }
      });

      const uniqueAcceptedMap = new Map();
      acceptedList.forEach(c => {
        const key = c._id || c.email?.toLowerCase();
        if (key && !uniqueAcceptedMap.has(key)) {
          uniqueAcceptedMap.set(key, c);
        }
      });

      setAcceptedMembers(Array.from(uniqueAcceptedMap.values()));
      setPendingInvites (Array.from(uniquePendingMap.values()));

      // 4. Activity log
      try {
        const logRes = await fetch(getApiUrl(`trips/${tripId}/activity-log`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (logRes.ok) {
          const logData = await logRes.json().catch(() => ({}));
          if (logData?.success && Array.isArray(logData.logs) && logData.logs.length > 0) {
            setActivityLogs(logData.logs);
          }
        }
      } catch (_) { /* non-critical */ }

    } catch (err) {
      console.error("[Collab] fetchCollaborationData error:", err);
      if (!silent) toast.error("Network error loading collaboration data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useEffect(() => { fetchCollaborationData(false); }, [fetchCollaborationData]);

  // ── Real-Time Socket Connection & Events ───────────────────────────────────

  useEffect(() => {
    if (!tripId || !user) return;

    socket.emit("join_trip", { tripId, user: { id: user._id || user.id, name: user.firstName || user.name || user.email, email: user.email } });
    setIsConnected(socket.connected);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleUserJoined = ({ user: joinedUser }) => {
      if (joinedUser?.id) {
        setOnlineUsers(prev => new Set(prev).add(joinedUser.id.toString()));
      }
    };

    const handleUserLeft = ({ user: leftUser }) => {
      if (leftUser?.id) {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(leftUser.id.toString());
          return updated;
        });
      }
    };

    const handleCollaboratorLeft = ({ userName }) => {
      toast.warning?.(`${userName} has left the trip.`) || toast.error(`${userName} has left the trip.`);
      fetchCollaborationData(true);
    };

    // Socket events specified in requirements
    const handleSync = () => {
      fetchCollaborationData(true);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("user_joined_trip", handleUserJoined);
    socket.on("user_left_trip", handleUserLeft);
    socket.on("collaborator_left", handleCollaboratorLeft);
    socket.on("trip:invite", handleSync);
    socket.on("trip:inviteAccepted", handleSync);
    socket.on("trip:inviteRejected", handleSync);
    socket.on("trip:inviteCancelled", handleSync);
    socket.on("trip:collaboratorAdded", handleSync);
    socket.on("trip_update", handleSync);

    return () => {
      socket.emit("leave_trip", { tripId, user: { id: user._id || user.id } });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("user_joined_trip", handleUserJoined);
      socket.off("user_left_trip", handleUserLeft);
      socket.off("collaborator_left", handleCollaboratorLeft);
      socket.off("trip:invite", handleSync);
      socket.off("trip:inviteAccepted", handleSync);
      socket.off("trip:inviteRejected", handleSync);
      socket.off("trip:inviteCancelled", handleSync);
      socket.off("trip:collaboratorAdded", handleSync);
      socket.off("trip_update", handleSync);
    };
  }, [tripId, user, fetchCollaborationData]);

  // ── Derived helpers ────────────────────────────────────────────────────────

  const isOwner =
    trip?.userId?.toString()         === user?._id?.toString() ||
    trip?.createdBy?._id?.toString() === user?._id?.toString() ||
    trip?.createdBy                  === user?._id;

  const getEmailConflict = (email) => {
    if (!email?.trim()) return null;
    const lc = email.trim().toLowerCase();
    const ownerEmail = (
      trip?.owner?.email     ||
      trip?.createdBy?.email ||
      user?.email            || ""
    ).toLowerCase();
    if (ownerEmail && lc === ownerEmail)                             return "owner";
    if (acceptedMembers.some(m => m.email.toLowerCase() === lc))    return "accepted";
    if (pendingInvites.some(p  => p.email.toLowerCase() === lc))    return "pending";
    return null;
  };

  const emailConflict = getEmailConflict(inviteEmail);

  // ── Send Invite Action ─────────────────────────────────────────────────────

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!tripId || tripId === "undefined") { toast.error("Trip ID is missing."); return; }

    const email = inviteEmail.trim();
    if (!email) { toast.error("Please enter an email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Please enter a valid email address."); return; }

    // Pre-flight duplicate check
    const conflict = getEmailConflict(email);
    if (conflict === "owner")    { toast.error("That is the trip owner's email."); return; }
    if (conflict === "accepted") { toast.error("This user is already a collaborator on this trip."); return; }
    if (conflict === "pending")  { toast.error("An invitation has already been sent to this user."); return; }

    setInviting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}/invite`), {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ email, role: inviteRole || "viewer" }),
      });

      let data = {};
      try { data = await res.json(); } catch (_) {}

      // 409 Conflict handling
      if (res.status === 409) {
        const friendly = INVITE_CODE_MSG[data?.code] || data?.message || "Invitation already exists.";
        toast.error(friendly);
        return;
      }

      if (res.status === 400) { toast.error(data?.message || "Invalid request."); return; }
      if (res.status === 403) { toast.error("You do not have permission to invite collaborators."); return; }
      if (res.status === 404) { toast.error(data?.message || "No Traveloop account found with that email."); return; }

      if (!res.ok) {
        console.error("[Invite] Unexpected server error:", res.status, data);
        toast.error(data?.message || "Failed to send invitation. Please try again.");
        return;
      }

      if (data?.success) {
        toast.success(data.message || `Invite sent to ${email}!`);
        setInviteEmail(""); // Clear input

        // Optimistically add to pending list
        setPendingInvites(prev => [
          ...prev,
          { _id: `opt-${Date.now()}`, email, name: email, role: inviteRole, acceptedAt: null, invitedAt: new Date().toISOString() },
        ]);

        fetchCollaborationData(true); // Silent sync
      } else {
        toast.error(data?.message || "Failed to send invitation.");
      }
    } catch (err) {
      console.error("[Invite] Network error:", err);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setInviting(false);
    }
  };

  // ── Resend Invitation Action ──────────────────────────────────────────────

  const handleResendInvite = async (invite) => {
    if (!invite?._id && !invite?.userId) return;
    const identifier = invite._id || invite.userId;
    setResendingId(identifier);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}/invitations/${identifier}/resend`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        toast.success("Invitation resent successfully!");
        fetchCollaborationData(true);
      } else {
        toast.error(data?.message || "Failed to resend invitation.");
      }
    } catch (err) {
      console.error("[ResendInvite Error]:", err);
      toast.error("Network error resending invitation.");
    } finally {
      setResendingId(null);
    }
  };

  // ── Cancel Invitation Action ──────────────────────────────────────────────

  const handleOpenCancelModal = (invite) => {
    setCancelTarget(invite);
  };

  const handleConfirmCancelInvite = async () => {
    if (!cancelTarget) return;

    setCancelling(true);
    const target = cancelTarget;
    const identifier = target._id || target.userId || "";

    try {
      const token = localStorage.getItem("token");
      let endpoint = `trips/${tripId}/invitations/${identifier}`;
      if (!identifier && target.email) {
        endpoint = `trips/${tripId}/invitations?email=${encodeURIComponent(target.email)}`;
      }

      const res = await fetch(getApiUrl(endpoint), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (res.status === 404) {
        toast.error("Pending invitation not found.");
      } else if (res.status === 403) {
        toast.error("You don't have permission to cancel this invitation.");
      } else if (!res.ok) {
        toast.error(data?.message || "Something went wrong. Please try again.");
      } else if (data?.success) {
        toast.success("Invitation cancelled successfully.");

        // Update local state immediately
        setPendingInvites(prev => prev.filter(p =>
          (identifier && p._id !== identifier && p.userId !== identifier) &&
          (p.email?.toLowerCase() !== target.email?.toLowerCase())
        ));

        fetchCollaborationData(true);
      } else {
        toast.error(data?.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("[CancelInvite] Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  // ── Leave Trip Action ─────────────────────────────────────────────────────

  const handleConfirmLeaveTrip = async () => {
    setLeaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}/leave`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        toast.success(data.message || "You have left the trip successfully.");
        navigate("/my-trips");
      } else {
        toast.error(data?.message || "Failed to leave trip.");
      }
    } catch (err) {
      console.error("[LeaveTrip Error]:", err);
      toast.error("Network error. Failed to leave trip.");
    } finally {
      setLeaving(false);
      setShowLeaveModal(false);
    }
  };

  // ── Remove Accepted Member Action ──────────────────────────────────────────

  const handleRemoveCollaborator = async (member) => {
    if (!member?.userId) return;
    if (!window.confirm(`Are you sure you want to remove ${member.name || member.email} from this trip?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}/collaborators/${member.userId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        toast.success("Member removed.");
        fetchCollaborationData(true);
      } else {
        toast.error(data?.message || "Failed to remove member.");
      }
    } catch (err) {
      console.error("[RemoveCollaborator]", err);
      toast.error("Network error removing member.");
    }
  };

  const shareLink = `${window.location.origin}/trips/${tripId}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <MainLayout>
        <TripHeaderNav trip={null} tripId={tripId} activeFeature="collaboration" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <TripHeaderNav trip={trip} tripId={tripId} activeFeature="collaboration" />

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Share &amp; Group Collaboration</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black ${isConnected ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-600"}`}>
                <Wifi size={10} className={isConnected ? "text-emerald-500 animate-pulse" : "text-slate-400"} />
                {isConnected ? "Live Sync Active" : "Connecting..."}
              </span>
            </div>
            <p className="text-base text-[#64748B] font-medium">Manage trip members, access roles, and shareable links</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh button */}
            <button
              onClick={() => fetchCollaborationData(true)}
              disabled={refreshing}
              title="Refresh collaboration data"
              className="h-11 w-11 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>

            {/* Leave Trip button for non-owners */}
            {!isOwner && (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="h-11 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                <span>Leave Trip</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="h-11 px-5 rounded-xl bg-white border border-slate-200 text-[#0F172A] font-extrabold text-xs flex items-center gap-2 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
              <span>{copiedLink ? "Link Copied!" : "Copy Invite Link"}</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <QrCode size={16} className="text-cyan-500" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* ── 2-Column workspace ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Invite form + Members list (8 cols) */}
          <div className="lg:col-span-8 space-y-8">

            {/* Invite Form Card */}
            <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-[22px] font-black text-[#0F172A]">Invite New Collaborator</h3>
                  <p className="text-xs text-[#64748B] font-medium">Send an email invitation to give friends or teammates access</p>
                </div>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  {/* Email input */}
                  <div className="relative flex-1 w-full">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      id="invite-email-input"
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="Enter collaborator email address..."
                      className={`w-full h-11 pl-10 pr-4 rounded-xl border text-sm font-bold text-[#0F172A] outline-none transition-colors ${
                        emailConflict
                          ? "border-amber-400 bg-amber-50 focus:border-amber-500"
                          : "border-slate-200 focus:border-cyan-400"
                      }`}
                    />
                  </div>

                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-xs font-black text-[#0F172A] outline-none cursor-pointer shrink-0"
                  >
                    <option value="Editor">Editor (Can Edit)</option>
                    <option value="Viewer">Viewer (View Only)</option>
                  </select>

                  {/* Send button */}
                  <button
                    type="submit"
                    id="send-invite-btn"
                    disabled={inviting || !!emailConflict}
                    className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {inviting ? (
                      <><Loader2 size={14} className="animate-spin" /> Sending...</>
                    ) : emailConflict === "pending" ? (
                      "Already Invited"
                    ) : emailConflict === "accepted" ? (
                      "Already a Collaborator"
                    ) : (
                      "Send Invite"
                    )}
                  </button>
                </div>

                {/* Inline conflict warning */}
                <AnimatePresence>
                  {emailConflict && inviteEmail.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold"
                    >
                      <AlertCircle size={14} className="text-amber-500 shrink-0" />
                      {emailConflict === "pending"  && "An invitation has already been sent to this email address."}
                      {emailConflict === "accepted" && "This user is already an active collaborator on this trip."}
                      {emailConflict === "owner"    && "That email belongs to the trip owner."}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Accepted Members Card */}
            <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[22px] font-black text-[#0F172A]">Accepted Members</h3>
                  <p className="text-xs text-[#64748B] font-medium">People with active access to this trip itinerary</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-black text-[#0F172A]">
                  {acceptedMembers.length + 1} Total
                </span>
              </div>

              <div className="space-y-4">
                {/* Owner row */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-200 shrink-0">
                      <Avatar user={trip?.owner || trip?.createdBy || user} size={44} />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" title="Online" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-[#0F172A]">
                          {trip?.owner?.firstName
                            ? `${trip.owner.firstName} ${trip.owner.lastName || ""}`.trim()
                            : (trip?.createdBy?.name || user?.name || "Trip Owner")}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black">
                          <Crown size={11} className="text-amber-500" /> Owner
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] font-medium">
                        {trip?.owner?.email || trip?.createdBy?.email || user?.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-400">Full Control</span>
                </div>

                {/* Collaborators or empty state */}
                {acceptedMembers.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center mx-auto">
                      <Users size={24} />
                    </div>
                    <h4 className="text-base font-black text-[#0F172A]">No collaborators added yet</h4>
                    <p className="text-xs text-[#64748B] font-medium max-w-sm mx-auto">
                      Invite friends or family members to plan this journey together in real time!
                    </p>
                  </div>
                ) : (
                  acceptedMembers.map((member, idx) => {
                    const isOnline = onlineUsers.has((member.userId || "").toString());
                    return (
                      <div key={member._id || idx} className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-200 shrink-0">
                            <Avatar user={{ name: member.name, avatar: member.avatar }} size={44} />
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" title="Online now" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-extrabold text-[#0F172A]">{member.name || member.email}</h4>
                              {isOnline && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-700">Online</span>
                              )}
                            </div>
                            <p className="text-xs text-[#64748B] font-medium">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-extrabold text-slate-700 capitalize">
                            {member.role || "Editor"}
                          </span>
                          {isOwner && (
                            <button
                              onClick={() => handleRemoveCollaborator(member)}
                              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove member"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: Pending invites + Activity log (4 cols) */}
          <div className="lg:col-span-4 space-y-8">

            {/* Pending Invites Card */}
            <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-black text-[#0F172A]">Pending Invitations</h3>
                </div>
                {pendingInvites.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black">
                    {pendingInvites.length}
                  </span>
                )}
              </div>

              {pendingInvites.length === 0 ? (
                <p className="text-xs text-[#64748B] font-medium text-center py-4">No pending invitations.</p>
              ) : (
                <div className="space-y-3">
                  {pendingInvites.map((invite, i) => {
                    const identifier = invite._id || invite.userId;
                    const isResending = resendingId === identifier;
                    return (
                      <div key={invite._id || i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-3 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-500 font-bold">
                              <Avatar user={{ name: invite.name || invite.email, avatar: invite.avatar }} size={32} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-[#0F172A] truncate max-w-[170px]" title={invite.email}>
                                {invite.name && invite.name !== invite.email ? invite.name : invite.email}
                              </p>
                              {invite.name && invite.name !== invite.email && (
                                <p className="text-[10px] text-[#64748B] truncate">{invite.email}</p>
                              )}
                              <p className="text-[10px] text-[#64748B] font-medium">
                                Sent {formatSentTime(invite.invitedAt)}
                              </p>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black shrink-0">
                            <Clock size={10} className="text-amber-600" /> Pending
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 flex-wrap gap-2">
                          <span className="text-[11px] font-bold text-slate-600">
                            Role: <span className="text-[#0F172A] font-extrabold">{invite.role || "Editor"}</span>
                          </span>

                          {isOwner && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleResendInvite(invite)}
                                disabled={isResending}
                                className="px-2 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-600 font-extrabold text-[10px] transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                title="Resend invitation email & notification"
                              >
                                {isResending ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <Send size={10} />
                                )}
                                Resend
                              </button>
                              <button
                                onClick={() => handleOpenCancelModal(invite)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                                title="Cancel invitation"
                              >
                                <UserX size={10} />
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity Log Card */}
            <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <History className="w-5 h-5 text-cyan-500" />
                <h3 className="text-lg font-black text-[#0F172A]">Activity Log</h3>
              </div>
              <div className="space-y-3">
                {activityLogs.length === 0 ? (
                  <p className="text-xs text-[#64748B] font-medium text-center py-2">No activity recorded yet.</p>
                ) : (
                  activityLogs.map((log, i) => (
                    <div key={log.id || log._id || i} className="flex items-start gap-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-extrabold text-[#0F172A]">{log.action}</p>
                        <span className="text-[10px] text-[#64748B] font-medium">{log.user} · {log.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Leave Trip Confirmation Modal ── */}
      <AnimatePresence>
        {showLeaveModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !leaving && setShowLeaveModal(false)}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-x-4 top-[25%] z-[999] max-w-md mx-auto bg-white rounded-[28px] p-6 space-y-5 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <LogOut size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0F172A]">Leave Shared Trip?</h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">{trip?.title}</p>
                </div>
              </div>

              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                You will lose access to this trip and it will be removed from your My Trips page. The trip owner will be notified.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  disabled={leaving}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-extrabold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLeaveTrip}
                  disabled={leaving}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {leaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Leaving...
                    </>
                  ) : (
                    "Leave Trip"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Cancel Invitation Confirmation Modal ── */}
      <AnimatePresence>
        {cancelTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !cancelling && setCancelTarget(null)}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-x-4 top-[25%] z-[999] max-w-md mx-auto bg-white rounded-[28px] p-6 space-y-5 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0F172A]">Cancel Invitation?</h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">{cancelTarget.email}</p>
                </div>
              </div>

              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                This will remove the pending invitation. The user will no longer be able to accept it.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setCancelTarget(null)}
                  disabled={cancelling}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-extrabold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCancelInvite}
                  disabled={cancelling}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {cancelling ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Removing...
                    </>
                  ) : (
                    "Remove Invitation"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── QR Code Modal ── */}
      <AnimatePresence>
        {showQrModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-x-4 top-[20%] z-[999] max-w-sm mx-auto bg-white rounded-[28px] p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="flex justify-end">
                <button onClick={() => setShowQrModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <X size={16} />
                </button>
              </div>
              <h3 className="text-xl font-black text-[#0F172A]">Scan QR Code to Join</h3>
              <div className="w-48 h-48 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 p-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareLink)}`}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-[#64748B] font-medium">Scan with your camera or Traveloop app to accept invite instantly</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default TripCollaborationPage;
