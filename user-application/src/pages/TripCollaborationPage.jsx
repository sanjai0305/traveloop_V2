// src/pages/TripCollaborationPage.jsx — Full-Page Collaboration & Member Management Engine

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import TripHeaderNav from "../components/trip/TripHeaderNav";
import Avatar from "../components/common/Avatar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/mobile/MobileToast";
import { getApiUrl } from "../utils/api";
import {
  Users, Mail, UserPlus, Shield, Copy, Check, QrCode, Trash2,
  Crown, Clock, History, AlertCircle, Sparkles, ChevronRight, X
} from "lucide-react";

const TripCollaborationPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor"); // Editor | Viewer
  const [inviting, setInviting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [collaborators, setCollaborators] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`trips/${tripId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.trip) {
          setTrip(data.trip);
          setCollaborators(data.trip.collaborators || []);
          setPendingInvites(data.trip.pendingInvites || []);
          setActivityLogs(data.trip.activityLogs || [
            { id: 1, action: "Trip created", user: data.trip.createdBy?.name || "Trip Owner", time: "Just now" }
          ]);
        }
      } catch (err) {
        toast.error("Failed to load trip details");
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!tripId) {
      toast.error("Trip ID is missing.");
      return;
    }
    const email = inviteEmail.trim();
    if (!email) {
      toast.error("Please enter an email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const payload = { email, role: inviteRole || "viewer" };
    console.log("[Invite Request Payload]:", { tripId, ...payload });

    setInviting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}/invite`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log("[Invite Response Data]:", data);
      if (res.ok && data.success) {
        toast.success(data.message || `Invite sent to ${email}!`);
        setPendingInvites(prev => [...prev, { email, role: inviteRole, status: "Pending", date: "Just now" }]);
        setInviteEmail("");
      } else {
        toast.error(data.message || "Failed to send invitation");
      }
    } catch (err) {
      console.error("[Invite Fetch Error]:", err);
      toast.error("Network error sending invite");
    } finally {
      setInviting(false);
    }
  };

  const shareLink = `${window.location.origin}/trips/${tripId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isOwner = trip?.createdBy?._id === user?._id || trip?.createdBy === user?._id;

  return (
    <MainLayout>
      <TripHeaderNav trip={trip} tripId={tripId} activeFeature="collaboration" />

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Share & Group Collaboration</h1>
            <p className="text-base text-[#64748B] font-medium mt-0.5">Manage trip members, access roles, and shareable links</p>
          </div>

          <div className="flex items-center gap-3">
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

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── 2-COLUMN MAIN WORKSPACE ───────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: INVITE & MEMBERS MANAGEMENT (8 Cols) */}
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

              <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="Enter collaborator email address..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0F172A] outline-none focus:border-cyan-400"
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

                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </form>
            </div>

            {/* Accepted Members List Card */}
            <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[22px] font-black text-[#0F172A]">Accepted Members</h3>
                  <p className="text-xs text-[#64748B] font-medium">People with active access to this trip itinerary</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-black text-[#0F172A]">
                  {collaborators.length + 1} Total
                </span>
              </div>

              {/* Members List */}
              <div className="space-y-4">
                {/* Owner Row */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 shrink-0">
                      <Avatar user={trip?.createdBy || user} size={44} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-[#0F172A]">{trip?.createdBy?.name || user?.name || "Trip Owner"}</h4>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black">
                          <Crown size={11} className="text-amber-500" /> Owner
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] font-medium">{trip?.createdBy?.email || user?.email}</p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-slate-400">Full Control</span>
                </div>

                {/* Collaborators List or Empty State */}
                {collaborators.length === 0 ? (
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
                  collaborators.map((member, idx) => (
                    <div key={member._id || idx} className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 shrink-0">
                          <Avatar user={member} size={44} />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-[#0F172A]">{member.name || member.email}</h4>
                          <p className="text-xs text-[#64748B] font-medium">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-extrabold text-slate-700">
                          {member.role || "Editor"}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => {
                              setCollaborators(prev => prev.filter((_, i) => i !== idx));
                              toast.success("Member removed");
                            }}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Remove member"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: PENDING INVITES & ACTIVITY TIMELINE (4 Cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Pending Invites Card */}
            <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-[#0F172A]">Pending Invites</h3>
              </div>

              {pendingInvites.length === 0 ? (
                <p className="text-xs text-[#64748B] font-medium text-center py-4">No pending email invites.</p>
              ) : (
                <div className="space-y-3">
                  {pendingInvites.map((invite, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-extrabold text-[#0F172A] truncate max-w-[160px]">{invite.email}</p>
                        <span className="text-[10px] text-amber-600 font-bold">Pending Accept</span>
                      </div>
                      <button
                        onClick={() => {
                          setPendingInvites(prev => prev.filter((_, idx) => idx !== i));
                          toast.success("Invite cancelled");
                        }}
                        className="text-xs font-bold text-rose-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Member Activity Log Card */}
            <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <History className="w-5 h-5 text-cyan-500" />
                <h3 className="text-lg font-black text-[#0F172A]">Activity Log</h3>
              </div>

              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-extrabold text-[#0F172A]">{log.action}</p>
                      <span className="text-[10px] text-[#64748B] font-medium">{log.user} · {log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQrModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQrModal(false)} className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed inset-x-4 top-[20%] z-[999] max-w-sm mx-auto bg-white rounded-[28px] p-6 text-center space-y-4 shadow-2xl">
              <div className="flex justify-end">
                <button onClick={() => setShowQrModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <X size={16} />
                </button>
              </div>
              <h3 className="text-xl font-black text-[#0F172A]">Scan QR Code to Join</h3>
              <div className="w-48 h-48 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 p-2">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareLink)}`} alt="QR Code" className="w-full h-full object-contain" />
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
