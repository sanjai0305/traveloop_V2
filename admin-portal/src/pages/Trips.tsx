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
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading package catalogs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-teal-400" />
            <span>Trip Moderation Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Audit published itineraries, feature top tours, and reject packages.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search trips or destinations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-xs text-white"
          />
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-2 border-b border-slate-800/80">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-5 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all ${
            activeTab === "active"
              ? "border-teal-500 text-teal-400 font-bold bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Active Packages
        </button>
        <button
          onClick={() => setActiveTab("deleted")}
          className={`px-5 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all ${
            activeTab === "deleted"
              ? "border-teal-500 text-teal-400 font-bold bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Deleted / Archived Trips
        </button>
      </div>

      {/* Trips Grid/Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-900/40">
                <th className="py-4 px-6">Package details</th>
                <th className="py-4 px-6">Travel Agency</th>
                <th className="py-4 px-6">Destinations</th>
                <th className="py-4 px-6 text-center">Dates & Duration</th>
                <th className="py-4 px-6 text-center">Occupancy</th>
                <th className="py-4 px-6 text-right">Price</th>
                <th className="py-4 px-6 text-center">Audit Status</th>
                <th className="py-4 px-6 text-center">Toggles</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    No matching trip itineraries found.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip._id} className="hover:bg-slate-900/30 transition-colors">
                    
                    {/* Cover & Title */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={trip.coverImage || "/placeholder.jpg"}
                          alt={trip.title}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200";
                          }}
                        />
                        <div>
                          <div className="font-semibold text-white truncate max-w-[200px]">{trip.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{trip.duration}</div>
                        </div>
                      </div>
                    </td>

                    {/* Agency */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-200">{trip.agent?.companyName || "Independent"}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{trip.agent?.displayName}</div>
                    </td>

                    {/* Destinations */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {trip.destinations.map((d, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] border border-slate-800 text-slate-400"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{trip.startDate}</span>
                        </div>
                        <div className="text-[9px] text-slate-500">to {trip.endDate}</div>
                      </div>
                    </td>

                    {/* Occupancy */}
                    <td className="py-4 px-6 text-center font-mono">
                      <div>
                        <span className="text-teal-400 font-bold">{trip.bookedSeats || 0}</span>
                        <span className="text-slate-500">/{trip.totalSeats}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        {trip.totalSeats - (trip.bookedSeats || 0)} available
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-6 text-right font-mono font-bold text-white">
                      {fmtPrice(trip.pricePerPerson || 0)}
                    </td>

                    {/* Approval Status */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          trip.approvalStatus === "approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : trip.approvalStatus === "rejected"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {trip.approvalStatus}
                      </span>
                    </td>

                    {/* Toggles */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* Feature */}
                        <button
                          onClick={() => handleUpdateTrip(trip._id, { isFeatured: !trip.isFeatured })}
                          className={`p-1.5 rounded-lg border transition-all ${
                            trip.isFeatured
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                          }`}
                          title="Feature Trip"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* Hide */}
                        <button
                          onClick={() => handleUpdateTrip(trip._id, { isHidden: !trip.isHidden })}
                          className={`p-1.5 rounded-lg border transition-all ${
                            trip.isHidden
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                          }`}
                          title={trip.isHidden ? "Unhide Trip" : "Hide Trip"}
                        >
                          {trip.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Moderation approvals */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        {trip.isDeleted || trip.status === "deleted" ? (
                          <>
                            <button
                              onClick={() => handleRestoreTrip(trip._id)}
                              className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-[10px] transition-all flex items-center gap-1"
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
                              className="px-2.5 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 font-bold text-[10px] transition-all flex items-center gap-1"
                              title="Permanent Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Purge</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {trip.approvalStatus !== "approved" && (
                              <button
                                onClick={() => handleUpdateTrip(trip._id, { approvalStatus: "approved" })}
                                className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 transition-all"
                                title="Approve Package"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {trip.approvalStatus !== "rejected" && (
                              <button
                                onClick={() => handleUpdateTrip(trip._id, { approvalStatus: "rejected" })}
                                className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 transition-all"
                                title="Reject Package"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this package? Associated bookings will be cancelled.")) {
                                  handleUpdateTrip(trip._id, { action: "delete" });
                                }
                              }}
                              className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-500 transition-all"
                              title="Delete Package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
