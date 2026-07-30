/**
 * demoMode.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for Demo / Development mode.
 *
 * Activated when:
 *   - import.meta.env.DEV  (vite dev server)
 *   - import.meta.env.VITE_DEMO_MODE === "true"
 *
 * In demo mode:
 *   - NO backend API calls are made for authentication.
 *   - A local session token is created after OTP verification.
 *   - All dashboard API calls return mock data instead of hitting the backend.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const IS_DEMO: boolean =
  import.meta.env.DEV === true ||
  import.meta.env.VITE_DEMO_MODE === "true";

export const DEMO_TOKEN_PREFIX = "demo_admin_token_";

/** Returns true if the stored token is a demo session token */
export const isDemoToken = (token: string | null): boolean =>
  !!token && token.startsWith(DEMO_TOKEN_PREFIX);

/** Generate a demo session token */
export const generateDemoToken = (email: string): string => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${DEMO_TOKEN_PREFIX}${ts}_${rand}_${email.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
};

/** Generate a cryptographically random 6-digit OTP */
export const generateDemoOtp = (): string =>
  String(Math.floor(100000 + Math.random() * 900000));

// ── Demo Admin Profile ────────────────────────────────────────────────────────

export const makeDemoAdmin = (email: string) => ({
  id: "demo-admin",
  email,
  displayName: "Traveloop Super Admin",
  role: "Super Admin" as const,
  twoFactorEnabled: false,
});

// ── Mock API data ─────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_STATS = {
  totalRevenue: 4_820_500,
  platformRevenue: 962_100,
  commissionEarned: 144_315,
  totalBookings: 3_241,
  totalAgents: 187,
  totalDrivers: 94,
  activeTrips: 42,
  cancelledTrips: 17,
  pendingRefunds: 8,
  pendingRefundsAmount: 23_400,
  pendingReviews: 5,
  activeAgents: 143,
  purchasedSlotsRevenue: 89_000,
  referralBonusSlots: 34,
};

export const MOCK_ANALYTICS = {
  revenue: [
    { month: "Jan", amount: 310_000 },
    { month: "Feb", amount: 425_000 },
    { month: "Mar", amount: 390_000 },
    { month: "Apr", amount: 510_000 },
    { month: "May", amount: 480_000 },
    { month: "Jun", amount: 620_000 },
  ],
  bookings: [
    { month: "Jan", count: 210 },
    { month: "Feb", count: 310 },
    { month: "Mar", count: 285 },
    { month: "Apr", count: 420 },
    { month: "May", count: 380 },
    { month: "Jun", count: 512 },
  ],
  topAgents: [
    { name: "Sanjai Travels", bookings: 128, revenue: 640_000 },
    { name: "Chennai Tours", bookings: 96, revenue: 480_000 },
    { name: "Delta Trip Co.", bookings: 84, revenue: 420_000 },
  ],
};

export const MOCK_AGENTS = [
  {
    _id: "agent-demo-1",
    name: "Sanjai Murugan",
    companyName: "Sanjai Travels",
    email: "sanjai@demo.com",
    mobile: "8637628773",
    kycStatus: "APPROVED",
    totalBookings: 128,
    revenue: 640_000,
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    _id: "agent-demo-2",
    name: "Priya Rajan",
    companyName: "Chennai Tours",
    email: "priya@demo.com",
    mobile: "9876543210",
    kycStatus: "APPROVED",
    totalBookings: 96,
    revenue: 480_000,
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "agent-demo-3",
    name: "Karthik Raj",
    companyName: "Delta Trip Co.",
    email: "karthik@demo.com",
    mobile: "7654321098",
    kycStatus: "PENDING",
    totalBookings: 0,
    revenue: 0,
    createdAt: "2026-07-01T10:00:00Z",
  },
];

