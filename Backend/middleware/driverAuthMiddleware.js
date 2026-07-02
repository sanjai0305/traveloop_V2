import jwt from "jsonwebtoken";
import Driver from "../models/Driver.js";

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

    const driverRow = await Driver.findById(decoded.id).select("name email phone status vehicleNumber licenseNumber");

    if (!driverRow) {
      return res.status(401).json({ success: false, message: "Driver account not found" });
    }

    if (driverRow.status === "suspended") {
      return res.status(403).json({ success: false, message: "Driver account suspended" });
    }

    req.driver = {
      ...driverRow.toObject(),
      _id: driverRow._id,
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
