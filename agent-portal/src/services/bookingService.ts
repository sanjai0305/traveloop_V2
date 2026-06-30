import api from "./api";
import { Booking } from "../types";

/**
 * All agent booking routes are under /api/agent/bookings/...
 * (mounted in agentRoutes.js at /api/agent)
 *
 * DO NOT use /api/bookings — that is not a valid route for agents.
 */

export const getBookings = async (): Promise<{ bookings: Booking[] }> => {
  const response = await api.get("/agent/bookings");
  return response.data;
};

export const updateBookingStatus = async (
  bookingId: string,
  paymentStatus: "Paid" | "Pending" | "Cancelled"
): Promise<{ success: boolean; booking: Booking }> => {
  const response = await api.put(`/agent/bookings/${bookingId}/status`, { paymentStatus });
  return response.data;
};

export const updateBookingDetails = async (
  bookingId: string,
  details: { seatNumbers?: string[]; pickupLocation?: string; boardingStatus?: string }
): Promise<{ success: boolean; booking: Booking }> => {
  const response = await api.put(`/agent/bookings/${bookingId}/update-details`, details);
  return response.data;
};

