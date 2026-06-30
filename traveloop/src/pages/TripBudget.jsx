// src/pages/TripBudget.jsx — Premium Budget & Cost Breakdown Module

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import {
  ArrowLeft, DollarSign, Car, Hotel, Utensils,
  Ticket, ShoppingBag, AlertTriangle, CheckCircle, Save,
  TrendingUp, TrendingDown, Users, Plus, Minus, ChevronDown,
  Camera, Upload, Info
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import BottomSheet from "../components/mobile/BottomSheet";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

const CATEGORIES = [
  { key: "transport",     label: "Transport",     icon: Car,         color: "#14B8B5", bg: "#CCFBF1" },
  { key: "accommodation", label: "Accommodation", icon: Hotel,       color: "#8B5CF6", bg: "#EDE9FE" },
  { key: "food",          label: "Food",          icon: Utensils,    color: "#F59E0B", bg: "#FEF3C7" },
  { key: "activities",    label: "Activities",    icon: Ticket,      color: "#EF4444", bg: "#FEE2E2" },
  { key: "shopping",      label: "Shopping",      icon: ShoppingBag, color: "#3B82F6", bg: "#DBEAFE" },
  { key: "others",        label: "Others",        icon: Info,        color: "#64748B", bg: "#F1F5F9" },
];

const TripBudget = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null);

  const isViewer = trip?.role === "viewer";
  const { user: authUser } = useAuth();

  // Currency states
  const [rates, setRates] = useState({});
  const [selectedCurrency, setSelectedCurrency] = useState("INR");

  // Edit states
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [expenses, setExpenses] = useState({
    transport: 0,
    accommodation: 0,
    food: 0,
    activities: 0,
    shopping: 0,
  });

  // Scanner states
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanStep, setScanStep] = useState("options"); // options | scanning | preview
  const [scanImage, setScanImage] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");

  // Splitter bottom sheet states
  const [isSplitSheetOpen, setIsSplitSheetOpen] = useState(false);
  const [splitSubTab, setSplitSubTab] = useState("balances"); // balances | add | ledger
  const [splitCategory, setSplitCategory] = useState("shopping");
  const [splitDesc, setSplitDesc] = useState("");
  const [splitAmount, setSplitAmount] = useState("");
  const [selectedPayer, setSelectedPayer] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [splitType, setSplitType] = useState("equal"); // equal | custom
  const [customShares, setCustomShares] = useState([]);
  const [splitResults, setSplitResults] = useState([]);

  // Firestore Realtime states
  const [expenseItems, setExpenseItems] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [pendingSync, setPendingSync] = useState(false);

  // Multi-budget states
  const [budgets, setBudgets] = useState([]);
  const [activeBudget, setActiveBudget] = useState(null);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [budgetErrors, setBudgetErrors] = useState({});

  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    budgetName: "",
    totalBudget: "",
    currency: "INR",
    category: ""
  });

  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    budgetName: "",
    totalBudget: "",
    currency: "INR",
    category: ""
  });

  const fetchBudgets = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`budgets/${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBudgets(data.budgets || []);
        const active = data.budgets?.find(b => b.isActive && !b.isArchived);
        setActiveBudget(active || null);
        if (active) {
          setBudgetLimit(active.totalBudget);
          if (active.currency) {
            setSelectedCurrency(active.currency);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
    } finally {
      setBudgetsLoading(false);
    }
  }, [id]);

  const handleActivateBudget = async (budgetId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`budgets/activate/${budgetId}`), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveBudget(data.budget);
        setBudgetLimit(data.budget.totalBudget);
        if (data.budget.currency) {
          setSelectedCurrency(data.budget.currency);
        }
        // Refresh budgets list
        const res2 = await fetch(getApiUrl(`budgets/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data2 = await res2.json();
        if (data2.success) setBudgets(data2.budgets || []);
      }
    } catch (err) {
      console.error("Failed to activate budget:", err);
    }
  };

  const handleDuplicateBudget = async (budgetId) => {
    if (!budgetId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`budgets/duplicate/${budgetId}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Refresh budgets list
        const res2 = await fetch(getApiUrl(`budgets/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data2 = await res2.json();
        if (data2.success) {
          setBudgets(data2.budgets || []);
          const active = data2.budgets?.find(b => b.isActive && !b.isArchived);
          setActiveBudget(active || null);
          if (active) {
            setBudgetLimit(active.totalBudget);
            if (active.currency) setSelectedCurrency(active.currency);
          }
        }
      }
    } catch (err) {
      console.error("Failed to duplicate budget:", err);
    }
  };

  const handleArchiveBudget = async (budgetId) => {
    if (!budgetId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`budgets/archive/${budgetId}`), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Refresh budgets list
        const res2 = await fetch(getApiUrl(`budgets/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data2 = await res2.json();
        if (data2.success) {
          setBudgets(data2.budgets || []);
          const active = data2.budgets?.find(b => b.isActive && !b.isArchived);
          setActiveBudget(active || null);
          if (active) {
            setBudgetLimit(active.totalBudget);
            if (active.currency) setSelectedCurrency(active.currency);
          }
        }
      }
    } catch (err) {
      console.error("Failed to archive budget:", err);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!budgetId) return;
    if (!window.confirm("Are you sure you want to delete this budget?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`budgets/${budgetId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Refresh budgets list
        const res2 = await fetch(getApiUrl(`budgets/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data2 = await res2.json();
        if (data2.success) {
          setBudgets(data2.budgets || []);
          const active = data2.budgets?.find(b => b.isActive && !b.isArchived);
          setActiveBudget(active || null);
          if (active) {
            setBudgetLimit(active.totalBudget);
            if (active.currency) setSelectedCurrency(active.currency);
          }
        }
      }
    } catch (err) {
      console.error("Failed to delete budget:", err);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!createForm.budgetName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("budgets/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId: id,
          budgetName: createForm.budgetName,
          totalBudget: Number(createForm.totalBudget) || 0,
          currency: createForm.currency,
          category: createForm.category
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateBudgetOpen(false);
        setCreateForm({ budgetName: "", totalBudget: "", currency: "INR", category: "" });
        // Refresh budgets list
        const res2 = await fetch(getApiUrl(`budgets/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data2 = await res2.json();
        if (data2.success) {
          setBudgets(data2.budgets || []);
          const active = data2.budgets?.find(b => b.isActive && !b.isArchived);
          setActiveBudget(active || null);
          if (active) {
            setBudgetLimit(active.totalBudget);
            if (active.currency) setSelectedCurrency(active.currency);
          }
        }
      } else {
        alert(data.message || "Failed to create budget");
      }
    } catch (err) {
      console.error("Create budget error:", err);
    }
  };

  const handleEditBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`budgets/update/${activeBudget._id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          budgetName: editForm.budgetName,
          totalBudget: Number(editForm.totalBudget) || 0,
          currency: editForm.currency,
          category: editForm.category
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsEditBudgetOpen(false);
        // Refresh budgets list
        const res2 = await fetch(getApiUrl(`budgets/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data2 = await res2.json();
        if (data2.success) {
          setBudgets(data2.budgets || []);
          const active = data2.budgets?.find(b => b.isActive && !b.isArchived);
          setActiveBudget(active || null);
          if (active) {
            setBudgetLimit(active.totalBudget);
            if (active.currency) setSelectedCurrency(active.currency);
          }
        }
      } else {
        alert(data.message || "Failed to update budget");
      }
    } catch (err) {
      console.error("Edit budget error:", err);
    }
  };

  useEffect(() => {
    if (activeBudget && isEditBudgetOpen) {
      setEditForm({
        budgetName: activeBudget.budgetName || "",
        totalBudget: activeBudget.totalBudget || "",
        currency: activeBudget.currency || "INR",
        category: activeBudget.category || ""
      });
    }
  }, [activeBudget, isEditBudgetOpen]);

  const fetchRates = async (base = "INR") => {
    const cacheKey = `rates_${base}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const timestamp = parsed.timestamp;
        const now = Date.now();
        if (now - timestamp < 24 * 60 * 60 * 1000) {
          setRates(parsed.rates);
          return;
        }
      } catch (e) {
        console.error("Error parsing cached exchange rates:", e);
      }
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/exchange-rates?base=${base}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.rates) {
        setRates(data.rates);
        localStorage.setItem(cacheKey, JSON.stringify({
          rates: data.rates,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      console.error("Error fetching exchange rates:", err);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setRates(parsed.rates);
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    let unsubscribeExpenses = null;
    let unsubscribeSettlements = null;

    const fetchTrip = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`trips/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.trip) {
          setTrip(data.trip);
          setBudgetLimit(data.trip.budget || 0);

          const dbExpenses = data.trip.expenses || {};
          const dbExpenseItems = data.trip.expenseItems || [];
          const dbSettlements = data.trip.settlements || [];

          // Suggest currency
          const suggestCurrency = (destination = "") => {
            const dest = destination.toLowerCase();
            if (dest.includes("japan") || dest.includes("tokyo")) return "JPY";
            if (dest.includes("singapore")) return "SGD";
            if (dest.includes("thailand") || dest.includes("phuket") || dest.includes("bangkok")) return "THB";
            if (dest.includes("europe") || dest.includes("france") || dest.includes("paris") || dest.includes("germany") || dest.includes("italy")) return "EUR";
            if (dest.includes("united kingdom") || dest.includes("london") || dest.includes("uk")) return "GBP";
            if (dest.includes("indonesia") || dest.includes("bali")) return "IDR";
            if (dest.includes("maldives")) return "MVR";
            if (dest.includes("switzerland")) return "CHF";
            if (dest.includes("dubai") || dest.includes("uae")) return "AED";
            if (dest.includes("united states") || dest.includes("usa") || dest.includes("us")) return "USD";
            return "INR";
          };
          const suggested = suggestCurrency(data.trip.destination);
          setSelectedCurrency(suggested);
          
          // Populate splitter default states
          const payerId = authUser?.id || authUser?._id || "";
          setSelectedPayer(payerId);
          const participantIds = [];
          if (data.trip.owner) {
            const ownerId = (data.trip.owner._id || data.trip.owner).toString();
            participantIds.push(ownerId);
          }
          data.trip.collaborators?.forEach(c => {
            if (c.userId && c.acceptedAt !== null) {
              const cId = (c.userId._id || c.userId).toString();
              participantIds.push(cId);
            }
          });
          setSelectedParticipants(participantIds);

          // Subscriptions setup
          const expensesCol = collection(db, "trips", id, "expenses");
          const qExpenses = query(expensesCol);
          unsubscribeExpenses = onSnapshot(qExpenses, async (snapshot) => {
            if (snapshot.empty && (Object.values(dbExpenses).some(v => v > 0) || dbExpenseItems.length > 0)) {
              // Auto-migrate to Firestore
              for (const catKey of Object.keys(dbExpenses)) {
                if (dbExpenses[catKey] > 0) {
                  const docRef = doc(db, "trips", id, "expenses", `cat_${catKey}`);
                  await setDoc(docRef, {
                    category: catKey,
                    amount: Number(dbExpenses[catKey]),
                    convertedAmount: Number(dbExpenses[catKey]),
                    isManual: true,
                    updatedAt: serverTimestamp()
                  });
                }
              }
              for (const item of dbExpenseItems) {
                const docRef = doc(db, "trips", id, "expenses", item._id || item.id);
                await setDoc(docRef, {
                  description: item.description || "",
                  amount: item.amount || 0,
                  currency: item.currency || "INR",
                  convertedAmount: item.convertedAmount || 0,
                  baseCurrency: item.baseCurrency || "INR",
                  exchangeRate: item.exchangeRate || 1,
                  category: item.category || "shopping",
                  paidBy: item.paidBy?._id || item.paidBy || "",
                  paidByName: item.paidByName || "",
                  participants: item.participants || [],
                  date: item.date ? new Date(item.date) : serverTimestamp(),
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              }
              return;
            }

            const manualExpenses = { transport: 0, accommodation: 0, food: 0, activities: 0, shopping: 0 };
            const splitItems = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              if (data.isManual) {
                manualExpenses[data.category] = data.amount || 0;
              } else {
                splitItems.push({
                  _id: docSnap.id,
                  id: docSnap.id,
                  ...data,
                  date: data.date?.toDate ? data.date.toDate().toISOString() : data.date || new Date().toISOString()
                });
              }
            });

            setExpenses(manualExpenses);
            setExpenseItems(splitItems);
            setPendingSync(snapshot.metadata.hasPendingWrites);
            setLoading(false);

            // Trigger backend budget recalculation to sync MongoDB and active budget
            const token = localStorage.getItem("token");
            fetch(getApiUrl(`budgets/sync/${id}`), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              }
            }).then(res => res.json())
              .then(data => {
                if (data.success && data.budget) {
                  setActiveBudget(data.budget);
                  setBudgetLimit(data.budget.totalBudget);
                  // Refresh budgets list in background
                  const token2 = localStorage.getItem("token");
                  fetch(getApiUrl(`budgets/${id}`), {
                    headers: { Authorization: `Bearer ${token2}` }
                  }).then(r => r.json()).then(d => {
                    if (d.success) setBudgets(d.budgets || []);
                  }).catch(e => console.error(e));
                }
              })
              .catch(err => console.error("Firestore sync to backend failed:", err));
          }, (err) => {
            console.error("Firestore expenses subscribe error:", err);
            setLoading(false);
          });

          // Settlements subscription
          const settlementsCol = collection(db, "trips", id, "settlements");
          const qSettlements = query(settlementsCol);
          unsubscribeSettlements = onSnapshot(qSettlements, async (snapshot) => {
            if (snapshot.empty && dbSettlements.length > 0) {
              // Auto-migrate to Firestore
              for (const s of dbSettlements) {
                const docRef = doc(db, "trips", id, "settlements", s._id || s.id);
                await setDoc(docRef, {
                  from: s.from?._id || s.from || "",
                  fromName: s.fromName || "",
                  to: s.to?._id || s.to || "",
                  toName: s.toName || "",
                  amount: s.amount || 0,
                  date: s.date ? new Date(s.date) : serverTimestamp(),
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              }
              return;
            }

            const settlementList = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              settlementList.push({
                _id: docSnap.id,
                id: docSnap.id,
                ...data,
                date: data.date?.toDate ? data.date.toDate().toISOString() : data.date || new Date().toISOString()
              });
            });

            setSettlements(settlementList);
            setLoading(false);
          }, (err) => {
            console.error("Firestore settlements subscribe error:", err);
            setLoading(false);
          });

        }
      } catch (err) {
        console.error("Error fetching trip budget details:", err);
        setLoading(false);
      }
    };
    fetchTrip();
    fetchRates();
    fetchBudgets();

    return () => {
      if (unsubscribeExpenses) unsubscribeExpenses();
      if (unsubscribeSettlements) unsubscribeSettlements();
    };
  }, [id, authUser, fetchBudgets]);

  // Combined manual + split expenses
  const displayExpenses = useMemo(() => {
    const sums = { transport: 0, accommodation: 0, food: 0, activities: 0, shopping: 0 };
    Object.keys(sums).forEach(key => {
      sums[key] += expenses[key] || 0;
    });
    expenseItems.forEach(item => {
      const cat = item.category?.toLowerCase();
      if (sums[cat] !== undefined) {
        sums[cat] += item.convertedAmount || 0;
      }
    });
    return sums;
  }, [expenses, expenseItems]);

  // Compute stats
  const totalSpent = useMemo(() => {
    return Object.values(displayExpenses).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [displayExpenses]);

  const remainingBudget = useMemo(() => {
    return budgetLimit - totalSpent;
  }, [budgetLimit, totalSpent]);

  const tripDurationDays = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 1;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end - start);
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [trip]);

  const dailySpend = useMemo(() => {
    return totalSpent / tripDurationDays;
  }, [totalSpent, tripDurationDays]);

  const budgetWarning = useMemo(() => {
    if (totalSpent > budgetLimit) {
      return { type: "danger", message: "Warning: You have exceeded your budget limit!" };
    }
    if (budgetLimit > 0 && remainingBudget < budgetLimit * 0.15) {
      return { type: "warning", message: "Caution: You have used more than 85% of your budget!" };
    }
    return null;
  }, [totalSpent, budgetLimit, remainingBudget]);

  const topCategory = useMemo(() => {
    let maxCat = "transport";
    let maxVal = -1;
    for (const [key, val] of Object.entries(displayExpenses)) {
      if (val > maxVal) {
        maxVal = val;
        maxCat = key;
      }
    }
    return { key: maxCat, value: maxVal };
  }, [displayExpenses]);

  const savingTip = useMemo(() => {
    const TIPS = {
      transport: "Consider using public transit, renting bicycles, or using ride-share carpools to lower transport costs.",
      accommodation: "Look for boutique hostels, guesthouses, or look for promotional discounts on stay booking apps.",
      food: "Explore local street food markets, Warungs, or self-cater some meals from grocery stores to save on food.",
      activities: "Look for free walking tours, city pass bundles, or book tickets in advance online for discounts.",
      shopping: "Set a souvenir limit, avoid tourist-trap markets, and hone your bargaining skills.",
    };
    return TIPS[topCategory.key] || "Review your categories to identify areas to cut back on spending.";
  }, [topCategory]);

  // ── BUDGET FORECAST CALCULATIONS ──
  const forecastData = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return null;
    const today = new Date();
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const totalDays = Math.max(1, Math.ceil((end - start) / 86400000));
    const daysElapsed = Math.max(0, Math.min(totalDays, Math.ceil((today - start) / 86400000)));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const dailyBurn = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
    const projectedTotal = totalSpent + (dailyBurn * daysRemaining);
    const overBudget = projectedTotal > budgetLimit;
    const percentSpent = budgetLimit > 0 ? Math.round((totalSpent / budgetLimit) * 100) : 0;
    const forecastPercent = budgetLimit > 0 ? Math.min(150, Math.round((projectedTotal / budgetLimit) * 100)) : 0;
    const savingsNeeded = overBudget ? projectedTotal - budgetLimit : 0;
    const dailyBudgetRemaining = daysRemaining > 0 ? (budgetLimit - totalSpent) / daysRemaining : 0;
    return {
      totalDays, daysElapsed, daysRemaining,
      dailyBurn, projectedTotal, overBudget,
      percentSpent, forecastPercent,
      savingsNeeded, dailyBudgetRemaining,
    };
  }, [trip, totalSpent, budgetLimit]);

  // ── DYNAMIC CURRENCY CONVERSION & FORMATTING ──
  const formatCurrency = (amountInINR) => {
    if (selectedCurrency === "INR") {
      return `₹${Math.round(amountInINR).toLocaleString("en-IN")}`;
    }
    const rate = rates[selectedCurrency] || 1;
    const converted = amountInINR * rate;
    const symbols = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", SGD: "S$", THB: "฿", AED: "AED ", CHF: "CHF ", IDR: "Rp " };
    const symbol = symbols[selectedCurrency] || "";
    return `${symbol}${Math.round(converted).toLocaleString()} (≈ ₹${Math.round(amountInINR).toLocaleString("en-IN")})`;
  };

  const members = useMemo(() => {
    if (!trip) return [];
    const list = [];
    if (trip.owner) {
      list.push({
        _id: (trip.owner._id || trip.owner).toString(),
        name: `${trip.owner.firstName || "Owner"} ${trip.owner.lastName || ""}`.trim(),
        avatar: trip.owner.avatar,
        upiId: trip.owner.upiId,
      });
    }
    trip.collaborators?.forEach(c => {
      if (c.userId && c.acceptedAt !== null) {
        list.push({
          _id: (c.userId._id || c.userId).toString(),
          name: `${c.userId.firstName || "Collaborator"} ${c.userId.lastName || ""}`.trim(),
          avatar: c.userId.avatar,
          upiId: c.userId.upiId,
        });
      }
    });
    return list;
  }, [trip]);

  const settlementsSuggestions = useMemo(() => {
    if (!trip || members.length === 0) return [];
    
    // 1. Calculate net balance for each member
    const balances = {};
    members.forEach(m => {
      balances[m._id] = 0;
    });

    expenseItems.forEach(item => {
      const payerId = (item.paidBy?._id || item.paidBy || "").toString();
      if (balances[payerId] !== undefined) {
        balances[payerId] += item.convertedAmount;
      }
      item.participants?.forEach(p => {
        const pId = (p.userId?._id || p.userId || "").toString();
        if (balances[pId] !== undefined) {
          balances[pId] -= p.amountOwed;
        }
      });
    });

    // Incorporate recorded settlements
    settlements.forEach(s => {
      const fromId = (s.from?._id || s.from || "").toString();
      const toId = (s.to?._id || s.to || "").toString();
      if (balances[fromId] !== undefined) {
        balances[fromId] += s.amount;
      }
      if (balances[toId] !== undefined) {
        balances[toId] -= s.amount;
      }
    });

    // 2. Divide into debtors and creditors
    const debtors = [];
    const creditors = [];
    Object.keys(balances).forEach(uid => {
      const bal = balances[uid];
      if (bal < -0.01) {
        debtors.push({ uid, balance: -bal });
      } else if (bal > 0.01) {
        creditors.push({ uid, balance: bal });
      }
    });

    // 3. Simplify debts
    const suggestions = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const amountToPay = Math.min(debtor.balance, creditor.balance);
      
      const debtorMember = members.find(m => m._id === debtor.uid);
      const creditorMember = members.find(m => m._id === creditor.uid);

      if (debtorMember && creditorMember) {
        suggestions.push({
          fromId: debtor.uid,
          fromName: debtorMember.name,
          toId: creditor.uid,
          toName: creditorMember.name,
          toUpiId: creditorMember.upiId || "",
          amount: amountToPay
        });
      }

      debtor.balance -= amountToPay;
      creditor.balance -= amountToPay;

      if (debtor.balance < 0.01) dIdx++;
      if (creditor.balance < 0.01) cIdx++;
    }

    return suggestions;
  }, [trip, members, expenseItems, settlements]);

  // Handle save
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      // Update budget limit on the trip document in Firestore
      await setDoc(doc(db, "trips", id), { budget: Number(budgetLimit) }, { merge: true });

      // Save all manual category expenses to Firestore
      for (const catKey of Object.keys(expenses)) {
        const docRef = doc(db, "trips", id, "expenses", `cat_${catKey}`);
        await setDoc(docRef, {
          category: catKey,
          amount: Number(expenses[catKey]),
          convertedAmount: Number(expenses[catKey]),
          isManual: true,
          updatedAt: serverTimestamp()
        });
      }

      // Also call MongoDB backend for compatibility
      await fetch(getApiUrl(`trips/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          budget: Number(budgetLimit),
          expenses: {
            transport: Number(expenses.transport),
            accommodation: Number(expenses.accommodation),
            food: Number(expenses.food),
            activities: Number(expenses.activities),
            shopping: Number(expenses.shopping),
          },
        }),
      });

      // Also update the active budget on the backend!
      if (activeBudget) {
        await fetch(getApiUrl(`budgets/update/${activeBudget._id}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            totalBudget: Number(budgetLimit),
            budgetName: activeBudget.budgetName,
            currency: selectedCurrency,
            category: activeBudget.category
          }),
        });
        await fetchBudgets();
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save budget settings:", err);
      alert("Failed to save budget settings");
    } finally {
      setSaving(false);
    }
  };

  const handleExpenseChange = (category, value) => {
    const valNum = value === "" ? 0 : (parseInt(value) || 0);
    const prevVal = Number(expenses[category]) || 0;
    
    // Calculate new totalSpent if this change is applied
    const projectedTotal = totalSpent - prevVal + valNum;
    
    setExpenses(prev => ({
      ...prev,
      [category]: value === "" ? "" : valNum,
    }));

    if (value !== "" && projectedTotal > budgetLimit) {
      setBudgetErrors(prev => ({
        ...prev,
        [category]: "Expense exceeds available trip budget."
      }));
    } else {
      setBudgetErrors(prev => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setScanError("Image is too large. Please select an image under 5MB.");
      return;
    }

    setScanStep("scanning");
    setScanError("");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      setScanImage(base64Data);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl("scanner/receipt"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type,
            tripId: id
          }),
        });

        const data = await res.json();
        if (data.success && data.result) {
          setScanResult({
            amount: data.result.amount !== null ? data.result.amount : "",
            vendor: data.result.vendor || "",
            category: data.result.category || "shopping",
            date: data.result.date || new Date().toISOString().split("T")[0],
            confidence: data.result.confidence || 0,
          });
          setScanStep("preview");
        } else {
          setScanError(data.message || "Could not read receipt text. Please try again with a clearer image.");
          setScanStep("options");
        }
      } catch (err) {
        setScanError("OCR Scan failed. Please check your network connection.");
        setScanStep("options");
      }
    };

    reader.onerror = () => {
      setScanError("Failed to load image file.");
      setScanStep("options");
    };

    reader.readAsDataURL(file);
  };

  const handleSaveScannedExpense = async () => {
    if (!scanResult || !scanResult.amount) return;

    const categoryKey = scanResult.category;
    const addedAmount = parseFloat(scanResult.amount) || 0;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      // Save manual expense document in Firestore
      const docRef = doc(db, "trips", id, "expenses", `cat_${categoryKey}`);
      await setDoc(docRef, {
        category: categoryKey,
        amount: (expenses[categoryKey] || 0) + addedAmount,
        convertedAmount: (expenses[categoryKey] || 0) + addedAmount,
        isManual: true,
        updatedAt: serverTimestamp()
      });

      // Pushing to MongoDB in the background
      const updatedExpenses = {
        ...expenses,
        [categoryKey]: (expenses[categoryKey] || 0) + addedAmount,
      };

      fetch(getApiUrl(`trips/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          budget: Number(budgetLimit),
          expenses: updatedExpenses,
          scannedExpenseInfo: {
            amount: addedAmount,
            vendor: scanResult.vendor || "Unknown Merchant",
            category: CATEGORIES.find(c => c.key === categoryKey)?.label || categoryKey,
          }
        }),
      }).catch(err => console.error("Failed to sync scanned expense to MongoDB:", err));

      setSaveSuccess(true);
      setIsScanOpen(false);
      setScanImage(null);
      setScanResult(null);
      setScanStep("options");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save scanned expense to Firestore:", err);
      alert("Failed to save scanned expense");
    } finally {
      setSaving(false);
    }
  };

  // Pie chart calculation
  const pieData = useMemo(() => {
    if (totalSpent === 0) return [];
    let startAngle = 0;
    return CATEGORIES.map(cat => {
      const value = displayExpenses[cat.key] || 0;
      const percentage = value / totalSpent;
      const angle = percentage * 360;
      const slice = {
        ...cat,
        value,
        percentage: (percentage * 100).toFixed(1),
        startAngle,
        endAngle: startAngle + angle,
      };
      startAngle += angle;
      return slice;
    }).filter(s => s.value > 0);
  }, [displayExpenses, totalSpent]);

  // Donut path drawing helper
  const drawDonutSlice = (slice) => {
    const { startAngle, endAngle, color, key } = slice;
    const radius = 70;
    const center = 90;
    
    // Convert to radians
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    
    // Coordinates
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    // Large arc flag
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    const isActive = activeSegment?.key === key;
    
    return (
      <motion.path
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 22 : 16}
        strokeLinecap="round"
        onClick={(e) => {
          e.stopPropagation();
          setActiveSegment(isActive ? null : slice);
        }}
        className="cursor-pointer transition-all duration-300"
        style={{
          filter: isActive ? "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))" : "none",
        }}
        whileHover={{ strokeWidth: 19 }}
        key={key}
      />
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="px-4 pt-4 space-y-4">
          <div className="h-8 w-1/3 skeleton rounded-lg" />
          <div className="h-40 skeleton rounded-[24px]" />
          <div className="h-56 skeleton rounded-[24px]" />
          <div className="h-64 skeleton rounded-[24px]" />
        </div>
      </MainLayout>
    );
  }

  if (!trip) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="text-5xl">😕</span>
          <p className="text-xl font-bold text-slate-700">Trip Not Found</p>
          <button onClick={() => navigate("/my-trips")} className="px-6 py-3 rounded-full text-white font-bold" style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}>
            Back to Trips
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/my-trips")}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm"
            >
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 leading-tight flex items-center gap-1.5">
                Trip Budget
                {pendingSync && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 animate-pulse">
                    Pending Sync
                  </span>
                )}
              </h2>
              <p className="text-slate-400 text-xs font-semibold">{trip.title} • {trip.destination}</p>
            </div>
          </div>
          
          {/* Currency Dropdown */}
          <div className="relative">
            <select
              value={selectedCurrency}
              onChange={(e) => {
                setSelectedCurrency(e.target.value);
                fetchRates(e.target.value);
              }}
              className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold bg-white text-slate-700 outline-none shadow-xs"
            >
              {["INR", "USD", "EUR", "GBP", "JPY", "SGD", "THB", "AED", "CHF", "IDR"].map(cur => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Budget Selector and Action Buttons */}
        <div className="premium-card p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-left">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Budget</span>
              {budgetsLoading ? (
                <span className="text-xs text-slate-400">Loading budgets...</span>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={activeBudget?._id || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "new") {
                        setIsCreateBudgetOpen(true);
                      } else {
                        handleActivateBudget(val);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 outline-none shadow-sm focus:border-teal-500 transition-colors"
                  >
                    {budgets.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.isActive ? "★ " : ""}{b.budgetName} {b.isArchived ? "(Archived)" : ""}
                      </option>
                    ))}
                    <option value="new">+ Create New Budget</option>
                  </select>
                </div>
              )}
            </div>

            {activeBudget && (
              <div className="flex items-center flex-wrap gap-1.5 self-end">
                <button
                  onClick={() => setIsEditBudgetOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-wide transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicateBudget(activeBudget._id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-wide transition-all"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => handleArchiveBudget(activeBudget._id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-wide transition-all"
                >
                  {activeBudget.isArchived ? "Restore" : "Archive"}
                </button>
                {budgets.length > 1 && (
                  <button
                    onClick={() => handleDeleteBudget(activeBudget._id)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-extrabold uppercase tracking-wide transition-all"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trip Budget Overview */}
        {activeBudget && (
          <div className="premium-card p-5 mb-5 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Budget Overview: {activeBudget.budgetName}
              </h3>
              {activeBudget.category && (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-teal-500/10 text-teal-600 uppercase">
                  {activeBudget.category}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Budget</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {formatCurrency(activeBudget.totalBudget).split(" (")[0]}
                </span>
              </div>
              
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Planned Budget</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {formatCurrency(activeBudget.plannedExpense).split(" (")[0]}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Actual Expenses</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {formatCurrency(activeBudget.actualExpense).split(" (")[0]}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Remaining Budget</span>
                <span className={`text-sm font-extrabold ${activeBudget.remainingBudget >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(activeBudget.remainingBudget).split(" (")[0]}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Budget Utilization</span>
                <span className={`text-sm font-extrabold ${activeBudget.utilizationPercentage > 100 ? "text-rose-600" : "text-teal-600"}`}>
                  {activeBudget.utilizationPercentage.toFixed(1)}%
                </span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, activeBudget.utilizationPercentage)}%`,
                      backgroundColor: activeBudget.utilizationPercentage > 100 ? "#EF4444" : "#14B8B5"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning Card */}
        <AnimatePresence>
          {budgetWarning && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`p-5 rounded-[24px] mb-5 border shadow-sm ${
                budgetWarning.type === "danger"
                  ? isDark ? "bg-rose-500/10 border-rose-500/30 text-rose-200" : "bg-rose-50 border-rose-200 text-rose-800"
                  : isDark ? "bg-amber-500/10 border-amber-500/30 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={20} className={budgetWarning.type === "danger" ? "text-rose-500" : "text-amber-500"} />
                <h4 className="text-sm font-extrabold uppercase tracking-wide">
                  {budgetWarning.type === "danger" ? "⚠️ Budget Exceeded" : "⚠️ Approaching Limit"}
                </h4>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className={`p-2.5 rounded-xl ${isDark ? "bg-white/5" : "bg-white/60"}`}>
                  <span className="text-[10px] block font-bold text-slate-400 uppercase">Limit</span>
                  <span className="text-sm font-extrabold">{formatCurrency(budgetLimit).split(" (")[0]}</span>
                </div>
                <div className={`p-2.5 rounded-xl ${isDark ? "bg-white/5" : "bg-white/60"}`}>
                  <span className="text-[10px] block font-bold text-slate-400 uppercase">Spent</span>
                  <span className="text-sm font-extrabold">{formatCurrency(totalSpent).split(" (")[0]}</span>
                </div>
                <div className={`p-2.5 rounded-xl ${isDark ? "bg-white/5" : "bg-white/60"}`}>
                  <span className="text-[10px] block font-bold text-slate-400 uppercase">
                    {budgetWarning.type === "danger" ? "Over by" : "Remaining"}
                  </span>
                  <span className={`text-sm font-extrabold ${budgetWarning.type === "danger" ? "text-rose-500" : "text-emerald-500"}`}>
                    {formatCurrency(Math.abs(remainingBudget)).split(" (")[0]}
                  </span>
                </div>
              </div>
              
              <div className={`p-3 rounded-xl text-xs leading-normal flex items-start gap-2 ${isDark ? "bg-white/5" : "bg-white/50"}`}>
                <span className="text-base flex-shrink-0">💡</span>
                <div>
                  <span className="font-extrabold block mb-0.5 text-[10px] uppercase text-slate-400">Saving Recommendation</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{savingTip}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save success toast */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-[20px] bg-emerald-50 border border-emerald-200 text-emerald-700 mb-5 flex items-center gap-2"
            >
              <CheckCircle size={18} className="flex-shrink-0" />
              <span className="text-xs font-bold">Budget changes saved successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards Row: Limit vs Spent */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="premium-card p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Limit</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-lg font-extrabold text-slate-800">₹</span>
              <input
                type="number"
                value={budgetLimit || ""}
                onChange={(e) => setBudgetLimit(Math.max(0, parseInt(e.target.value) || 0))}
                className="text-lg font-extrabold text-slate-800 bg-transparent w-full outline-none border-b border-dashed border-slate-300 focus:border-teal-400"
                placeholder="Limit"
                disabled={isViewer}
              />
            </div>
            {selectedCurrency !== "INR" && (
              <span className="text-[10px] text-teal-600 mt-1 font-bold">
                ≈ {formatCurrency(budgetLimit).split(" (")[0]}
              </span>
            )}
            {!isViewer && <span className="text-[10px] text-slate-400 mt-1">Tap to edit limit</span>}
          </div>

          <div className="premium-card p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Spent</span>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-lg font-extrabold text-slate-800">₹{totalSpent.toLocaleString()}</span>
            </div>
            {selectedCurrency !== "INR" && (
              <span className="text-[10px] text-teal-600 mt-1 font-bold">
                ≈ {formatCurrency(totalSpent).split(" (")[0]}
              </span>
            )}
            <span className={`text-[10px] font-bold mt-1 ${remainingBudget >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {remainingBudget >= 0 ? `₹${remainingBudget.toLocaleString()} left` : `₹${Math.abs(remainingBudget).toLocaleString()} over`}
            </span>
          </div>
        </div>

        {/* Daily spend & Analytics */}
        <div className="premium-card p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <DollarSign size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Daily Average Spend</span>
              <span className="text-base font-extrabold text-slate-800">{formatCurrency(dailySpend).split(" (")[0]} / day</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Trip Duration</span>
            <span className="text-xs font-bold text-slate-700">{tripDurationDays} {tripDurationDays === 1 ? "day" : "days"}</span>
          </div>
        </div>

        {/* Pie/Donut Chart Card */}
        <div className="premium-card p-5 mb-5" onClick={() => setActiveSegment(null)}>
          <h3 className="text-sm font-bold text-slate-800 mb-4">Cost Distribution</h3>
          
          <div className="flex flex-col items-center sm:flex-row sm:justify-around gap-6">
            {/* SVG Donut Chart */}
            <div className="relative w-[180px] h-[180px] flex-shrink-0">
              <svg width="180" height="180" viewBox="0 0 180 180" className="w-full h-full" onClick={() => setActiveSegment(null)}>
                {totalSpent === 0 ? (
                  <circle cx="90" cy="90" r="70" fill="none" stroke="#E2E8F0" strokeWidth="16" />
                ) : (
                  pieData.map((slice) => drawDonutSlice(slice))
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {activeSegment ? activeSegment.label : "Spent"}
                </span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                  {formatCurrency(activeSegment ? activeSegment.value : totalSpent).split(" (")[0]}
                </span>
                {selectedCurrency !== "INR" && (
                  <span className="text-[9px] text-slate-400">
                    ≈ ₹{Math.round(activeSegment ? activeSegment.value : totalSpent).toLocaleString()}
                  </span>
                )}
                <span className="text-[9px] font-bold text-teal-500">
                  {activeSegment ? `${activeSegment.percentage}%` : "Total Cost"}
                </span>
              </div>
            </div>

            {/* Color-coded Legend */}
            <div className="flex-1 w-full space-y-2">
              {CATEGORIES.map((cat) => {
                const amount = expenses[cat.key] || 0;
                const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(0) : 0;
                const isSelected = activeSegment?.key === cat.key;
                
                const sliceData = pieData.find(s => s.key === cat.key);
                
                return (
                  <div
                    key={cat.key}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (sliceData) {
                        setActiveSegment(isSelected ? null : sliceData);
                      }
                    }}
                    className={`flex items-center justify-between text-xs font-semibold p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isSelected ? (isDark ? "bg-slate-800" : "bg-slate-100") : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-600 dark:text-slate-300">{cat.label}</span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-200 flex gap-2">
                      <span>{formatCurrency(amount).split(" (")[0]}</span>
                      <span className="text-slate-400">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bar Chart Section */}
        <div className="premium-card p-5 mb-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Comparison Breakdown</h3>
          <div className="space-y-4 pt-2">
            {CATEGORIES.map((cat) => {
              const spent = activeBudget && activeBudget.categories[cat.key]
                ? (activeBudget.categories[cat.key].actual || 0)
                : (expenses[cat.key] || 0);
              const allocated = activeBudget && activeBudget.categories[cat.key]
                ? (activeBudget.categories[cat.key].planned || 0)
                : (budgetLimit / 5);
              const maxVal = Math.max(spent, allocated, 1);
              const spentPercent = (spent / maxVal) * 100;
              const allocatedPercent = (allocated / maxVal) * 100;
              const Icon = cat.icon;
              
              const isOver = spent > allocated;

              return (
                <div key={cat.key} className="space-y-2 pb-2 border-b border-dashed border-slate-100 dark:border-slate-800 last:border-b-0">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <Icon size={14} style={{ color: cat.color }} />
                      <span className="text-slate-700 dark:text-slate-300">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-semibold">Planned: ₹{Math.round(allocated).toLocaleString()}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${isOver ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 font-extrabold" : "text-slate-600 dark:text-slate-400"}`}>
                        Spent: ₹{spent.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bars container */}
                  <div className="space-y-1.5 pl-5">
                    {/* Allocated Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-400 w-8 flex-shrink-0">Budget</span>
                      <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${allocatedPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full opacity-60"
                          style={{ backgroundColor: "#14B8B5" }}
                        />
                      </div>
                    </div>
                    {/* Spent Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-400 w-8 flex-shrink-0">Spent</span>
                      <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${spentPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: isOver ? "#EF4444" : cat.color }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BUDGET FORECAST SECTION ── */}
        {forecastData && budgetLimit > 0 && totalSpent > 0 && (
          <div className="premium-card p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-teal-500" />
              <h3 className="text-sm font-bold text-slate-800">Budget Forecast</h3>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-[14px] text-center" style={{ background: "rgba(20,184,181,0.08)" }}>
                <p className="text-base font-extrabold text-teal-600">₹{Math.round(forecastData.dailyBurn).toLocaleString()}</p>
                <p className="text-[10px] font-semibold text-slate-400">Daily Burn</p>
              </div>
              <div className="p-3 rounded-[14px] text-center" style={{ background: forecastData.overBudget ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)" }}>
                <p className={`text-base font-extrabold ${forecastData.overBudget ? "text-red-500" : "text-emerald-600"}`}>₹{Math.round(forecastData.projectedTotal).toLocaleString()}</p>
                <p className="text-[10px] font-semibold text-slate-400">Projected</p>
              </div>
              <div className="p-3 rounded-[14px] text-center" style={{ background: "rgba(99,102,241,0.08)" }}>
                <p className="text-base font-extrabold text-indigo-600">₹{Math.max(0, Math.round(forecastData.dailyBudgetRemaining)).toLocaleString()}</p>
                <p className="text-[10px] font-semibold text-slate-400">Daily Left</p>
              </div>
            </div>

            {/* Forecast bar */}
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Spent ({forecastData.percentSpent}%)</span>
                <span>Budget: ₹{budgetLimit.toLocaleString()}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden relative">
                {/* Spent bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, forecastData.percentSpent)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{ background: "linear-gradient(90deg,#14B8B5,#0D9488)" }}
                />
                {/* Forecast marker */}
                {forecastData.forecastPercent > forecastData.percentSpent && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, forecastData.forecastPercent)}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    className="absolute left-0 top-0 h-full rounded-full opacity-30"
                    style={{ background: forecastData.overBudget ? "#EF4444" : "#10B981" }}
                  />
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {forecastData.daysElapsed} of {forecastData.totalDays} days elapsed • {forecastData.daysRemaining} days remaining
              </p>
            </div>

            {/* Warning / on-track banner */}
            {forecastData.overBudget ? (
              <div className="flex items-start gap-2 p-3 rounded-[12px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <TrendingDown size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-600">Over Budget by ₹{Math.round(forecastData.savingsNeeded).toLocaleString()}</p>
                  <p className="text-[10px] text-red-400 mt-0.5">{savingTip}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 rounded-[12px]" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <TrendingUp size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-600">On Track 🎯</p>
                  <p className="text-[10px] text-emerald-500 mt-0.5">Estimated savings: ₹{Math.round(budgetLimit - forecastData.projectedTotal).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EXPENSE SPLITTER SECTION ── */}
        {!isViewer && (
          <div className="premium-card p-5 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Split & Settlements</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Track balances and settle with UPI</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsSplitSheetOpen(true);
                setSplitSubTab("balances");
              }}
              className="px-4 py-2 rounded-full text-white font-bold text-xs bg-violet-600 shadow-sm active:scale-95 transition-all"
            >
              Manage Splits
            </button>
          </div>
        )}

        {/* Category Inputs Form */}
        <div className="premium-card p-5 space-y-4 mb-20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Update Expenses</h3>
            {!isViewer && (
              <button
                onClick={() => {
                  setIsScanOpen(true);
                  setScanStep("options");
                  setScanError("");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-[10px] uppercase tracking-wide bg-gradient-to-r from-teal-500 to-emerald-500 shadow-sm active:scale-95 transition-all"
              >
                <Camera size={12} />
                Scan Receipt
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const value = expenses[cat.key];
              return (
                <div key={cat.key} className="flex items-center justify-between gap-3 p-3 rounded-[16px] bg-slate-50 border border-slate-100 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: cat.bg }}>
                      <Icon size={16} style={{ color: cat.color }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{cat.label}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        value={value || ""}
                        onChange={(e) => handleExpenseChange(cat.key, e.target.value)}
                        className={`w-24 text-right px-2.5 py-1.5 rounded-lg border text-xs font-bold text-slate-800 bg-white outline-none focus:border-teal-400 disabled:opacity-80 ${
                          budgetErrors[cat.key] ? "border-red-500 focus:border-red-500" : "border-slate-200"
                        }`}
                        placeholder="0"
                        disabled={isViewer}
                      />
                    </div>
                    {budgetErrors[cat.key] && (
                      <span className="text-[9px] text-red-500 font-semibold text-right">
                        {budgetErrors[cat.key]}
                      </span>
                    )}
                    {selectedCurrency !== "INR" && value > 0 && (
                      <span className="text-[10px] text-teal-600 font-bold">
                        {formatCurrency(value).split(" (")[0]} ≈ ₹{Math.round(value).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Action Button for Saving changes */}
        {!isViewer && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSaveChanges}
            disabled={saving || Object.keys(budgetErrors).length > 0}
            className="fixed z-40 flex items-center gap-2 px-6 py-3.5 rounded-full text-white font-bold shadow-brand disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #14B8B5, #0D9488)",
              bottom: "calc(100px + max(env(safe-area-inset-bottom), 12px))",
              right: "16px",
            }}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Budget"}
          </motion.button>
        )}

        {/* Receipt Scanner Bottom Sheet */}
        <BottomSheet
          isOpen={isScanOpen}
          onClose={() => {
            if (scanStep !== "scanning") {
              setIsScanOpen(false);
              setScanStep("options");
              setScanError("");
            }
          }}
          title="Receipt Scanner"
          snapPoints={scanStep === "preview" ? ["85vh"] : ["50vh"]}
        >
          <div className="p-4 space-y-4">
            {scanStep === "options" && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-teal-500">
                  <Camera size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Scan Receipt</h4>
                  <p className="text-xs text-slate-400 font-semibold px-6">
                    Instantly scan hotel, restaurant, taxi, or shopping bills to update your budget automatically.
                  </p>
                </div>

                {scanError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold leading-normal">
                    ⚠️ {scanError}
                  </div>
                )}

                <div className="pt-2 space-y-2.5">
                  <label className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-[16px] bg-teal-500 text-white font-bold text-xs shadow-brand active:scale-95 transition-all cursor-pointer">
                    <Camera size={16} />
                    Take Photo (Camera)
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  
                  <label className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-[16px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs active:scale-95 transition-all cursor-pointer">
                    <Upload size={16} />
                    Choose from Gallery
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {scanStep === "scanning" && (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 rounded-[16px] flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                  <span className="text-xs text-slate-400 font-semibold">Extracting receipt details...</span>
                </div>
                <div className="space-y-2.5">
                  <div className="h-9 w-full bg-slate-200 dark:bg-slate-700 rounded-[12px]" />
                  <div className="h-9 w-full bg-slate-200 dark:bg-slate-700 rounded-[12px]" />
                  <div className="h-9 w-full bg-slate-200 dark:bg-slate-700 rounded-[12px]" />
                </div>
              </div>
            )}

            {scanStep === "preview" && scanResult && (
              <div className="space-y-4">
                {scanImage && (
                  <div className="w-full h-24 rounded-[16px] overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <img src={scanImage} alt="Receipt Preview" className="h-full object-contain" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Scan Results</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    scanResult.confidence > 70
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                  }`}>
                    OCR Confidence: {scanResult.confidence}%
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Merchant / Vendor</label>
                    <input
                      value={scanResult.vendor}
                      onChange={e => setScanResult({ ...scanResult, vendor: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Amount (₹)</label>
                      <input
                        type="number"
                        value={scanResult.amount}
                        onChange={e => setScanResult({ ...scanResult, amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-teal-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Category</label>
                      <select
                        value={scanResult.category}
                        onChange={e => setScanResult({ ...scanResult, category: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-teal-400"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.key} value={cat.key}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Receipt Date</label>
                    <input
                      type="date"
                      value={scanResult.date}
                      onChange={e => setScanResult({ ...scanResult, date: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setScanStep("options");
                      setScanImage(null);
                      setScanResult(null);
                    }}
                    className="flex-1 py-3 rounded-[14px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveScannedExpense}
                    disabled={saving || !scanResult.amount}
                    className="flex-1 py-3 rounded-[14px] text-white font-bold text-xs bg-teal-500 shadow-brand active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save to Budget"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </BottomSheet>

        {/* Split & Settlements Bottom Sheet */}
        <BottomSheet
          isOpen={isSplitSheetOpen}
          onClose={() => setIsSplitSheetOpen(false)}
          title="Split & Settlements"
          snapPoints={["90vh"]}
        >
          <div className="p-4 space-y-6 overflow-y-auto max-h-[80vh] hide-scrollbar text-slate-800">
            {/* Tab navigation within Split Sheet */}
            <div className="flex border-b border-slate-100 pb-2">
              <button
                onClick={() => setSplitSubTab("balances")}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 ${
                  splitSubTab === "balances" ? "border-teal-500 text-teal-600" : "border-transparent text-slate-400"
                }`}
              >
                Balances
              </button>
              <button
                onClick={() => setSplitSubTab("add")}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 ${
                  splitSubTab === "add" ? "border-teal-500 text-teal-600" : "border-transparent text-slate-400"
                }`}
              >
                Add Bill
              </button>
              <button
                onClick={() => setSplitSubTab("ledger")}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 ${
                  splitSubTab === "ledger" ? "border-teal-500 text-teal-600" : "border-transparent text-slate-400"
                }`}
              >
                History ({settlements.length})
              </button>
            </div>
 
            {/* Sub-Tab 1: Balances & Simplified Debts */}
            {splitSubTab === "balances" && (
              <div className="space-y-4">
                {/* Net Balances List */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Group Balances</h4>
                  <div className="space-y-2.5">
                    {members.map(m => {
                      let bal = 0;
                      expenseItems.forEach(item => {
                        const payerId = (item.paidBy?._id || item.paidBy || "").toString();
                        if (payerId === m._id) bal += item.convertedAmount;
                        item.participants?.forEach(p => {
                          const pId = (p.userId?._id || p.userId || "").toString();
                          if (pId === m._id) bal -= p.amountOwed;
                        });
                      });
                      settlements.forEach(s => {
                        const fromId = (s.from?._id || s.from || "").toString();
                        const toId = (s.to?._id || s.to || "").toString();
                        if (fromId === m._id) bal += s.amount;
                        if (toId === m._id) bal -= s.amount;
                      });
 
                      const isOwed = bal >= 0.01;
                      const isClear = Math.abs(bal) < 0.01;
 
                      return (
                        <div key={m._id} className="flex items-center justify-between p-3 rounded-[16px] bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs">
                              {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : m.name[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.name}</p>
                              {m.upiId && <p className="text-[9px] text-teal-600 font-semibold">{m.upiId}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            {isClear ? (
                              <span className="text-[10px] font-bold text-slate-400">Settled Up</span>
                            ) : (
                              <span className={`text-xs font-extrabold ${isOwed ? "text-emerald-500" : "text-rose-500"}`}>
                                {isOwed ? "is owed" : "owes"} ₹{Math.abs(Math.round(bal)).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
 
                {/* Simplified Settlement Suggestions */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Suggested Payments</h4>
                  {settlementsSuggestions.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-xl">🙌</span>
                      <p className="text-xs font-bold text-slate-500 mt-1">Everyone is settled up!</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {settlementsSuggestions.map((s, idx) => (
                        <div key={idx} className="p-3.5 rounded-[16px] border border-violet-100 bg-violet-50/20 flex flex-col gap-3 animate-fade-in">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-600">
                                <span className="font-extrabold text-slate-800">{s.toName}</span> receives
                              </span>
                              <span className="font-extrabold text-teal-600">₹{Math.round(s.amount).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-600">
                                <span className="font-extrabold text-slate-800">{s.fromName}</span> pays
                              </span>
                              <span className="font-extrabold text-rose-500">₹{Math.round(s.amount).toLocaleString()}</span>
                            </div>
                          </div>
 
                          <div className="flex gap-2">
                            {s.toUpiId && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(s.toUpiId);
                                  alert("UPI ID copied! 🚀");
                                }}
                                className="flex-1 py-2 rounded-xl bg-white border border-violet-200 text-violet-600 font-bold text-[10px] uppercase tracking-wide active:scale-95 transition-all shadow-xs"
                              >
                                Copy UPI ID
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (confirm(`Record a settlement of ₹${Math.round(s.amount)} from ${s.fromName} to ${s.toName}?`)) {
                                  try {
                                    const token = localStorage.getItem("token");
                                    const docRef = doc(collection(db, "trips", id, "settlements"));
                                    await setDoc(docRef, {
                                      from: s.fromId,
                                      fromName: s.fromName,
                                      to: s.toId,
                                      toName: s.toName,
                                      amount: s.amount,
                                      date: serverTimestamp(),
                                      createdAt: serverTimestamp(),
                                      updatedAt: serverTimestamp()
                                    });

                                    // Sync to MongoDB backend in background
                                    fetch(getApiUrl(`trips/${id}/settlements`), {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`
                                      },
                                      body: JSON.stringify({
                                        from: s.fromId,
                                        fromName: s.fromName,
                                        to: s.toId,
                                        toName: s.toName,
                                        amount: s.amount
                                      })
                                    }).catch(err => console.error("Failed to sync settlement to MongoDB:", err));
 
                                    alert("Settlement recorded! 🤝");
                                  } catch (err) {
                                    console.error("Failed to record settlement in Firestore:", err);
                                    alert("Failed to record settlement");
                                  }
                                }
                              }}
                              className="flex-1 py-2 rounded-xl bg-violet-600 text-white font-bold text-[10px] uppercase tracking-wide active:scale-95 transition-all shadow-sm"
                            >
                              Mark Settled
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
 
            {/* Sub-Tab 2: Add Split Bill Form */}
            {splitSubTab === "add" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Paid By</label>
                    <select
                      value={selectedPayer}
                      onChange={e => setSelectedPayer(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 outline-none"
                    >
                      <option value="">Select Payer</option>
                      {members.map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                    <select
                      value={splitCategory}
                      onChange={e => setSplitCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 outline-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
 
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
                    <input
                      value={splitDesc}
                      onChange={e => setSplitDesc(e.target.value)}
                      placeholder="e.g. Dinner at Beach Club"
                      className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount ({selectedCurrency})</label>
                    <input
                      type="number"
                      value={splitAmount}
                      onChange={e => {
                        const valStr = e.target.value;
                        setSplitAmount(valStr);
                        if (valStr === "") {
                          setBudgetErrors(prev => {
                            const next = { ...prev };
                            delete next.splitAmount;
                            return next;
                          });
                          return;
                        }
                        const valNum = parseFloat(valStr) || 0;
                        const rate = rates[selectedCurrency] || 1;
                        const converted = selectedCurrency === "INR" ? valNum : valNum / rate;
                        if (converted + totalSpent > budgetLimit) {
                          setBudgetErrors(prev => ({
                            ...prev,
                            splitAmount: "Expense exceeds available trip budget."
                          }));
                        } else {
                          setBudgetErrors(prev => {
                            const next = { ...prev };
                            delete next.splitAmount;
                            return next;
                          });
                        }
                      }}
                      placeholder="0.00"
                      className={`w-full px-3 py-2.5 rounded-[12px] border text-xs font-bold bg-slate-50 text-slate-700 outline-none ${
                        budgetErrors.splitAmount ? "border-red-500 focus:border-red-500" : "border-slate-200"
                      }`}
                    />
                    {budgetErrors.splitAmount && (
                      <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                        {budgetErrors.splitAmount}
                      </span>
                    )}
                  </div>
                </div>
 
                {/* Participants Selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Split Between</label>
                  <div className="space-y-1.5">
                    {members.map(m => {
                      const isChecked = selectedParticipants.includes(m._id);
                      return (
                        <label key={m._id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:border-slate-600 cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedParticipants(prev => prev.filter(id => id !== m._id));
                                } else {
                                  setSelectedParticipants(prev => [...prev, m._id]);
                                }
                              }}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{m.name}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
 
                {/* Add Bill Button */}
                <button
                  onClick={async () => {
                    if (!selectedPayer || !splitAmount || selectedParticipants.length === 0 || !splitDesc) {
                      alert("Please fill in all fields");
                      return;
                    }
                    try {
                      setSaving(true);
                      const token = localStorage.getItem("token");
                      const amountVal = parseFloat(splitAmount);
                      const rate = rates[selectedCurrency] || 1;
                      const converted = selectedCurrency === "INR" ? amountVal : amountVal / rate;
 
                      const expensePayload = {
                        description: splitDesc,
                        amount: amountVal,
                        currency: selectedCurrency,
                        convertedAmount: converted,
                        baseCurrency: "INR",
                        exchangeRate: rate,
                        category: splitCategory,
                        paidBy: selectedPayer,
                        paidByName: members.find(m => m._id === selectedPayer)?.name || "Payer",
                        participants: selectedParticipants.map(uid => ({
                          userId: uid,
                          name: members.find(m => m._id === uid)?.name || "Participant",
                          amountOwed: converted / selectedParticipants.length
                        })),
                        date: new Date()
                      };
 
                      // Write split expense to Firestore
                      const docRef = doc(collection(db, "trips", id, "expenses"));
                      await setDoc(docRef, {
                        description: splitDesc,
                        amount: amountVal,
                        currency: selectedCurrency,
                        convertedAmount: converted,
                        baseCurrency: "INR",
                        exchangeRate: rate,
                        category: splitCategory,
                        paidBy: selectedPayer,
                        paidByName: members.find(m => m._id === selectedPayer)?.name || "Payer",
                        participants: selectedParticipants.map(uid => ({
                          userId: uid,
                          name: members.find(m => m._id === uid)?.name || "Participant",
                          amountOwed: converted / selectedParticipants.length
                        })),
                        date: serverTimestamp(),
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                      });
 
                      // Trigger XP reward on the backend
                      fetch(getApiUrl("profile/reward-xp"), {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ action: "expense_added" })
                      }).catch(err => console.error("Failed to reward XP:", err));
 
                      // Also call backend to keep MongoDB backend in sync
                      fetch(getApiUrl(`trips/${id}/expenses`), {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(expensePayload)
                      }).catch(err => console.error("Failed to sync split expense to MongoDB:", err));
 
                      setSplitDesc("");
                      setSplitAmount("");
                      alert("Split expense added! 💸");
                      setSplitSubTab("balances");
                    } catch (err) {
                      console.error("Failed to add split expense to Firestore:", err);
                      alert("Failed to add split expense");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || !selectedPayer || !splitAmount || selectedParticipants.length === 0 || !splitDesc || !!budgetErrors.splitAmount}
                  className="w-full py-3.5 rounded-[16px] text-white font-bold text-xs bg-teal-500 active:scale-95 shadow-brand transition-all disabled:opacity-50"
                >
                  Add Bill & Split
                </button>
              </div>
            )}
 
            {/* Sub-Tab 3: Ledger History */}
            {splitSubTab === "ledger" && (
              <div className="space-y-3">
                {(!settlements || settlements.length === 0) ? (
                  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center dark:bg-slate-800 dark:border-slate-700">
                    <span className="text-3xl">📭</span>
                    <p className="text-xs font-bold text-slate-500 mt-2">No settlements recorded yet</p>
                  </div>
                ) : (
                  settlements.map((s, idx) => (
                    <div key={s._id || idx} className="p-3.5 rounded-[16px] border border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {s.fromName} paid {s.toName}
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold">
                          {new Date(s.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-500">
                        ₹{s.amount.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </BottomSheet>

        {/* CREATE BUDGET BOTTOM SHEET */}
        <BottomSheet
          isOpen={isCreateBudgetOpen}
          onClose={() => setIsCreateBudgetOpen(false)}
          title="Create New Budget"
          snapPoints={["75vh"]}
        >
          <form onSubmit={handleCreateBudget} className="flex flex-col gap-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Budget Name</label>
              <input
                type="text"
                placeholder="e.g. Activity Budget, Food Budget"
                value={createForm.budgetName}
                onChange={e => setCreateForm(prev => ({ ...prev, budgetName: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Total Limit</label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={createForm.totalBudget}
                  onChange={e => setCreateForm(prev => ({ ...prev, totalBudget: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Currency</label>
                <select
                  value={createForm.currency}
                  onChange={e => setCreateForm(prev => ({ ...prev, currency: e.target.value }))}
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

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Trip Category</label>
              <select
                value={createForm.category}
                onChange={e => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
              >
                <option value="">Select Category</option>
                <option value="Solo Trip">Solo Trip</option>
                <option value="Family Trip">Family Trip</option>
                <option value="Friends Trip">Friends Trip</option>
                <option value="Business Trip">Business Trip</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg active:scale-98 transition-all mt-2"
              style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
            >
              Create Budget
            </button>
          </form>
        </BottomSheet>

        {/* EDIT BUDGET BOTTOM SHEET */}
        <BottomSheet
          isOpen={isEditBudgetOpen}
          onClose={() => setIsEditBudgetOpen(false)}
          title="Edit Active Budget"
          snapPoints={["75vh"]}
        >
          <form onSubmit={handleEditBudgetSubmit} className="flex flex-col gap-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Budget Name</label>
              <input
                type="text"
                placeholder="e.g. Activity Budget, Food Budget"
                value={editForm.budgetName}
                onChange={e => setEditForm(prev => ({ ...prev, budgetName: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Total Limit</label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={editForm.totalBudget}
                  onChange={e => setEditForm(prev => ({ ...prev, totalBudget: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Currency</label>
                <select
                  value={editForm.currency}
                  onChange={e => setEditForm(prev => ({ ...prev, currency: e.target.value }))}
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

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Trip Category</label>
              <select
                value={editForm.category}
                onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 transition-colors"
              >
                <option value="">Select Category</option>
                <option value="Solo Trip">Solo Trip</option>
                <option value="Family Trip">Family Trip</option>
                <option value="Friends Trip">Friends Trip</option>
                <option value="Business Trip">Business Trip</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg active:scale-98 transition-all mt-2"
              style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
            >
              Save Changes
            </button>
          </form>
        </BottomSheet>

      </div>
    </MainLayout>
  );
};

export default TripBudget;
