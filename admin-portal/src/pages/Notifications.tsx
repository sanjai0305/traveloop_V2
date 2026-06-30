import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Bell, Check, Clock, Radio, RefreshCw } from "lucide-react";

interface AdminNotif {
  _id: string;
  title: string;
  message: string;
  type: "booking" | "trip_published" | "refund_requested" | "settlement_due" | "info";
  read: boolean;
  createdAt: string;
}

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotif[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/notifications");
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.patch(`/admin/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(
          notifications.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-teal-500/10 text-teal-400";
      case "trip_published":
        return "bg-cyan-500/10 text-cyan-400";
      case "settlement_due":
        return "bg-amber-500/10 text-amber-400";
      case "refund_requested":
        return "bg-rose-500/10 text-rose-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  const fmtTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Syncing communication nodes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-poppins text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-teal-400" />
            <span>Marketplace System Alerts</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Audit logs of transaction, publication, and withdrawal events.</p>
        </div>

        <button
          onClick={loadNotifications}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-teal-400 hover:rotate-180 transition-all duration-300"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl text-slate-500">
            No system notifications or alerts currently logged.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`glass-panel p-5 rounded-2xl flex items-center justify-between gap-6 transition-all border ${
                n.read ? "opacity-60" : "border-teal-500/10 hover:border-teal-500/30"
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Icon wrapper */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconColor(n.type)}`}>
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-xs text-white truncate">{n.title}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {n.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>{fmtTime(n.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  className="p-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-bold shrink-0 shadow-lg shadow-teal-500/15"
                  title="Mark as Read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};
