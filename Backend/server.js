import "./config/env.js";
import "./config/firebaseAdmin.js";
import express from "express";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import uploadRoutes from "./routes/uploadRoutes.js";

import { connectDB } from "./config/db.js";
import supabase from "./config/supabase.js";
import sanitizeInput from "./middleware/sanitize.js";

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception thrown:", error);
  process.exit(1);
});

import authRoutes from "./routes/authRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import itineraryRoutes from "./routes/itineraryRoutes.js";
import checklistRoutes from "./routes/checklistRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { setIo as setNotificationIo } from "./controllers/notificationController.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import nearbyRoutes from "./routes/nearbyRoutes.js";
import visaRoutes from "./routes/visaRoutes.js";
import scannerRoutes from "./routes/scannerRoutes.js";
import flightRoutes from "./routes/flightRoutes.js";
import exploreRoutes from "./routes/exploreRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import boardingRoutes from "./routes/boardingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import driverUpdatesRoutes from "./routes/driverUpdatesRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import rewardRoutes from "./routes/rewardRoutes.js";
import tripMembersRoutes from "./routes/tripMembersRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import passengerVerificationRoutes from "./routes/passengerVerificationRoutes.js";
import legalRoutes from "./routes/legalRoutes.js";

import healthRoutes from "./routes/healthRoutes.js";
import errorLogger from "./middleware/errorMiddleware.js";
import { bootstrapAdmin } from "./utils/bootstrapAdmin.js";

// Run Admin Bootstrap on startup
bootstrapAdmin().catch((err) =>
  console.error("❌ Admin Bootstrap startup failed:", err)
);

let dbConnected = true;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5181",
  "http://localhost:5182",
  "http://localhost:5183",
  "capacitor://localhost",
  "http://localhost",
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",").forEach((origin) => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

console.log("Allowed Origins:");
allowedOrigins.forEach((origin) => console.log("✓", origin));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin === "capacitor://localhost" ||
        origin === "http://localhost";
      if (isAllowed) return callback(null, true);
      return callback(null, true); // Fallback allow for dev
    },
    credentials: true,
  },
});

