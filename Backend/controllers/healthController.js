import db from "../config/db.js";

export const getSystemHealth = async (req, res) => {
  console.log("[Health Check] Checking MySQL infrastructure status...");

  let dbStatus = "unhealthy";
  try {
    const rows = await db.query("SELECT 1 AS connected");
    dbStatus = (rows && rows[0]?.connected === 1) ? "healthy" : "unhealthy";
  } catch {
    dbStatus = "unhealthy";
  }

  const uptimeSeconds = process.uptime();
  const hours   = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeString  = `${hours}h ${minutes}m`;
  const memoryString  = `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`;

  res.status(dbStatus === "healthy" ? 200 : 503).json({
    mysql:    dbStatus,
    database: dbStatus,
    uptime:   uptimeString,
    memory:   memoryString,
  });
};

export default getSystemHealth;