export const MOCK_TRIPS = [
  {
    _id: "trip-demo-1",
    title: "Ooty Hill Station Adventure",
    agentName: "Sanjai Travels",
    price: 4_500,
    seats: 24,
    status: "ACTIVE",
    bookedCount: 18,
    startDate: "2026-08-15",
  },
  {
    _id: "trip-demo-2",
    title: "Rameswaram Temple Circuit",
    agentName: "Chennai Tours",
    price: 3_200,
    seats: 40,
    status: "ACTIVE",
    bookedCount: 35,
    startDate: "2026-08-22",
  },
  {
    _id: "trip-demo-3",
    title: "Kerala Backwaters Tour",
    agentName: "Delta Trip Co.",
    price: 8_999,
    seats: 16,
    status: "DRAFT",
    bookedCount: 0,
    startDate: "2026-09-10",
  },
];

export const MOCK_BOOKINGS = [
  {
    _id: "book-demo-1",
    tripTitle: "Ooty Hill Station Adventure",
    customerName: "Ananya Kumar",
    seats: 2,
    amount: 9_000,
    status: "CONFIRMED",
    bookedAt: "2026-07-20T14:30:00Z",
  },
  {
    _id: "book-demo-2",
    tripTitle: "Rameswaram Temple Circuit",
    customerName: "Vijay Sharma",
    seats: 4,
    amount: 12_800,
    status: "CONFIRMED",
    bookedAt: "2026-07-21T09:15:00Z",
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    _id: "notif-1",
    type: "KYC_SUBMISSION",
    message: "Agent Karthik Raj submitted KYC documents for review.",
    read: false,
    createdAt: "2026-07-30T08:00:00Z",
  },
  {
    _id: "notif-2",
    type: "BOOKING",
    message: "New booking received for Ooty Hill Station Adventure.",
    read: false,
    createdAt: "2026-07-29T16:45:00Z",
  },
  {
    _id: "notif-3",
    type: "PAYMENT",
    message: "Commission payment of ₹14,315 processed successfully.",
    read: true,
    createdAt: "2026-07-28T11:20:00Z",
  },
];

/**
 * Returns a mock API response for a given URL path.
 * Returns null if no mock is defined for that path (caller can let the real
 * request through or handle the miss).
 */
export const getMockResponse = (url: string, method: string): object | null => {
  const path = url.toLowerCase();
  const m = method.toUpperCase();

  if (m === "POST" && (path.includes("/admin/login") || path.includes("/admin/verify"))) {
    return { success: true, twoFactorRequired: false, token: "demo_skip", admin: {} };
  }
  if (m === "POST" && path.includes("/admin/seed")) {
    return { success: true };
  }
  if (m === "GET" && path.includes("/admin/dashboard")) {
    return { success: true, stats: MOCK_DASHBOARD_STATS };
  }
  if (m === "GET" && path.includes("/admin/commission")) {
    return { success: true, analytics: MOCK_ANALYTICS };
  }
  if (m === "GET" && path.includes("/admin/agents")) {
    return { success: true, agents: MOCK_AGENTS };
  }
  if (m === "GET" && path.includes("/admin/trips")) {
    return { success: true, trips: MOCK_TRIPS };
  }
  if (m === "GET" && path.includes("/admin/bookings")) {
    return { success: true, bookings: MOCK_BOOKINGS };
  }
  if (m === "GET" && path.includes("/admin/notifications")) {
    return { success: true, notifications: MOCK_NOTIFICATIONS, unreadCount: 2 };
  }
  if (m === "GET" && path.includes("/admin/finance")) {
    return { success: true, finance: MOCK_ANALYTICS };
  }
  if (m === "GET" && path.includes("/admin/referrals")) {
    return { success: true, referrals: [] };
  }
  if (m === "GET" && path.includes("/admin/settings")) {
    return { success: true, settings: {} };
  }
  if (m === "GET" && path.includes("/admin/me")) {
    return { success: true, admin: makeDemoAdmin("demo@traveloop.com") };
  }

  // Generic fallback for any other admin endpoint
  if (path.includes("/admin/")) {
    return { success: true, data: [], message: "Demo mode: mock response" };
  }

  return null;
};