// Inject io into notification controller for real-time push delivery
setNotificationIo(io);

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`[Socket.io] Client ${socket.id} joined room: ${room}`);
  });

  // Allow authenticated users to subscribe to their personal notification room
  socket.on("join_user_room", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      socket.join(`user_${userId.toString()}`);
      console.log(
        `[Socket.io] Client ${socket.id} joined user rooms: ${userId} & user_${userId}`
      );
    }
  });

  // ── Real-Time Trip Collaboration Events ──
  socket.on("join_trip", ({ tripId, user }) => {
    if (tripId) {
      socket.join(`trip_${tripId}`);
      socket.join(`trip:${tripId}`);
      socket.join(tripId);
      socket.currentTripId = tripId;
      socket.userData = user;
      console.log(
        `[Socket.io] User ${user?.name || user?.email || socket.id} joined trip rooms: trip_${tripId} & trip:${tripId}`
      );
      socket
        .to(`trip_${tripId}`)
        .emit("user_joined_trip", { user, socketId: socket.id });
    }
  });

  socket.on("leave_trip", ({ tripId, user }) => {
    if (tripId) {
      socket.leave(`trip_${tripId}`);
      socket
        .to(`trip_${tripId}`)
        .emit("user_left_trip", { user, socketId: socket.id });
    }
  });

  socket.on("trip_update", ({ tripId, type, data, user }) => {
    if (tripId) {
      console.log(
        `[Socket.io] Live trip_update (${type}) broadcast to room trip_${tripId}`
      );
      socket
        .to(`trip_${tripId}`)
        .emit("trip_update", { type, data, user, timestamp: new Date() });
    }
  });

  socket.on("typing", ({ tripId, user, field }) => {
    if (tripId) {
      socket.to(`trip_${tripId}`).emit("user_typing", { user, field });
      socket.to(`trip_${tripId}`).emit("chat:typing", { user, field });
    }
  });

  socket.on("stop_typing", ({ tripId, user, field }) => {
    if (tripId) {
      socket.to(`trip_${tripId}`).emit("user_stop_typing", { user, field });
      socket.to(`trip_${tripId}`).emit("chat:stopTyping", { user, field });
    }
  });

  // Enterprise Chat Socket Handlers
  socket.on("chat:join", ({ tripId, user }) => {
    if (tripId) {
      socket.join(`trip_${tripId}`);
      console.log(
        `[Socket.io] User ${user?.name || socket.id} joined chat room: trip_${tripId}`
      );
    }
  });

  socket.on("chat:leave", ({ tripId }) => {
    if (tripId) {
      socket.leave(`trip_${tripId}`);
    }
  });

  socket.on("chat:message", (data) => {
    if (data && data.tripId) {
      socket.to(`trip_${data.tripId}`).emit("chat:message", data);
    }
  });

  socket.on("chat:typing", ({ tripId, user }) => {
    if (tripId) {
      socket.to(`trip_${tripId}`).emit("chat:typing", { user });
    }
  });

  socket.on("chat:stopTyping", ({ tripId, user }) => {
    if (tripId) {
      socket.to(`trip_${tripId}`).emit("chat:stopTyping", { user });
    }
  });

  socket.on("chat:reaction", ({ tripId, messageId, reactions }) => {
    if (tripId) {
      socket
        .to(`trip_${tripId}`)
        .emit("chat:reaction", { messageId, reactions });
    }
  });

  socket.on("chat:readReceipt", ({ tripId, messageId, userId }) => {
    if (tripId) {
      socket
        .to(`trip_${tripId}`)
        .emit("chat:readReceipt", { messageId, userId, readAt: new Date() });
    }
  });

  // Seat map real-time room — scoped per trip
  socket.on("join_trip_seats", (tripId) => {
    if (tripId) {
      socket.join(`trip_${tripId}`);
      console.log(
        `[Socket.io] Client ${socket.id} joined seat room: trip_${tripId}`
      );
    }
  });

  socket.on("leave_trip_seats", (tripId) => {
    if (tripId) {
      socket.leave(`trip_${tripId}`);
    }
  });

  socket.on("trip_deleted", (tripId) => {
    console.log(`[Socket.io] Received trip_deleted: ${tripId}, broadcasting...`);
    io.emit("trip_deleted", tripId);
  });

  socket.on("disconnect", () => {
    if (socket.currentTripId) {
      socket
        .to(`trip_${socket.currentTripId}`)
        .emit("user_left_trip", { user: socket.userData, socketId: socket.id });
    }
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

app.set("io", io);

app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* -----------------------------
   RATE LIMITERS
------------------------------ */

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 200 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skip: (req) => req.originalUrl.startsWith("/api/admin"),
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skip: (req) => {
    const authHeader = req.headers.authorization;
    return authHeader && authHeader.startsWith("Bearer ");
  },
  message: {
    success: false,
    message: "Too many admin requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});

/* -----------------------------
   CORS CONFIGURATION
------------------------------ */

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin === "capacitor://localhost" ||
      origin === "http://localhost";

    if (isAllowed) return callback(null, true);

    console.error("[CORS] Blocked origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

/* -----------------------------
   SECURITY & BODY PARSERS
------------------------------ */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use("/api/scanner", express.json({ limit: "10mb" }));
app.use("/api/profile", express.json({ limit: "5mb" }));

app.use(
  express.json({
    limit: "100kb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(sanitizeInput);
app.use(globalLimiter);

/* -----------------------------
   HEALTH CHECK & RECOMS
------------------------------ */

app.use("/api/health", healthRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TravelLoop Backend Running (Supabase PostgreSQL) 🚀",
    db: "connected",
  });
});

/* -----------------------------
   ROUTES
------------------------------ */

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/legal", legalRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/my-trips", tripRoutes);
app.use("/api/itinerary", itineraryRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/user", userRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/nearby", nearbyRoutes);
app.use("/api/visa", visaRoutes);
app.use("/api/scanner", scannerRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/boarding", boardingRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/driver-updates", driverUpdatesRoutes);
app.use("/api/trip-members", tripMembersRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/passenger", passengerVerificationRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/rewards", rewardRoutes);

// Direct QR status route
app.get("/api/qr/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .or(`id.eq.${bookingId},booking_code.eq.${bookingId}`)
      .maybeSingle();

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      qrUnlocked: true,
      qrCode: booking.qr_code_url || "",
      token: booking.booking_code || "",
    });
  } catch (error) {
    console.error("[Booking QR Status API] Error:", error);
    res.status(500).json({ success: false, message: "Server Error fetching QR status" });
  }
});

