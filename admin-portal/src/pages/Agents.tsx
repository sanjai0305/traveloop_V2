import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  Users,
  Edit,
  ShieldAlert,
  CheckCircle,
  Ban,
  Search,
  DollarSign,
  Filter,
  UserCheck,
  Clock,
  Wallet,
  Check,
  X
} from "lucide-react";

export interface Agent {
  _id: string;
  displayName: string;
  companyName: string;
  email: string;
  phone: string;
  status: "pending" | "approved" | "suspended";
  commissionRate: number;
  walletBalance: number;
  totalRevenue: number;
  pendingRevenue: number;
  settledRevenue: number;
  tripSlots?: number;
  usedSlots?: number;
  bonusSlots?: number;
  purchasedSlots?: number;
}

export const normalizeAgent = (raw: any): Agent => {
  if (!raw || typeof raw !== "object") {
    return {
      _id: String(Math.random()),
      displayName: "Independent Agent",
      companyName: "Independent Agent",
      email: "",
      phone: "",
      status: "pending",
      commissionRate: 10,
      walletBalance: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      settledRevenue: 0,
      tripSlots: 2,
      usedSlots: 0,
      bonusSlots: 0,
      purchasedSlots: 0,
    };
  }

  const companyName = String(raw.companyName || raw.name || "Independent Agent");
  const displayName = String(raw.displayName || raw.name || companyName);
  const email = String(raw.email || "");
  const phone = String(raw.phone || raw.mobile || "");

  let status: "pending" | "approved" | "suspended" = "pending";
  const s = String(raw.status || raw.kycStatus || "").toLowerCase();
  if (s === "approved" || s === "kyc_completed") {
    status = "approved";
  } else if (s === "suspended") {
    status = "suspended";
  }

  return {
    _id: String(raw._id || Math.random()),
    companyName,
    displayName,
    email,
    phone,
    status,
    commissionRate: Number(raw.commissionRate ?? 10) || 10,
    walletBalance: Number(raw.walletBalance ?? raw.revenue ?? 0) || 0,
    totalRevenue: Number(raw.totalRevenue ?? raw.revenue ?? 0) || 0,
    pendingRevenue: Number(raw.pendingRevenue ?? 0) || 0,
    settledRevenue: Number(raw.settledRevenue ?? 0) || 0,
    tripSlots: Number(raw.tripSlots ?? 2) || 2,
    usedSlots: Number(raw.usedSlots ?? raw.totalBookings ?? 0) || 0,
    bonusSlots: Number(raw.bonusSlots ?? 0) || 0,
    purchasedSlots: Number(raw.purchasedSlots ?? 0) || 0,
  };
};

