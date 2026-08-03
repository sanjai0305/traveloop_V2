import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import {
  Map,
  Search,
  Star,
  Eye,
  EyeOff,
  Check,
  X,
  Trash2,
  Calendar,
  Clock,
  User,
  Building2,
  AlertTriangle,
  Bus,
  Hotel,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  Sparkles,
  MapPin,
  IndianRupee,
  Users,
} from "lucide-react";

interface TripAgent {
  companyName: string;
  displayName: string;
  email: string;
}

interface TripDriver {
  name?: string;
  phone?: string;
  vehicleNumber?: string;
}

interface Trip {
  _id: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  destinations: string[];
  duration: string;
  startDate: string;
  endDate: string;
  pricePerPerson: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  coverImage: string;
  approvalStatus: "pending" | "approved" | "rejected" | "archived";
  isHidden: boolean;
  isFeatured: boolean;
  isDeleted?: boolean;
  status?: string;
  submittedAt?: string;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  agent?: TripAgent;
  driver?: TripDriver;
  busNumber?: string;
  vehicleType?: string;
  hotels?: any[];
  itinerary?: any[];
}

export const normalizeTrip = (rawTrip: any): Trip => {
  if (!rawTrip || typeof rawTrip !== "object") {
    return {
      _id: String(Math.random()),
      title: "Unknown Package",
      destinations: [],
      duration: "N/A",
      startDate: "N/A",
      endDate: "N/A",
      pricePerPerson: 0,
      totalSeats: 0,
      availableSeats: 0,
      bookedSeats: 0,
      coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
      approvalStatus: "pending",
      isHidden: false,
      isFeatured: false,
      isDeleted: false,
      status: "pending",
      createdAt: "",
      submittedAt: "",
      agent: { companyName: "Independent", displayName: "", email: "" },
    };
  }

  let destinations: string[] = [];
  if (Array.isArray(rawTrip.destinations)) {
    destinations = rawTrip.destinations.map((d: any) => String(d || "")).filter(Boolean);
  } else if (typeof rawTrip.destination === "string" && rawTrip.destination.trim()) {
    destinations = [rawTrip.destination.trim()];
  } else if (typeof rawTrip.destinations === "string" && rawTrip.destinations.trim()) {
    destinations = rawTrip.destinations.split(",").map((s: string) => s.trim()).filter(Boolean);
  }

  const pricePerPerson = Number(rawTrip.pricePerPerson ?? rawTrip.offerPrice ?? rawTrip.price ?? 0) || 0;
  const totalSeats = Number(rawTrip.totalSeats ?? rawTrip.seats ?? 0) || 0;
  const bookedSeats = Number(rawTrip.bookedSeats ?? rawTrip.bookedCount ?? 0) || 0;
  const availableSeats = Number(rawTrip.availableSeats ?? Math.max(0, totalSeats - bookedSeats)) || 0;

  let approvalStatus: "pending" | "approved" | "rejected" | "archived" = "pending";
  const rawAppStatus = (rawTrip.approvalStatus || "").toLowerCase();
  const rawStatus = (rawTrip.status || "").toLowerCase();

  if (
    rawAppStatus === "approved" ||
    rawStatus === "approved" ||
    rawStatus === "published" ||
    rawStatus === "active"
  ) {
    approvalStatus = "approved";
  } else if (rawAppStatus === "rejected" || rawStatus === "rejected") {
    approvalStatus = "rejected";
  } else if (rawTrip.isDeleted || rawStatus === "deleted" || rawStatus === "archived") {
    approvalStatus = "archived";
  } else {
    // Treat PENDING_APPROVAL, pending_approval, PENDING, pending all as "pending"
    approvalStatus = "pending";
  }

  const agentName = rawTrip.agentName || rawTrip.agent?.companyName || "Independent Agency";

  return {
    _id: String(rawTrip._id || Math.random()),
    title: String(rawTrip.title || "Untitled Trip Package"),
    subtitle: rawTrip.subtitle || "",
    tagline: rawTrip.tagline || "",
    destinations,
    duration: String(rawTrip.duration || "Multi-Day"),
    startDate: String(rawTrip.startDate || "N/A"),
    endDate: String(rawTrip.endDate || "N/A"),
    pricePerPerson,
    totalSeats,
    availableSeats,
    bookedSeats,
    coverImage: String(rawTrip.coverImage || rawTrip.bannerImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600"),
    approvalStatus,
    isHidden: Boolean(rawTrip.isHidden),
    isFeatured: Boolean(rawTrip.isFeatured),
    isDeleted: Boolean(rawTrip.isDeleted || rawStatus === "deleted"),
    status: String(rawTrip.status || approvalStatus),
    createdAt: rawTrip.createdAt ? String(rawTrip.createdAt) : undefined,
    submittedAt: rawTrip.submittedAt ? String(rawTrip.submittedAt) : rawTrip.createdAt ? String(rawTrip.createdAt) : undefined,
    approvedAt: rawTrip.approvedAt ? String(rawTrip.approvedAt) : undefined,
    approvedBy: rawTrip.approvedBy || undefined,
    rejectedAt: rawTrip.rejectedAt ? String(rawTrip.rejectedAt) : undefined,
    rejectedBy: rawTrip.rejectedBy || undefined,
    rejectionReason: rawTrip.rejectionReason || rawTrip.rejectReason || undefined,
    busNumber: rawTrip.busNumber || rawTrip.vehicleNumber || "",
    vehicleType: rawTrip.vehicleType || "Bus",
    hotels: Array.isArray(rawTrip.hotels) ? rawTrip.hotels : [],
    itinerary: Array.isArray(rawTrip.itinerary) ? rawTrip.itinerary : [],
    agent: {
      companyName: String(rawTrip.agent?.companyName || agentName),
      displayName: String(rawTrip.agent?.displayName || rawTrip.agentName || agentName),
      email: String(rawTrip.agent?.email || ""),
    },
    driver: {
      name: rawTrip.driverName || rawTrip.driver?.name || "Driver Unassigned",
      phone: rawTrip.driverPhone || rawTrip.driver?.phone || "",
      vehicleNumber: rawTrip.busNumber || rawTrip.driver?.vehicleNumber || "",
    },
  };
};

export const Trips: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "archived">("pending");

  // Modal states
  const [rejectModalTrip, setRejectModalTrip] = useState<Trip | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const [detailsModalTrip, setDetailsModalTrip] = useState<Trip | null>(null);

  const PRESET_REASON_OPTIONS = [
    "Missing itinerary details or incomplete schedule",
    "Incorrect or misleading pricing structure",
    "Invalid or low-quality cover images",
    "Duplicate package listing",
    "Unverified driver / transport fleet details",
  ];

  const loadTrips = async () => {
    try {
      setLoading(true);
      console.log("[Admin Trips] Fetching from real backend: GET /admin/trips");
      const res = await api.get("/admin/trips");
      if (res.data.success) {
        const rawList = res.data.trips || [];
        const normalized = Array.isArray(rawList) ? rawList.map(normalizeTrip) : [];
        console.log(`[Admin Trips] Loaded ${normalized.length} trips from MongoDB`);
        setTrips(normalized);
        // Update counts from backend if available
        if (res.data.counts) {
          console.log("[Admin Trips] Backend counts:", res.data.counts);
        }
      }
    } catch (err) {
      console.error("[Admin Trips] Failed to load trips from backend", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();

    let socket: any = null;
    try {
      const envUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
      const socketUrl = envUrl ? envUrl.replace(/\/+$/, "").replace(/\/api$/, "") : "http://localhost:5000";

      socket = io(socketUrl, {
        transports: ["polling", "websocket"],
        withCredentials: true,
        autoConnect: true,
      });

      socket.on("connect", () => {
        console.log("[Socket.io] Admin Trips: connected to backend", socketUrl);
      });

      socket.on("connect_error", (err: any) => {
        console.warn("[Socket.io] Admin Trips: connection error — falling back to polling", err.message);
      });

      const handleRealtimeUpdate = (data?: any) => {
        console.log("[Admin Trips] Real-time update received — refreshing trip list", data);
        loadTrips();
      };

      socket.on("admin:new-trip-submission", handleRealtimeUpdate);
      socket.on("admin:publication-submitted", handleRealtimeUpdate);
      socket.on("admin:trip-status-changed", handleRealtimeUpdate);
      socket.on("trip_published", handleRealtimeUpdate);
      socket.on("trip_approved", handleRealtimeUpdate);
      socket.on("trip_rejected", handleRealtimeUpdate);
      socket.on("trip_updated", handleRealtimeUpdate);
    } catch (err) {
      console.warn("[Socket.io] Admin Trips listener setup warning — using polling only:", err);
    }

    // Auto-polling fallback every 10 seconds
    const interval = setInterval(loadTrips, 10000);

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, []);

  // Filtering by search term and selected status tab
  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = trips.filter((t) => {
      const isDeleted = t.isDeleted || t.status === "deleted";
      const rawApproval = (t.approvalStatus || "").toLowerCase();
      const rawStatus = (t.status || "").toLowerCase();

      let matchesTab = false;
      if (activeTab === "archived") {
        matchesTab = isDeleted || rawApproval === "archived" || rawStatus === "archived";
      } else if (isDeleted) {
        matchesTab = false;
      } else if (activeTab === "pending") {
        // Match any pending variant — pending, pending_approval, PENDING_APPROVAL, PENDING
        matchesTab = rawApproval === "pending" || rawStatus.includes("pending");
      } else if (activeTab === "approved") {
        matchesTab = rawApproval === "approved" || rawStatus === "published" || rawStatus === "approved";
      } else if (activeTab === "rejected") {
        matchesTab = rawApproval === "rejected" || rawStatus === "rejected";
      }

      const matchesSearch =
        !term ||
        (t.title || "").toLowerCase().includes(term) ||
        (t.destinations || []).join(" ").toLowerCase().includes(term) ||
        (t.agent?.companyName || "").toLowerCase().includes(term) ||
        (t.agent?.displayName || "").toLowerCase().includes(term);

      return matchesTab && matchesSearch;
    });

    setFilteredTrips(filtered);
  }, [search, trips, activeTab]);

  // Action: Approve Trip
  const handleApproveTrip = async (tripId: string) => {
    try {
      console.log(`[Admin Trips] Approving trip ${tripId}`);
      const res = await api.post(`/admin/trips/${tripId}/approve`);
      if (res.data.success) {
        console.log(`[Admin Trips] Trip ${tripId} APPROVED — refreshing list`);
        setTrips((prev) =>
          prev.map((t) =>
            t._id === tripId
              ? normalizeTrip({ ...t, approvalStatus: "APPROVED", status: "APPROVED", published: true, visibleToTravelers: true, approvedAt: new Date().toISOString() })
              : t
          )
        );
      }
    } catch (err) {
      console.error("[Admin Trips] Failed to approve trip:", err);
      alert("Failed to approve trip. Please try again.");
    }
  };

  // Action: Open Reject Modal
  const handleOpenRejectModal = (trip: Trip) => {
    setRejectModalTrip(trip);
    setRejectReasonInput("");
  };

  // Action: Submit Rejection
  const handleConfirmRejection = async () => {
    if (!rejectModalTrip) return;
    const finalReason = rejectReasonInput.trim() || "Does not comply with platform listing policies";

    setRejectLoading(true);
    try {
      console.log(`[Admin Trips] Rejecting trip ${rejectModalTrip._id} — Reason: ${finalReason}`);
      const res = await api.post(`/admin/trips/${rejectModalTrip._id}/reject`, {
        reason: finalReason,
        rejectionReason: finalReason,
      });

      if (res.data.success) {
        console.log(`[Admin Trips] Trip ${rejectModalTrip._id} REJECTED`);
        setTrips((prev) =>
          prev.map((t) =>
            t._id === rejectModalTrip._id
              ? normalizeTrip({
                  ...t,
                  approvalStatus: "REJECTED",
                  status: "REJECTED",
                  published: false,
                  visibleToTravelers: false,
                  rejectionReason: finalReason,
                  rejectedAt: new Date().toISOString(),
                })
              : t
          )
        );
        setRejectModalTrip(null);
        setRejectReasonInput("");
      }
    } catch (err) {
      console.error("[Admin Trips] Failed to reject trip:", err);
      alert("Failed to reject trip.");
    } finally {
      setRejectLoading(false);
    }
  };

  // Action: Toggle Feature / Hide / Soft Delete
  const handleUpdateTripProperty = async (
    tripId: string,
    updates: Partial<Pick<Trip, "approvalStatus" | "isHidden" | "isFeatured">> & { action?: string }
  ) => {
    try {
      const res = await api.patch(`/admin/trips/${tripId}`, updates);
      if (res.data.success) {
        if (updates.action === "delete") {
          setTrips((prev) =>
            prev.map((t) => (t._id === tripId ? { ...t, isDeleted: true, status: "deleted", approvalStatus: "archived" } : t))
          );
        } else {
          setTrips((prev) =>
            prev.map((t) => (t._id === tripId ? normalizeTrip({ ...t, ...updates, ...res.data.trip }) : t))
          );
        }
      }
    } catch (err) {
      alert("Failed to update trip properties.");
    }
  };

  const handleRestoreTrip = async (tripId: string) => {
    try {
      const res = await api.post(`/admin/trips/${tripId}/restore`);
      if (res.data.success) {
        setTrips((prev) =>
          prev.map((t) =>
            t._id === tripId ? normalizeTrip({ ...t, isDeleted: false, status: "published", approvalStatus: "approved" }) : t
          )
        );
      }
    } catch (err) {
      alert("Failed to restore trip.");
    }
  };

  const fmtPrice = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Counts per tab — handle both uppercase (new) and lowercase (legacy) status values
  const pendingCount = trips.filter((t) => !t.isDeleted && (
    t.approvalStatus === "pending" ||
    (t.status || "").toLowerCase().includes("pending")
  )).length;
  const approvedCount = trips.filter((t) => !t.isDeleted && (
    t.approvalStatus === "approved" ||
    (t.status || "").toLowerCase() === "approved" ||
    (t.status || "").toLowerCase() === "published"
  )).length;
  const rejectedCount = trips.filter((t) => !t.isDeleted && (
    t.approvalStatus === "rejected" ||
    (t.status || "").toLowerCase() === "rejected"
  )).length;
  const archivedCount = trips.filter((t) => t.isDeleted || t.approvalStatus === "archived" || t.status === "deleted").length;

  if (loading && trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Loading Review Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-slate-800 flex items-center gap-2">
            <Map className="w-5 h-5 text-[#14B8A6]" />
            <span>Trip Moderation & Review Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review agent trip submissions, approve listings for traveler marketplace, or request revisions.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by trip, agency, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#14B8A6] text-xs text-slate-700 shadow-xs"
            />
          </div>
          <button
            onClick={loadTrips}
            title="Refresh List"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "pending"
              ? "border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <span>⏰ Pending Approval</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-black">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "approved"
              ? "border-emerald-500 text-emerald-600 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <span>🟢 Approved Packages</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-black">
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "rejected"
              ? "border-rose-500 text-rose-600 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <span>🔴 Rejected Requests</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-black">
            {rejectedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("archived")}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "archived"
              ? "border-slate-500 text-slate-700 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <span>📦 Archived</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-black">
            {archivedCount}
          </span>
        </button>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-xs flex flex-col items-center justify-center">
            <Map className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No {activeTab} trip submissions</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 font-medium">
              {activeTab === "pending"
                ? "New agent trip submissions will automatically appear here for review."
                : `There are currently no trips categorized under ${activeTab}.`}
            </p>
          </div>
        ) : (
          filteredTrips.map((trip) => {
            const isPending = trip.approvalStatus === "pending";
            const isApproved = trip.approvalStatus === "approved";
            const isRejected = trip.approvalStatus === "rejected";

            return (
              <div
                key={trip._id}
                className={`bg-white border rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 ${
                  isPending
                    ? "border-amber-300 ring-2 ring-amber-400/20"
                    : isRejected
                    ? "border-rose-200"
                    : "border-slate-200"
                }`}
              >
                <div>
                  {/* Banner Image & Badges Overlay */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={trip.coverImage}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                    {/* Top Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      {isPending && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-md animate-pulse flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Approval
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                      {trip.isFeatured && (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950 shadow-md">
                          ★ Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {trip.destinations.join(" → ") || "Destination"}
                      </p>
                      <h3 className="text-sm font-extrabold line-clamp-1 drop-shadow-md">{trip.title}</h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3 text-xs">
                    {/* Agency & Agent */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[#14B8A6] flex items-center justify-center font-bold">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase">Agency</p>
                          <p className="font-bold text-slate-800 line-clamp-1">{trip.agent?.companyName || "Independent"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase">Submitted</p>
                        <p className="font-bold text-slate-700">{formatDate(trip.submittedAt)}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl border border-slate-100 bg-white">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Departure Date</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-500" />
                          {formatDate(trip.startDate)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-100 bg-white">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Capacity & Price</span>
                        <span className="font-bold text-slate-800 block mt-0.5">
                          {fmtPrice(trip.pricePerPerson)} · {trip.totalSeats} seats
                        </span>
                      </div>
                    </div>

                    {/* Rejection Note Banner */}
                    {isRejected && trip.rejectionReason && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-1">
                        <p className="font-extrabold flex items-center gap-1 text-[11px] uppercase tracking-wider text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Reject Reason
                        </p>
                        <p className="text-xs text-rose-900 font-semibold italic">"{trip.rejectionReason}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setDetailsModalTrip(trip)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-500" />
                    <span>View Details</span>
                  </button>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Approve Action */}
                    {isPending && (
                      <button
                        onClick={() => handleApproveTrip(trip._id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                    )}

                    {/* Reject Action */}
                    {isPending && (
                      <button
                        onClick={() => handleOpenRejectModal(trip)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    )}

                    {/* Archive / Delete Action */}
                    <button
                      onClick={() => handleUpdateTripProperty(trip._id, { action: "delete" })}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
                      title="Archive Trip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── REJECTION REASON MODAL ── */}
      {rejectModalTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setRejectModalTrip(null)}
          />
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-base">
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>Reject Package Submission</span>
              </div>
              <button
                onClick={() => setRejectModalTrip(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Rejecting <strong className="text-slate-900">{rejectModalTrip.title}</strong> by{" "}
              <strong className="text-slate-900">{rejectModalTrip.agent?.companyName || "Agency"}</strong>. Please select or type the reason for rejection:
            </p>

            {/* Quick Reason Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Common Rejection Reasons
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_REASON_OPTIONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectReasonInput(reason)}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-[11px] font-semibold text-slate-600 transition-all"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Text Area */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Rejection Note for Agent *
              </label>
              <textarea
                rows={3}
                placeholder="Explain what the agent needs to modify before resubmitting..."
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium outline-none focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalTrip(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={rejectLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                {rejectLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-4 h-4" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW TRIP DETAILS MODAL ── */}
      {detailsModalTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setDetailsModalTrip(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl overflow-y-auto space-y-5 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-base">
                <Sparkles className="w-5 h-5 text-teal-500" />
                <span>Package Audit Details</span>
              </div>
              <button
                onClick={() => setDetailsModalTrip(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner Cover */}
            <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={detailsModalTrip.coverImage}
                alt={detailsModalTrip.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <p className="text-[10px] font-extrabold uppercase text-teal-300">
                  {detailsModalTrip.destinations.join(" → ")}
                </p>
                <h3 className="text-base font-extrabold">{detailsModalTrip.title}</h3>
              </div>
            </div>

            {/* Audit Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase">Hosting Agency</p>
                <p className="font-bold text-slate-800">{detailsModalTrip.agent?.companyName || "Independent"}</p>
                <p className="text-[11px] text-slate-500">{detailsModalTrip.agent?.email}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase">Travel Dates</p>
                <p className="font-bold text-slate-800">{formatDate(detailsModalTrip.startDate)}</p>
                <p className="text-[11px] text-slate-500">to {formatDate(detailsModalTrip.endDate)} ({detailsModalTrip.duration})</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase">Price & Seats</p>
                <p className="font-extrabold text-teal-600">{fmtPrice(detailsModalTrip.pricePerPerson)} / seat</p>
                <p className="text-[11px] text-slate-500">{detailsModalTrip.totalSeats} Total Seats</p>
              </div>
            </div>

            {/* Transport & Driver */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-teal-500" /> Transport & Driver Specification
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium">
                <div>Fleet Type: <strong className="text-slate-900">{detailsModalTrip.vehicleType || "Bus"} ({detailsModalTrip.busNumber || "N/A"})</strong></div>
                <div>Driver: <strong className="text-slate-900">{detailsModalTrip.driver?.name || "Unassigned"} ({detailsModalTrip.driver?.phone || "N/A"})</strong></div>
              </div>
            </div>

            {/* Actions in Modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailsModalTrip(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all"
              >
                Close Audit View
              </button>

              {detailsModalTrip.approvalStatus === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const tripToReject = detailsModalTrip;
                      setDetailsModalTrip(null);
                      handleOpenRejectModal(tripToReject);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-all flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> Reject Package
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleApproveTrip(detailsModalTrip._id);
                      setDetailsModalTrip(null);
                    }}
                    className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Approve & Publish Live
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
