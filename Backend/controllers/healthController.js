import mongoose from "mongoose";
import { checkNeo4jConnection } from "../config/neo4j.js";
import { checkRedisConnection } from "../config/redis.js";

export const getSystemHealth = async (req, res) => {
  console.log("[Health Check] Checking server dependency levels...");
  const mongoStatus = mongoose.connection.readyState === 1 ? "HEALTHY" : "UNHEALTHY";
  
  const neo4jHealthy = await checkNeo4jConnection();
  const neo4jStatus = neo4jHealthy ? "HEALTHY" : "UNHEALTHY";

  const redisHealthy = await checkRedisConnection();
  const redisStatus = redisHealthy ? "HEALTHY" : "UNHEALTHY";

  const isOverallHealthy =
    mongoStatus === "HEALTHY" &&
    neo4jStatus === "HEALTHY" &&
    redisStatus === "HEALTHY";

  res.status(isOverallHealthy ? 200 : 503).json({
    success: isOverallHealthy,
    status: isOverallHealthy ? "UP" : "DOWN",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
      neo4j: neo4jStatus,
      redis: redisStatus,
    },
  });
};
