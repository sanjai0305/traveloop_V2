// src/components/mobile/BottomNavBar.jsx
// Floating glassmorphism navigation pill

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Map, Plus, Compass, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import BottomSheet from "./BottomSheet";
import { getApiUrl } from "../../utils/api";

const NAV_ITEMS = [
  { id: "home",     label: "nav.home",     icon: Home,    path: "/dashboard" },
  { id: "trips",    label: "nav.trips",    icon: Map,     path: "/my-trips" },
  { id: "new",      label: "nav.create",   icon: Plus,    path: "/create-trip", isFab: true },
  { id: "activity", label: "nav.explore",  icon: Compass, path: "/activities" },
  { id: "profile",  label: "nav.profile",  icon: User,    path: "/profile" },
];

const BottomNavBar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t } = useTranslation();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [form, setForm] = useState({
    budgetName: "",
    tripId: "",
    totalBudget: "",
    currency: "INR",
    category: "",
    startDate: "",
    endDate: ""
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isSheetOpen) {
      const fetchTrips = async () => {
        setTripsLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(getApiUrl("trips"), {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setTrips(data.trips);
            if (data.trips.length > 0) {
              const defaultTrip = data.trips[0];
              setForm({
                budgetName: "",
                tripId: defaultTrip._id,
                totalBudget: "",
                currency: "INR",
                category: "",
                startDate: defaultTrip.startDate || "",
                endDate: defaultTrip.endDate || ""
              });
            }
          }
        } catch (err) {
          console.error("Error fetching trips:", err);
        } finally {
          setTripsLoading(false);
        }
      };
      fetchTrips();
    }
  }, [isSheetOpen]);

  const handleTripChange = (e) => {
    const selectedId = e.target.value;
    const selectedTrip = trips.find(t => t._id === selectedId);
    setForm(prev => ({
      ...prev,
      tripId: selectedId,
      startDate: selectedTrip ? (selectedTrip.startDate || "") : "",
      endDate: selectedTrip ? (selectedTrip.endDate || "") : "",
      budgetName: prev.budgetName || (selectedTrip ? `${selectedTrip.title} Budget` : "")
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tripId) {
      setFormError("Please select a trip.");
      return;
    }
    if (!form.budgetName.trim()) {
      setFormError("Please enter a budget name.");
      return;
    }
    if (!form.totalBudget || isNaN(form.totalBudget) || Number(form.totalBudget) <= 0) {
      setFormError("Please enter a valid total budget amount.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("budgets/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId: form.tripId,
          budgetName: form.budgetName,
          totalBudget: Number(form.totalBudget),
          currency: form.currency,
          category: form.category
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsSheetOpen(false);
        setForm({
          budgetName: "",
          tripId: "",
          totalBudget: "",
          currency: "INR",
          category: "",
          startDate: "",
          endDate: ""
        });
        navigate(`/trip-budget/${form.tripId}`);
      } else {
        setFormError(data.message || "Failed to create budget.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isActive = (path) =>
    path === "/dashboard"
      ? location.pathname === path
      : location.pathname === path ||
        (path !== "/dashboard" && location.pathname.startsWith(path));

  const handleNav = (path) => {
    navigate(path);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      >
        <div
          className="floating-nav mx-4 mb-2 px-2 py-2 rounded-[28px] flex items-center justify-around gap-1"
          style={{ width: "calc(100% - 32px)", maxWidth: "460px" }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon   = item.icon;
            const active = isActive(item.path);

            /* ── FAB (Create) ── */
            if (item.isFab) {
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setIsSheetOpen(true)}
                  whileTap={{ scale: 0.90 }}
                  className="relative flex flex-col items-center gap-1 flex-shrink-0"
                  aria-label={t(item.label)}
                >
                  <motion.div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-brand"
                    style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
                    animate={active ? { scale: 1.05 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <motion.div animate={active ? { rotate: 45 } : { rotate: 0 }} transition={{ duration: 0.2 }}>
                      <Icon size={26} strokeWidth={2.5} />
                    </motion.div>
                  </motion.div>
                  <span className="text-[9px] font-semibold text-slate-400">{t(item.label)}</span>
                </motion.button>
              );
            }

            /* ── Regular Tab ── */
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNav(item.path)}
                whileTap={{ scale: 0.88 }}
                className="relative flex flex-col items-center gap-1 flex-1 min-w-0 py-1"
                aria-label={t(item.label)}
              >
                <div className="relative flex items-center justify-center w-10 h-10">
                  {/* Active pill background */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-2xl"
                        style={{ background: "rgba(20,184,181,0.12)" }}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1,   opacity: 1 }}
                        exit={{   scale: 0.7, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>

                  <motion.div
                    animate={{
                      color:  active ? "#14B8B5" : "#94A3B8",
                      scale:  active ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  </motion.div>
                </div>

                <motion.span
                  animate={{ color: active ? "#14B8B5" : "#94A3B8" }}
                  className="text-[10px] font-semibold leading-none"
                >
                  {t(item.label)}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* CREATE BUDGET BOTTOM SHEET */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Create Trip Budget"
        snapPoints={["85vh"]}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {/* Trip Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Select Trip</label>
            {tripsLoading ? (
              <div className="text-sm text-slate-400 py-2">Loading trips...</div>
            ) : trips.length === 0 ? (
              <div className="text-sm text-rose-500 py-2">No trips found. Please create a trip first.</div>
            ) : (
              <select
                value={form.tripId}
                onChange={handleTripChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
                required
              >
                <option value="" disabled>-- Choose a Trip --</option>
                {trips.map(t => (
                  <option key={t._id} value={t._id}>{t.title} ({t.destination})</option>
                ))}
              </select>
            )}
          </div>

          {/* Budget Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Budget Name</label>
            <input
              type="text"
              placeholder="e.g. Vacation Budget, Shopping Budget"
              value={form.budgetName}
              onChange={e => setForm(prev => ({ ...prev, budgetName: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
              required
            />
          </div>

          {/* Total Budget & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Total Budget</label>
              <input
                type="number"
                placeholder="Amount"
                value={form.totalBudget}
                onChange={e => setForm(prev => ({ ...prev, totalBudget: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Currency</label>
              <select
                value={form.currency}
                onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
                required
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="SGD">SGD (S$)</option>
              </select>
            </div>
          </div>

          {/* Date range display */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Start Date</label>
              <input
                type="text"
                value={form.startDate ? new Date(form.startDate).toLocaleDateString("en-IN") : "-"}
                disabled
                className="w-full bg-slate-100 border border-slate-200 text-slate-400 text-sm rounded-xl px-3.5 py-2.5 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">End Date</label>
              <input
                type="text"
                value={form.endDate ? new Date(form.endDate).toLocaleDateString("en-IN") : "-"}
                disabled
                className="w-full bg-slate-100 border border-slate-200 text-slate-400 text-sm rounded-xl px-3.5 py-2.5 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Trip Type / Category</label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
            >
              <option value="">Select Category (Optional)</option>
              <option value="Solo Trip">Solo Trip</option>
              <option value="Family Trip">Family Trip</option>
              <option value="Friends Trip">Friends Trip</option>
              <option value="Business Trip">Business Trip</option>
            </select>
          </div>

          {/* Form Error */}
          {formError && (
            <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 px-3.5 py-2.5 rounded-xl">
              {formError}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || trips.length === 0}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
            style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
          >
            {isSubmitting ? "Creating Budget..." : "Create Budget"}
          </button>
        </form>
      </BottomSheet>
    </>
  );
};

export default BottomNavBar;
