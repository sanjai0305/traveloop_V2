import mongoose from "mongoose";

export const getSystemHealth = async (req, res) => {
  console.log("[Health Check] Checking infrastructure status...");
  
  const mongoStatus = mongoose.connection.readyState === 1 ? "healthy" : "unhealthy";
  const isOverallHealthy = mongoStatus === "healthy";

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
    uptime: uptimeString,
    memory: memoryString,
  });
};

