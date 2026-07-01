import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";

// Initialize the Express app
const app = express();

// Configure CORS and JSON parsing middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Sample Routing
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the TravelLoop Firebase Functions API!",
    timestamp: new Date().toISOString(),
    status: "healthy"
  });
});

app.get("/hello", (req, res) => {
  const name = req.query.name || "World";
  res.json({
    message: `Hello, ${name}! This response is served from Firebase Cloud Functions.`,
    env: process.env.NODE_ENV || "production"
  });
});

// Error handling middleware for the Express API
app.use((err, req, res, next) => {
  console.error("Express App Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// Export the Express app as a Firebase Cloud Function named 'api'
export const api = onRequest({
  cors: true,
  maxInstances: 10, // Optimize cost by limiting max instances
}, app);
