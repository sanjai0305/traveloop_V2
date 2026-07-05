import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redisClient;

try {
  console.log(`[Redis Init] Connecting to Redis instance at: ${redisUrl}`);
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    reconnectOnError: (err) => {
      const targetError = "READONLY";
      if (err.message.slice(0, targetError.length) === targetError) {
        return true; // Reconnect on READONLY error
      }
      return false;
    },
  });

  redisClient.on("connect", () => {
    console.log("[Redis] Connected to server successfully.");
  });

  redisClient.on("error", (err) => {
    console.error("[Redis] Client error:", err.message);
  });
} catch (error) {
  console.error("[Redis Init] Failed to create Redis client instance:", error);
}

export const checkRedisConnection = async () => {
  if (!redisClient) return false;
  try {
    const pong = await redisClient.ping();
    const isHealthy = pong === "PONG";
    console.log("[Redis Health] Ping check response:", pong);
    return isHealthy;
  } catch (error) {
    console.error("[Redis Health] Connection failed:", error.message);
    return false;
  }
};

export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log("[Redis] Client connection closed.");
  }
};

export default redisClient;
export { redisClient };