/* -----------------------------
   HEALTH CHECK
------------------------------ */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "Traveloop Backend API",
    version: "2.0.0",
    status: "healthy",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

/* -----------------------------
   404 & ERROR HANDLER
------------------------------ */

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

app.use(errorLogger);

/* -----------------------------
   SERVER STARTUP
------------------------------ */

await connectDB();

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing!");
}

let port = parseInt(process.env.PORT || "5000", 10);

if (process.env.NODE_ENV === "production") {
  server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`✅ Supabase PostgreSQL Connected`);
    console.log(`✅ Socket.io enabled`);
    console.log(`✅ Routes loaded successfully`);
  });
} else {
  const maxPort = port + 2;

  const startServer = (p) => {
    server.listen(p, () => {
      console.log(`🚀 Server running on port ${p}`);
      console.log(`✅ Supabase PostgreSQL Connected`);
      console.log(`✅ Socket.io enabled`);
      console.log(`\n── Registered Trip & Booking API Endpoints ──`);
      console.log(`  - POST   /api/trips/create`);
      console.log(`  - POST   /api/trips/`);
      console.log(`  - GET    /api/trips/my`);
      console.log(`  - GET    /api/trips/my-trips`);
      console.log(`  - GET    /api/trips/published`);
      console.log(`  - GET    /api/trips/published/:id`);
      console.log(`  - GET    /api/trips/destination`);
      console.log(`  - GET    /api/trips/:id`);
      console.log(`  - PUT    /api/trips/:id`);
      console.log(`  - DELETE /api/trips/:id`);
      console.log(`  - POST   /api/bookings/create`);
      console.log(`  - GET    /api/bookings/my`);
      console.log(`  - GET    /api/bookings/my-bookings`);
      console.log(`\n── Registered Agent API Endpoints ──`);
      console.log(`  - POST   /api/agent/login`);
      console.log(`  - POST   /api/agent/google`);
      console.log(`  - GET    /api/agent/profile`);
      console.log(`  - GET    /api/agent/me`);
      console.log(`  - PUT    /api/agent/profile`);
      console.log(`  - PATCH  /api/agent/profile`);
      console.log(`  - PATCH  /api/agent/profile/onboarding`);
      console.log(`  - POST   /api/agent/profile/onboarding`);
      console.log(`  - PUT    /api/agent/profile/onboarding`);
      console.log(`  - POST   /api/agent/profile/create`);
      console.log(`  - POST   /api/agent/onboarding/step`);
      console.log(`  - GET    /api/agent/onboarding/status`);
      console.log(`  - POST   /api/agent/verify-mobile-otp`);
      console.log(`\n── Registered Driver API Endpoints ──`);
      console.log(`  - POST   /api/driver/send-email-otp`);
      console.log(`  - POST   /api/driver/verify-email-otp`);
      console.log(`  - POST   /api/driver/login`);
      console.log(`  - GET    /api/driver/me`);
      console.log(`  - GET    /api/driver/my-trip`);
      console.log(`  - GET    /api/driver/passengers/:tripId`);
      console.log(`  - POST   /api/driver/scan-qr`);
      console.log(`==================================================\n`);
    });
  };

  server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.log(`⚠️ Port ${port} is already in use.`);
      if (port < maxPort) {
        port++;
        console.log(`🔄 Retrying on port ${port}...`);
        startServer(port);
      } else {
        console.log("Backend already running on port 5000");
        process.exit(0);
      }
    } else {
      console.error(e);
      process.exit(1);
    }
  });

  startServer(port);
}

const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log("[Server] HTTP server closed.");
    console.log("[Server] Graceful shutdown completed successfully.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[Server] Force exiting after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default app;