export const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [newComm, setNewComm] = useState<number>(10);
  const [newTripSlots, setNewTripSlots] = useState<number>(2);
  const [newBonusSlots, setNewBonusSlots] = useState<number>(0);
  const [newPurchasedSlots, setNewPurchasedSlots] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/agents");
      if (res.data.success) {
        const rawList = res.data.agents || [];
        const normalized = Array.isArray(rawList) ? rawList.map(normalizeAgent) : [];
        setAgents(normalized);
        setFilteredAgents(normalized);
      }
    } catch (err) {
      console.error("Failed to load agents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  // Search & status filter
  useEffect(() => {
    const term = search.trim().toLowerCase();
    const filtered = agents.filter((a) => {
      const company = String(a.companyName || "").toLowerCase();
      const display = String(a.displayName || "").toLowerCase();
      const email = String(a.email || "").toLowerCase();
      const phone = String(a.phone || "").toLowerCase();

      const matchesSearch =
        company.includes(term) ||
        display.includes(term) ||
        email.includes(term) ||
        phone.includes(term);

      const matchesStatus =
        statusFilter === "all" || (a.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
    setFilteredAgents(filtered);
  }, [search, statusFilter, agents]);

  const handleUpdateStatus = async (agentId: string, status: Agent["status"]) => {
    if (!window.confirm(`Are you sure you want to change the agent status to ${status}?`)) return;
    try {
      const res = await api.patch(`/admin/agents/${agentId}`, { status });
      if (res.data.success) {
        setAgents(agents.map((a) => (a._id === agentId ? { ...a, status } : a)));
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleSaveCommission = async () => {
    if (!editAgent) return;
    setSaving(true);
    try {
      const res = await api.patch(`/admin/agents/${editAgent._id}`, {
        commissionRate: newComm,
        tripSlots: newTripSlots,
        bonusSlots: newBonusSlots,
        purchasedSlots: newPurchasedSlots,
      });
      if (res.data.success) {
        setAgents(
          agents.map((a) =>
            a._id === editAgent._id
              ? {
                  ...a,
                  commissionRate: newComm,
                  tripSlots: newTripSlots,
                  bonusSlots: newBonusSlots,
                  purchasedSlots: newPurchasedSlots,
                }
              : a
          )
        );
        setEditAgent(null);
      }
    } catch (err) {
      alert("Failed to save agent settings");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const getInitials = (name: string) => {
    if (!name) return "AG";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Metrics calculation
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "approved").length;
  const pendingAgents = agents.filter((a) => a.status === "pending").length;
  const totalEarnings = agents.reduce(
    (acc, a) => acc + (a.totalRevenue ?? a.walletBalance ?? 0),
    0
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Loading travel agent directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#14B8A6]" />
            <span>Agents</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage travel agents, commissions, payouts and account status.
          </p>
        </div>

        {/* Search & Filters Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="relative w-36">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 focus:outline-none focus:border-[#14B8A6] cursor-pointer appearance-none shadow-xs font-bold"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#14B8A6] text-xs text-slate-700 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Agents */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Total Agents
            </span>
            <span className="text-xl font-bold font-poppins text-slate-800 mt-0.5 block">
              {totalAgents}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#14B8A6] border border-teal-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Agents */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Active Agents
            </span>
            <span className="text-xl font-bold font-poppins text-slate-800 mt-0.5 block">
              {activeAgents}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Pending Approval
            </span>
            <span className="text-xl font-bold font-poppins text-slate-800 mt-0.5 block">
              {pendingAgents}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Agent Earnings */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Total Agent Revenue
            </span>
            <span className="text-xl font-bold font-poppins text-slate-800 font-mono mt-0.5 block">
              {fmt(totalEarnings)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50/80">
                <th className="py-3.5 px-5">Agent</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 text-center">Commission</th>
                <th className="py-3.5 px-5 text-center whitespace-nowrap">Trips (Used / Total)</th>
                <th className="py-3.5 px-5 text-right">Wallet Balance</th>
                <th className="py-3.5 px-5 text-right">Total Earnings</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-bold text-slate-400">
                        No agents found matching your filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => {
                  const maxSlots =
                    (agent.tripSlots ?? 2) +
                    (agent.bonusSlots ?? 0) +
                    (agent.purchasedSlots ?? 0);
                  const isSlotsFull = (agent.usedSlots || 0) >= maxSlots;

                  return (
                    <tr
                      key={agent._id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Agent Identity */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 font-bold text-xs font-poppins flex items-center justify-center shrink-0">
                            {getInitials(agent.companyName || agent.displayName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate">
                              {agent.companyName || "Independent Agent"}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {agent.displayName || agent.email}
                            </div>
                            {agent.phone && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                {agent.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            agent.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : agent.status === "suspended"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                              : "bg-amber-50 text-amber-700 border border-amber-200/80"
                          }`}
                        >
                          {agent.status === "approved" ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : agent.status === "suspended" ? (
                            <Ban className="w-3 h-3 text-rose-600" />
                          ) : (
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                          )}
                          <span>
                            {agent.status === "approved"
                              ? "Active"
                              : agent.status === "suspended"
                              ? "Suspended"
                              : "Pending"}
                          </span>
                        </span>
                      </td>

                      {/* Commission */}
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-700">
                        {agent.commissionRate || 10}%
                      </td>

                      {/* Trips / Slots (Never wraps) */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold whitespace-nowrap ${
                            isSlotsFull
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200/70"
                          }`}
                        >
                          {agent.usedSlots || 0} / {maxSlots}
                        </span>
                      </td>

                      {/* Wallet Balance */}
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-800">
                        {fmt(agent.walletBalance || 0)}
                      </td>

                      {/* Total Earnings */}
                      <td className="py-3.5 px-5 text-right font-mono text-slate-600">
                        {fmt(agent.totalRevenue || agent.settledRevenue || 0)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          {agent.status !== "approved" && (
                            <button
                              onClick={() => handleUpdateStatus(agent._id, "approved")}
                              className="px-2.5 py-1.2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1"
                              title="Approve Agent"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          {agent.status !== "suspended" && (
                            <button
                              onClick={() => handleUpdateStatus(agent._id, "suspended")}
                              className="px-2.5 py-1.2 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-wider transition-colors"
                              title="Suspend Agent"
                            >
                              Suspend
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditAgent(agent);
                              setNewComm(agent.commissionRate || 10);
                              setNewTripSlots(agent.tripSlots ?? 2);
                              setNewBonusSlots(agent.bonusSlots ?? 0);
                              setNewPurchasedSlots(agent.purchasedSlots ?? 0);
                            }}
                            title="Edit Agent Details & Slots"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
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
      </div>

      {/* ── COMMISSION & TRIP SLOTS MODAL EDITOR ── */}
      {editAgent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-md font-bold text-slate-800 font-poppins">
                  Edit Agent Settings
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Override commission policy and trip slots allocation for:{" "}
                  <span className="font-semibold text-slate-700">
                    {editAgent.companyName || editAgent.displayName}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setEditAgent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Presets */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Commission Preset
                </label>
                <div className="flex justify-between items-center gap-2">
                  {[
                    { label: "Enterprise (5%)", val: 5 },
                    { label: "Premium (8%)", val: 8 },
                    { label: "Standard (10%)", val: 10 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => setNewComm(preset.val)}
                      type="button"
                      className={`flex-1 text-[10px] font-semibold py-2 rounded-xl transition-all border ${
                        newComm === preset.val
                          ? "bg-[#14B8A6] border-[#14B8A6] text-white shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Commission %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newComm}
                      onChange={(e) => setNewComm(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#14B8A6] focus:bg-white font-bold"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold font-mono">
                      %
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Base Slots
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newTripSlots}
                    onChange={(e) => setNewTripSlots(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#14B8A6] focus:bg-white font-bold font-mono"
                  />
                </div>
              </div>

              {/* Bonus and Purchased Slots */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Bonus Slots (Referral)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newBonusSlots}
                    onChange={(e) => setNewBonusSlots(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#14B8A6] focus:bg-white font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Purchased Slots
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPurchasedSlots}
                    onChange={(e) => setNewPurchasedSlots(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#14B8A6] focus:bg-white font-bold font-mono"
                  />
                </div>
              </div>

              {/* Slot Presets / Reset */}
              <div className="flex gap-2 justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setNewTripSlots((prev) => prev + 1)}
                  className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-[#14B8A6] font-bold rounded-xl text-[10px] transition-colors border border-slate-200"
                >
                  +1 Base Slot
                </button>
                <button
                  type="button"
                  onClick={() => setNewTripSlots((prev) => Math.max(0, prev - 1))}
                  className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-rose-600 font-bold rounded-xl text-[10px] transition-colors border border-slate-200"
                >
                  -1 Base Slot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewTripSlots(2);
                    setNewBonusSlots(0);
                    setNewPurchasedSlots(0);
                  }}
                  className="flex-1 py-1.5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold rounded-xl text-[10px] transition-colors border border-slate-200"
                >
                  Reset Slots
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditAgent(null)}
                className="flex-1 py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCommission}
                disabled={saving}
                className="flex-1 py-2 px-4 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                {saving ? "Saving..." : "Apply Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
