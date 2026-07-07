import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

// Load backend .env directly
dotenv.config();

const generateQrSignature = (payload, secret) => {
  const dataToSign = `${payload.bookingId}|${payload.tripId}|${payload.passengerId}|${payload.seatNumber}|${payload.issuedAt}|${payload.expiresAt}`;
  return crypto.createHmac("sha256", secret).update(dataToSign).digest("hex");
};

const payload = {
  bookingId: "65d8c6b1234567890abcdef1",
  tripId: "65d8c6b1234567890abcdef2",
  passengerId: "65d8c6b1234567890abcdef3",
  seatNumber: "A3",
  issuedAt: Date.now(),
  expiresAt: Date.now() + 86400000,
};

const driverSecret1 = process.env.DRIVER_QR_SECRET || process.env.JWT_SECRET || "super_secret_jwt_key_for_local_development_traveloop";
const driverSecret2 = process.env.DRIVER_QR_SECRET || process.env.JWT_SECRET || "super_secret_jwt_key_for_local_development_traveloop";

console.log("DRIVER_QR_SECRET from env:", JSON.stringify(process.env.DRIVER_QR_SECRET));
console.log("JWT_SECRET from env:", JSON.stringify(process.env.JWT_SECRET));
console.log("driverSecret1 resolved:", JSON.stringify(driverSecret1));
console.log("driverSecret2 resolved:", JSON.stringify(driverSecret2));

const sig1 = generateQrSignature(payload, driverSecret1);
const sig2 = generateQrSignature(payload, driverSecret2);

console.log("Signature 1:", sig1);
console.log("Signature 2:", sig2);
console.log("Signature Match:", sig1 === sig2);
