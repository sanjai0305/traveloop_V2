import { Agent, DocumentUpload } from "./agent";
export type { Agent, DocumentUpload };


export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  hotel?: string;
  images?: string[];
}

export interface AgentTrip {
  _id: string;
  agent: string;
  title: string;
  subtitle?: string;
  shortDescription: string;
  description: string;
  category?: string;
  destinations: string[];
  originCity?: string;
  duration: string;
  startDate: string;
  endDate: string;
  departureTime?: string;
  arrivalTime?: string;
  pickupLocation: string;
  dropPoint?: string;
  // Pricing
  pricePerPerson: number;
  originalPrice?: number;
  offerPrice?: number;
  discountPercentage?: number;
  saveAmount?: number;
  // Capacity
  totalSeats: number;
  availableSeats: number;
  bookedSeats?: number;
  maleCount?: number;
  femaleCount?: number;
  childrenCount?: number;
  occupancyPercent?: number;
  // Bus
  busName?: string;
  busType: string;
  busNumber: string;
  busRegistration?: string;
  busImages?: string[];
  busPhotos?: string[];
  seatLayoutImage?: string;
  // Driver
  driverName?: string;
  driverPhone?: string;
  driverAlternateMobile?: string;
  driverLicenseNumber?: string;
  driverExperience?: number;
  driverPhoto?: string;
  emergencyContact: string;
  reportingTime?: string;
  boardingStatus?: string;
  boardingOpenedAt?: string;
  boardingClosesAt?: string;
  // Media
  coverImage?: string;
  gallery?: string[];
  galleryImages?: string[];
  // Accommodation
  hotelName?: string;
  hotelRating?: number;
  roomType?: string;
  mealsIncluded?: string[];
  // Services
  includedServices: string[];
  excludedServices?: string[];
  exclusions?: string;
  termsConditions?: string;
  cancellationPolicy?: string;
  // Itinerary
  itinerary: ItineraryDay[];
  // Publishing
  publishStatus?: string;
  status?: string;
  progressPercentage?: number;
  activeStep?: number;
  bookingDeadline?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  _id: string;
  bookingId: string;
  travelerName: string;
  gender: "Male" | "Female" | "Other";
  contactNumber: string;
  age: number;
  seats: number;
  seatNumbers: string[];
  paymentStatus: "Paid" | "Pending" | "Cancelled";
  bookingDate: string;
  agentTrip: string | AgentTrip;
  agent: string;
  pricePaid: number;
  tripName?: string;
  pickupLocation?: string;
  dropLocation?: string;
  commissionAmount?: number;
  boardingStatus?: string;
  boardedAt?: string;
  assignedSeat?: string;
  qrCode?: string;
  token?: string;
  boardingPassGenerated?: boolean;
  boardingPassGeneratedAt?: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  boarded?: boolean;
  seatAssigned?: boolean;
}

export interface DashboardMetrics {
  totalTrips: number;
  activeTrips: number;
  upcomingTrips: number;
  totalTravelers: number;
  revenue: number;
  pendingBookings: number;
  occupancyRate: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
}

export interface BookingGraphPoint {
  month: string;
  Bookings: number;
  Revenue: number;
}

export interface DestinationCount {
  destination: string;
  count: number;
}

export interface TopAgent {
  name: string;
  revenue: number;
  trips: number;
}

export interface AnalyticsResponse {
  metrics: DashboardMetrics;
  recentActivities: Array<{
    id: string;
    type: "paid" | "pending" | "cancelled";
    travelerName: string;
    description: string;
    timestamp: string;
  }>;
  bookingsGraph: BookingGraphPoint[];
  popularDestinations: DestinationCount[];
  topAgents: TopAgent[];
}
