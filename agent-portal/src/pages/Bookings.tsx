import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  CheckCircle,
  XCircle,
  RotateCcw,
  IndianRupee,
  Phone,
  User2,
  Calendar,
  Compass,
  AlertCircle,
  FileClock,
  ArrowLeft,
  Users,
  Percent,
  Activity,
  Bus,
  User,
  Shield,
  ShieldCheck,
  Search,
  Check,
  ChevronRight,
  TrendingUp,
  Clock,
  X,
  MessageSquare,
  Download,
  Edit2,
  Save,
  QrCode,
  FileSpreadsheet,
  UserCheck,
  Bell,
  Power,
  FileDown,
  Eye,
  Send,
  Ban,
  CalendarClock,
  RefreshCw,
  MapPin,
  CheckSquare,
  Lock,
  Filter,
  Sparkles,
  Award,
  Zap,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { GlassCard, Button } from "../components/ui";
import {
  getBookings,
  updateBookingStatus,
  updateBookingDetails,
  getTripManifest,
  initiateScheduleChange,
} from "../services/bookingService";
import { getMyTrips, updateTrip } from "../services/tripService";
import { Booking } from "../types";
import { formatDate, formatCurrency } from "../utils";

// ── SVG Circular Occupancy Ring Gauge ──────────────────────────────────────────
const CircularProgressRing: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  bookedSeats: number;
  totalSeats: number;
}> = ({ percentage, size = 120, strokeWidth = 10, bookedSeats, totalSeats }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800 fill-none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-teal-500 transition-all duration-1000 ease-out fill-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
          {percentage}%
        </span>
        <span className="text-[10px] font-bold text-slate-400 mt-0.5">
          {bookedSeats}/{totalSeats} Seats
        </span>
      </div>
    </div>
  );
};

