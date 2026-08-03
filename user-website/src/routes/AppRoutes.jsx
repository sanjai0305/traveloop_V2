import React, { Suspense, lazy } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// SKELETON LOADER
import PageSkeletonLoader from "../components/common/PageSkeletonLoader";
// PAGES (Statically imported for instant startup)
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyEmail from "../pages/VerifyEmail";
import LegalConsent from "../pages/LegalConsent";

import VerifyPhone from "../pages/VerifyPhone";

// LAZY LOADED PAGES
const Dashboard = lazy(() => import("../pages/Dashboard"));
const MyTrips = lazy(() => import("../pages/MyTrips"));
const BookedTrips = lazy(() => import("../pages/BookedTrips"));
const CreateTrip = lazy(() => import("../pages/CreateTrip"));
const BuildItinerary = lazy(() => import("../pages/BuildItinerary"));
const PackingChecklist = lazy(() => import("../pages/PackingChecklist"));
const TripNotes = lazy(() => import("../pages/TripNotes"));
const Activities = lazy(() => import("../pages/Activities"));
const TripDetails = lazy(() => import("../pages/TripDetails"));
const Profile = lazy(() => import("../pages/Profile"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const TripBudget = lazy(() => import("../pages/TripBudget"));
const SharedItinerary = lazy(() => import("../pages/SharedItinerary"));
const SavedDestinations = lazy(() => import("../pages/SavedDestinations"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("../pages/TermsConditions"));
const TermsAndConditions = lazy(() => import("../pages/TermsAndConditions"));
const TravelJournal = lazy(() => import("../pages/TravelJournal"));
const NearbyPlaces = lazy(() => import("../pages/NearbyPlaces"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const About = lazy(() => import("../pages/About"));
const BookedPackageDetail = lazy(() => import("../pages/BookedPackageDetail"));
const DriverPortal = lazy(() => import("../pages/DriverPortal"));
const BookingSuccess = lazy(() => import("../pages/BookingSuccess"));
const TripCollaborationPage = lazy(() => import("../pages/TripCollaborationPage"));
const TripFlightsPage = lazy(() => import("../pages/TripFlightsPage"));
const TripChatPage = lazy(() => import("../pages/TripChatPage"));
const TripAiAssistantPage = lazy(() => import("../pages/TripAiAssistantPage"));
const EditTrip = lazy(() => import("../pages/EditTrip"));
const NoteEditor = lazy(() => import("../pages/NoteEditor"));
const NoteView = lazy(() => import("../pages/NoteView"));
const TripActivitiesPage = lazy(() => import("../pages/TripActivitiesPage"));
const ActivityEditorPage = lazy(() => import("../pages/ActivityEditorPage"));

// PROTECTED ROUTE
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeletonLoader />}>
        <Routes>
            {/* LOGIN */}
            <Route
              path="/"
              element={<Login />}
            />

          {/* REGISTER - UNIFIED WIZARD (Handles all 3 steps internally) */}
          <Route
            path="/register"
            element={<Register />}
          />

          {/* VERIFY EMAIL - DEPRECATED (Use /register instead - now unified) */}
          {/* Route commented out: VerifyEmail is now part of RegistrationWizard */}
          {/* <Route
            path="/verify-email"
            element={<VerifyEmail />}
          /> */}

          {/* REDIRECT /verify-email to /register for backward compatibility */}
          <Route
            path="/verify-email"
            element={<Navigate to="/register" replace />}
          />

          {/* FORGOT PASSWORD */}
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          {/* LEGAL CONSENT */}
          <Route
            path="/legal-consent"
            element={
              <ProtectedRoute>
                <LegalConsent />
              </ProtectedRoute>
            }
          />

          {/* VERIFY PHONE */}
          <Route
            path="/verify-phone"
            element={
              <ProtectedRoute>
                <VerifyPhone />
              </ProtectedRoute>
            }
          />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* MY TRIPS */}
          <Route
            path="/my-trips"
            element={
              <ProtectedRoute>
                <MyTrips />
              </ProtectedRoute>
            }
          />

          {/* BOOKED TRIPS */}
          <Route
            path="/booked-trips"
            element={
              <ProtectedRoute>
                <BookedTrips />
              </ProtectedRoute>
            }
          />

          {/* CREATE TRIP */}
          <Route
            path="/create-trip"
            element={
              <ProtectedRoute>
                <CreateTrip />
              </ProtectedRoute>
            }
          />

          {/* BUILD ITINERARY */}
          <Route
            path="/build-itinerary/:id"
            element={
              <ProtectedRoute>
                <BuildItinerary />
              </ProtectedRoute>
            }
          />

          {/* PACKING CHECKLIST */}
          <Route
            path="/packing-checklist/:id"
            element={
              <ProtectedRoute>
                <PackingChecklist />
              </ProtectedRoute>
            }
          />

          {/* TRIP NOTES */}
          <Route
            path="/trip-notes/:tripId/new"
            element={
              <ProtectedRoute>
                <NoteEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip-notes/:tripId/:noteId/edit"
            element={
              <ProtectedRoute>
                <NoteEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip-notes/:tripId/:noteId"
            element={
              <ProtectedRoute>
                <NoteView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip-notes/:tripId"
            element={
              <ProtectedRoute>
                <TripNotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip-notes/:id"
            element={
              <ProtectedRoute>
                <TripNotes />
              </ProtectedRoute>
            }
          />

          {/* TRIP ACTIVITIES */}
          <Route
            path="/trips/:tripId/activities/new"
            element={
              <ProtectedRoute>
                <ActivityEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:tripId/activities/:activityId/edit"
            element={
              <ProtectedRoute>
                <ActivityEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:tripId/activities"
            element={
              <ProtectedRoute>
                <TripActivitiesPage />
              </ProtectedRoute>
            }
          />

          {/* EXPLORE PAGE */}
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <Activities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities/:id?"
            element={
              <ProtectedRoute>
                <Activities />
              </ProtectedRoute>
            }
          />

          {/* GROUP TRIP DETAILS */}
          <Route
            path="/trips/:id"
            element={
              <ProtectedRoute>
                <TripDetails />
              </ProtectedRoute>
            }
          />

          {/* TRIP COLLABORATION PAGE */}
          <Route
            path="/trips/:tripId/collaboration"
            element={
              <ProtectedRoute>
                <TripCollaborationPage />
              </ProtectedRoute>
            }
          />

          {/* TRIP FLIGHTS PAGE */}
          <Route
            path="/trips/:tripId/flights"
            element={
              <ProtectedRoute>
                <TripFlightsPage />
              </ProtectedRoute>
            }
          />

          {/* TRIP CHAT PAGE */}
          <Route
            path="/trips/:tripId/chat"
            element={
              <ProtectedRoute>
                <TripChatPage />
              </ProtectedRoute>
            }
          />

          {/* EDIT TRIP PAGE */}
          <Route
            path="/trips/:tripId/edit"
            element={
              <ProtectedRoute>
                <EditTrip />
              </ProtectedRoute>
            }
          />

          {/* TRIP AI ASSISTANT PAGE */}
          <Route
            path="/trips/:tripId/assistant"
            element={
              <ProtectedRoute>
                <TripAiAssistantPage />
              </ProtectedRoute>
            }
          />

          {/* BOOKED PACKAGE DETAIL / BOOKING DETAILS */}
          <Route
            path="/booking/:bookingId"
            element={
              <ProtectedRoute>
                <BookedPackageDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booked-package/:bookingId"
            element={
              <ProtectedRoute>
                <BookedPackageDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booked-trips/:bookingId"
            element={
              <ProtectedRoute>
                <BookedPackageDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings/:bookingId"
            element={
              <ProtectedRoute>
                <BookedPackageDetail />
              </ProtectedRoute>
            }
          />

          {/* PROFILE */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* TRIP BUDGET */}
          <Route
            path="/trip-budget/:id"
            element={
              <ProtectedRoute>
                <TripBudget />
              </ProtectedRoute>
            }
          />

          {/* SHARED ITINERARY */}
          <Route
            path="/shared/:token"
            element={<SharedItinerary />}
          />

          {/* SAVED DESTINATIONS */}
          <Route
            path="/saved-destinations"
            element={
              <ProtectedRoute>
                <SavedDestinations />
              </ProtectedRoute>
            }
          />

          {/* PRIVACY POLICY */}
          <Route
            path="/privacy"
            element={<PrivacyPolicy />}
          />

          {/* TERMS AND CONDITIONS */}
          <Route
            path="/terms"
            element={<TermsConditions />}
          />

          {/* ABOUT */}
          <Route
            path="/about"
            element={<About />}
          />

          {/* NEW TERMS AND CONDITIONS PAGE */}
          <Route
            path="/terms-and-conditions"
            element={
              <ProtectedRoute isTermsPage={true}>
                <TermsAndConditions />
              </ProtectedRoute>
            }
          />

          {/* ADMIN DASHBOARD */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* TRAVEL JOURNAL */}
          <Route
            path="/travel-journal/:id"
            element={
              <ProtectedRoute>
                <TravelJournal />
              </ProtectedRoute>
            }
          />

          {/* NEARBY PLACES */}
          <Route
            path="/nearby"
            element={
              <ProtectedRoute>
                <NearbyPlaces />
              </ProtectedRoute>
            }
          />

          {/* LOGIN REDIRECT */}
          <Route
            path="/login"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

          {/* 404 */}
          {/* DRIVER PORTAL */}
          <Route
            path="/driver/verify"
            element={<DriverPortal />}
          />

          {/* BOOKING SUCCESS */}
          <Route
            path="/booking/:bookingId/success"
            element={
              <ProtectedRoute>
                <BookingSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-success/:bookingId"
            element={
              <ProtectedRoute>
                <BookingSuccess />
              </ProtectedRoute>
            }
          />

          {/* 454 */}
          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRoutes;