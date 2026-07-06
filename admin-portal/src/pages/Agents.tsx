import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Users, Edit, ShieldAlert, CheckCircle, Ban, Search, DollarSign } from "lucide-react";

interface Agent {
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

export const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
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
        setAgents(res.data.agents);
        setFilteredAgents(res.data.agents);
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

  // Search filter
  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = agents.filter(
      (a) =>
        (a.companyName || "").toLowerCase().includes(term) ||
        (a.displayName || "").toLowerCase().includes(term) ||
        (a.email || "").toLowerCase().includes(term)
    );
    setFilteredAgents(filtered);
  }, [search, agents]);

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
      maximumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading travel agent directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-400" />
            <span>Agent Moderation System</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure marketplace payouts and agent statuses.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-xs text-white"
          />
        </div>
      </div>

      {/* Agents Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-900/40">
                <th className="py-4 px-6">Company & Contact</th>
                <th className="py-4 px-6">Email & Phone</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Commission %</th>
                <th className="py-4 px-6 text-center">Trip Slots</th>
                <th className="py-4 px-6 text-right">Wallet Balance</th>
                <th className="py-4 px-6 text-right">Pending Payouts</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No active travel agents found matching your query.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent._id} className="hover:bg-slate-900/30 transition-colors">
                    {/* Company */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{agent.companyName || "Independent Agent"}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{agent.displayName}</div>
                    </td>
                    
                    {/* Contacts */}
                    <td className="py-4 px-6">
                      <div>{agent.email}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{agent.phone || "---"}</div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          agent.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : agent.status === "suspended"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {agent.status === "approved" ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : agent.status === "suspended" ? (
                          <Ban className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                        <span>{agent.status}</span>
                      </span>
                    </td>

                    {/* Commission Rate */}
                    <td className="py-4 px-6 text-center font-mono font-bold text-teal-400">
                      {agent.commissionRate || 10}%
                    </td>

                    {/* Trip Slots */}
                    <td className="py-4 px-6 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        (agent.usedSlots || 0) >= ((agent.tripSlots ?? 2) + (agent.bonusSlots ?? 0) + (agent.purchasedSlots ?? 0))
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-800/40 text-slate-300 border border-slate-700/30"
                      }`}>
                        {agent.usedSlots || 0} / {(agent.tripSlots ?? 2) + (agent.bonusSlots ?? 0) + (agent.purchasedSlots ?? 0)}
                      </span>
                    </td>

                    {/* Wallet */}
                    <td className="py-4 px-6 text-right font-mono font-semibold text-emerald-400">
                      {fmt(agent.walletBalance || 0)}
                    </td>

                    {/* Pending */}
                    <td className="py-4 px-6 text-right font-mono text-slate-400">
                      {fmt(agent.pendingRevenue || 0)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setEditAgent(agent);
                            setNewComm(agent.commissionRate || 10);
                            setNewTripSlots(agent.tripSlots ?? 2);
                            setNewBonusSlots(agent.bonusSlots ?? 0);
                            setNewPurchasedSlots(agent.purchasedSlots ?? 0);
                          }}
                          title="Edit Agent Details & Slots"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-400 transition-all duration-200"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        
                        {agent.status !== "approved" && (
                          <button
                            onClick={() => handleUpdateStatus(agent._id, "approved")}
                            className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500 hover:text-slate-950 transition-all duration-200"
                          >
                            Approve
                          </button>
                        )}

                        {agent.status !== "suspended" && (
                          <button
                            onClick={() => handleUpdateStatus(agent._id, "suspended")}
                            className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-500 hover:text-slate-950 transition-all duration-200"
                          >
                            Suspend
                          </button>
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

      {/* ── COMMISSION & TRIP SLOTS MODAL EDITOR ── */}
      {editAgent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-md font-bold text-white font-poppins">Edit Agent Settings</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Override commission policy and trip slots allocation for: {editAgent.companyName || editAgent.displayName}</p>
            </div>
 
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Presets */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Commission Preset</label>
                <div className="flex justify-between items-center gap-2">
                  {[
                    { label: "Enterprise (5%)", val: 5 },
                    { label: "Premium (8%)", val: 8 },
                    { label: "Standard (10%)", val: 10 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => setNewComm(preset.val)}
                      type="button"
                      className={`flex-1 text-[10px] font-semibold py-2 rounded-xl transition-all border ${
                        newComm === preset.val
                          ? "bg-teal-500 border-teal-500 text-slate-950 shadow-md shadow-teal-500/10"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
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
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500 text-xs font-bold font-mono">%</div>
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-bold font-mono"
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-bold font-mono"
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-bold font-mono"
                  />
                </div>
              </div>

              {/* Slot Management Presets / Reset */}
              <div className="flex gap-2 justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewTripSlots(prev => prev + 1);
                  }}
                  className="flex-1 py-1.5 bg-slate-850 hover:bg-slate-800 text-teal-400 font-bold rounded-xl text-[10px] transition-colors border border-slate-800"
                >
                  +1 Base Slot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewTripSlots(prev => Math.max(0, prev - 1));
                  }}
                  className="flex-1 py-1.5 bg-slate-850 hover:bg-slate-800 text-rose-400 font-bold rounded-xl text-[10px] transition-colors border border-slate-800"
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
                  className="flex-1 py-1.5 bg-slate-950 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 font-bold rounded-xl text-[10px] transition-colors border border-slate-800"
                >
                  Reset Slots
                </button>
              </div>
            </div>
 
            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditAgent(null)}
                className="flex-1 py-2 px-4 bg-slate-950 border border-slate-800 hover:bg-slate-800/50 rounded-xl text-slate-400 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCommission}
                disabled={saving}
                className="flex-1 py-2 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-teal-500/10"
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
