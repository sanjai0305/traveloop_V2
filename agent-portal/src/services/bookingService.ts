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

export const getTripManifest = async (tripId: string): Promise<{
  success: boolean;
  trip: any;
  bookings: Booking[];
  tripStats: {
    passengerCount: number;
    paidCount: number;
    cancelledCount: number;
    boardedCount: number;
    pendingBoardingCount: number;
    maleCount: number;
    femaleCount: number;
    otherCount: number;
    totalSeats: number;
    bookedSeats: number;
    availableSeats: number;
    occupancyPercent: number;
    grossRevenue: number;
    commissionAmount: number;
    netRevenue: number;
    pendingRevenue: number;
    refundedAmount: number;
  };
  driver: any;
}> => {
  const response = await api.get(`/agent/trips/${tripId}/manifest`);
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

