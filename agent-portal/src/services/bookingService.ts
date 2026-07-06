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

// ─── Schedule Change API ─────────────────────────────────────────────────────

export interface ScheduleChangePassenger {
  bookingId: string;
  travelerName: string;
  email: string;
  status: "pending" | "otp_sent" | "approved" | "rejected" | "expired";
  verified?: boolean;
  verifiedAt?: string;
}

export interface ScheduleChangeStatusResponse {
  success: boolean;
  exists: boolean;
  changeRequestId?: string;
  status?: string;
  newStartDate?: string;
  newDepartureTime?: string;
  oldStartDate?: string;
  oldDepartureTime?: string;
  totalPassengers?: number;
  approvedCount?: number;
  allApproved?: boolean;
  passengers?: ScheduleChangePassenger[];
}

export const initiateScheduleChange = async (
  tripId: string,
  payload: { newStartDate: string; newDepartureTime: string }
): Promise<{
  success: boolean;
  requiresConsent: boolean;
  message: string;
  changeRequestId?: string;
  totalPassengers?: number;
  approvedCount?: number;
  passengers?: ScheduleChangePassenger[];
  trip?: any;
}> => {
  const response = await api.post(`/agent/trips/${tripId}/schedule-change/initiate`, payload);
  return response.data;
};

export const verifyScheduleOtp = async (
  tripId: string,
  payload: { bookingId: string; otp: string }
): Promise<{
  success: boolean;
  message: string;
  approvedCount: number;
  totalPassengers: number;
  allApproved: boolean;
}> => {
  const response = await api.post(`/agent/trips/${tripId}/schedule-change/verify-otp`, payload);
  return response.data;
};

export const resendScheduleOtp = async (
  tripId: string,
  bookingId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/agent/trips/${tripId}/schedule-change/resend-otp`, { bookingId });
  return response.data;
};

export const getScheduleChangeStatus = async (
  tripId: string
): Promise<ScheduleChangeStatusResponse> => {
  const response = await api.get(`/agent/trips/${tripId}/schedule-change/status`);
  return response.data;
};

export const applyScheduleChange = async (
  tripId: string
): Promise<{ success: boolean; message: string; trip?: any }> => {
  const response = await api.post(`/agent/trips/${tripId}/schedule-change/apply`);
  return response.data;
};
