import api from "./api";
import { AnalyticsResponse } from "../types";

export const getAnalytics = async (): Promise<AnalyticsResponse & { isDemo?: boolean }> => {
  try {
    const response = await api.get("/analytics");
    return response.data;
  } catch (error) {
    console.warn("[Analytics Service] Failed to fetch analytics from backend. Using fallback demo values.", error);
    return {
      metrics: {
        totalTrips: 0,
        activeTrips: 0,
        upcomingTrips: 0,
        totalTravelers: 0,
        revenue: 0,
        pendingBookings: 0,
        occupancyRate: 0,
        maleCount: 0,
        femaleCount: 0,
        otherCount: 0,
      },
      recentActivities: [],
      bookingsGraph: [
        { month: "Jan", Bookings: 0, Revenue: 0 },
        { month: "Feb", Bookings: 0, Revenue: 0 },
        { month: "Mar", Bookings: 0, Revenue: 0 },
      ],
      popularDestinations: [],
      topAgents: [],
      isDemo: true,
    };
  }
};
export default getAnalytics;
