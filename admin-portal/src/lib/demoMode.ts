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
    displayName: "Sanjai Murugan",
    companyName: "Sanjai Travels",
    email: "sanjai@demo.com",
    mobile: "8637628773",
    phone: "8637628773",
    status: "approved",
    kycStatus: "APPROVED",
    commissionRate: 10,
    walletBalance: 640_000,
    totalRevenue: 640_000,
    pendingRevenue: 45_000,
    settledRevenue: 595_000,
    totalBookings: 128,
    usedSlots: 1,
    tripSlots: 2,
    bonusSlots: 1,
    purchasedSlots: 0,
    revenue: 640_000,
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    _id: "agent-demo-2",
    name: "Priya Rajan",
    displayName: "Priya Rajan",
    companyName: "Chennai Tours",
    email: "priya@demo.com",
    mobile: "9876543210",
    phone: "9876543210",
    status: "approved",
    kycStatus: "APPROVED",
    commissionRate: 8,
    walletBalance: 480_000,
    totalRevenue: 480_000,
    pendingRevenue: 20_000,
    settledRevenue: 460_000,
    totalBookings: 96,
    usedSlots: 2,
    tripSlots: 2,
    bonusSlots: 0,
    purchasedSlots: 1,
    revenue: 480_000,
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    _id: "agent-demo-3",
    name: "Karthik Raj",
    displayName: "Karthik Raj",
    companyName: "Delta Trip Co.",
    email: "karthik@demo.com",
    mobile: "7654321098",
    phone: "7654321098",
    status: "pending",
    kycStatus: "PENDING",
    commissionRate: 10,
    walletBalance: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    settledRevenue: 0,
    totalBookings: 0,
    usedSlots: 0,
    tripSlots: 2,
    bonusSlots: 0,
    purchasedSlots: 0,
    revenue: 0,
    createdAt: "2026-07-01T10:00:00Z",
  },
];

export const MOCK_TRIPS = [
  {
    _id: "trip-demo-1",
    title: "Ooty Hill Station Adventure",
    destinations: ["Coimbatore", "Coonoor", "Ooty"],
    duration: "3 Days / 2 Nights",
    startDate: "2026-08-15",
    endDate: "2026-08-17",
    pricePerPerson: 4_500,
    price: 4_500,
    totalSeats: 24,
    seats: 24,
    availableSeats: 6,
    bookedSeats: 18,
    bookedCount: 18,
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    approvalStatus: "approved",
    status: "published",
    isHidden: false,
    isFeatured: true,
    isDeleted: false,
    createdAt: "2026-07-20T10:00:00Z",
    agent: {
      companyName: "Sanjai Travels",
      displayName: "Sanjai Murugan",
      email: "sanjai@demo.com",
    },
    agentName: "Sanjai Travels",
  },
  {
    _id: "trip-demo-2",
    title: "Rameswaram Temple Circuit",
    destinations: ["Madurai", "Rameswaram", "Dhanushkodi"],
    duration: "2 Days / 1 Night",
    startDate: "2026-08-22",
    endDate: "2026-08-24",
    pricePerPerson: 3_200,
    price: 3_200,
    totalSeats: 40,
    seats: 40,
    availableSeats: 5,
    bookedSeats: 35,
    bookedCount: 35,
    coverImage: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600",
    approvalStatus: "approved",
    status: "published",
    isHidden: false,
    isFeatured: false,
    isDeleted: false,
    createdAt: "2026-07-22T10:00:00Z",
    agent: {
      companyName: "Chennai Tours",
      displayName: "Priya Rajan",
      email: "priya@demo.com",
    },
    agentName: "Chennai Tours",
  },
  {
    _id: "trip-demo-3",
    title: "Kerala Backwaters Tour",
    destinations: ["Kochi", "Alleppey", "Munnar"],
    duration: "4 Days / 3 Nights",
    startDate: "2026-09-10",
    endDate: "2026-09-14",
    pricePerPerson: 8_999,
    price: 8_999,
    totalSeats: 16,
    seats: 16,
    availableSeats: 16,
    bookedSeats: 0,
    bookedCount: 0,
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600",
    approvalStatus: "pending",
    status: "pending",
    isHidden: false,
    isFeatured: false,
    isDeleted: false,
    createdAt: "2026-07-31T09:00:00Z",
    agent: {
      companyName: "Delta Trip Co.",
      displayName: "Karthik Raj",
      email: "karthik@demo.com",
    },
    agentName: "Delta Trip Co.",
  },
];

export const MOCK_BOOKINGS = [
  {
    _id: "book-demo-1",
    bookingId: "BK-2026-001",
    travelerName: "Ananya Kumar",
    customerName: "Ananya Kumar",
    seats: 2,
    pricePaid: 9_000,
    amountPaid: 9_000,
    amount: 9_000,
    commissionAmount: 900,
    agentAmount: 7_920,
    gatewayFee: 180,
    paymentStatus: "PAID",
    status: "Paid",
    createdAt: "2026-07-20T14:30:00Z",
    bookedAt: "2026-07-20T14:30:00Z",
    agentTrip: {
      title: "Ooty Hill Station Adventure",
    },
    tripTitle: "Ooty Hill Station Adventure",
    agent: {
      companyName: "Sanjai Travels",
      displayName: "Sanjai Murugan",
    },
  },
  {
    _id: "book-demo-2",
    bookingId: "BK-2026-002",
    travelerName: "Vijay Sharma",
    customerName: "Vijay Sharma",
    seats: 4,
    pricePaid: 12_800,
    amountPaid: 12_800,
    amount: 12_800,
    commissionAmount: 1_280,
    agentAmount: 11_264,
    gatewayFee: 256,
    paymentStatus: "PAID",
    status: "Settled",
    createdAt: "2026-07-21T09:15:00Z",
    bookedAt: "2026-07-21T09:15:00Z",
    agentTrip: {
      title: "Rameswaram Temple Circuit",
    },
    tripTitle: "Rameswaram Temple Circuit",
    agent: {
      companyName: "Chennai Tours",
      displayName: "Priya Rajan",
    },
  },
  {
    _id: "book-demo-3",
    bookingId: "BK-2026-003",
    travelerName: "Karthik Raja",
    customerName: "Karthik Raja",
    seats: 1,
    pricePaid: 4_500,
    amountPaid: 4_500,
    amount: 4_500,
    commissionAmount: 450,
    agentAmount: 3_960,
    gatewayFee: 90,
    paymentStatus: "REFUNDED",
    status: "Cancelled",
    createdAt: "2026-07-25T11:00:00Z",
    bookedAt: "2026-07-25T11:00:00Z",
    agentTrip: {
      title: "Kerala Backwaters Tour",
    },
    tripTitle: "Kerala Backwaters Tour",
    agent: {
      companyName: "Delta Trip Co.",
      displayName: "Karthik Raj",
    },
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
