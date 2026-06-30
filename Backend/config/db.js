import mongoose from "mongoose";

/**
 * Global cache for Vercel serverless functions
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

const connectWithRetry = async (MONGO_URI, options, retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(MONGO_URI, options);
      return conn;
    } catch (error) {
      console.warn(`[MongoDB] Connection attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`);
      if (i === retries - 1) throw error;
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2; // exponential backoff
    }
  }
};

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("❌ CRITICAL: MONGO_URI is missing from environment variables!");
    // Don't throw so serverless doesn't crash on boot, but log heavily
    return null;
  }

  try {
    // Already connected
    if (cached.conn) {
      return cached.conn;
    }

    // Create connection promise once
    if (!cached.promise) {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      };

      cached.promise = connectWithRetry(MONGO_URI, options);
    }

    cached.conn = await cached.promise;

    if (cached.conn) {
      console.log(`✅ MongoDB Connected: ${cached.conn.connection.host}`);
    }
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    
    console.error("\n========== FULL MONGODB ERROR ==========");
    console.error(error.message);
    console.error("========================================\n");

    // Re-throw if you want it to fail explicitly (we keep the current behavior)
    throw error;
  }
};

export default connectDB;