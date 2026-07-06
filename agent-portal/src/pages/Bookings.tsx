import React, { useState } from "react";
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
} from "lucide-react";
import { GlassCard, Button } from "../components/ui";
import { getBookings, updateBookingStatus, updateBookingDetails, getTripManifest, initiateScheduleChange, verifyScheduleOtp, resendScheduleOtp, getScheduleChangeStatus, applyScheduleChange, ScheduleChangePassenger } from "../services/bookingService";
import { getMyTrips, updateTrip } from "../services/tripService";
import { Booking } from "../types";
import { formatDate, formatCurrency } from "../utils";

export const Bookings: React.FC = () => {
  const { tripId } = useParams<{ tripId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dedicated React Query fetch for Manifest
  const { data: manifestData, isLoading: manifestLoading, error: manifestError } = useQuery({
    queryKey: ["manifest", tripId],
    queryFn: () => getTripManifest(tripId!),
    enabled: !!tripId,
    refetchInterval: 8000,
  });

  // Filter & Search states
  const [filterStatus, setFilterStatus] = useState<
    "All" | "Paid" | "Pending" | "Cancelled" | "Boarded" | "Not Boarded" | "Male" | "Female" | "Checked In" | "QR Generated" | "Seat Assigned" | "Waiting Seat"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Passenger Drawer & Modal states
  const [selectedPassenger, setSelectedPassenger] = useState<Booking | null>(null);
  const [isEditingSeat, setIsEditingSeat] = useState(false);
  const [editedSeats, setEditedSeats] = useState("");
  const [isEditingPickup, setIsEditingPickup] = useState(false);
  const [editedPickup, setEditedPickup] = useState("");

  // Quick Action states
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [qrPreviewPassenger, setQrPreviewPassenger] = useState<string | null>(null);
  const [editingSeatBookingId, setEditingSeatBookingId] = useState<string | null>(null);
  const [editingSeatValue, setEditingSeatValue] = useState<string>("");

  // ── Update Schedule modal states ────────────────────────────────────────
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedNewDate, setSchedNewDate] = useState("");
  const [schedNewTime, setSchedNewTime] = useState("");
  const [scheduleUpdating, setScheduleUpdating] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      // Update drawer if active
      if (selectedPassenger && selectedPassenger._id === res.booking._id) {
        setSelectedPassenger(res.booking);
      }
    },
  });

  const detailsMutation = useMutation({
    mutationFn: (vars: { id: string; seatNumbers?: string[]; pickupLocation?: string; boardingStatus?: string }) =>
      updateBookingDetails(vars.id, { seatNumbers: vars.seatNumbers, pickupLocation: vars.pickupLocation, boardingStatus: vars.boardingStatus }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["manifest", tripId] });
      // Update drawer
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
    }
  });

  const handleStatusChange = (id: string, status: "Paid" | "Pending" | "Cancelled") => {
    let confirmMsg = `Mark this booking as ${status}?`;
    if (status === "Cancelled") {
      confirmMsg = "Cancel this reservation and release the booked seats back into the trip capacity?";
    }
    if (confirm(confirmMsg)) {
      statusMutation.mutate({ id, status });
    }
  };

  const handleUpdateDetails = () => {
    if (!selectedPassenger) return;
    const updatePayload: { seatNumbers?: string[]; pickupLocation?: string } = {};

    if (isEditingSeat) {
      updatePayload.seatNumbers = editedSeats.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (isEditingPickup) {
      updatePayload.pickupLocation = editedPickup.trim();
    }

    detailsMutation.mutate({ id: selectedPassenger._id, ...updatePayload });
  };

  const handlePassengerClick = (p: Booking) => {
    setSelectedPassenger(p);
    setEditedSeats(p.seatNumbers.join(", ") || p.assignedSeat || "");
    setEditedPickup(p.pickupLocation || "");
    setIsEditingSeat(false);
    setIsEditingPickup(false);
  };

  React.useEffect(() => {
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

  // Mock document download triggers
  const triggerInvoiceDownload = (bookingId: string) => {
    alert(`Generating invoice for ${bookingId}. The PDF download will begin shortly.`);
  };

  const triggerBoardingPassDownload = (bookingId: string) => {
    alert(`Compiling Boarding Ticket for ${bookingId}. Receipt ready to print.`);
  };

  if (bookingsLoading || tripsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Retrieving traveler reservations...</span>
      </div>
    );
  }

  if (bookingsErr || tripsErr || !bookingsData || !tripsData) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-rose-500" />
        <span className="text-sm font-bold text-rose-600 dark:text-rose-455">
          Failed to fetch reservation logs. Verify backend connection.
        </span>
      </div>
    );
  }

  // Handle manifest load failures (e.g. trip does not exist or unauthorized)
  if (tripId && (manifestError as any)) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/bookings")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Departures Ledger
        </button>
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <span className="text-sm font-bold text-rose-600 dark:text-rose-455">
            404 — Manifest not found
          </span>
        </div>
      </div>
    );
  }

  const bookingsList = bookingsData.bookings || [];
  const tripsList = tripsData.trips || [];

  // ─── CASE A: Specific Trip Drill-down Detail ───
  if (tripId) {
    if (manifestLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Retrieving trip manifest details...</span>
        </div>
      );
    }

    const selectedTrip = manifestData?.trip || tripsList.find((t) => t._id === tripId);
    const tripBookings = manifestData?.bookings || bookingsList.filter(
      (b) =>
        (b as any).tripId === tripId ||
        (typeof (b as any).tripId === "object" && (b as any).tripId?._id === tripId) ||
        b.agentTrip === tripId ||
        (typeof b.agentTrip === "object" && b.agentTrip?._id === tripId)
    );

    // Calculations for the selected trip (prefer backend stats if loaded, else fallback to precise client calculations)
    const activeBookings = tripBookings.filter((b: any) => 
      b.paymentStatus !== "Cancelled" && 
      b.paymentStatus !== "cancelled" && 
      b.status !== "Cancelled" && 
      b.status !== "cancelled"
    );

    const totalBookedSeats = manifestData?.tripStats?.bookedSeats !== undefined
      ? manifestData.tripStats.bookedSeats
      : activeBookings.reduce((sum, b) => {
          const count = (b.seats && typeof b.seats === 'number') 
            ? b.seats 
            : (Array.isArray(b.seats) ? b.seats.length : (((b as any).seats as any)?.length || b.seatNumbers?.length || 1));
          return sum + count;
        }, 0);

    const totalSeats = selectedTrip?.totalSeats || 40;
    const occupancyPercent = totalSeats > 0
      ? ((totalBookedSeats / totalSeats) * 100).toFixed(1)
      : "0.0";

    const totalRevenue = manifestData?.tripStats?.grossRevenue !== undefined
      ? manifestData.tripStats.grossRevenue
      : activeBookings
          .filter((b: any) => b.paymentStatus === "Paid" || b.status === "Paid")
          .reduce((sum, b) => sum + (b.pricePaid || (b as any).amountPaid || (b as any).price || 0), 0);

    const totalRefund = manifestData?.tripStats?.refundedAmount !== undefined
      ? manifestData.tripStats.refundedAmount
      : tripBookings
          .filter((b: any) => b.paymentStatus === "Cancelled" || b.status === "Cancelled")
          .reduce((sum, b) => sum + (b.pricePaid || (b as any).amountPaid || (b as any).price || 0), 0);

    const totalCommission = manifestData?.tripStats?.commissionAmount !== undefined
      ? manifestData.tripStats.commissionAmount
      : totalRevenue * 0.1; // 10% Agent Commission

    const netPayout = manifestData?.tripStats?.netRevenue !== undefined
      ? manifestData.tripStats.netRevenue
      : totalRevenue - totalCommission;

    const passengers = manifestData?.tripStats?.passengerCount !== undefined
      ? manifestData.tripStats.passengerCount
      : activeBookings.length;

    const boardedCount = manifestData?.tripStats?.boardedCount !== undefined
      ? manifestData.tripStats.boardedCount
      : activeBookings.filter((b) => (b.boardingStatus || "").toUpperCase() === "BOARDED").length;

    const pendingBoardingCount = manifestData?.tripStats?.pendingBoardingCount !== undefined
      ? manifestData.tripStats.pendingBoardingCount
      : activeBookings.filter((b) => (b.boardingStatus || "").toUpperCase() !== "BOARDED").length;

    const cancelledCount = manifestData?.tripStats?.cancelledCount !== undefined
      ? manifestData.tripStats.cancelledCount
      : tripBookings.filter((b: any) => 
          (b.paymentStatus || "").toUpperCase() === "CANCELLED" || 
          (b.status || "").toUpperCase() === "CANCELLED"
        ).length;

    console.log("Trip:", selectedTrip);
    console.log("Bookings:", tripBookings.length);
    console.log("Booked Seats:", totalBookedSeats);
    console.log("Revenue:", totalRevenue);

    // Apply Filter & Search (normalize statuses to uppercase for case-insensitive comparison)
    const filteredTripBookings = tripBookings.filter((b) => {
      const payment = (b.paymentStatus || "PENDING").toUpperCase();
      const boarding = (b.boardingStatus || "PENDING").toUpperCase();

      // 1. Filter Status
      if (filterStatus === "Paid" && payment !== "PAID") return false;
      if (filterStatus === "Pending" && payment !== "PENDING") return false;
      if (filterStatus === "Cancelled" && payment !== "CANCELLED") return false;
      if (filterStatus === "Boarded" && boarding !== "BOARDED") return false;
      if (filterStatus === "Not Boarded" && boarding === "BOARDED") return false;
      if (filterStatus === "Male" && (b.gender || "") !== "Male") return false;
      if (filterStatus === "Female" && (b.gender || "") !== "Female") return false;
      if (filterStatus === "Checked In" && boarding !== "BOARDED") return false;
      if (filterStatus === "QR Generated" && !b.qrCode) return false;
      
      const hasSeatAssigned = b.assignedSeat || (b.seatNumbers && b.seatNumbers.length > 0);
      if (filterStatus === "Seat Assigned" && !hasSeatAssigned) return false;
      if (filterStatus === "Waiting Seat" && hasSeatAssigned) return false;

      // 2. Search (null-guarded)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = (b.bookingId || "").toLowerCase().includes(query);
        const matchesName = (b.travelerName || "").toLowerCase().includes(query);
        const matchesPhone = (b.contactNumber || "").toLowerCase().includes(query);
        const matchesSeat = (b.seatNumbers || []).some((s: string) => s.toLowerCase().includes(query))
          || ((b.assignedSeat || "").toLowerCase().includes(query));
        return matchesId || matchesName || matchesPhone || matchesSeat;
      }
      return true;
    });

    // Populate seat map
    const seatMap: Record<string, { bookingId: string; travelerName: string; status: "occupied" | "reserved" | "cancelled"; gender?: string; paymentStatus?: string }> = {};
    tripBookings.forEach((b) => {
      const seats = b.seatNumbers && b.seatNumbers.length > 0 ? b.seatNumbers : b.assignedSeat ? [b.assignedSeat] : [];
      seats.forEach((seat) => {
        if (!seat) return;
        if (b.paymentStatus === "Cancelled" || (b as any).status === "Cancelled") {
          seatMap[seat] = { bookingId: b.bookingId, travelerName: b.travelerName, status: "cancelled", gender: b.gender, paymentStatus: b.paymentStatus };
        } else {
          seatMap[seat] = { 
            bookingId: b.bookingId, 
            travelerName: b.travelerName, 
            status: b.boardingStatus === "boarded" ? "occupied" : "reserved",
            gender: b.gender,
            paymentStatus: b.paymentStatus
          };
        }
      });
    });

    // Document downloads
    const downloadExcel = () => {
      const csvContent = [
        ["Passenger Name", "Booking ID", "Gender", "Age", "Seat", "Phone", "Pickup Point", "Payment Status", "Boarding Status", "Checked In Time"],
        ...tripBookings.map(b => [
          b.travelerName, b.bookingId, b.gender, b.age, b.assignedSeat || b.seatNumbers.join(", "), b.contactNumber, b.pickupLocation, b.paymentStatus, b.boardingStatus, b.boardedAt ? new Date(b.boardedAt).toLocaleTimeString() : "N/A"
        ])
      ].map(e => e.join(",")).join("\n");
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
      content += `Trip ID: ${tripId} | Date: ${selectedTrip?.startDate || ""}\n`;
      content += `Vehicle: ${selectedTrip?.busNumber || ""} | Driver: ${selectedTrip?.driverName || ""}\n`;
      content += `========================================================\n\n`;
      content += `Passenger Name     | Seat | Phone      | Pickup Point    | Status\n`;
      content += `--------------------------------------------------------\n`;
      tripBookings.forEach(b => {
        content += `${b.travelerName.padEnd(18)} | ${(b.assignedSeat || b.seatNumbers.join(", ") || "N/A").padEnd(4)} | ${b.contactNumber.padEnd(10)} | ${(b.pickupLocation || "N/A").padEnd(15)} | ${b.boardingStatus || "not_boarded"}\n`;
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
        tripData: { driverName, driverPhone, busNumber }
      });
    };

    const handleCloseBoarding = () => {
      if (confirm("Are you sure you want to close boarding for this departure? This will lock seat allocations and notify remaining pending travelers.")) {
        tripUpdateMutation.mutate({
          id: tripId,
          tripData: { status: "completed" }
        });
      }
    };

    const handleSendNotifications = () => {
      alert("Broadcasting trip reminder alerts and boarding status updates to all passengers...");
    };

    const handleBoardingStatusToggle = (booking: Booking) => {
      const nextStatus = booking.boardingStatus === "boarded" ? "not_boarded" : "boarded";
      detailsMutation.mutate({
        id: booking._id,
        boardingStatus: nextStatus
      });
    };

    const handleSeatClick = (seatNumber: string) => {
      const occupant = tripBookings.find(b => b.seatNumbers.includes(seatNumber) || b.assignedSeat === seatNumber);
      if (occupant) {
        setSelectedPassenger(occupant);
      } else {
        alert(`Seat ${seatNumber} is available. You can assign it to any traveler from the Passenger List.`);
      }
    };

    const saveInlineSeat = (id: string) => {
      detailsMutation.mutate({
        id,
        seatNumbers: editingSeatValue.split(",").map(s => s.trim()).filter(Boolean)
      });
      setEditingSeatBookingId(null);
    };

    const triggerCancelAndRefund = (booking: Booking) => {
      if (confirm(`Cancel booking ${booking.bookingId} and refund traveler ${booking.travelerName}?`)) {
        statusMutation.mutate({ id: booking._id, status: "Cancelled" });
      }
    };

    const filterChips: Array<typeof filterStatus> = [
      "All", "Paid", "Pending", "Cancelled", "Boarded", "Not Boarded", "Male", "Female", "Checked In", "QR Generated", "Seat Assigned", "Waiting Seat"
    ];

    // ── Schedule change handler ──────────────────────────────────────────────
    const handleInitiateScheduleChange = async () => {
      if (!schedNewDate || !schedNewTime) {
        setScheduleMsg({ type: "error", text: "Please enter both a new departure date and time." });
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
          // Redirect to OTP verification page
          setShowScheduleModal(false);
          navigate(`/bookings/${tripId}/schedule-verify`);
        } else {
          setScheduleMsg({ type: "success", text: "Schedule updated successfully! No passenger consent required." });
          queryClient.invalidateQueries({ queryKey: ["my-trips"] });
          queryClient.invalidateQueries({ queryKey: ["manifest", tripId] });
          setTimeout(() => setShowScheduleModal(false), 1800);
        }
      } catch (err: any) {
        setScheduleMsg({ type: "error", text: err?.response?.data?.message || "Failed to update schedule. Please try again." });
      } finally {
        setScheduleUpdating(false);
      }
    };

    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Back control */}
        <button
          onClick={() => navigate("/bookings")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Departures Ledger
        </button>

        {/* ─── HEADER ROW ─── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              Trip Manifest Detail
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
              Manage passengers, boarding, seat allocation, QR verification and occupancy in real time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportPDF}
              className="px-3 py-1.5 rounded-lg border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-705 dark:text-slate-350 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" /> Export PDF
            </button>
            <button
              onClick={downloadExcel}
              className="px-3 py-1.5 rounded-lg border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-705 dark:text-slate-355 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Download Excel
            </button>
            <button
              onClick={() => {
                setSchedNewDate(selectedTrip?.startDate || "");
                setSchedNewTime(selectedTrip?.departureTime || "");
                setScheduleMsg(null);
                setShowScheduleModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <CalendarClock className="w-3.5 h-3.5" /> Update Schedule
            </button>
            <button
              onClick={handleAssignDriver}
              className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" /> Assign Driver
            </button>
            <button
              onClick={handleSendNotifications}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" /> Send Notifications
            </button>
            <button
              onClick={handleCloseBoarding}
              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Power className="w-3.5 h-3.5" /> Close Boarding
            </button>
          </div>
        </div>

        {/* ─── BOOKING ANALYTICS ROW — enriched with gender + seat stats ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <GlassCard className="p-3.5 flex flex-col justify-between border border-slate-100 dark:border-slate-850 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{passengers}</span>
          </GlassCard>
          <GlassCard className="p-3.5 flex flex-col justify-between border border-slate-100 dark:border-slate-850 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Revenue</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{totalRevenue.toLocaleString("en-IN")}</span>
          </GlassCard>
          <GlassCard className="p-3.5 flex flex-col justify-between border border-slate-100 dark:border-slate-850 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Male</span>
            <span className="text-xl font-black text-sky-500 mt-1">
              {manifestData?.tripStats?.maleCount ?? activeBookings.filter(b => (b.gender || "").toLowerCase() === "male").length}
            </span>
          </GlassCard>
          <GlassCard className="p-3.5 flex flex-col justify-between border border-slate-100 dark:border-slate-850 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Female</span>
            <span className="text-xl font-black text-pink-500 mt-1">
              {manifestData?.tripStats?.femaleCount ?? activeBookings.filter(b => (b.gender || "").toLowerCase() === "female").length}
            </span>
          </GlassCard>
          <GlassCard className="p-3.5 flex flex-col justify-between border border-slate-100 dark:border-slate-850 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Seats</span>
            <span className="text-xl font-black text-teal-500 mt-1">{Math.max(0, (selectedTrip?.totalSeats || 40) - totalBookedSeats)}</span>
          </GlassCard>
          <GlassCard className="p-3.5 flex flex-col justify-between border border-slate-100 dark:border-slate-850 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Occupied Seats</span>
            <span className="text-xl font-black text-indigo-500 mt-1">{totalBookedSeats}</span>
          </GlassCard>
        </div>

        {/* ─── COMPACT HERO CARD ─── */}
        {selectedTrip && (
          <GlassCard className="p-4 border border-slate-100 dark:border-slate-850 shadow-sm overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column: Cover & General Trip Details */}
              <div className="flex gap-4 flex-1">
                <div className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/50">
                  {selectedTrip.coverImage ? (
                    <img src={selectedTrip.coverImage} alt={selectedTrip.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
                      🚌
                    </div>
                  )}
                </div>
                <div className="space-y-2 overflow-hidden flex-1">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1">
                      {selectedTrip.title}
                    </h2>
                    <p className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                      <span>{selectedTrip.duration}</span> · 
                      <span className="bg-slate-100 dark:bg-slate-805 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600 dark:text-slate-400">{selectedTrip.busType}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-505">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">ID: {selectedTrip._id}</span>
                    <span className="bg-teal-50 dark:bg-teal-950/20 text-teal-650 px-2 py-0.5 rounded-md uppercase">{selectedTrip.category || "General"}</span>
                    <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 px-2 py-0.5 rounded-md capitalize">{selectedTrip.status || "published"}</span>
                  </div>
                </div>
              </div>

              {/* Center Column: Crew & Schedule Timings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 border-t lg:border-t-0 lg:border-l lg:border-r border-slate-100 dark:border-slate-850 pt-4 lg:pt-0 lg:px-6">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Crew Info</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-202 block truncate">{selectedTrip.driverName || "Not Assigned"}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">{selectedTrip.driverPhone || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">{selectedTrip.busNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reporting Time</span>
                  <span className="text-xs font-extrabold text-indigo-500 block flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> {selectedTrip.reportingTime || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Departure / Arrival</span>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block flex items-center gap-1 mt-0.5">
                    {selectedTrip.departureTime || "N/A"} → {selectedTrip.arrivalTime || "N/A"}
                  </span>
                </div>
              </div>

              {/* Right Column: Key Financial breakdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 w-full lg:w-96">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Booked</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{totalBookedSeats} Seats</span>
                  <span className="text-[9px] text-slate-400 block font-medium">/{selectedTrip.totalSeats} Total</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Gross Revenue</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">₹{totalRevenue.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Commission (10%)</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">₹{totalCommission.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Net Payout</span>
                  <span className="text-xs font-black text-teal-650 dark:text-teal-400 block">₹{netPayout.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Seat Statistics & Progress Bar Dashboard */}
        {tripId && selectedTrip && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <GlassCard className="p-4">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold block">
                Total Capacity
              </span>
              <h4 className="text-xl font-extrabold text-slate-850 dark:text-slate-100 mt-1">
                {selectedTrip.totalSeats || 40} Seats
              </h4>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold block">
                Booked Seats
              </span>
              <h4 className="text-xl font-extrabold text-slate-850 dark:text-slate-100 mt-1">
                {totalBookedSeats} Seats
              </h4>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-sky-400 rounded-full transition-all" 
                  style={{ width: `${selectedTrip.totalSeats > 0 ? (totalBookedSeats / selectedTrip.totalSeats) * 100 : 0}%` }} 
                />
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold block">
                Available Seats
              </span>
              <h4 className="text-xl font-extrabold text-slate-850 dark:text-slate-100 mt-1">
                {Math.max(0, (selectedTrip.totalSeats || 40) - totalBookedSeats)} Seats
              </h4>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all" 
                  style={{ width: `${selectedTrip.totalSeats > 0 ? (Math.max(0, (selectedTrip.totalSeats || 40) - totalBookedSeats) / selectedTrip.totalSeats) * 100 : 0}%` }} 
                />
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold block">
                Occupancy Rate
              </span>
              <h4 className="text-xl font-extrabold text-slate-850 dark:text-slate-100 mt-1">
                {occupancyPercent}%
              </h4>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full transition-all" 
                  style={{ width: `${occupancyPercent}%` }} 
                />
              </div>
            </GlassCard>
          </div>
        )}

        {/* ─── GRID CONTENT SPLIT: LEFT SUMMARY | MAIN PANEL | SEAT MAP ─── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ─── LEFT COLUMN: Trip Summary Card ─── */}
          {selectedTrip && (
            <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
              <GlassCard className="p-4 border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col gap-3 text-xs">
                {/* Cover image */}
                <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/50 shrink-0">
                  {selectedTrip.coverImage ? (
                    <img src={selectedTrip.coverImage} alt={selectedTrip.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-3xl">
                      🚌
                    </div>
                  )}
                </div>

                {/* Trip name & status */}
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 leading-snug">{selectedTrip.title}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                    selectedTrip.status === "published" || selectedTrip.status === "active"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                      : selectedTrip.status === "completed"
                      ? "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                  }`}>{selectedTrip.status || "Published"}</span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-3 space-y-2.5">
                  {/* Booking ID */}
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Trip ID</span>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 block truncate">{selectedTrip._id}</span>
                  </div>
                  {/* Departure Date */}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Departure Date</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{selectedTrip.startDate ? new Date(selectedTrip.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                    </div>
                  </div>
                  {/* Departure Time */}
                  <div className="flex items-start gap-2">
                    <Clock className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Departure Time</span>
                      <span className="font-bold text-indigo-500">{selectedTrip.departureTime || "—"}</span>
                    </div>
                  </div>
                  {/* Return Date */}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Return Date</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{selectedTrip.endDate ? new Date(selectedTrip.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                    </div>
                  </div>
                  {/* Duration */}
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTrip.duration || "—"}</span>
                  </div>
                  {/* Pickup Point */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pickup Point</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 leading-snug">{selectedTrip.pickupLocation || selectedTrip.pickupPoint || "—"}</span>
                    </div>
                  </div>
                  {/* Drop Point */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Drop Point</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 leading-snug">{selectedTrip.dropPoint || selectedTrip.destination || "—"}</span>
                    </div>
                  </div>
                  {/* Seats grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-850 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block">Seats Sold</span>
                      <span className="font-black text-teal-600">{totalBookedSeats}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block">Seats Left</span>
                      <span className="font-black text-slate-700 dark:text-slate-200">{Math.max(0, (selectedTrip.totalSeats || 40) - totalBookedSeats)}</span>
                    </div>
                  </div>
                  {/* Bus Type */}
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bus Type</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTrip.busType || "—"}</span>
                  </div>
                  {/* Driver */}
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Driver</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{selectedTrip.driverName || "Not Assigned"}</span>
                  </div>
                </div>

                {/* Quick Update Schedule shortcut */}
                <button
                  onClick={() => {
                    setSchedNewDate(selectedTrip?.startDate || "");
                    setSchedNewTime(selectedTrip?.departureTime || "");
                    setScheduleMsg(null);
                    setShowScheduleModal(true);
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wide border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 transition-all"
                >
                  <CalendarClock className="w-3.5 h-3.5" /> Update Schedule
                </button>
              </GlassCard>
            </div>
          )}

          {/* ─── MIDDLE COLUMN: Roster & Filters ─── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            
            {/* Sticky filter bar */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-150 dark:border-slate-850 p-2.5 rounded-2xl flex flex-wrap items-center gap-1.5">
              {filterChips.map((chip) => {
                const isActive = filterStatus === chip;
                return (
                  <button
                    key={chip}
                    onClick={() => setFilterStatus(chip)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            {/* Search Input Bar & Export Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by Passenger Name, Booking ID, Phone Number or Seat Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={downloadExcel}
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs px-4 py-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  Export CSV
                </Button>
                <Button
                  onClick={exportPDF}
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs px-4 py-2"
                >
                  <FileDown className="w-4 h-4 text-rose-500" />
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Passenger Roster List */}
            <GlassCard className="p-0 border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-450 dark:text-slate-550 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Passenger Name</th>
                      <th className="px-4 py-3">Booking ID</th>
                      <th className="px-3 py-3 text-center">Seat Number</th>
                      <th className="px-3 py-3 text-center">Gender</th>
                      <th className="px-3 py-3 text-center">Age</th>
                      <th className="px-4 py-3">Phone Number</th>
                      <th className="px-3 py-3 text-center">Payment Status</th>
                      <th className="px-3 py-3 text-center">Boarding Status</th>
                      <th className="px-3 py-3 text-center">Check-in Time</th>
                      <th className="px-3 py-3 text-center">Boarded Time</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {tripBookings.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 px-4 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-805 flex items-center justify-center text-slate-400 dark:text-slate-500 text-3xl">
                              🎫
                            </div>
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-150">No passengers booked yet</h4>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium leading-relaxed">
                                Share this trip details link or run a coupon promotion to start receiving traveler reservations.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`https://traveloopv2.duckdns.org/trips/${tripId}`);
                                  alert("Trip Link Copied!");
                                }}
                                className="px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-black uppercase hover:opacity-90 transition-all flex items-center gap-1 shadow-sm"
                              >
                                <Send className="w-3 h-3" /> Share Trip
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`https://traveloopv2.duckdns.org/trips/${tripId}`);
                                  alert("Trip Link Copied!");
                                }}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-extrabold hover:bg-slate-50 dark:hover:bg-slate-850 transition-all"
                              >
                                Copy Link
                              </button>
                              <button
                                onClick={() => alert("Launching coupon promotion campaigns...")}
                                className="px-3 py-1.5 rounded-lg bg-teal-500 text-white text-[10px] font-black uppercase hover:opacity-90 transition-all flex items-center gap-1 shadow-sm"
                              >
                                <Percent className="w-3 h-3" /> Send Promotion
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTripBookings.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-10 text-slate-400 dark:text-slate-505 font-bold">
                          No matching passenger reservation records found.
                        </td>
                      </tr>
                    ) : (
                      filteredTripBookings.map((b) => {
                        const rawBoarding = (b.boardingStatus || "PENDING").toUpperCase();
                        let statusLabel = "Pending";
                        let statusColor = "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
                        
                        if (rawBoarding === "BOARDED") {
                          statusLabel = "Boarded";
                          statusColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20";
                        } else if (rawBoarding === "CHECKED_IN" || rawBoarding === "CHECKED-IN" || rawBoarding === "CHECKED IN") {
                          statusLabel = "Checked-In";
                          statusColor = "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20";
                        } else if (rawBoarding === "NO_SHOW" || rawBoarding === "NOSHOW" || rawBoarding === "NO SHOW") {
                          statusLabel = "No Show";
                          statusColor = "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20";
                        } else if (rawBoarding === "OPEN") {
                          statusLabel = "QR Active";
                          statusColor = "text-teal-600 bg-teal-50 dark:bg-teal-950/20 border border-teal-500/20";
                        } else {
                          statusLabel = "Pending";
                          statusColor = "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
                        }

                        return (
                          <tr key={b._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all text-slate-700 dark:text-slate-300">
                            {/* Passenger name */}
                            <td className="px-4 py-3">
                              <span className="font-extrabold text-slate-800 dark:text-slate-100 block">
                                {b.travelerName}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-semibold">{b.seats} Tickets</span>
                            </td>

                            {/* Booking ID */}
                            <td className="px-4 py-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {b.bookingId}
                            </td>

                            {/* Seat Number */}
                            <td className="px-3 py-3 text-center text-slate-800 dark:text-slate-100 font-bold">
                              {b.assignedSeat || b.seatNumbers?.join(", ") || "—"}
                            </td>

                            {/* Gender */}
                            <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-350">
                              {b.gender || "—"}
                            </td>

                            {/* Age */}
                            <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-350">
                              {b.age || "—"}
                            </td>

                            {/* Phone */}
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-355 font-mono text-[11px]">
                              {b.contactNumber}
                            </td>

                            {/* Payment Status badge */}
                            <td className="px-3 py-3 text-center">
                              {(() => {
                                const pStatus = (b.paymentStatus || "PENDING").toUpperCase();
                                const pLabel = pStatus === "PAID" ? "Paid" : pStatus === "CANCELLED" ? "Cancelled" : "Pending";
                                const pColor = pStatus === "PAID"
                                  ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20"
                                  : pStatus === "CANCELLED"
                                  ? "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20"
                                  : "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20";
                                return (
                                  <span className={`inline-flex items-center justify-center h-7 px-3 rounded-full text-xs font-semibold ${pColor}`}>
                                    {pLabel}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Boarding Status badge */}
                            <td className="px-3 py-3 text-center">
                              <span className={`inline-flex items-center justify-center h-7 px-3 rounded-full text-xs font-semibold ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </td>

                            {/* Check-in Time */}
                            <td className="px-3 py-3 text-center text-[10px] text-slate-400 font-mono">
                              {b.checkedInAt ? new Date(b.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : b.boardingPassGeneratedAt ? new Date(b.boardingPassGeneratedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </td>

                            {/* Boarded Time */}
                            <td className="px-3 py-3 text-center text-[10px] text-slate-400 font-mono">
                              {b.boardedAt ? new Date(b.boardedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </td>

                            {/* Actions options menu */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end">
                                <button
                                  onClick={() => handlePassengerClick(b)}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
                                  title="View Passenger Booking Ledger"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

          {/* ─── RIGHT COLUMN: Seat Map ─── */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
            
            {/* Driver & Bus sidebar card */}
            <GlassCard className="p-4 border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  Crew & Dispatch
                </h3>
                <span className="text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded font-black uppercase">
                  Active
                </span>
              </div>
              <div className="space-y-3.5 text-xs text-slate-605 dark:text-slate-355">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Driver Name</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">
                    {selectedTrip?.driverName || selectedTrip?.driver?.name || "Not Assigned"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Driver Phone</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {selectedTrip?.driverPhone || selectedTrip?.driver?.phone || "N/A"}
                  </span>
                </div>
                {selectedTrip?.driver?.licenseNumber && (
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">License Number</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {selectedTrip.driver.licenseNumber}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Bus Numbers</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">
                    {selectedTrip?.busNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Vehicle Configuration</span>
                  <span>
                    {selectedTrip?.busType || "Sleeper"} ({selectedTrip?.totalSeats || 40} Seats Capacity)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Co-driver / Crew Support</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedTrip?.coDriver || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Emergency Contact</span>
                  <span className="font-bold text-rose-500">
                    {selectedTrip?.emergencyContact || selectedTrip?.driver?.emergencyContact || "N/A"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-850 pt-2">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Reporting Time</span>
                    <span className="font-semibold text-indigo-500">{selectedTrip?.reportingTime || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Departure Time</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTrip?.departureTime || "N/A"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Dispatch Status</span>
                    <span className="font-bold text-teal-600 uppercase text-[10px]">{selectedTrip?.status === "completed" ? "Dispatched" : "Scheduled"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Live Status</span>
                    <span className="font-bold text-emerald-500 text-[10px]">On Track</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
                  <div className="flex justify-between font-bold text-slate-500 text-[11px] mb-1">
                    <span>Boarded Pass Checked</span>
                    <span>{boardedCount} / {totalBookedSeats}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${totalBookedSeats > 0 ? (boardedCount / totalBookedSeats) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Mini Seat Layout Map */}
            <GlassCard className="p-4 border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  Passenger Seat Map
                </h3>
              </div>
              
              {/* Grid map */}
              <div className="space-y-4">
                {/* 10 rows grid */}
                <div className="grid grid-cols-5 gap-2 max-w-[240px] mx-auto bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                  {/* Driver wheel indicator */}
                  <div className="col-span-5 flex justify-end text-[10px] font-bold text-slate-400 mb-2 border-b border-slate-200/50 pb-1">
                    <span className="flex items-center gap-1">Wheel 🛞</span>
                  </div>
                  
                  {Array.from({ length: 10 }).map((_, rowIndex) => {
                    const rowNum = rowIndex + 1;
                    const cols = ["A", "B", "spacer", "C", "D"];
                    
                    return cols.map((col, colIndex) => {
                      if (col === "spacer") {
                        return <div key={`spacer-${rowNum}`} className="h-6 w-4" />; // Aisle spacer
                      }
                      
                      const seatId = `${rowNum}${col}`;
                      const occupant = seatMap[seatId];
                      const isSelected = selectedPassenger && (selectedPassenger.seatNumbers.includes(seatId) || selectedPassenger.assignedSeat === seatId);
                      
                      let seatBg = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800";
                      
                      if (isSelected) {
                        seatBg = "bg-blue-600 text-white border-blue-700 hover:bg-blue-700";
                      } else if (occupant) {
                        if (occupant.paymentStatus?.toUpperCase() === "PENDING" || occupant.status === "reserved") {
                          seatBg = "bg-amber-500 text-white border-amber-600 hover:bg-amber-600";
                        } else if (occupant.status === "cancelled") {
                          seatBg = "bg-rose-500 text-white border-rose-600 hover:bg-rose-600";
                        } else {
                          if (occupant.gender?.toLowerCase() === "male") {
                            seatBg = "bg-sky-400 text-white border-sky-500 hover:bg-sky-500";
                          } else if (occupant.gender?.toLowerCase() === "female") {
                            seatBg = "bg-pink-400 text-white border-pink-500 hover:bg-pink-500";
                          } else {
                            seatBg = "bg-slate-400 text-white border-slate-500 hover:bg-slate-500";
                          }
                        }
                      }
                      
                      return (
                        <button
                          key={seatId}
                          onClick={() => handleSeatClick(seatId)}
                          className={`h-6 w-7 rounded-md text-[9px] font-bold flex items-center justify-center border transition-all ${seatBg}`}
                          title={occupant ? `${seatId}: ${occupant.travelerName} (${occupant.status})` : `${seatId}: Available`}
                        >
                          {seatId}
                        </button>
                      );
                    });
                  })}
                </div>
                
                {/* Color code reference */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 border-t border-slate-100 dark:border-slate-850 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-sky-400 rounded-sm border border-sky-500" />
                    <span>Booked Male</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-pink-400 rounded-sm border border-pink-500" />
                    <span>Booked Female</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm border border-amber-600" />
                    <span>Reserved/Pending</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm border border-blue-700" />
                    <span>Selected Traveler</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <span className="w-2.5 h-2.5 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800" />
                    <span>Available Seat</span>
                  </div>
                </div>
              </div>
            </GlassCard>
            
          </div>
        </div>

        {/* ─── UPDATE SCHEDULE MODAL ─── */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in px-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-150 dark:border-slate-800 shadow-2xl p-6 relative">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Update Schedule</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Only departure date &amp; time can be modified</p>
                </div>
              </div>

              {/* Locked fields notice */}
              <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Lock className="w-3 h-3" /> Read-Only Fields (Agent Cannot Edit)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { label: "Price", value: `₹${selectedTrip?.pricePerPerson?.toLocaleString("en-IN") || "—"}` },
                    { label: "Route", value: selectedTrip?.pickupLocation || "—" },
                    { label: "Seat Capacity", value: `${selectedTrip?.totalSeats || 40} seats` },
                    { label: "Vehicle", value: selectedTrip?.busNumber || "—" },
                  ].map(f => (
                    <div key={f.label} className="bg-white dark:bg-slate-900 rounded-lg px-2.5 py-2 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block font-semibold">{f.label}</span>
                      <span className="text-slate-600 dark:text-slate-400 font-bold truncate block">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">New Departure Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={schedNewDate}
                    onChange={e => setSchedNewDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">New Departure Time <span className="text-rose-500">*</span></label>
                  <input
                    type="time"
                    value={schedNewTime}
                    onChange={e => setSchedNewTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Status message */}
              {scheduleMsg && (
                <div className={`mt-4 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  scheduleMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 border border-emerald-200/50"
                    : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 border border-rose-200/50"
                }`}>
                  {scheduleMsg.type === "success" ? <CheckSquare className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {scheduleMsg.text}
                </div>
              )}

              {/* Consent warning if bookings exist */}
              {tripBookings.filter((b: any) => (b.paymentStatus || "").toUpperCase() !== "CANCELLED").length > 0 && (
                <div className="mt-4 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-start gap-2">
                  <Bell className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>{tripBookings.filter((b: any) => (b.paymentStatus || "").toUpperCase() !== "CANCELLED").length} passenger(s)</strong> have active bookings. All must approve via OTP before the schedule is updated.
                  </span>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInitiateScheduleChange}
                  disabled={scheduleUpdating || !schedNewDate || !schedNewTime}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {scheduleUpdating ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                  ) : tripBookings.filter((b: any) => (b.paymentStatus || "").toUpperCase() !== "CANCELLED").length > 0 ? (
                    <><Send className="w-3.5 h-3.5" /> Send OTP to Passengers</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" /> Apply Schedule Change</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── FLOATING QR PREVIEW MODAL ─── */}
        {qrPreviewUrl && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full mx-4 border border-slate-100 dark:border-slate-850 shadow-2xl relative">
              <button 
                onClick={() => { setQrPreviewUrl(null); setQrPreviewPassenger(null); }}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center space-y-4">
                <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-150">Boarding Pass QR</h3>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{qrPreviewPassenger}</p>
                <div className="w-60 h-60 mx-auto bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 p-2 flex items-center justify-center">
                  <img src={qrPreviewUrl} alt="QR Code" className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] text-teal-650 bg-teal-50 dark:bg-teal-950/20 px-3 py-1 rounded-full font-bold">
                  Scan to board passenger
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── PASSENGER BOOKING DETAIL SLIDE-OVER DRAWER ─── */}
        {selectedPassenger && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setSelectedPassenger(null)}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col p-6 animate-slide-left border-l border-slate-150 dark:border-slate-800">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-855 pb-4 mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">
                    Passenger Ledger Profile
                  </span>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    {selectedPassenger.travelerName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPassenger(null)}
                  className="p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
                {/* Boarding Status Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">Boarding Status</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">
                      {selectedPassenger.boardingStatus === "boarded"
                        ? "Checked In & Boarded"
                        : selectedPassenger.boardingStatus === "no_show"
                        ? "Declared No-Show"
                        : "Not Boarded"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleBoardingStatusToggle(selectedPassenger)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                      selectedPassenger.boardingStatus === "boarded"
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-slate-100 dark:bg-slate-805 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350"
                    }`}
                  >
                    {selectedPassenger.boardingStatus === "boarded" ? "Mark Not Boarded" : "Check In"}
                  </button>
                </div>

                 {/* Primary Booking metadata */}
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Booking Ticket ID</span>
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{selectedPassenger.bookingId}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Contact Phone</span>
                      <span className="font-mono text-xs text-slate-800 dark:text-slate-100">{selectedPassenger.contactNumber}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-850 pt-2">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Gender</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-100">{selectedPassenger.gender || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Age</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-100">{selectedPassenger.age || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Email Address</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate block">{(selectedPassenger as any).email || "—"}</span>
                    </div>
                  </div>

                  {/* Seat assignment editing */}
                  <div className="bg-slate-50/50 dark:bg-slate-850/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-850">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block">Seat Assignment</span>
                        {isEditingSeat ? (
                          <input
                            type="text"
                            value={editedSeats}
                            onChange={(e) => setEditedSeats(e.target.value)}
                            className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs font-mono w-40 mt-1 focus:outline-hidden focus:border-teal-500"
                          />
                        ) : (
                          <span className="font-extrabold text-slate-850 dark:text-slate-100">
                            {selectedPassenger.assignedSeat || selectedPassenger.seatNumbers.join(", ") || "No Seat Assigned"}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (isEditingSeat) {
                            handleUpdateDetails();
                          } else {
                            setIsEditingSeat(true);
                          }
                        }}
                        className="text-[10px] text-primary dark:text-primary-light font-bold flex items-center gap-1 hover:underline"
                      >
                        {isEditingSeat ? <Save className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                        {isEditingSeat ? "Save" : "Change Seat"}
                      </button>
                    </div>
                  </div>

                  {/* Pickup location editing */}
                  <div className="bg-slate-50/50 dark:bg-slate-850/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-850">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block">Pickup Location</span>
                        {isEditingPickup ? (
                          <input
                            type="text"
                            value={editedPickup}
                            onChange={(e) => setEditedPickup(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs w-48 mt-1 focus:outline-hidden focus:border-teal-500"
                          />
                        ) : (
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {selectedPassenger.pickupLocation || "Hope Farm, Bangalore"}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (isEditingPickup) {
                            handleUpdateDetails();
                          } else {
                            setIsEditingPickup(true);
                          }
                        }}
                        className="text-[10px] text-primary dark:text-primary-light font-bold flex items-center gap-1 hover:underline"
                      >
                        {isEditingPickup ? <Save className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                        {isEditingPickup ? "Save" : "Edit Pickup"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ledger Financial Invoice */}
                <div className="space-y-3 pt-3 border-t border-slate-150 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">
                    Financial Breakdowns
                  </span>
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Payment Status</span>
                      <span
                        className={`font-bold ${
                          selectedPassenger.paymentStatus === "Paid"
                            ? "text-emerald-500"
                            : selectedPassenger.paymentStatus === "Pending"
                            ? "text-amber-500"
                            : "text-rose-500"
                        }`}
                      >
                        {selectedPassenger.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Paid Amount</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">₹{selectedPassenger.pricePaid}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">GST Share (5%)</span>
                      <span>₹{(selectedPassenger.pricePaid * 0.05).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Convenience Fee</span>
                      <span>₹150.00</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Razorpay Order ID</span>
                      <span className="font-mono truncate block text-[10px]">{(selectedPassenger as any).razorpayOrderId || "order_mock_94380"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Razorpay Payment ID</span>
                      <span className="font-mono truncate block text-[10px]">{(selectedPassenger as any).razorpayPaymentId || "pay_mock_37281"}</span>
                    </div>
                    <div className="col-span-2 flex justify-between border-t border-slate-200/50 dark:border-slate-805 pt-2">
                      <div>
                        <span className="text-[9px] text-slate-400 block">Booking Date</span>
                        <span>{new Date(selectedPassenger.bookingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      {selectedPassenger.paymentStatus === "Cancelled" && (
                        <div className="text-right">
                          <span className="text-[9px] text-rose-455 block">Refund Status</span>
                          <span className="font-bold text-rose-500">Refund Approved</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${selectedPassenger.contactNumber}`}
                    className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-350 flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-850"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Call Traveler
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?phone=${selectedPassenger.contactNumber.replace(/[^0-9]/g, "")}&text=Hello ${encodeURIComponent(selectedPassenger.travelerName)}, this is regarding your upcoming booking ${selectedPassenger.bookingId} for ${encodeURIComponent(selectedPassenger.tripName || selectedTrip?.title)}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 rounded-xl border border-emerald-255 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 hover:bg-emerald-50/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Message
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => triggerInvoiceDownload(selectedPassenger.bookingId)}
                    className="py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Invoice PDF
                  </button>
                  <button
                    onClick={() => triggerBoardingPassDownload(selectedPassenger.bookingId)}
                    className="py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Boarding Pass
                  </button>
                </div>

                {/* Status overrides */}
                <div className="flex gap-2">
                  {selectedPassenger.paymentStatus === "Pending" && (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => handleStatusChange(selectedPassenger._id, "Paid")}
                        className="flex-1 py-2 font-bold text-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Approve Ticket
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleStatusChange(selectedPassenger._id, "Cancelled")}
                        className="flex-1 py-2 font-bold text-xs"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Cancel Reservation
                      </Button>
                    </>
                  )}
                  {selectedPassenger.paymentStatus === "Paid" && (
                    <Button
                      variant="danger"
                      onClick={() => handleStatusChange(selectedPassenger._id, "Cancelled")}
                      className="w-full py-2.5 font-bold text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Cancel Reservation & Refund Ticket
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── CASE B: All Trips Summary view (URL: /bookings) ───
  // Calculate analytics for each trip card
  const tripSummaries = tripsList.map((trip) => {
    const tripBookings = bookingsList.filter(
      (b) =>
        b.agentTrip === trip._id ||
        (typeof b.agentTrip === "object" && b.agentTrip?._id === trip._id)
    );

    const activeBookings = tripBookings.filter((b) => b.paymentStatus !== "Cancelled");
    const totalTravelers = activeBookings.reduce((sum, b) => sum + b.seats, 0);

    const revenue = activeBookings
      .filter((b) => b.paymentStatus === "Paid")
      .reduce((sum, b) => sum + b.pricePaid, 0);

    const pendingCount = tripBookings.filter((b) => b.paymentStatus === "Pending").length;
    const cancelledCount = tripBookings.filter((b) => b.paymentStatus === "Cancelled").length;

    return {
      ...trip,
      bookingsCount: tripBookings.length,
      totalTravelers,
      revenue,
      pendingCount,
      cancelledCount,
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          Bookings Ledger
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mt-1">
          Review active departures, group ledger aggregates, and run traveler manifest sheets.
        </p>
      </div>

      {/* ── Trips Summary Section (Cards Grid) ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Active Trips Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tripSummaries.map((trip) => {
            const seatsFilled = trip.totalTravelers;
            const seatsAvailable = trip.availableSeats;
            const filledPercent = trip.totalSeats > 0 ? Math.round((seatsFilled / trip.totalSeats) * 100) : 0;

            return (
              <GlassCard key={trip._id} className="p-0 overflow-hidden flex flex-col justify-between border border-slate-150 dark:border-slate-850 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Card Cover image header */}
                <div className="relative h-32 w-full bg-slate-105 shrink-0">
                  {trip.coverImage ? (
                    <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
                      ✈️
                    </div>
                  )}
                  {/* Date overlay */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white shadow-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(trip.startDate)}
                  </div>
                  {/* Category overlay */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-teal-500 text-[9px] font-black text-white shadow-sm uppercase tracking-wider">
                    {trip.category || "General"}
                  </div>
                </div>

                {/* Info & Stats */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug line-clamp-1">
                        {trip.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                        {trip.duration} · {trip.busType}
                      </p>
                    </div>

                    {/* Progress Bar (Occupancy) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>Occupancy</span>
                        <span>
                          {seatsFilled} / {trip.totalSeats} seats ({filledPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-105 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-505 rounded-full transition-all duration-300"
                          style={{ width: `${filledPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Numeric details Grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Revenue</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-405">
                          ₹{trip.revenue.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Available Seats</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {seatsAvailable} Left
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Pending Payments</span>
                        <span className={`text-xs font-bold ${trip.pendingCount > 0 ? "text-amber-500" : "text-slate-400"}`}>
                          {trip.pendingCount} Pending
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Cancelled Count</span>
                        <span className="text-xs font-semibold text-rose-500">
                          {trip.cancelledCount} Cancelled
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-850 pt-4 mt-4">
                    <button
                      onClick={() => navigate(`/bookings/${trip._id}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-teal-500 text-white text-[10px] font-bold shadow hover:bg-teal-650 transition-all flex items-center justify-center gap-1 w-full col-span-2"
                      title="View Bookings"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      View Bookings & Passengers
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
