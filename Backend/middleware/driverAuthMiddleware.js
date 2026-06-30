import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

const protectDriver = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "driver") {
      return res.status(403).json({ success: false, message: "Not a driver account" });
    }

    const { data: driverRow, error } = await supabase
      .from("drivers")
      .select("id, name, email, phone, status, vehicleNumber, licenseNumber")
      .eq("id", decoded.id)
      .maybeSingle();

    if (error || !driverRow) {
      return res.status(401).json({ success: false, message: "Driver account not found" });
    }

    if (driverRow.status === "suspended") {
      return res.status(403).json({ success: false, message: "Driver account suspended" });
    }

    req.driver = {
      ...driverRow,
      _id: driverRow.id,
    };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default protectDriver;
