import supabase from "../config/supabase.js";

export const getSystemHealth = async (req, res) => {
  console.log("[Health Check] Checking infrastructure status...");

  let supabaseStatus = "unhealthy";
  try {
    const { error } = await supabase.from("bus_types").select("id").limit(1);
    supabaseStatus = error ? "unhealthy" : "healthy";
  } catch {
    supabaseStatus = "unhealthy";
  }

  const uptimeSeconds = process.uptime();
  const hours   = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeString  = `${hours}h ${minutes}m`;
  const memoryString  = `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`;

  res.status(supabaseStatus === "healthy" ? 200 : 503).json({
    supabase: supabaseStatus,
    database: supabaseStatus,
    uptime:   uptimeString,
    memory:   memoryString,
  });
};
