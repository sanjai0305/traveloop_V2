import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Trips } from "./pages/Trips";
import { Bookings } from "./pages/Bookings";
import { Analytics } from "./pages/Analytics";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { MainLayout } from "./components/layout";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";

/**
 * App — Root router.
 *
 * Auth flow:
 *  /login  → Auth page (handles redirect check on mount once)
 *  /       → redirect to /dashboard
 *  /*      → ProtectedRoute wraps all app pages
 *
 * ProtectedRoute ONLY checks isAuthenticated.
 * Profile completion is handled inside each page via banners.
 */
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public auth routes ── */}
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />

        {/* ── Protected app routes ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Trips />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Bookings />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:tripId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Bookings />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Analytics />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all: redirect to dashboard (ProtectedRoute will redirect to /login if not authed) ── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
