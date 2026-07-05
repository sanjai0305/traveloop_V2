import mongoose from "mongoose";
import { checkNeo4jConnection } from "../config/neo4j.js";
import { checkRedisConnection } from "../config/redis.js";
import { neo4jSyncQueue } from "../config/bullmq.js";

export const getSystemHealth = async (req, res) => {
  console.log("[Health Check] Checking self-hosted infrastructure statuses...");
  
  const mongoStatus = mongoose.connection.readyState === 1 ? "healthy" : "unhealthy";
  
  const neo4jHealthy = await checkNeo4jConnection();
  const neo4jStatus = neo4jHealthy ? "healthy" : "unhealthy";

  const redisHealthy = await checkRedisConnection();
  const redisStatus = redisHealthy ? "healthy" : "unhealthy";

  let queueDepth = "0";
  let bullmqStatus = "unhealthy";
  if (redisHealthy && neo4jSyncQueue) {
    try {
      const counts = await neo4jSyncQueue.getJobCounts("active", "waiting", "delayed");
      const depth = (counts.active || 0) + (counts.waiting || 0) + (counts.delayed || 0);
      queueDepth = String(depth);
      bullmqStatus = "healthy";
    } catch (e) {
      console.warn("[Health Check] Failed to read BullMQ counts:", e.message);
    }
  }

  const isOverallHealthy =
    mongoStatus === "healthy" &&
    neo4jStatus === "healthy" &&
    redisStatus === "healthy" &&
    bullmqStatus === "healthy";

  // Calculate process uptime
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeString = `${hours}h ${minutes}m`;

  // Calculate memory usage (RSS)
  const memoryUsageRss = process.memoryUsage().rss;
  const memoryString = `${Math.round(memoryUsageRss / 1024 / 1024)}MB`;

  res.status(isOverallHealthy ? 200 : 503).json({
    mongodb: mongoStatus,
    neo4j: neo4jStatus,
    redis: redisStatus,
    bullmq: bullmqStatus,
    uptime: uptimeString,
    memory: memoryString,
    queueDepth: queueDepth,
  });
};
