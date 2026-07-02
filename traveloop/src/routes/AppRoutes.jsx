import React, { Suspense, lazy } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// SKELETON LOADER
import PageSkeletonLoader from "../components/common/PageSkeletonLoader";

// CENTRALIZED ANDROID BACK HANDLER
import AndroidBackButtonHandler from "../components/mobile/AndroidBackButtonHandler";

// PAGES (Statically imported for instant startup)
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyEmail from "../pages/VerifyEmail";

// LAZY LOADED PAGES
const Dashboard = lazy(() => import("../pages/Dashboard"));
const MyTrips = lazy(() => import("../pages/MyTrips"));
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

// PROTECTED ROUTE
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

const TermsReacceptanceCheck = ({ children }) => {
  const { user, isAuthenticated, loading, userRefreshed } = useAuth();
  const location = useLocation();

  console.log("[TermsReacceptanceCheck] Render:", {
    pathname: location.pathname,
    isAuthenticated,
    loading,
    userRefreshed,
    termsVersion: user?.termsVersion,
    acceptedTerms: user?.acceptedTerms,
    userExists: !!user
  });

  // Wait for loading AND background /auth/me refresh to complete before
  // making the terms decision. This prevents false redirects on stale cache.
  if (loading || !userRefreshed) {
    return <PageSkeletonLoader />;
  }

  // If user is authenticated and hasn't accepted the latest terms version
  if (isAuthenticated && user && user.termsVersion !== "2026-06") {
    // Allowed paths during re-acceptance block
    const isAllowedPath =
      location.pathname === "/terms-and-conditions" ||
      location.pathname === "/privacy" ||
      location.pathname === "/terms";

    if (!isAllowedPath) {
      return <Navigate to="/terms-and-conditions?force=true" replace />;
    }
  }

  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AndroidBackButtonHandler />
      <Suspense fallback={<PageSkeletonLoader />}>
        <TermsReacceptanceCheck>
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
            path="/trip-notes/:id"
            element={
              <ProtectedRoute>
                <TripNotes />
              </ProtectedRoute>
            }
          />

          {/* ACTIVITIES */}
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

          {/* BOOKED PACKAGE DETAIL */}
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
              <ProtectedRoute>
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
      </TermsReacceptanceCheck>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRoutes;