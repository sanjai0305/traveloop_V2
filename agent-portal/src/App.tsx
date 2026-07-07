import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Trips } from "./pages/Trips";
import { Bookings } from "./pages/Bookings";
import { Analytics } from "./pages/Analytics";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { CompleteProfile } from "./pages/CompleteProfile";
import { Wallet } from "./pages/Wallet";
import { ScheduleVerification } from "./pages/ScheduleVerification";
import LegalConsent from "./pages/LegalConsent";
import { MainLayout } from "./components/layout";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

/**
 * SessionGuard — calls validateSession() once on mount.
 * This ensures that after a browser refresh (F5), the stored token is
 * verified against the backend before rendering any protected routes.
 * isLoading will be true during validation, so ProtectedRoute shows a spinner.
 */
const SessionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const validateSession = useAuthStore((s) => s.validateSession);

  useEffect(() => {
    console.log("[App] SessionGuard mounted — calling validateSession()");
    validateSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
};

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
      <SessionGuard>
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
            path="/bookings/:tripId/schedule-verify"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ScheduleVerification />
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
            path="/wallet"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Wallet />
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

          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/legal-consent"
            element={
              <ProtectedRoute>
                <LegalConsent />
              </ProtectedRoute>
            }
          />

          {/* ── Catch-all: redirect to dashboard (ProtectedRoute will redirect to /login if not authed) ── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SessionGuard>
    </BrowserRouter>
  );
};

export default App;