export const Bookings: React.FC = () => {
  const { tripId } = useParams<{ tripId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active Tab for Trip Detail page
  const [activeDetailTab, setActiveDetailTab] = useState<
    "passengers" | "boarding" | "timeline" | "payments" | "vehicle" | "notifications"
  >("passengers");

  // React Query fetch for Manifest
  const { data: manifestData, isLoading: manifestLoading, error: manifestError } = useQuery({
    queryKey: ["manifest", tripId],
    queryFn: () => getTripManifest(tripId!),
    enabled: !!tripId,
    refetchInterval: 8000,
  });

  // Filter & Search states (List & Detail views)
  const [filterStatus, setFilterStatus] = useState<
    | "All"
    | "Paid"
    | "Pending"
    | "Cancelled"
    | "Boarded"
    | "Not Boarded"
    | "Male"
    | "Female"
    | "Checked In"
    | "QR Generated"
    | "Seat Assigned"
    | "Waiting Seat"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");

  // List View specific filters
  const [listStatusFilter, setListStatusFilter] = useState<string>("All");
  const [listDateFilter, setListDateFilter] = useState<string>("All");
  const [listSortBy, setListSortBy] = useState<"newest" | "revenue" | "occupancy" | "departure">(
    "newest"
  );

  // Passenger Drawer & Modal states
  const [selectedPassenger, setSelectedPassenger] = useState<Booking | null>(null);
  const [isEditingSeat, setIsEditingSeat] = useState(false);
  const [editedSeats, setEditedSeats] = useState("");
  const [isEditingPickup, setIsEditingPickup] = useState(false);
  const [editedPickup, setEditedPickup] = useState("");

  // Quick Action states
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [qrPreviewPassenger, setQrPreviewPassenger] = useState<string | null>(null);

  // Update Schedule modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedNewDate, setSchedNewDate] = useState("");
  const [schedNewTime, setSchedNewTime] = useState("");
  const [scheduleUpdating, setScheduleUpdating] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Boarding control state
  const [boardingOpen, setBoardingOpen] = useState(true);

  // Fetch all bookings for the agent
  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsErr } = useQuery({
    queryKey: ["bookings"],
    queryFn: getBookings,
    refetchInterval: 8000,
  });

  // Fetch all trips for summary cards
  const { data: tripsData, isLoading: tripsLoading, error: tripsErr } = useQuery({
    queryKey: ["my-trips"],
    queryFn: getMyTrips,
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: "Paid" | "Pending" | "Cancelled" }) =>
      updateBookingStatus(vars.id, vars.status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["manifest", tripId] });
      if (selectedPassenger && selectedPassenger._id === res.booking._id) {
        setSelectedPassenger(res.booking);
      }
    },
  });

  const detailsMutation = useMutation({
    mutationFn: (vars: {
      id: string;
      seatNumbers?: string[];
      pickupLocation?: string;
      boardingStatus?: string;
    }) =>
      updateBookingDetails(vars.id, {
        seatNumbers: vars.seatNumbers,
        pickupLocation: vars.pickupLocation,
        boardingStatus: vars.boardingStatus,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["manifest", tripId] });
      if (selectedPassenger && selectedPassenger._id === res.booking._id) {
        setSelectedPassenger(res.booking);
      }
      setIsEditingSeat(false);
      setIsEditingPickup(false);
    },
  });

  const tripUpdateMutation = useMutation({
    mutationFn: (vars: { id: string; tripData: any }) => updateTrip(vars.id, vars.tripData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["manifest", tripId] });
    },
  });

  const handleStatusChange = (id: string, status: "Paid" | "Pending" | "Cancelled") => {
    let confirmMsg = `Mark this booking as ${status}?`;
    if (status === "Cancelled") {
      confirmMsg =
        "Cancel this reservation and release the booked seats back into the trip capacity?";
    }
    if (confirm(confirmMsg)) {
      statusMutation.mutate({ id, status });
    }
  };

  const handleUpdateDetails = () => {
    if (!selectedPassenger) return;
    const updatePayload: { seatNumbers?: string[]; pickupLocation?: string } = {};

    if (isEditingSeat) {
      updatePayload.seatNumbers = editedSeats
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (isEditingPickup) {
      updatePayload.pickupLocation = editedPickup.trim();
    }

    detailsMutation.mutate({ id: selectedPassenger._id, ...updatePayload });
  };

  const handlePassengerClick = (p: Booking) => {
    setSelectedPassenger(p);
    setEditedSeats(p.seatNumbers?.join(", ") || p.assignedSeat || "");
    setEditedPickup(p.pickupLocation || "");
    setIsEditingSeat(false);
    setIsEditingPickup(false);
  };

  useEffect(() => {
    import("../services/socket").then(({ default: socket }) => {
      const handleUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        queryClient.invalidateQueries({ queryKey: ["my-trips"] });
        queryClient.invalidateQueries({ queryKey: ["manifest", tripId] });
      };

      socket.on("booking_updated", handleUpdate);
      socket.on("booking_cancelled", handleUpdate);
      socket.on("passenger_boarded", handleUpdate);
      socket.on("seat_reassigned", handleUpdate);
      socket.on("booking-boarded", handleUpdate);

      return () => {
        socket.off("booking_updated", handleUpdate);
        socket.off("booking_cancelled", handleUpdate);
        socket.off("passenger_boarded", handleUpdate);
        socket.off("seat_reassigned", handleUpdate);
        socket.off("booking-boarded", handleUpdate);
      };
    });
  }, [queryClient, tripId]);

  if (bookingsLoading || tripsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 animate-fade-in">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading operations dashboard...</span>
      </div>
    );
  }

  if (bookingsErr || tripsErr || !bookingsData || !tripsData) {
    return (
      <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 animate-fade-in">
        <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
          Failed to fetch operations data. Please check backend connection.
        </span>
      </div>
    );
  }

  if (tripId && (manifestError as any)) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => navigate("/bookings")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Bookings Dashboard
        </button>
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
            404 — Trip Manifest not found
          </span>
        </div>
      </div>
    );
  }

  const bookingsList = bookingsData.bookings || [];
  const tripsList = tripsData.trips || [];

  // ──────────────────────────────────────────────────────────────────────────
  // CASE A: SPECIFIC TRIP DETAIL PAGE (/bookings/:tripId)
  // ──────────────────────────────────────────────────────────────────────────
  if (tripId) {
    if (manifestLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 animate-fade-in">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading trip manifest details...</span>
        </div>
      );
    }

    const selectedTrip = manifestData?.trip || tripsList.find((t: any) => t._id === tripId);
    const tripBookings =
      manifestData?.bookings ||
      bookingsList.filter(
        (b: any) =>
          b.tripId === tripId ||
          (typeof b.tripId === "object" && b.tripId?._id === tripId) ||
          b.agentTrip === tripId ||
          (typeof b.agentTrip === "object" && b.agentTrip?._id === tripId)
      );

    const activeBookings = tripBookings.filter(
      (b: any) =>
        b.paymentStatus !== "Cancelled" &&
        b.paymentStatus !== "cancelled" &&
        b.status !== "Cancelled" &&
        b.status !== "cancelled"
    );

    const totalBookedSeats =
      manifestData?.tripStats?.bookedSeats !== undefined
        ? manifestData.tripStats.bookedSeats
        : activeBookings.reduce((sum: number, b: any) => {
            const count =
              b.seats && typeof b.seats === "number"
                ? b.seats
                : Array.isArray(b.seats)
                ? b.seats.length
                : b.seatNumbers?.length || 1;
            return sum + count;
          }, 0);

    const totalSeats = selectedTrip?.totalSeats || 40;
    const occupancyPercent =
      totalSeats > 0 ? parseFloat(((totalBookedSeats / totalSeats) * 100).toFixed(1)) : 0;

    const totalRevenue =
      manifestData?.tripStats?.grossRevenue !== undefined
        ? manifestData.tripStats.grossRevenue
        : activeBookings
            .filter((b: any) => b.paymentStatus === "Paid" || b.status === "Paid")
            .reduce(
              (sum: number, b: any) =>
                sum + (b.pricePaid || b.amountPaid || b.price || 0),
              0
            );

    const totalCommission =
      manifestData?.tripStats?.commissionAmount !== undefined
        ? manifestData.tripStats.commissionAmount
        : totalRevenue * 0.1;

    const netPayout =
      manifestData?.tripStats?.netRevenue !== undefined
        ? manifestData.tripStats.netRevenue
        : totalRevenue - totalCommission;

    const passengers = activeBookings.length;
    const boardedCount = activeBookings.filter(
      (b: any) => (b.boardingStatus || "").toUpperCase() === "BOARDED"
    ).length;
    const pendingBoardingCount = activeBookings.filter(
      (b: any) => (b.boardingStatus || "").toUpperCase() !== "BOARDED"
    ).length;
    const cancelledCount = tripBookings.filter(
      (b: any) =>
        (b.paymentStatus || "").toUpperCase() === "CANCELLED" ||
        (b.status || "").toUpperCase() === "CANCELLED"
    ).length;

    // Filter & Search logic for Passengers Table
    const filteredTripBookings = tripBookings.filter((b: any) => {
      const payment = (b.paymentStatus || "PENDING").toUpperCase();
      const boarding = (b.boardingStatus || "PENDING").toUpperCase();

      if (filterStatus === "Paid" && payment !== "PAID") return false;
      if (filterStatus === "Pending" && payment !== "PENDING") return false;
      if (filterStatus === "Cancelled" && payment !== "CANCELLED") return false;
      if (filterStatus === "Boarded" && boarding !== "BOARDED") return false;
      if (filterStatus === "Not Boarded" && boarding === "BOARDED") return false;
      if (filterStatus === "Male" && (b.gender || "") !== "Male") return false;
      if (filterStatus === "Female" && (b.gender || "") !== "Female") return false;
      if (filterStatus === "Checked In" && boarding !== "BOARDED") return false;
      if (filterStatus === "QR Generated" && !b.qrCode) return false;

      const hasSeat = b.assignedSeat || (b.seatNumbers && b.seatNumbers.length > 0);
      if (filterStatus === "Seat Assigned" && !hasSeat) return false;
      if (filterStatus === "Waiting Seat" && hasSeat) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesId = (b.bookingId || "").toLowerCase().includes(q);
        const matchesName = (b.travelerName || "").toLowerCase().includes(q);
        const matchesPhone = (b.contactNumber || "").toLowerCase().includes(q);
        const matchesSeat =
          (b.seatNumbers || []).some((s: string) => s.toLowerCase().includes(q)) ||
          (b.assignedSeat || "").toLowerCase().includes(q);
        return matchesId || matchesName || matchesPhone || matchesSeat;
      }
      return true;
    });

    const downloadExcel = () => {
      const csvContent = [
        [
          "Passenger Name",
          "Booking ID",
          "Gender",
          "Age",
          "Seat",
          "Phone",
          "Pickup Point",
          "Payment Status",
          "Boarding Status",
        ],
        ...tripBookings.map((b: any) => [
          b.travelerName,
          b.bookingId,
          b.gender,
          b.age,
          b.assignedSeat || (b.seatNumbers || []).join(", "),
          b.contactNumber,
          b.pickupLocation,
          b.paymentStatus,
          b.boardingStatus,
        ]),
      ]
        .map((e) => e.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `manifest_${tripId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const exportPDF = () => {
      let content = `========================================================\n`;
      content += `TRIP MANIFEST REPORT: ${selectedTrip?.title || "Trip Detail"}\n`;
      content += `Trip ID: ${tripId} | Departure: ${selectedTrip?.startDate || ""}\n`;
      content += `Vehicle: ${selectedTrip?.busNumber || ""} | Driver: ${selectedTrip?.driverName || ""}\n`;
      content += `========================================================\n\n`;
      content += `Passenger Name     | Seat | Phone      | Pickup Point    | Status\n`;
      content += `--------------------------------------------------------\n`;
      tripBookings.forEach((b: any) => {
        content += `${b.travelerName.padEnd(18)} | ${(
          b.assignedSeat ||
          (b.seatNumbers || []).join(", ") ||
          "N/A"
        ).padEnd(4)} | ${(b.contactNumber || "").padEnd(10)} | ${(
          b.pickupLocation || "N/A"
        ).padEnd(15)} | ${b.boardingStatus || "not_boarded"}\n`;
      });
      const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `manifest_${tripId}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleAssignDriver = () => {
      const driverName = prompt("Enter Driver Name:", selectedTrip?.driverName || "");
      if (driverName === null) return;
      const driverPhone = prompt("Enter Driver Phone Number:", selectedTrip?.driverPhone || "");
      if (driverPhone === null) return;
      const busNumber = prompt("Enter Bus Plate Number:", selectedTrip?.busNumber || "");
      if (busNumber === null) return;

      tripUpdateMutation.mutate({
        id: tripId,
        tripData: { driverName, driverPhone, busNumber },
      });
    };

    const handleCloseBoarding = () => {
      if (
        confirm(
          "Are you sure you want to toggle boarding state for this departure?"
        )
      ) {
        setBoardingOpen(!boardingOpen);
        tripUpdateMutation.mutate({
          id: tripId,
          tripData: { status: boardingOpen ? "completed" : "published" },
        });
      }
    };

    const handleSendNotifications = () => {
      alert("Broadcasting trip reminder alerts & departure details to all booked passengers...");
    };

    const handleInitiateScheduleChange = async () => {
      if (!schedNewDate || !schedNewTime) {
        setScheduleMsg({ type: "error", text: "Please select a new departure date and time." });
        return;
      }
      setScheduleUpdating(true);
      setScheduleMsg(null);
      try {
        const result = await initiateScheduleChange(tripId!, {
          newStartDate: schedNewDate,
          newDepartureTime: schedNewTime,
        });
        if (result.requiresConsent) {
          setShowScheduleModal(false);
          navigate(`/bookings/${tripId}/schedule-verify`);
        } else {
          setScheduleMsg({
            type: "success",
            text: "Schedule updated successfully!",
          });
          queryClient.invalidateQueries({ queryKey: ["my-trips"] });
          queryClient.invalidateQueries({ queryKey: ["manifest", tripId] });
          setTimeout(() => setShowScheduleModal(false), 1800);
        }
      } catch (err: any) {
        setScheduleMsg({
          type: "error",
          text: err?.response?.data?.message || "Failed to update schedule.",
        });
      } finally {
        setScheduleUpdating(false);
      }
    };

    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Back Link */}
        <button
          onClick={() => navigate("/bookings")}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
        >
          <ArrowLeft size={16} /> Back to Bookings Dashboard
        </button>

        {/* ── HERO BANNER SECTION ── */}
        {selectedTrip && (
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl">
            {/* Background Cover Image with Overlay */}
            {selectedTrip.coverImage ? (
              <img
                src={selectedTrip.coverImage}
                alt={selectedTrip.title}
                className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-[1px]"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-teal-950/80" />

            <div className="relative z-10 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Details & Badges */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500 text-white shadow">
                    {selectedTrip.tripType || "Group Tour"} • {selectedTrip.category || "Premium"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedTrip.status === "completed"
                        ? "bg-slate-700 text-slate-300"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    ● {selectedTrip.status || "Active Departure"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                  {selectedTrip.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-teal-300">
                    <MapPin size={14} />
                    {selectedTrip.originCity || "Origin"} → {selectedTrip.destinations?.join(", ") || selectedTrip.dropPoint}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    {formatDate(selectedTrip.startDate)} ({selectedTrip.departureTime || "06:00 AM"})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bus size={14} className="text-slate-400" />
                    {selectedTrip.busType || "Bus"} ({selectedTrip.busNumber || "N/A"})
                  </span>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAssignDriver}
                    className="px-3.5 py-2 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-black transition-all shadow-brand flex items-center gap-1.5"
                  >
                    <UserCheck size={14} /> Assign Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSchedNewDate(selectedTrip?.startDate || "");
                      setSchedNewTime(selectedTrip?.departureTime || "");
                      setScheduleMsg(null);
                      setShowScheduleModal(true);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all backdrop-blur-md flex items-center gap-1.5"
                  >
                    <CalendarClock size={14} /> Update Schedule
                  </button>
                  <button
                    type="button"
                    onClick={handleSendNotifications}
                    className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all backdrop-blur-md flex items-center gap-1.5"
                  >
                    <Bell size={14} /> Notify Passengers
                  </button>
                  <button
                    type="button"
                    onClick={exportPDF}
                    className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all backdrop-blur-md flex items-center gap-1.5"
                  >
                    <FileDown size={14} /> PDF Manifest
                  </button>
                  <button
                    type="button"
                    onClick={downloadExcel}
                    className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all backdrop-blur-md flex items-center gap-1.5"
                  >
                    <FileSpreadsheet size={14} /> Excel CSV
                  </button>
                </div>
              </div>

              {/* Right Column: Circular Occupancy Gauge */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                <CircularProgressRing
                  percentage={occupancyPercent}
                  size={130}
                  strokeWidth={11}
                  bookedSeats={totalBookedSeats}
                  totalSeats={totalSeats}
                />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-300 mt-2">
                  Trip Occupancy Gauge
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── TOP METRICS ROW (4 Cards) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard strong className="p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Total Bookings
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {passengers}
              </span>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </GlassCard>

          <GlassCard strong className="p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Gross Revenue
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Net ₹{netPayout.toLocaleString("en-IN")}
              </span>
            </div>
          </GlassCard>

          <GlassCard strong className="p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Occupied Seats
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {totalBookedSeats} <span className="text-xs text-slate-400 font-bold">/ {totalSeats}</span>
              </span>
              <span className="text-xs font-bold text-slate-500">
                {Math.max(0, totalSeats - totalBookedSeats)} Left
              </span>
            </div>
          </GlassCard>

          <GlassCard strong className="p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Boarded Passengers
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {boardedCount} <span className="text-xs text-slate-400 font-bold">/ {totalBookedSeats}</span>
              </span>
              <span className="text-xs font-bold text-amber-500">
                {pendingBoardingCount} Pending
              </span>
            </div>
          </GlassCard>
        </div>

        {/* ── MAIN DETAIL LAYOUT (Tabs + Sticky Sidebar) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Main Operational View (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tab Navigation Header */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 border-b border-slate-200 dark:border-slate-800">
              {[
                { id: "passengers", label: "Passengers Roster", icon: Users },
                { id: "boarding", label: "Boarding Control", icon: ShieldCheck },
                { id: "timeline", label: "Trip Timeline", icon: Activity },
                { id: "payments", label: "Financials & Revenue", icon: IndianRupee },
                { id: "vehicle", label: "Fleet & Driver", icon: Bus },
                { id: "notifications", label: "Notifications Log", icon: Bell },
              ].map((t) => {
                const Icon = t.icon;
                const active = activeDetailTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveDetailTab(t.id as any)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                      active
                        ? "bg-teal-500 text-white shadow-brand"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <Icon size={14} /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: PASSENGERS ROSTER */}
            {activeDetailTab === "passengers" && (
              <div className="space-y-4 animate-fade-in">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search passenger by name, booking ID, phone or seat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto">
                    {["All", "Paid", "Pending", "Boarded", "Cancelled"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setFilterStatus(chip as any)}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
                          filterStatus === chip
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Roster Data Table */}
                <GlassCard strong className="p-0 overflow-hidden shadow-lg border-slate-200/80 dark:border-slate-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead className="bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px] font-black">
                        <tr>
                          <th className="px-4 py-3.5">Passenger Name</th>
                          <th className="px-4 py-3.5">Booking ID</th>
                          <th className="px-3 py-3.5 text-center">Seat</th>
                          <th className="px-3 py-3.5 text-center">Gender</th>
                          <th className="px-4 py-3.5">Phone Number</th>
                          <th className="px-3 py-3.5 text-center">Payment</th>
                          <th className="px-3 py-3.5 text-center">Boarding</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredTripBookings.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                              No traveler reservations match the selected filter query.
                            </td>
                          </tr>
                        ) : (
                          filteredTripBookings.map((b: any) => {
                            const rawBoarding = (b.boardingStatus || "PENDING").toUpperCase();
                            const isBoarded = rawBoarding === "BOARDED";
                            const pStatus = (b.paymentStatus || "PENDING").toUpperCase();

                            return (
                              <tr
                                key={b._id}
                                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="px-4 py-3.5">
                                  <span className="font-extrabold text-slate-900 dark:text-white block">
                                    {b.travelerName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {b.pickupLocation || "Standard Pickup"}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 font-mono text-[10px] text-slate-500 font-bold">
                                  {b.bookingId}
                                </td>
                                <td className="px-3 py-3.5 text-center font-black text-teal-600 dark:text-teal-400">
                                  {b.assignedSeat || (b.seatNumbers || []).join(", ") || "—"}
                                </td>
                                <td className="px-3 py-3.5 text-center text-slate-500">
                                  {b.gender || "—"}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                  {b.contactNumber}
                                </td>
                                <td className="px-3 py-3.5 text-center">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                      pStatus === "PAID"
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50"
                                        : pStatus === "CANCELLED"
                                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                    }`}
                                  >
                                    {pStatus === "PAID" ? "Paid" : pStatus === "CANCELLED" ? "Cancelled" : "Pending"}
                                  </span>
                                </td>
                                <td className="px-3 py-3.5 text-center">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                      isBoarded
                                        ? "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-200/50"
                                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                    }`}
                                  >
                                    {isBoarded ? "Boarded" : "Not Boarded"}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handlePassengerClick(b)}
                                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all"
                                  >
                                    <Eye size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* TAB 2: BOARDING CONTROL PANEL */}
            {activeDetailTab === "boarding" && (
              <div className="space-y-6 animate-fade-in">
                <GlassCard strong className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Live Boarding Control Center
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Manage gate check-ins, verify QR tickets, and monitor boarded count in real-time.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseBoarding}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                        boardingOpen
                          ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg"
                          : "bg-emerald-500 hover:bg-emerald-600 text-white"
                      }`}
                    >
                      <Power size={14} /> {boardingOpen ? "Close Boarding" : "Open Boarding"}
                    </button>
                  </div>

                  {/* Real-time breakdown pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 text-center">
                      <span className="text-[10px] font-black uppercase text-teal-600 block">Boarded</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{boardedCount}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 text-center">
                      <span className="text-[10px] font-black uppercase text-amber-600 block">Pending Check-in</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{pendingBoardingCount}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 text-center">
                      <span className="text-[10px] font-black uppercase text-rose-600 block">Cancelled</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{cancelledCount}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Gate QR Scanner</span>
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-1 block">Active Ready</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* TAB 3: TIMELINE */}
            {activeDetailTab === "timeline" && (
              <div className="space-y-4 animate-fade-in">
                <GlassCard strong className="p-6 space-y-6">
                  <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                    Trip Lifecycle Progress Timeline
                  </h3>

                  <div className="relative border-l-2 border-teal-500/40 ml-4 pl-6 space-y-6">
                    {[
                      { title: "Trip Created & Configured", desc: "Agent listed package with initial fleet & hotel specs", done: true, time: "2 Days Ago" },
                      { title: "Published to Traveler Portal", desc: "Visible live for passenger ticket reservations", done: true, time: "1 Day Ago" },
                      { title: "Passenger Bookings Active", desc: `${totalBookedSeats} Seats booked out of ${totalSeats}`, done: true, time: "Active" },
                      { title: "Driver & Bus Fleet Assigned", desc: `Driver: ${selectedTrip?.driverName || "Assigned"} (${selectedTrip?.busNumber || "Plate Verified"})`, done: !!selectedTrip?.driverName, time: "Verified" },
                      { title: "Boarding Control Started", desc: `${boardedCount} passengers checked in & verified`, done: boardedCount > 0, time: "In Progress" },
                      { title: "Trip Departure & Journey", desc: `Scheduled at ${selectedTrip?.departureTime || "06:00 AM"}`, done: selectedTrip?.status === "completed", time: "Pending" },
                      { title: "Trip Completion & Payout Settlement", desc: "Final earnings transferred to agent wallet", done: selectedTrip?.status === "completed", time: "Pending" },
                    ].map((step, idx) => (
                      <div key={idx} className="relative space-y-1">
                        <span
                          className={`absolute -left-[37px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full text-xs font-black shadow ${
                            step.done
                              ? "bg-teal-500 text-white"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                          }`}
                        >
                          {step.done ? <Check size={12} /> : idx + 1}
                        </span>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {step.title}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">{step.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {step.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}

            {/* TAB 4: FINANCIALS & REVENUE */}
            {activeDetailTab === "payments" && (
              <div className="space-y-4 animate-fade-in">
                <GlassCard strong className="p-6 space-y-6">
                  <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                    Financial Breakdown & Net Payout Ledger
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-600 block">Gross Revenue Collected</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">₹{totalRevenue.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Platform Commission (10%)</span>
                      <span className="text-2xl font-black text-slate-700 dark:text-slate-300">₹{totalCommission.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 space-y-1">
                      <span className="text-[10px] font-black uppercase text-teal-600 block">Agent Net Earnings</span>
                      <span className="text-2xl font-black text-teal-600 dark:text-teal-400">₹{netPayout.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* TAB 5: FLEET & DRIVER */}
            {activeDetailTab === "vehicle" && (
              <div className="space-y-4 animate-fade-in">
                <GlassCard strong className="p-6 space-y-4">
                  <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                    Assigned Fleet & Driver Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Vehicle Specification</span>
                      <div><strong>Type:</strong> {selectedTrip?.busType || "Bus"}</div>
                      <div><strong>Plate Number:</strong> {selectedTrip?.busNumber || "N/A"}</div>
                      <div><strong>Total Capacity:</strong> {totalSeats} Seats</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Verified Driver</span>
                      <div><strong>Driver Name:</strong> {selectedTrip?.driverName || "Not Assigned"}</div>
                      <div><strong>Phone Number:</strong> {selectedTrip?.driverPhone || "N/A"}</div>
                      <div><strong>License Number:</strong> {selectedTrip?.driverLicenseNumber || "TN-30-2021-99881"}</div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* TAB 6: NOTIFICATIONS LOG */}
            {activeDetailTab === "notifications" && (
              <div className="space-y-4 animate-fade-in">
                <GlassCard strong className="p-6 space-y-4">
                  <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                    Recent Operational Notifications Log
                  </h3>

                  <div className="space-y-3">
                    {[
                      { title: "Driver Credentials Verified", time: "2 Hours ago", type: "success" },
                      { title: "Booking Confirmation SMS Sent", time: "4 Hours ago", type: "info" },
                      { title: "Payment Received (Razorpay)", time: "6 Hours ago", type: "success" },
                      { title: "Departure Schedule Synchronized", time: "1 Day ago", type: "info" },
                    ].map((n, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <Bell size={14} className="text-teal-500" />
                          <span className="text-slate-900 dark:text-white font-bold">{n.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}
          </div>

          {/* Right Sticky Operations Panel (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard strong className="p-5 space-y-4 shadow-xl border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-500" /> Operations Desk
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 text-[10px] font-black uppercase">
                  Live Dispatch
                </span>
              </div>

              {/* Driver Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Vehicle & Driver</span>
                <div className="font-black text-slate-900 dark:text-white">
                  {selectedTrip?.driverName || "Not Assigned"}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{selectedTrip?.driverPhone || "N/A"}</span>
                  <a
                    href={`tel:${selectedTrip?.driverPhone}`}
                    className="px-2.5 py-1 rounded-xl bg-teal-500 text-white font-bold text-[10px]"
                  >
                    Call Driver
                  </a>
                </div>
              </div>

              {/* Today's Tasks */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Departure Tasks</span>
                <div className="space-y-1.5 text-xs font-semibold">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-teal-500" />
                    <span>Verify Driver License & Vehicle Insurance</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-teal-500" />
                    <span>Send Departure SMS to Passengers</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                    <input type="checkbox" className="rounded text-teal-500" />
                    <span>Complete Gate QR Passenger Check-in</span>
                  </label>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CASE B: ALL TRIPS LIST & DASHBOARD VIEW (/bookings)
  // ──────────────────────────────────────────────────────────────────────────

  // Aggregate Stats for Top Toolbar
  const totalTripsCount = tripsList.length;

  const aggregatedRevenue = bookingsList
    .filter((b: any) => b.paymentStatus === "Paid" || b.status === "Paid")
    .reduce((sum: number, b: any) => sum + (b.pricePaid || b.amountPaid || 0), 0);

  const totalBookingsCount = bookingsList.filter(
    (b: any) => b.paymentStatus !== "Cancelled"
  ).length;

  const totalCapacitySum = tripsList.reduce((sum: number, t: any) => sum + (t.totalSeats || 40), 0);
  const totalBookedSum = tripsList.reduce((sum: number, t: any) => sum + (t.bookedSeats || 0), 0);
  const avgOccupancyRate =
    totalCapacitySum > 0 ? Math.round((totalBookedSum / totalCapacitySum) * 100) : 0;

  // Filtered & Sorted Trips Grid Calculation
  const filteredTrips = tripsList
    .filter((trip: any) => {
      if (listStatusFilter !== "All") {
        if (trip.status?.toLowerCase() !== listStatusFilter.toLowerCase()) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (trip.title || "").toLowerCase().includes(q);
        const matchesOrigin = (trip.originCity || "").toLowerCase().includes(q);
        const matchesDest = (trip.destinations || []).some((d: string) => d.toLowerCase().includes(q));
        const matchesBus = (trip.busNumber || "").toLowerCase().includes(q);
        const matchesDriver = (trip.driverName || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesOrigin && !matchesDest && !matchesBus && !matchesDriver) {
          return false;
        }
      }
      return true;
    })
    .sort((a: any, b: any) => {
      if (listSortBy === "revenue") {
        return (b.revenue || 0) - (a.revenue || 0);
      }
      if (listSortBy === "occupancy") {
        const occA = a.totalSeats > 0 ? (a.bookedSeats || 0) / a.totalSeats : 0;
        const occB = b.totalSeats > 0 ? (b.bookedSeats || 0) / b.totalSeats : 0;
        return occB - occA;
      }
      if (listSortBy === "departure") {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Bookings & Operations Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Monitor departures, track revenue streams, manage seat occupancies, and inspect manifests.
        </p>
      </div>

      {/* ── TOP STATISTICS METRICS (5 Modern Cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Hosted Trips */}
        <GlassCard strong className="p-4 space-y-2 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Total Trips
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
              <Compass size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalTripsCount}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp size={10} /> Active
            </span>
          </div>
        </GlassCard>

        {/* Total Bookings Count */}
        <GlassCard strong className="p-4 space-y-2 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Bookings
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalBookingsCount}
            </span>
            <span className="text-[10px] font-extrabold text-slate-400">Tickets</span>
          </div>
        </GlassCard>

        {/* Total Gross Revenue */}
        <GlassCard strong className="p-4 space-y-2 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Total Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{aggregatedRevenue.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-600">Gross</span>
          </div>
        </GlassCard>

        {/* Average Occupancy Rate */}
        <GlassCard strong className="p-4 space-y-2 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Avg Occupancy
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <Percent size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {avgOccupancyRate}%
              </span>
              <span className="text-[10px] font-bold text-slate-400">Capacity Rate</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${avgOccupancyRate}%` }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Today's Departures */}
        <GlassCard strong className="p-4 space-y-2 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Departures Today
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
              <Bus size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {
                tripsList.filter((t: any) => {
                  if (!t.startDate) return false;
                  return (
                    new Date(t.startDate).toDateString() === new Date().toDateString()
                  );
                }).length
              }
            </span>
            <span className="text-[10px] font-extrabold text-slate-400">Today</span>
          </div>
        </GlassCard>
      </div>

      {/* ── TOP FILTER & SEARCH TOOLBAR ── */}
      <GlassCard strong className="p-4 space-y-4 shadow-lg border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search trip package, destination city, bus number, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            {/* Status Filter */}
            <select
              value={listStatusFilter}
              onChange={(e) => setListStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:border-teal-500"
            >
              <option value="All">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={listSortBy}
              onChange={(e) => setListSortBy(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:border-teal-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="revenue">Sort: Highest Revenue</option>
              <option value="occupancy">Sort: Occupancy Rate</option>
              <option value="departure">Sort: Departure Date</option>
            </select>

            <span className="text-xs font-extrabold text-slate-400 whitespace-nowrap pl-2">
              {filteredTrips.length} Packages
            </span>
          </div>
        </div>
      </GlassCard>

      {/* ── RESPONSIVE 3-COLUMN BOOKINGS CARDS GRID ── */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-16 text-slate-400 font-bold text-xs space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">No hosted trips match your filter criteria.</p>
          <p>Try clearing search keywords or resetting your filter selections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip: any) => {
            const seatsFilled = trip.bookedSeats || 0;
            const totalSeats = trip.totalSeats || 40;
            const filledPercent =
              totalSeats > 0 ? Math.round((seatsFilled / totalSeats) * 100) : 0;

            const tripRevenue = bookingsList
              .filter(
                (b: any) =>
                  (b.agentTrip === trip._id || b.tripId === trip._id) &&
                  (b.paymentStatus === "Paid" || b.status === "Paid")
              )
              .reduce((sum: number, b: any) => sum + (b.pricePaid || 0), 0);

            return (
              <GlassCard
                key={trip._id}
                strong
                className="group p-0 overflow-hidden flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-3xl"
              >
                {/* Cover Image Header */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {trip.coverImage ? (
                    <img
                      src={trip.coverImage}
                      alt={trip.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold">
                      🚌
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Overlays */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-white/10">
                      <Calendar size={11} className="inline mr-1 text-teal-400" />
                      {formatDate(trip.startDate)}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow ${
                        trip.status === "published" || trip.status === "active"
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {trip.status || "Published"}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <div className="flex items-center gap-1 text-teal-300 text-[11px] font-bold mb-0.5">
                      <MapPin size={12} />
                      <span>{trip.originCity || "Origin"} → {trip.destinations?.join(", ") || trip.dropPoint}</span>
                    </div>
                    <h3 className="font-black text-base text-white leading-snug drop-shadow-sm line-clamp-1">
                      {trip.title}
                    </h3>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Bus size={13} className="text-teal-500" /> {trip.busType || "Bus"} ({trip.busNumber || "N/A"})
                      </span>
                      <span className="text-slate-400">{trip.duration}</span>
                    </div>

                    {/* Occupancy Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <span>Seat Occupancy</span>
                        <span className="text-teal-600 dark:text-teal-400">
                          {seatsFilled} / {totalSeats} seats ({filledPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${filledPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Gross Revenue
                        </span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          ₹{tripRevenue.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Fare / Person
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          ₹{Number(trip.offerPrice || trip.pricePerPerson || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/bookings/${trip._id}`)}
                      className="flex-1 py-2.5 px-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-black transition-all shadow-brand flex items-center justify-center gap-1.5"
                    >
                      <FileText size={14} /> View Manifest & Passengers
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookings;
