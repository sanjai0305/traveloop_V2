import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Map, Search, Star, Eye, EyeOff, Check, X, Trash2, Calendar } from "lucide-react";

interface Trip {
  _id: string;
  title: string;
  destinations: string[];
  duration: string;
  startDate: string;
  endDate: string;
  pricePerPerson: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  coverImage: string;
  approvalStatus: "pending" | "approved" | "rejected";
  isHidden: boolean;
  isFeatured: boolean;
  isDeleted?: boolean;
  status?: string;
  createdAt?: string;
  agent: {
    companyName: string;
    displayName: string;
    email: string;
  };
}

export const Trips: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");

  const loadTrips = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/trips");
      if (res.data.success) {
        setTrips(res.data.trips);
        setFilteredTrips(res.data.trips);
      }
    } catch (err) {
      console.error("Failed to load trips", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  // Search filter
  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = trips.filter(
      (t) => {
        const matchesTab = activeTab === "active"
          ? !t.isDeleted && t.status !== "deleted"
          : t.isDeleted || t.status === "deleted";
        const matchesSearch =
          t.title.toLowerCase().includes(term) ||
          t.destinations.join(" ").toLowerCase().includes(term) ||
          (t.agent?.companyName || "").toLowerCase().includes(term);
        return matchesTab && matchesSearch;
      }
    );
    setFilteredTrips(filtered);
  }, [search, trips, activeTab]);

  const handleUpdateTrip = async (
    tripId: string,
    updates: Partial<Pick<Trip, "approvalStatus" | "isHidden" | "isFeatured">> & { action?: string }
  ) => {
    try {
      const res = await api.patch(`/admin/trips/${tripId}`, updates);
      if (res.data.success) {
        if (updates.action === "delete") {
          setTrips(
            trips.map((t) =>
              t._id === tripId ? { ...t, isDeleted: true, status: "deleted" } : t
            )
          );
        } else {
          setTrips(
            trips.map((t) =>
              t._id === tripId ? { ...t, ...updates, ...res.data.trip } : t
            )
          );
        }
      }
    } catch (err) {
      alert("Failed to update trip");
    }
  };

  const handleRestoreTrip = async (tripId: string) => {
    try {
      const res = await api.post(`/admin/trips/${tripId}/restore`);
      if (res.data.success) {
        alert("Trip restored successfully");
        setTrips(
          trips.map((t) =>
            t._id === tripId ? { ...t, isDeleted: false, status: "published", approvalStatus: "approved" } : t
          )
        );
      }
    } catch (err) {
      alert("Failed to restore trip");
    }
  };

  const handlePurgeTrip = async (tripId: string) => {
    try {
      const res = await api.delete(`/admin/trips/${tripId}/purge`);
      if (res.data.success) {
        alert("Trip permanently deleted from database");
        setTrips(trips.filter((t) => t._id !== tripId));
      }
    } catch (err) {
      alert("Failed to purge trip");
    }
  };

  const fmtPrice = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Loading packages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-slate-800 flex items-center gap-2">
            <Map className="w-5 h-5 text-[#14B8A6]" />
            <span>Trips</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Approve, feature, hide or audit active marketplace itineraries.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search trips or destinations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-205 rounded-xl focus:outline-none focus:border-[#14B8A6] text-xs text-slate-700 shadow-xs"
          />
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "active"
              ? "border-[#14B8A6] text-[#14B8A6] font-bold"
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          Active Packages
        </button>
        <button
          onClick={() => setActiveTab("deleted")}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "deleted"
              ? "border-[#14B8A6] text-[#14B8A6] font-bold"
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          Deleted / Archived
        </button>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.length === 0 ? (
          <div className="col-span-full text-center py-16 glass-panel flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[20px] shadow-xs">
            <Map className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-xs font-bold text-slate-400">No matching trip packages found.</p>
          </div>
        ) : (
          filteredTrips.map((trip) => {
            const isOverdue = trip.approvalStatus === "pending" && trip.createdAt && (Date.now() - new Date(trip.createdAt).getTime() > 60 * 60 * 1000);
            return (
              <div key={trip._id} className={`glass-panel overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 bg-white border rounded-[20px] ${
                isOverdue ? "border-orange-500 ring-2 ring-orange-550/20" : "border-slate-200"
              }`}>
                <div>
                  {/* Banner Image */}
                  <div className="relative h-44 w-full bg-slate-50">
                    <img
                      src={trip.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600"}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600";
                      }}
                    />
                    {/* Status Badges Overlay */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        trip.approvalStatus === "approved"
                          ? "bg-emerald-500 text-white"
                          : trip.approvalStatus === "rejected"
                          ? "bg-rose-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}>
                        {trip.approvalStatus}
                      </span>
                      {isOverdue && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-500 text-white animate-pulse">
                          ⚠️ Overdue (over 1h)
                        </span>
                      )}
                      {trip.isHidden && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-900 text-white">
                        Hidden
                      </span>
                    )}
                    {trip.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-900">
                        ★ Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 font-poppins line-clamp-1">{trip.title}</h3>
                    <p className="text-[9px] text-[#14B8A6] font-extrabold uppercase mt-1 tracking-wider">{trip.destinations.join(" → ")}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-100 py-3">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Travel Agency</span>
                      <span className="font-bold text-slate-700 truncate block mt-0.5">{trip.agent?.companyName || "Independent"}</span>
                      <span className="text-[9px] text-slate-450 block mt-0.5">{trip.agent?.displayName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Seats Occupied</span>
                      <span className="font-mono font-bold text-slate-700 block mt-0.5">
                        {trip.bookedSeats || 0} / {trip.totalSeats}
                      </span>
                      <span className="text-[9px] text-[#14B8A6] font-bold block mt-0.5">
                        {trip.totalSeats - (trip.bookedSeats || 0)} available
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Trip Dates</span>
                      <span className="font-semibold text-slate-600 block mt-0.5">{trip.startDate}</span>
                      <span className="text-[9px] text-slate-400 block">to {trip.endDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Price Per Person</span>
                      <span className="text-xs font-black text-slate-805 font-mono block mt-0.5">{fmtPrice(trip.pricePerPerson || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2 rounded-b-[20px]">
                <button
                  onClick={() => alert(`Itinerary detail for ${trip.title}:\n\n- Destinations: ${trip.destinations.join(", ")}\n- Duration: ${trip.duration}\n- Agent Email: ${trip.agent?.email || 'N/A'}`)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 font-bold text-[10px] hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {trip.isDeleted || trip.status === "deleted" ? (
                    <>
                      <button
                        onClick={() => handleRestoreTrip(trip._id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] transition-all flex items-center gap-1"
                        title="Restore Trip"
                      >
                        <Check className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to PERMANENTLY delete this package from the database? This cannot be undone!")) {
                            handlePurgeTrip(trip._id);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] transition-all flex items-center gap-1"
                        title="Permanent Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Purge</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Feature star */}
                      <button
                        onClick={() => handleUpdateTrip(trip._id, { isFeatured: !trip.isFeatured })}
                        className={`p-1.5 rounded-lg border transition-all ${
                          trip.isFeatured
                            ? "bg-amber-500 border-amber-600 text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                        }`}
                        title="Feature Trip"
                      >
                        <Star className={`w-3.5 h-3.5 ${trip.isFeatured ? 'fill-current' : ''}`} />
                      </button>

                      {/* Hide toggle */}
                      <button
                        onClick={() => handleUpdateTrip(trip._id, { isHidden: !trip.isHidden })}
                        className={`p-1.5 rounded-lg border transition-all ${
                          trip.isHidden
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                        }`}
                        title={trip.isHidden ? "Unhide Trip" : "Hide Trip"}
                      >
                        {trip.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {/* Approve button */}
                      {trip.approvalStatus !== "approved" && (
                        <button
                          onClick={() => handleUpdateTrip(trip._id, { approvalStatus: "approved" })}
                          className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-all"
                          title="Approve Package"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Reject button */}
                      {trip.approvalStatus !== "rejected" && (
                        <button
                          onClick={() => handleUpdateTrip(trip._id, { approvalStatus: "rejected" })}
                          className="p-1.5 rounded bg-rose-500 hover:bg-rose-600 text-white transition-all"
                          title="Reject Package"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Soft Delete */}
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this package? Associated bookings will be cancelled.")) {
                            handleUpdateTrip(trip._id, { action: "delete" });
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-slate-400 transition-all"
                        title="Delete Package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
};
export default Trips;
