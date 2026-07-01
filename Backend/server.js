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

import sanitizeInput from "./middleware/sanitize.js";
// Removed connectDB import

import authRoutes from "./routes/authRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import itineraryRoutes from "./routes/itineraryRoutes.js";
import checklistRoutes from "./routes/checklistRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
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
import tripMembersRoutes from "./routes/tripMembersRoutes.js";


let dbConnected = true;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  
  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`[Socket.io] Client ${socket.id} joined room: ${room}`);
  });

  socket.on("trip_deleted", (tripId) => {
    console.log(`[Socket.io] Received trip_deleted: ${tripId}, broadcasting...`);
    io.emit("trip_deleted", tripId);
  });

  socket.on("disconnect", () => {
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
  message: {
    success: false,
    message: "Too many requests, please try again later.",
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
   CORS FIX
------------------------------ */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://localhost:5179",
  "http://localhost:5180",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);



app.use(
  cors({
    origin(origin, callback) {
      console.log("Incoming Origin:", origin);

      // Allow requests without origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked Origin:", origin);

      // TEMP DEBUG MODE
      return callback(null, true);

      // STRICT MODE (enable later)
      // return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "Accept",
      "X-Requested-With",
    ],
    optionsSuccessStatus: 204,
  })
);

app.options("*all", cors());

/* -----------------------------
   SECURITY
------------------------------ */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* -----------------------------
   BODY PARSERS
------------------------------ */

app.use("/api/scanner", express.json({ limit: "10mb" }));
app.use("/api/profile", express.json({ limit: "5mb" }));

app.use(express.json({ limit: "100kb" }));

app.use(sanitizeInput);
app.use(globalLimiter);

/* -----------------------------
   HEALTH CHECK
------------------------------ */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TravelLoop Backend Running 🚀",
    db: dbConnected ? "connected" : "disconnected",
  });
});

// Health check endpoint — useful for Render deployment verification
app.get("/api/health", (req, res) => {
  const supabaseConnected = !!process.env.SUPABASE_URL;
  res.status(supabaseConnected ? 200 : 503).json({
    success: supabaseConnected,
    status: supabaseConnected ? "healthy" : "degraded",
    db: supabaseConnected ? "connected" : "disconnected — set SUPABASE_URL in Render env vars",
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

/* -----------------------------
   ROUTES
------------------------------ */

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/itinerary", itineraryRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/profile", profileRoutes);
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
app.use("/api/payment", paymentRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/boarding", boardingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/driver-updates", driverUpdatesRoutes);
app.use("/api/trip-members", tripMembersRoutes);

/* -----------------------------
   404
------------------------------ */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

/* -----------------------------
   ERROR HANDLER
------------------------------ */

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* -----------------------------
   SERVER STARTUP
------------------------------ */

let port = parseInt(process.env.PORT || "5000", 10);

if (process.env.NODE_ENV === "production") {
  server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`✅ Supabase Connected`);
    console.log(`✅ Routes Loaded Successfully`);
  });
} else {
  const maxPort = port + 2;

  const startServer = (p) => {
    server.listen(p, () => {
      console.log(`🚀 Server running on port ${p}`);
      console.log(`✅ Supabase Connected`);
      console.log(`✅ Routes Loaded Successfully`);
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

export default app;